/* ========================================================================
   tournaments.js — 2026 NextGen Youth Championship only.
   Renders three division formats from local JSON, completed results,
   next-match countdowns and an automatic MYT broadcast timeline.
   ======================================================================== */

$(function () {
  'use strict';

  var championship = null;
  var teams = {};
  var activeGame = 'valorant';
  var activeStatus = 'all';
  var youtubePlayer = null;
  var youtubeApiReady = false;
  var countdownTimer = null;
  var scoreTimer = null;
  var query = new URLSearchParams(window.location.search);
  var demoMode = query.get('demo') || '';
  var timelineOverride = query.get('at') || '';
  var timelineTimer = null;
  var broadcastPlayerMode = '';
  var divisionBackgrounds = {
    valorant: "url('../GameArt/valorant-profile.jpg')",
    cs2: "url('../GameArt/cs2-profile.png')",
    pubg: "url('../GameArt/pubg-profile.jpg')"
  };
  var divisionDays = {
    pubg: { short: 'FRI', full: 'Friday' },
    cs2: { short: 'SAT', full: 'Saturday' },
    valorant: { short: 'SUN', full: 'Sunday' }
  };
  var matchDurations = {
    valorant: { BO3: 150, BO5: 240 },
    cs2: { BO3: 180, BO5: 300 },
    pubg: { round: 45 }
  };
  var bracketDependencies = {
    valorant: {
      'val-sf1': ['val-qf1', 'val-qf2'],
      'val-sf2': ['val-qf3', 'val-qf4'],
      'val-final': ['val-sf1', 'val-sf2']
    },
    cs2: {
      'cs-sf1': ['cs-qf1', 'cs-qf2'],
      'cs-sf2': ['cs-qf3', 'cs-qf4'],
      'cs-final': ['cs-sf1', 'cs-sf2']
    }
  };
  var seededResults = {
    'val-qf4': ['zera', 2, 1],
    'val-sf1': ['vyne', 2, 1],
    'val-sf2': ['zera', 1, 2],
    'val-final': ['vyne', 3, 2],
    'cs-sf1': ['kova', 2, 1],
    'cs-sf2': ['axen', 1, 2],
    'cs-final': ['kova', 3, 1]
  };
  var seededPubgWinners = {
    'pubg-r11': 'brix', 'pubg-r12': 'axen', 'pubg-r13': 'talo',
    'pubg-r14': 'zera', 'pubg-r15': 'rift'
  };
  var pubgMapImages = {
    erangel: 'GameArt/pubg-maps/erangel.jpg',
    miramar: 'GameArt/pubg-maps/miramar.jpg',
    rondo: 'GameArt/pubg-maps/rondo.jpg',
    taego: 'GameArt/pubg-maps/taego.jpg'
  };
  var matchModal = document.getElementById('matchModal')
    ? bootstrap.Modal.getOrCreateInstance(document.getElementById('matchModal'))
    : null;

  function escapeHtml(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function team(id, fallback) {
    return id && teams[id]
      ? teams[id]
      : { id: '', code: fallback || 'TBD', logo: '', color: '#7b7b88' };
  }

  function teamLogo(item, decorative) {
    if (!item.logo) {
      return '<span class="team-logo-fallback" aria-hidden="true">' +
        escapeHtml(item.code.slice(0, 1)) + '</span>';
    }
    return '<img src="' + escapeHtml(item.logo) + '" alt="' +
      (decorative ? '' : escapeHtml(item.code + ' logo')) + '">';
  }

  function score(value) {
    return value === null || value === undefined ? '—' : escapeHtml(value);
  }

  function statusLabel(value) {
    return value === 'live' ? 'LIVE' : value === 'completed' ? 'COMPLETED' : 'UPCOMING';
  }

  function timelineNow() {
    var overridden = timelineOverride ? Date.parse(timelineOverride) : NaN;
    return Number.isNaN(overridden) ? Date.now() : overridden;
  }

  function durationFor(gameKey, item) {
    if (gameKey === 'pubg') { return matchDurations.pubg.round * 60000; }
    return ((matchDurations[gameKey] && matchDurations[gameKey][item.bestOf]) || 180) * 60000;
  }

  function knockoutWinner(match) {
    if (!match || match.status !== 'completed' || match.homeScore === null || match.awayScore === null) return null;
    return match.homeScore > match.awayScore ? match.home : match.awayScore > match.homeScore ? match.away : null;
  }

  function cardArtwork(options) {
    var classes = [];
    var styles = [];
    var backgrounds = [];
    var winner = options.winnerId ? team(options.winnerId) : null;
    if (options.map && pubgMapImages[String(options.map).toLowerCase()]) {
      classes.push('has-map-art');
      backgrounds.push('url(' + pubgMapImages[String(options.map).toLowerCase()] + ')');
    }
    if (winner && winner.logo) {
      classes.push('has-winner-art');
    } else if (options.pending) {
      classes.push('has-pending-art');
    }
    if (backgrounds.length) {
      styles.push('background-image:' + backgrounds.join(','));
    }
    return {
      className: classes.length ? ' ' + classes.join(' ') : '',
      style: styles.length ? ' style="' + styles.join(';') + '"' : '',
      watermark: winner && winner.logo
        ? '<img class="result-watermark" src="' + escapeHtml(winner.logo) + '" alt="" aria-hidden="true">'
        : ''
    };
  }

  function parseFixtureDate(item) {
    var match = String(item.date || '').match(/(\d{1,2})\s+([A-Za-z]{3})/);
    if (!match) { return new Date(NaN); }
    var months = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
    var time = String(item.time || '12:00 PM').match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    var hour = time ? Number(time[1]) % 12 : 12;
    if (time && time[3].toUpperCase() === 'PM') { hour += 12; }
    var iso = '2026-' + months[match[2]] + '-' + String(Number(match[1])).padStart(2, '0') +
      'T' + String(hour).padStart(2, '0') + ':' + (time ? time[2] : '00') + ':00+08:00';
    return new Date(iso);
  }

  function matchById(game, id) {
    return game && game.matches ? game.matches.find(function (item) { return item.id === id; }) : null;
  }

  function stableHash(value) {
    var hash = 0;
    String(value).split('').forEach(function (character) { hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0; });
    return Math.abs(hash);
  }

  function mapPool(gameKey) {
    return gameKey === 'valorant'
      ? ['Ascent', 'Haven', 'Lotus', 'Bind', 'Sunset']
      : ['Mirage', 'Ancient', 'Nuke', 'Inferno', 'Dust II'];
  }

  function buildResult(gameKey, match) {
    var preset = seededResults[match.id];
    var winningTeam = preset ? preset[0] : (stableHash(match.id) % 2 ? match.home : match.away);
    var homeWon = winningTeam === match.home;
    var target = match.bestOf === 'BO5' ? 3 : 2;
    var loserScore = preset ? Math.min(preset[1], preset[2]) : stableHash(match.id + '-maps') % target;
    var homeScore = preset ? preset[1] : (homeWon ? target : loserScore);
    var awayScore = preset ? preset[2] : (homeWon ? loserScore : target);
    var totalMaps = homeScore + awayScore;
    var pool = mapPool(gameKey);
    var maps = [];
    var mapWinners = [];
    if (homeWon) {
      for (var awayIndex = 0; awayIndex < awayScore; awayIndex += 1) { mapWinners.push(false); }
      for (var homeIndex = 0; homeIndex < homeScore; homeIndex += 1) { mapWinners.push(true); }
    } else {
      for (var firstHomeIndex = 0; firstHomeIndex < homeScore; firstHomeIndex += 1) { mapWinners.push(true); }
      for (var firstAwayIndex = 0; firstAwayIndex < awayScore; firstAwayIndex += 1) { mapWinners.push(false); }
    }
    for (var index = 0; index < totalMaps; index += 1) {
      var homeMapWon = mapWinners[index];
      maps.push({
        name: pool[(stableHash(match.id) + index) % pool.length],
        home: homeMapWon ? 13 : 8 + ((stableHash(match.id + index) % 4)),
        away: homeMapWon ? 8 + ((stableHash(match.id + '-a' + index) % 4)) : 13
      });
    }
    return { homeScore: homeScore, awayScore: awayScore, maps: maps };
  }

  function applyLiveProgress(match, result, elapsed, duration) {
    var fraction = Math.max(0, Math.min(0.99, elapsed / duration));
    var completedMaps = Math.min(result.maps.length - 1, Math.floor(fraction * result.maps.length));
    var homeScore = 0;
    var awayScore = 0;
    result.maps.slice(0, completedMaps).forEach(function (map) {
      if (map.home > map.away) { homeScore += 1; } else { awayScore += 1; }
    });
    match.homeScore = homeScore;
    match.awayScore = awayScore;
    match.maps = result.maps.map(function (map, index) {
      return index < completedMaps ? map : { name: map.name, home: null, away: null };
    });
  }

  function applyKnockoutTimeline(gameKey, game, now) {
    game.matches.slice().sort(function (a, b) { return parseFixtureDate(a) - parseFixtureDate(b); }).forEach(function (match) {
      var dependencies = bracketDependencies[gameKey] && bracketDependencies[gameKey][match.id];
      if (dependencies) {
        var first = matchById(game, dependencies[0]);
        var second = matchById(game, dependencies[1]);
        match.home = knockoutWinner(first);
        match.away = knockoutWinner(second);
      }

      var start = parseFixtureDate(match).getTime();
      var duration = durationFor(gameKey, match);
      if (!match.home || !match.away || now < start) {
        match.status = 'upcoming';
        match.homeScore = null;
        match.awayScore = null;
        return;
      }

      if (match.status === 'completed' && match.homeScore !== null && match.awayScore !== null && now >= start + duration) {
        return;
      }

      var result = buildResult(gameKey, match);
      if (now < start + duration) {
        match.status = 'live';
        applyLiveProgress(match, result, now - start, duration);
      } else {
        match.status = 'completed';
        match.homeScore = result.homeScore;
        match.awayScore = result.awayScore;
        match.maps = result.maps;
      }
    });
  }

  function applyPubgTimeline(game, now) {
    game.rounds.forEach(function (round) {
      var start = parseFixtureDate(round).getTime();
      var end = start + durationFor('pubg', round);
      if (now < start) {
        round.status = 'upcoming';
        round.winner = null;
      } else if (now < end) {
        round.status = 'live';
        round.winner = null;
      } else {
        round.status = 'completed';
        round.winner = round.winner || seededPubgWinners[round.id] || championship.teams[stableHash(round.id) % championship.teams.length].id;
      }
    });
  }

  function applyTournamentTimeline() {
    var now = timelineNow();
    applyKnockoutTimeline('valorant', championship.games.valorant, now);
    applyKnockoutTimeline('cs2', championship.games.cs2, now);
    applyPubgTimeline(championship.games.pubg, now);
  }

  function fixturesForGame(gameKey, status) {
    var game = championship.games[gameKey];
    if (!game) { return []; }
    var rows = gameKey === 'pubg' ? game.rounds : game.matches;
    var fixtures = [];
    rows.forEach(function (item) {
      if (!status || item.status === status) {
        fixtures.push({ gameKey: gameKey, game: game, item: item, startsAt: parseFixtureDate(item) });
      }
    });
    return fixtures.sort(function (a, b) { return a.startsAt - b.startsAt; });
  }

  function nextFixture(gameKey) {
    var fixtures = fixturesForGame(gameKey, 'upcoming');
    var future = fixtures.find(function (fixture) { return fixture.startsAt.getTime() > timelineNow(); });
    return future || null;
  }

  function liveFixture(gameKey) {
    return fixturesForGame(gameKey, 'live')[0] || null;
  }

  function fixtureName(fixture) {
    if (!fixture) { return 'Competition complete'; }
    var day = divisionDays[fixture.gameKey] || { short: '', full: '' };
    var when = day.short + ' ' + fixture.item.date.toUpperCase() + ' · ' + fixture.item.time + ' MYT · ';
    if (fixture.gameKey === 'pubg') {
      return when + 'PUBG ROUND ' + fixture.item.number + ' · ' + fixture.item.map;
    }
    var home = team(fixture.item.home, fixture.item.sourceHome);
    var away = team(fixture.item.away, fixture.item.sourceAway);
    return when + fixture.game.label + ' · ' + home.code + ' vs ' + away.code;
  }

  function simulationMatch() {
    var config = championship.simulation || {};
    var game = championship.games[config.game || 'valorant'];
    return game && game.matches ? game.matches.find(function (item) { return item.id === config.matchId; }) : null;
  }

  function saveState() {
    NXStore.session.set('tournamentFilter', {
      game: activeGame,
      status: activeStatus
    });
  }

  function renderDivisionIntro(game) {
    $('#divisionIntro').html(
      '<div>' +
        '<p class="nx-eyebrow">2026 youth division</p>' +
        '<h2>' + escapeHtml(game.label) + '</h2>' +
        '<p>' + escapeHtml(game.description) + '</p>' +
      '</div>' +
      '<div class="division-intro__facts">' +
        '<span><small>Teams</small><b>8</b></span>' +
        '<span><small>Prize</small><b>RM20K</b></span>' +
        '<span><small>Format</small><b>' + (activeGame === 'pubg' ? game.rounds.length + ' rounds' : '7 matches') + '</b></span>' +
      '</div>'
    );
  }

  function renderBroadcast(game) {
    var simulated = demoMode === 'live' || demoMode === 'final';
    var automaticLive = liveFixture(activeGame);
    var scheduledFixture = simulated ? null : (automaticLive || nextFixture(activeGame));
    var scheduledMatch = scheduledFixture && activeGame !== 'pubg' ? scheduledFixture.item : null;
    var match = simulated ? simulationMatch() : scheduledMatch;
    var home = team(match ? match.home : game.broadcast.home, match ? match.sourceHome : 'TBD');
    var away = team(match ? match.away : game.broadcast.away, match ? match.sourceAway : 'TBD');
    var liveState = demoMode === 'live' || Boolean(automaticLive);
    var finalState = demoMode === 'final';
    var timeline = championship.simulation && championship.simulation.scoreTimeline;
    var lastState = timeline && timeline.length ? timeline[timeline.length - 1] : null;
    var homeScore = finalState && lastState ? lastState.homeScore : match && match.homeScore !== null ? match.homeScore : game.broadcast.homeScore;
    var awayScore = finalState && lastState ? lastState.awayScore : match && match.awayScore !== null ? match.awayScore : game.broadcast.awayScore;

    $('#broadcastLabel')
      .toggleClass('is-live', liveState)
      .html('<span></span> ' + (liveState ? 'LIVE' : finalState ? 'FINAL' : 'UP NEXT · SHARED BROADCAST CHANNEL'));
    $('#watchOnYouTube').prop('hidden', !liveState);
    $('#broadcastStage').text(match
      ? match.round + ' · ' + match.bestOf
      : scheduledFixture && activeGame === 'pubg'
        ? 'League Day 3 · Round ' + scheduledFixture.item.number
        : game.broadcast.stage);
    $('#broadcastMap').text(finalState && lastState
      ? lastState.map
      : scheduledFixture && activeGame === 'pubg'
        ? scheduledFixture.item.map
        : game.broadcast.map);
    var broadcastDay = divisionDays[activeGame] ? divisionDays[activeGame].full : '';
    var broadcastWhen = scheduledFixture
      ? scheduledFixture.item.date + ' · ' + scheduledFixture.item.time
      : match
        ? match.date + ' · ' + match.time
        : game.broadcast.time;
    $('#broadcastTime').text(broadcastDay + ' · ' + broadcastWhen + ' MYT');
    $('#broadcastVersus').html(
      '<div class="broadcast-team">' + teamLogo(home, true) + '<strong>' + escapeHtml(home.code) + '</strong></div>' +
      '<div class="broadcast-score">' + score(homeScore) + ' : ' + score(awayScore) + '</div>' +
      '<div class="broadcast-team">' + teamLogo(away, true) + '<strong>' + escapeHtml(away.code) + '</strong></div>'
    );
  }

  function mountBroadcastPlayer() {
    var useYouTube = (demoMode === 'live' || Boolean(liveFixture(activeGame))) && championship.liveVideoId;
    var mode = useYouTube ? 'youtube-' + activeGame : 'trailer';
    if (broadcastPlayerMode === mode && $('#broadcastPlayer').children().length) { return; }
    broadcastPlayerMode = mode;
    var badge = useYouTube ? '<span class="broadcast-live-badge">LIVE</span>' : '';

    if (!useYouTube) {
      $('#broadcastPlayer').html(
        '<video class="tournament-trailer" id="tournamentTrailer" autoplay muted ' + (demoMode ? '' : 'loop ') + 'playsinline controls preload="auto" ' +
          'aria-label="NextGen Youth Championship tournament trailer">' +
          '<source src="' + escapeHtml(championship.trailerFile) + '" type="video/mp4">' +
          'Your browser does not support the tournament trailer.' +
        '</video>' + badge
      );

      var trailer = document.getElementById('tournamentTrailer');
      if (demoMode === 'live') {
        trailer.addEventListener('timeupdate', function () { updateSimulatedScore(trailer.currentTime); });
      }
      var playAttempt = trailer.play();
      if (playAttempt && typeof playAttempt.catch === 'function') {
        playAttempt.catch(function () {
          // Browser autoplay policies may require the visitor to press play once.
        });
      }
      return;
    }

    $('#broadcastPlayer').html(
      '<iframe class="broadcast-youtube" src="https://www.youtube.com/embed/' + escapeHtml(championship.liveVideoId) +
      '?autoplay=1&mute=1&rel=0" title="NextGen Youth Championship live broadcast" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>' + badge
    );
  }

  function updateSimulatedScore(seconds) {
    if (demoMode !== 'live' || !championship.simulation) { return; }
    var timeline = championship.simulation.scoreTimeline || [];
    var state = timeline[0];
    timeline.forEach(function (entry) {
      if (seconds >= entry.at) { state = entry; }
    });
    if (!state) { return; }
    var match = simulationMatch();
    if (!match) { return; }
    var home = team(match.home, match.sourceHome);
    var away = team(match.away, match.sourceAway);
    $('#broadcastVersus').html(
      '<div class="broadcast-team">' + teamLogo(home, true) + '<strong>' + escapeHtml(home.code) + '</strong></div>' +
      '<div class="broadcast-score">' + score(state.homeScore) + ' : ' + score(state.awayScore) + '</div>' +
      '<div class="broadcast-team">' + teamLogo(away, true) + '<strong>' + escapeHtml(away.code) + '</strong></div>'
    );
    $('#broadcastMap').text(state.map + ' · ' + state.label);
  }

  function matchTeamRow(item, value, winner) {
    return '<div class="match-card__team' + (winner ? ' is-winner' : '') + '">' +
      teamLogo(item, true) +
      '<span>' + escapeHtml(item.code) + '</span>' +
      '<b>' + score(value) + '</b>' +
    '</div>';
  }

  function renderKnockoutMatch(match) {
    var home = team(match.home, match.sourceHome);
    var away = team(match.away, match.sourceAway);
    var homeWinner = match.homeScore !== null && match.homeScore > match.awayScore;
    var awayWinner = match.awayScore !== null && match.awayScore > match.homeScore;
    var artwork = cardArtwork({ winnerId: knockoutWinner(match), pending: match.status !== 'completed' });

    return '<button class="match-card' + artwork.className + '"' + artwork.style + ' type="button" data-match="' + escapeHtml(match.id) + '">' +
      artwork.watermark +
      '<span class="match-card__when"><strong>' + escapeHtml(match.date) + '</strong>' + escapeHtml(match.time) + '</span>' +
      '<span class="match-card__teams">' +
        matchTeamRow(home, match.homeScore, homeWinner) +
        matchTeamRow(away, match.awayScore, awayWinner) +
      '</span>' +
      '<span class="match-card__status"><span data-status="' + escapeHtml(match.status) + '">' + escapeHtml(statusLabel(match.status)) + '</span><small>' + escapeHtml(match.round + ' · ' + match.bestOf) + '</small></span>' +
      '<i class="bi bi-chevron-right" aria-hidden="true"></i>' +
    '</button>';
  }

  function renderPubgMatch(round) {
    var artwork = cardArtwork({ map: round.map, winnerId: round.winner, pending: round.status !== 'completed' });
    return '<button class="match-card' + artwork.className + '"' + artwork.style + ' type="button" data-round="' + escapeHtml(round.id) + '">' +
      artwork.watermark +
      '<span class="match-card__when"><strong>' + escapeHtml(round.date) + '</strong>' + escapeHtml(round.time) + '</span>' +
      '<span class="match-card__teams">' +
        '<span class="match-card__team"><i class="bi bi-people-fill" aria-hidden="true"></i><span>8-team final lobby</span><b>R' + escapeHtml(round.number) + '</b></span>' +
        '<span class="match-card__team"><i class="bi bi-map" aria-hidden="true"></i><span>' + escapeHtml(round.map) + '</span><b>—</b></span>' +
      '</span>' +
      '<span class="match-card__status"><span data-status="' + escapeHtml(round.status) + '">' + escapeHtml(statusLabel(round.status)) + '</span><small>Cumulative points</small></span>' +
      '<i class="bi bi-chevron-right" aria-hidden="true"></i>' +
    '</button>';
  }

  function renderMatches(game) {
    var rows = activeGame === 'pubg' ? game.rounds : game.matches;
    var filtered = rows.filter(function (item) {
      return activeStatus === 'all' || item.status === activeStatus;
    });

    $('#scheduleTitle').text(activeStatus === 'completed' ? 'Recent results' : 'Match schedule');
    $('#matchList').html(filtered.length
      ? filtered.map(activeGame === 'pubg' ? renderPubgMatch : renderKnockoutMatch).join('')
      : '<div class="empty-matches">No ' + escapeHtml(activeStatus) + ' matches yet.</div>');
  }

  function bracketTeamRow(id, fallback, match, isHome) {
    var item = team(id, fallback);
    var ownScore = isHome ? match.homeScore : match.awayScore;
    var otherScore = isHome ? match.awayScore : match.homeScore;
    var winner = ownScore !== null && ownScore > otherScore;

    return '<div class="bracket-team' + (winner ? ' is-winner' : '') + '">' +
      teamLogo(item, true) + '<span>' + escapeHtml(item.code) + '</span><b>' + score(ownScore) + '</b>' +
    '</div>';
  }

  function bracketMatch(match) {
    var artwork = cardArtwork({ winnerId: knockoutWinner(match), pending: match.status !== 'completed' });
    return '<div class="bracket-match' + artwork.className + '"' + artwork.style + '>' +
      artwork.watermark +
      bracketTeamRow(match.home, match.sourceHome, match, true) +
      bracketTeamRow(match.away, match.sourceAway, match, false) +
      '<small>' + escapeHtml(match.date + ' · ' + match.time + ' · ' + match.bestOf) + '</small>' +
    '</div>';
  }

  function renderBracket(game) {
    var order = ['Quarter-finals', 'Semi-finals', 'Grand Final'];
    var html = '<div class="bracket-scroll"><div class="bracket">';

    order.forEach(function (round) {
      var rows = game.matches.filter(function (match) { return match.round === round; });
      html += '<section class="bracket-round"><h4>' + escapeHtml(round) + '</h4><div>' +
        rows.map(bracketMatch).join('') + '</div></section>';
    });

    html += '</div></div>';
    return html;
  }

  function renderPubgFormat(game) {
    var rounds = '<div class="pubg-rounds row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3">' +
      game.rounds.map(function (round) {
      var artwork = cardArtwork({ winnerId: round.winner, pending: round.status !== 'completed' });
      /* Each round is a Bootstrap column; the wrapper above is the row. */
      return '<div class="col"><article class="pubg-round h-100' + artwork.className + '"' + artwork.style + '>' +
        artwork.watermark +
        '<div class="pubg-round__top"><span>ROUND ' + escapeHtml(round.number) + '</span><span>' + escapeHtml(round.date) + ' · ' + escapeHtml(round.time) + '</span></div>' +
        '<h4>' + escapeHtml(round.map) + '</h4>' +
        '<p>' + (round.winner ? 'Winner: ' + escapeHtml(team(round.winner).code) : 'Winner to be decided') + '</p>' +
      '</article></div>';
    }).join('') + '</div>';

    return rounds;
  }

  function renderFormat(game) {
    $('#formatTitle').text(activeGame === 'pubg' ? 'Round history' : 'Playoff bracket');
    $('#formatSummary').text(game.formatLabel);
    $('#formatContent').html(activeGame === 'pubg' ? renderPubgFormat(game) : renderBracket(game));
  }

  function renderActiveGame() {
    var game = championship.games[activeGame];
    $('.competition-section, .match-modal').css('--division-accent', game.accent);
    $('.competition-section').css('--division-bg', divisionBackgrounds[activeGame]);
    $('.tournament-game').removeClass('is-active').attr('aria-selected', 'false')
      .filter('[data-game="' + activeGame + '"]').addClass('is-active').attr('aria-selected', 'true');

    renderDivisionIntro(game);
    renderBroadcast(game);
    renderMatches(game);
    renderFormat(game);
    mountBroadcastPlayer();
    startCountdown();
    saveState();
  }

  function showKnockoutModal(match) {
    var home = team(match.home, match.sourceHome);
    var away = team(match.away, match.sourceAway);
    var mapRows = match.maps && match.maps.length
      ? match.maps.map(function (map) {
          return '<div class="map-result"><span>' + score(map.home) + '</span><strong>' + escapeHtml(map.name) + '</strong><span>' + score(map.away) + '</span></div>';
        }).join('')
      : '<p class="nx-muted nx-mb-0">Map veto will be confirmed after both teams qualify.</p>';

    $('#matchModalStage').text(match.round + ' · ' + match.bestOf + ' · ' + match.date + ' ' + match.time);
    $('#matchModalTitle').text(home.code + ' vs ' + away.code);
    $('#matchModalBody').html(
      '<div class="match-modal-score">' +
        '<div class="match-modal-team">' + teamLogo(home, true) + '<strong>' + escapeHtml(home.code) + '</strong></div>' +
        '<strong>' + score(match.homeScore) + ' : ' + score(match.awayScore) + '</strong>' +
        '<div class="match-modal-team">' + teamLogo(away, true) + '<strong>' + escapeHtml(away.code) + '</strong></div>' +
      '</div><div class="map-results">' + mapRows + '</div>'
    );
    if (matchModal) { matchModal.show(); }
  }

  function showPubgModal(round) {
    $('#matchModalStage').text('PUBG Friday Series · Round ' + round.number);
    $('#matchModalTitle').text(round.map + ' lobby');
    $('#matchModalBody').html(
      '<div class="match-modal-score">' +
        '<div class="match-modal-team"><i class="bi bi-people-fill" style="font-size:3rem" aria-hidden="true"></i><strong>8 teams</strong></div>' +
        '<strong>R' + escapeHtml(round.number) + '</strong>' +
        '<div class="match-modal-team"><i class="bi bi-map" style="font-size:3rem" aria-hidden="true"></i><strong>' + escapeHtml(round.map) + '</strong></div>' +
      '</div><p class="nx-muted nx-mb-0">' + escapeHtml(round.date + ' · ' + round.time) + '. Placement and elimination points will update the standings after the lobby is certified.</p>'
    );
    if (matchModal) { matchModal.show(); }
  }

  function startCountdown() {
    if (countdownTimer) { window.clearInterval(countdownTimer); }

    function update() {
      var live = liveFixture(activeGame);
      var fixture = live || nextFixture(activeGame);
      var activeLabel = championship.games[activeGame] ? championship.games[activeGame].label : 'Selected division';
      var activeDay = divisionDays[activeGame] ? divisionDays[activeGame].full : '';
      $('#eventCountdownLabel').text(activeLabel + ' · ' + activeDay + ' next match');
      if (!fixture) {
        $('#eventCountdown, #nextMatchClock').text('Season complete');
        $('#nextMatchName').text(activeLabel + ' schedule completed');
        return;
      }
      if (live || demoMode === 'live') {
        $('#eventCountdown, #nextMatchClock').text('LIVE NOW');
        $('#nextMatchName').text(fixtureName(fixture));
        return;
      }
      var remaining = fixture.startsAt.getTime() - timelineNow();
      if (remaining < 0) { remaining = 0; }
      var days = Math.floor(remaining / 86400000);
      var hours = Math.floor((remaining % 86400000) / 3600000);
      var minutes = Math.floor((remaining % 3600000) / 60000);
      var seconds = Math.floor((remaining % 60000) / 1000);
      var shortValue = days + 'D ' + hours + 'H ' + minutes + 'M';
      var fullValue = days + 'D ' + String(hours).padStart(2, '0') + 'H ' + String(minutes).padStart(2, '0') + 'M ' + String(seconds).padStart(2, '0') + 'S';
      $('#eventCountdown').text(shortValue);
      $('#nextMatchClock').text(demoMode === 'final' ? 'MATCH COMPLETE' : fullValue);
      $('#nextMatchName').text(demoMode ? 'ZERA vs MIRA · VALORANT demonstration' : fixtureName(fixture));
    }

    update();
    countdownTimer = window.setInterval(update, 1000);
  }

  function mountYouTubeApi() {
    if (document.querySelector('script[data-nextgen-youtube-api]')) { return; }
    var script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.dataset.nextgenYoutubeApi = 'true';
    document.head.appendChild(script);
  }

  window.onYouTubeIframeAPIReady = function () {
    youtubeApiReady = true;
    if (!championship || !document.getElementById('youtubePlayer')) { return; }

    youtubePlayer = new YT.Player('youtubePlayer', {
      width: '100%',
      height: '100%',
      videoId: championship.liveVideoId,
      playerVars: {
        playsinline: 1,
        rel: 0,
        origin: window.location.origin
      },
      events: {
        onReady: function (event) {
          event.target.mute();
          event.target.playVideo();
          if (scoreTimer) { window.clearInterval(scoreTimer); }
          scoreTimer = window.setInterval(function () {
            if (youtubePlayer && typeof youtubePlayer.getCurrentTime === 'function') {
              updateSimulatedScore(youtubePlayer.getCurrentTime());
            }
          }, 500);
        },
        onError: function () {
          $('.broadcast-panel__player').html(
            '<div class="broadcast-placeholder"><i class="bi bi-wifi-off" aria-hidden="true"></i><span>Broadcast unavailable. Check the video ID or internet connection.</span></div>'
          );
        }
      }
    });
  };

  $('#tournamentGamePicker').on('click', '.tournament-game', function () {
    activeGame = $(this).data('game');
    activeStatus = 'all';
    $('#scheduleFilter button').removeClass('is-active').filter('[data-status="all"]').addClass('is-active');
    renderActiveGame();
  });

  $('#scheduleFilter').on('click', 'button', function () {
    activeStatus = $(this).data('status');
    $('#scheduleFilter button').removeClass('is-active');
    $(this).addClass('is-active');
    renderMatches(championship.games[activeGame]);
    saveState();
  });

  $('#matchList').on('click', '[data-match]', function () {
    var id = $(this).data('match');
    var match = championship.games[activeGame].matches.find(function (item) { return item.id === id; });
    if (match) { showKnockoutModal(match); }
  });

  $('#matchList').on('click', '[data-round]', function () {
    var id = $(this).data('round');
    var round = championship.games.pubg.rounds.find(function (item) { return item.id === id; });
    if (round) { showPubgModal(round); }
  });

  $.getJSON('data/youth-tournament.json')
    .done(function (data) {
      championship = data.championship;
      championship.teams.forEach(function (item) { teams[item.id] = item; });

      var saved = NXStore.session.get('tournamentFilter', {}) || {};
      activeGame = championship.games[saved.game] ? saved.game : 'valorant';
      if (demoMode && championship.simulation && championship.games[championship.simulation.game]) {
        activeGame = championship.simulation.game;
      }
      activeStatus = ['all', 'live', 'upcoming', 'completed'].indexOf(saved.status) >= 0 ? saved.status : 'all';

      $('#scheduleFilter button').removeClass('is-active')
        .filter('[data-status="' + activeStatus + '"]').addClass('is-active');
      $('#tournamentDataNote').text(data._source);

      if (championship.liveVideoId) {
        $('#watchOnYouTube')
          .attr('href', 'https://www.youtube.com/watch?v=' + championship.liveVideoId)
          .prop('hidden', true);
      }

      applyTournamentTimeline();
      renderActiveGame();
      timelineTimer = window.setInterval(function () {
        applyTournamentTimeline();
        renderActiveGame();
      }, 30000);
    })
    .fail(function () {
      $('#divisionIntro').html('<div class="empty-matches">Tournament data could not be loaded. Open the project through Live Server and try again.</div>');
      $('#matchList, #formatContent, #clubTable').html('<div class="empty-matches">Data unavailable.</div>');
    });
});
