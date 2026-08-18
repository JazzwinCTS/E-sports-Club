/* Players page only: Weekly MVP desk, game divisions, teams and player profiles. */
$(function () {
  'use strict';
  var leagueData = null, mvpArchive = null, mvpWeeks = [], activeMvpWeekIndex = 0;
  var activeGame = 'valorant', activeTeamId = null, mvpIndex = 0, mvpTimer = null, queuedProfile = null, returnToTeam = false;
  var mvpAvailabilitySignature = '';
  var teamModalElement = document.getElementById('teamModal');
  var playerModalElement = document.getElementById('playerProfileModal');
  var teamModal = new bootstrap.Modal(teamModalElement);
  var playerModal = new bootstrap.Modal(playerModalElement);
  var gameOrder = ['valorant', 'cs2', 'pubg'];
  var timelineOverride = new URLSearchParams(window.location.search).get('at') || '';
  var gameSettings = {
    valorant: { label: 'VALORANT', eyebrow: '5v5 tactical shooter', icon: 'bi-crosshair', playersPerTeam: 5, gradient: 'linear-gradient(145deg, #7d1526, #dc2945 55%, #ff647a)', pickerImage: '../GameArt/valorant-picker.jpg', profileImage: '../GameArt/valorant-profile.jpg', accent: '#ff4655' },
    cs2: { label: 'Counter-Strike 2', eyebrow: '5v5 tactical shooter', icon: 'bi-bullseye', playersPerTeam: 5, gradient: 'linear-gradient(145deg, #644014, #b77622 55%, #e9ae4d)', pickerImage: '../GameArt/cs2-profile.png', profileImage: '../GameArt/cs2-profile.png', accent: '#f0a538' },
    pubg: { label: 'PUBG', eyebrow: '4-player battle royale squads', icon: 'bi-map', playersPerTeam: 4, gradient: 'linear-gradient(145deg, #123c36, #187b69 55%, #32ad91)', pickerImage: '../GameArt/pubg-profile.jpg', profileImage: '../GameArt/pubg-profile.jpg', accent: '#29c39a' }
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
  function timelineNow() {
    var overridden = timelineOverride ? Date.parse(timelineOverride) : NaN;
    return Number.isNaN(overridden) ? Date.now() : overridden;
  }
  function getSavedGame() {
    if (window.NXStore && NXStore.local) return NXStore.local.get('playersGame', null);
    try { return localStorage.getItem('playersGame'); } catch (error) { return null; }
  }
  function saveGame(game) {
    if (window.NXStore && NXStore.local) { NXStore.local.set('playersGame', game); return; }
    try { localStorage.setItem('playersGame', game); } catch (error) { /* Optional preference only. */ }
  }
  function sortedTeams() { return leagueData.teams.slice().sort(function (a, b) { return a.code.localeCompare(b.code); }); }
  function findPlayer(team, game, playerId) {
    if (!team || !team.rosters[game]) return null;
    return team.rosters[game].find(function (player) { return player.id === playerId; });
  }

  function currentMvpWeek() {
    return mvpWeeks[activeMvpWeekIndex] || null;
  }
  function currentMvpList() {
    var week = currentMvpWeek();
    return week ? week.mvps : (leagueData.weeklyMvp || []);
  }
  function isMvpPublished(mvp, week) {
    var revealAt = mvp && (mvp.publishedAt || (week && week.publishedAt));
    return Boolean(mvp && mvp.published !== false && (!revealAt || new Date(revealAt).getTime() <= timelineNow()));
  }
  function firstPublishedMvpIndex() {
    var week = currentMvpWeek();
    var index = currentMvpList().findIndex(function (mvp) { return isMvpPublished(mvp, week); });
    return index < 0 ? 0 : index;
  }
  function availabilitySignature() {
    return mvpWeeks.map(function (week) {
      return week.id + ':' + week.mvps.map(function (mvp) { return isMvpPublished(mvp, week) ? '1' : '0'; }).join('');
    }).join('|');
  }
  function revealLabel(mvp) {
    if (!mvp || !mvp.publishedAt) return 'MVP reveal follows the final weekly match';
    var date = new Date(mvp.publishedAt);
    var formatted = new Intl.DateTimeFormat('en-MY', {
      weekday: 'long', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true,
      timeZone: 'Asia/Kuala_Lumpur'
    }).format(date);
    return 'MVP reveals ' + formatted + ' MYT';
  }
  function prepareMvpWeeks() {
    var now = timelineNow();
    mvpWeeks = mvpArchive && Array.isArray(mvpArchive.weeks)
      ? mvpArchive.weeks.filter(function (week) {
          return week.published !== false && Array.isArray(week.mvps) && week.mvps.length &&
            (!week.publishedAt || new Date(week.publishedAt).getTime() <= now);
        }).sort(function (a, b) { return new Date(b.publishedAt) - new Date(a.publishedAt); })
      : [];
    if (!mvpWeeks.length) {
      mvpWeeks = [{ id: 'current', label: 'Current week', period: '', published: true, mvps: leagueData.weeklyMvp || [] }];
    }
    activeMvpWeekIndex = 0;
  }
  function renderMvpWeekPicker() {
    $('#mvpWeekSelect').html(mvpWeeks.map(function (week, index) {
      return '<option value="' + index + '">' + escapeHtml(week.label + (week.period ? ' · ' + week.period : '')) + '</option>';
    }).join('')).val(String(activeMvpWeekIndex));
    var week = currentMvpWeek();
    $('#mvpDeskLabel').text(week ? week.label + (week.period ? ' · ' + week.period : '') + ' performance desk' : 'Weekly performance desk');
  }

  function renderGamePicker() {
    $('#gamePicker').html(gameOrder.map(function (game) {
      var settings = gameSettings[game];
      return '<button class="game-card" type="button" role="listitem" aria-pressed="false" data-game="' + escapeHtml(game) + '" style="--game-gradient:' + settings.gradient + ';--game-image:url(&quot;' + escapeHtml(settings.pickerImage) + '&quot;)">' +
        '<span class="game-card__icon"><i class="bi ' + settings.icon + '" aria-hidden="true"></i></span><span class="game-card__copy"><span class="game-card__eyebrow">' + escapeHtml(settings.eyebrow) + '</span><h3>' + escapeHtml(settings.label) + '</h3></span><span class="game-card__status"><i class="bi bi-check-lg" aria-hidden="true"></i></span></button>';
    }).join(''));
  }
  function selectGame(game, options) {
    if (!leagueData || !gameSettings[game]) return;
    activeGame = game; saveGame(game);
    var settings = gameSettings[game];
    document.querySelector('.players-browser').style.setProperty('--directory-bg', 'url("' + settings.profileImage + '")');
    document.querySelector('.players-browser').style.setProperty('--directory-accent', settings.accent);
    $('#teamsPanel').removeAttr('hidden');
    $('#gamePicker .game-card').removeClass('is-active').attr('aria-pressed', 'false');
    $('#gamePicker .game-card[data-game="' + game + '"]').addClass('is-active').attr('aria-pressed', 'true');
    $('#divisionEyebrow').text(settings.eyebrow); $('#divisionTitle').text(settings.label + ' teams');
    $('#playersCount').text('8 teams · ' + (settings.playersPerTeam * 8) + ' players'); renderTeams(game);
    if (options && options.scroll) document.getElementById('teamsPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function renderTeams(game) {
    var settings = gameSettings[game];
    $('#teamGrid').html(sortedTeams().map(function (team) {
      var roster = team.rosters[game] || [], honours = team.honours[game] || [];
      /* Each card sits in its own Bootstrap column; #teamGrid is the row. */
      return '<div class="col"><button class="team-card h-100" type="button" data-team="' + escapeHtml(team.id) + '" style="--team-color:' + escapeHtml(team.color) + '"><span class="team-card__top"><span class="team-mark" aria-hidden="true">' + (team.logo ? '<img src="' + escapeHtml(team.logo) + '" alt="">' : escapeHtml(team.code)) + '</span><span class="team-card__open"><i class="bi bi-arrow-up-right" aria-hidden="true"></i></span></span><h3>' + escapeHtml(team.code) + '</h3><p class="team-card__base">Independent youth organisation · ' + escapeHtml(team.base) + '</p><span class="team-card__meta"><span><strong>' + roster.length + '</strong> starters</span><span>' + escapeHtml(honours[0] || settings.label + ' division') + '</span></span></button></div>';
    }).join(''));
  }
  function playerInitials(player) {
    if (player.initials) return player.initials;
    return player.name.split(/\s+/).map(function (part) { return part.charAt(0); }).slice(0, 2).join('').toUpperCase();
  }
  function renderPlayer(player, team) {
    var portrait = player.photo ? '<img src="' + escapeHtml(player.photo) + '" alt="Portrait of ' + escapeHtml(player.ign) + '">' : '<span aria-hidden="true">' + escapeHtml(playerInitials(player)) + '</span>';
    /* Wrapped in a Bootstrap column — #teamModalRoster is the row. */
    return '<div class="col"><button class="player-card h-100" type="button" data-player="' + escapeHtml(player.id) + '" style="--team-color:' + escapeHtml(team.color) + '"><span class="player-card__portrait">' + portrait + '</span><span class="player-card__body"><span class="player-card__role">' + escapeHtml(player.role) + '</span><strong>' + escapeHtml(player.ign) + '</strong><span class="player-card__name">' + escapeHtml(player.name) + '</span><span class="player-card__facts">Age ' + escapeHtml(player.age) + '<i class="bi bi-arrow-up-right"></i></span></span></button></div>';
  }

  function openTeam(teamId) {
    var team = leagueData.teams.find(function (item) { return item.id === teamId; });
    if (!team || !activeGame) return;
    activeTeamId = teamId;
    var settings = gameSettings[activeGame], roster = team.rosters[activeGame] || [], honours = team.honours[activeGame] || [];
    teamModalElement.style.setProperty('--team-color', team.color); teamModalElement.style.setProperty('--team-logo', 'url("../' + team.logo + '")');
    $('#teamModalMark').html(team.logo ? '<img src="' + escapeHtml(team.logo) + '" alt="">' : escapeHtml(team.code));
    $('#teamModalDivision').text(settings.label + ' division'); $('#teamModalTitle').text(team.code);
    $('#teamModalMeta').text('Independent youth organisation · ' + team.base + ' · Founded ' + team.founded); $('#teamModalIntro').text(team.introduction);
    var coaches = team.coaches || (team.coach ? [team.coach] : []);
    var coach = coaches.find(function (item) { return item.game === activeGame; });
    $('#teamCoachTitle').text(settings.label + ' specialist coach');
    if (coach) {
      var coachPortrait = coach.photo ? '<img src="' + escapeHtml(coach.photo) + '" alt="Portrait of ' + escapeHtml(coach.name) + '">' : '<span><i class="bi bi-person-badge"></i></span>';
      $('#teamCoachGrid').html('<article class="coach-card"><div class="coach-card__portrait">' + coachPortrait + '</div><div class="coach-card__copy"><p class="coach-card__role">' + escapeHtml(coach.role || settings.label + ' Coach') + '</p><h4>' + escapeHtml(coach.name) + '</h4><p>Responsible only for preparation, player development and match review in the ' + escapeHtml(settings.label) + ' division.</p></div></article>');
    } else $('#teamCoachGrid').html('<p>Division coach to be announced.</p>');
    $('#teamModalRosterTitle').text(settings.label + ' roster'); $('#teamModalRosterCount').text(roster.length + ' starting players');
    $('#teamModalHonours').html(honours.map(function (honour) { return '<li><i class="bi bi-trophy"></i><span>' + escapeHtml(honour) + '</span></li>'; }).join(''));
    $('#teamModalRoster').html(roster.map(function (player) { return renderPlayer(player, team); }).join('')); teamModal.show();
  }

  function showPlayerProfile(team, game, player, reopenTeam) {
    if (!team || !player || !gameSettings[game]) return;
    var settings = gameSettings[game]; returnToTeam = Boolean(reopenTeam);
    playerModalElement.setAttribute('data-game', game);
    playerModalElement.style.setProperty('--profile-bg', 'url("' + settings.profileImage + '")');
    playerModalElement.style.setProperty('--team-color', team.color); playerModalElement.style.setProperty('--team-logo', 'url("../' + team.logo + '")');
    $('#playerProfilePhoto').attr({ src: player.photo, alt: 'Portrait of ' + player.ign }); $('#playerProfileTeamLogo').attr({ src: team.logo, alt: '' });
    $('#playerProfileGame').text(settings.label + ' player profile'); $('#playerProfileTeam').text(team.code); $('#playerProfileTitle').text(player.ign);
    $('#playerProfileName').text(player.name); $('#playerProfileAge').text(player.age); $('#playerProfileRole').text(player.role); $('#playerProfileBase').text(team.base); playerModal.show();
  }
  function requestPlayerProfile(team, game, player, reopenTeam) {
    queuedProfile = { team: team, game: game, player: player, reopenTeam: reopenTeam };
    if (teamModalElement.classList.contains('show')) teamModal.hide();
    else { var item = queuedProfile; queuedProfile = null; showPlayerProfile(item.team, item.game, item.player, item.reopenTeam); }
  }

  function renderMetricCards(metrics, selector) {
    $(selector).html(metrics.map(function (metric) { return '<div class="mvp-metric"><span>' + escapeHtml(metric.label) + '</span><strong>' + escapeHtml(metric.value) + '</strong></div>'; }).join(''));
  }
  function drawRadar(metrics, accent) {
    var canvas = document.getElementById('mvpRadar'), context = canvas.getContext('2d'), dpr = window.devicePixelRatio || 1;
    var size = Math.max(300, Math.round(canvas.getBoundingClientRect().width || 430)); canvas.width = size * dpr; canvas.height = size * dpr; context.setTransform(dpr, 0, 0, dpr, 0, 0);
    var center = size / 2, radius = size * 0.34, count = metrics.length, styles = getComputedStyle(document.documentElement);
    var grid = styles.getPropertyValue('--border-strong').trim() || 'rgba(255,255,255,.2)', textColor = styles.getPropertyValue('--text-muted').trim() || '#aaa';
    context.clearRect(0, 0, size, size);
    function point(index, scale) { var angle = -Math.PI / 2 + index * Math.PI * 2 / count; return [center + Math.cos(angle) * radius * scale, center + Math.sin(angle) * radius * scale]; }
    for (var ring = 1; ring <= 4; ring += 1) {
      context.beginPath(); for (var i = 0; i < count; i += 1) { var p = point(i, ring / 4); if (!i) context.moveTo(p[0], p[1]); else context.lineTo(p[0], p[1]); }
      context.closePath(); context.strokeStyle = grid; context.lineWidth = 1; context.stroke();
    }
    for (var axis = 0; axis < count; axis += 1) { var end = point(axis, 1); context.beginPath(); context.moveTo(center, center); context.lineTo(end[0], end[1]); context.strokeStyle = grid; context.stroke(); }
    context.beginPath(); metrics.forEach(function (metric, index) { var p = point(index, metric.score / 100); if (!index) context.moveTo(p[0], p[1]); else context.lineTo(p[0], p[1]); });
    context.closePath(); context.fillStyle = accent + '55'; context.fill(); context.strokeStyle = accent; context.lineWidth = 3; context.stroke();
    context.fillStyle = textColor; context.font = '700 11px system-ui'; context.textAlign = 'center'; context.textBaseline = 'middle';
    metrics.forEach(function (metric, index) { var p = point(index, 1.18); context.fillText(metric.label.toUpperCase(), p[0], p[1]); });
  }

  function renderMvp(index, restartTimer) {
    var list = currentMvpList(); if (!list.length) return;
    mvpIndex = (index + list.length) % list.length;
    var mvp = list[mvpIndex], team = leagueData.teams.find(function (item) { return item.id === mvp.teamId; });
    var player = findPlayer(team, mvp.game, mvp.playerId), settings = gameSettings[mvp.game]; if (!team || !player || !settings) return;
    var week = currentMvpWeek();
    var published = isMvpPublished(mvp, week);
    var stage = document.getElementById('mvpStage');
    stage.style.setProperty('--mvp-accent', settings.accent);
    stage.style.setProperty('--mvp-bg', 'url("' + settings.profileImage + '")');
    stage.classList.toggle('is-pending', !published);
    $('#mvpWeek').text(currentMvpWeek() ? currentMvpWeek().label : (mvp.week || 'Current week')); $('#mvpGame').text(settings.label);
    $('#mvpTabs button').removeClass('is-active').attr('aria-selected', 'false').eq(mvpIndex).addClass('is-active').attr('aria-selected', 'true');
    if (published) {
      $('#mvpPlayerPhoto').attr({ src: player.photo, alt: 'Portrait of ' + player.ign });
      $('#mvpTeamLogo').attr({ src: team.logo, alt: '' });
      $('#mvpIgn').text(player.ign);
      $('#mvpProfileButton').prop('disabled', false).text('View player profile').data({ team: team.id, game: mvp.game, player: player.id });
      renderMetricCards(mvp.metrics.slice(0, 3), '#mvpMetricsLeft');
      renderMetricCards(mvp.metrics.slice(3), '#mvpMetricsRight');
      requestAnimationFrame(function () { drawRadar(mvp.metrics, settings.accent); });
    } else {
      $('#mvpPlayerPhoto').removeAttr('src alt');
      $('#mvpTeamLogo').removeAttr('src alt');
      $('#mvpIgn').text('TO BE DECIDED');
      $('#mvpProfileButton').prop('disabled', true).removeData('team game player').text(revealLabel(mvp));
      var pendingMetrics = mvp.metrics.map(function (metric) { return { label: metric.label, value: '—', score: 18 }; });
      renderMetricCards(pendingMetrics.slice(0, 3), '#mvpMetricsLeft');
      renderMetricCards(pendingMetrics.slice(3), '#mvpMetricsRight');
      requestAnimationFrame(function () { drawRadar(pendingMetrics, settings.accent); });
    }
    if (restartTimer !== false) startMvpTimer();
  }
  function renderMvpTabs() {
    var week = currentMvpWeek();
    $('#mvpTabs').html(currentMvpList().map(function (mvp, index) {
      var locked = !isMvpPublished(mvp, week);
      return '<button type="button" role="tab" aria-selected="false" data-mvp-index="' + index + '" class="' + (locked ? 'is-locked' : '') + '">' +
        escapeHtml(gameSettings[mvp.game].label) + (locked ? '<i class="bi bi-lock-fill" aria-hidden="true"></i>' : '') + '</button>';
    }).join(''));
  }
  function startMvpTimer() { clearInterval(mvpTimer); mvpTimer = setInterval(function () { renderMvp(mvpIndex + 1, false); }, 7000); }
  function showLoadError() { $('#playersLoading').html('<div class="nx-empty"><i class="bi bi-exclamation-triangle"></i><strong>Roster data could not be loaded.</strong><p>Run the project through its local web server instead of opening players.html directly.</p></div>'); }

  renderGamePicker();
  $('#gamePicker').on('click', '.game-card', function () { selectGame($(this).data('game')); });
  $('#teamGrid').on('click', '.team-card', function () { openTeam($(this).data('team')); });
  $('#teamModalRoster').on('click', '.player-card', function () { var team = leagueData.teams.find(function (item) { return item.id === activeTeamId; }); requestPlayerProfile(team, activeGame, findPlayer(team, activeGame, $(this).data('player')), true); });
  $('#mvpTabs').on('click', 'button', function () { renderMvp(Number($(this).data('mvp-index'))); });
  $('#mvpWeekSelect').on('change', function () {
    activeMvpWeekIndex = Number(this.value) || 0;
    renderMvpWeekPicker();
    renderMvpTabs();
    mvpIndex = firstPublishedMvpIndex();
    renderMvp(mvpIndex);
  });
  $('#mvpPrev').on('click', function () { renderMvp(mvpIndex - 1); }); $('#mvpNext').on('click', function () { renderMvp(mvpIndex + 1); });
  $('#mvpProfileButton').on('click', function () { var button = $(this); if (button.prop('disabled')) return; var team = leagueData.teams.find(function (item) { return item.id === button.data('team'); }); requestPlayerProfile(team, button.data('game'), findPlayer(team, button.data('game'), button.data('player')), false); });
  $('#mvpStage').on('mouseenter focusin', function () { clearInterval(mvpTimer); }).on('mouseleave focusout', startMvpTimer);
  $(teamModalElement).on('hidden.bs.modal', function () { if (queuedProfile) { var item = queuedProfile; queuedProfile = null; showPlayerProfile(item.team, item.game, item.player, item.reopenTeam); } });
  $(playerModalElement).on('hidden.bs.modal', function () { if (returnToTeam && activeTeamId) { returnToTeam = false; openTeam(activeTeamId); } });
  $(window).on('resize', function () { if (leagueData && currentMvpList().length) renderMvp(mvpIndex, false); });

  $.getJSON('data/players.json').done(function (data) {
    leagueData = data;
    $.getJSON('data/weekly-mvp.json').done(function (archive) {
      mvpArchive = archive;
    }).always(function () {
      prepareMvpWeeks();
      $('#playersLoading').attr('hidden', true);
      renderMvpWeekPicker(); renderMvpTabs(); mvpIndex = firstPublishedMvpIndex(); renderMvp(mvpIndex);
      mvpAvailabilitySignature = availabilitySignature();
      window.setInterval(function () {
        if (!leagueData) return;
        var signature = availabilitySignature();
        if (signature !== mvpAvailabilitySignature) {
          mvpAvailabilitySignature = signature;
          renderMvpTabs();
          renderMvp(mvpIndex);
        }
      }, 30000);
      var savedGame = getSavedGame(); selectGame(gameSettings[savedGame] ? savedGame : 'valorant', { scroll: false });
    });
  }).fail(showLoadError);
});
