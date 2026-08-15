/* Players page only: game selection, team cards and Bootstrap roster modal. */

$(function () {
  'use strict';

  var leagueData = null;
  var activeGame = null;
  var teamModal = new bootstrap.Modal(document.getElementById('teamModal'));

  var gameOrder = ['valorant', 'cs2', 'pubg'];

  var gameSettings = {
    valorant: {
      label: 'VALORANT',
      eyebrow: '5v5 tactical shooter',
      icon: 'bi-crosshair',
      gradient: 'linear-gradient(145deg, #7d1526, #dc2945 55%, #ff647a)',
      playersPerTeam: 5
    },
    cs2: {
      label: 'Counter-Strike 2',
      eyebrow: '5v5 tactical shooter',
      icon: 'bi-bullseye',
      gradient: 'linear-gradient(145deg, #644014, #b77622 55%, #e9ae4d)',
      playersPerTeam: 5
    },
    pubg: {
      label: 'PUBG',
      eyebrow: '4-player battle royale squads',
      icon: 'bi-map',
      gradient: 'linear-gradient(145deg, #123c36, #187b69 55%, #32ad91)',
      playersPerTeam: 4
    }
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getSavedGame() {
    if (window.NXStore && NXStore.local) {
      return NXStore.local.get('playersGame', null);
    }

    try {
      return localStorage.getItem('playersGame');
    } catch (error) {
      return null;
    }
  }

  function saveGame(game) {
    if (window.NXStore && NXStore.local) {
      NXStore.local.set('playersGame', game);
      return;
    }

    try {
      localStorage.setItem('playersGame', game);
    } catch (error) {
      /* Storage can be unavailable in privacy modes; the page still works. */
    }
  }

  function renderGamePicker() {
    var cards = gameOrder.map(function (game, index) {
      var settings = gameSettings[game];

      return [
        '<button class="game-card" type="button" role="listitem"',
        ' data-game="', escapeHtml(game), '"',
        ' data-number="0', index + 1, '"',
        ' style="--game-gradient:', settings.gradient, '">',
          '<span class="game-card__top">',
            '<span class="game-card__icon"><i class="bi ', settings.icon, '" aria-hidden="true"></i></span>',
            '<span class="game-card__arrow"><i class="bi bi-arrow-up-right" aria-hidden="true"></i></span>',
          '</span>',
          '<span class="game-card__bottom">',
            '<span class="game-card__eyebrow">', escapeHtml(settings.eyebrow), '</span>',
            '<h3>', escapeHtml(settings.label), '</h3>',
            '<span class="game-card__meta">8 youth teams · ', settings.playersPerTeam * 8, ' starters</span>',
          '</span>',
        '</button>'
      ].join('');
    }).join('');

    $('#gamePicker').html(cards);
  }

  function selectGame(game, options) {
    if (!leagueData || !gameSettings[game]) return;

    activeGame = game;
    saveGame(game);

    var settings = gameSettings[game];
    $('#gamePicker').attr('hidden', true);
    $('#teamsPanel').removeAttr('hidden');
    $('#divisionEyebrow').text(settings.eyebrow);
    $('#divisionTitle').text(settings.label + ' teams');
    $('#playersCount').text('8 teams · ' + (settings.playersPerTeam * 8) + ' players');

    renderTeams(game);

    if (!options || options.scroll !== false) {
      document.getElementById('game-picker').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function showGamePicker() {
    activeGame = null;
    $('#teamsPanel').attr('hidden', true);
    $('#gamePicker').removeAttr('hidden');
    $('#playersCount').text('Choose a division');
    document.getElementById('game-picker').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderTeams(game) {
    var settings = gameSettings[game];

    var cards = leagueData.teams.map(function (team) {
      var roster = team.rosters[game] || [];
      var honours = team.honours[game] || [];

      return [
        '<button class="team-card" type="button" data-team="', escapeHtml(team.id), '"',
        ' style="--team-color:', escapeHtml(team.color), '">',
          '<span class="team-card__top">',
            '<span class="team-mark" aria-hidden="true">', escapeHtml(team.code), '</span>',
            '<span class="team-card__open"><i class="bi bi-arrow-up-right" aria-hidden="true"></i></span>',
          '</span>',
          '<h3>', escapeHtml(team.teamName), '</h3>',
          '<p class="team-card__base">Independent youth organisation · ', escapeHtml(team.base), '</p>',
          '<span class="team-card__meta">',
            '<span><strong>', roster.length, '</strong> starters</span>',
            '<span>', escapeHtml(honours[0] || settings.label + ' division'), '</span>',
          '</span>',
        '</button>'
      ].join('');
    }).join('');

    $('#teamGrid').html(cards);
  }

  function playerInitials(player) {
    if (player.initials) return player.initials;

    return player.name
      .split(/\s+/)
      .map(function (part) { return part.charAt(0); })
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  function renderPlayer(player, team) {
    var portrait = player.photo
      ? '<img src="' + escapeHtml(player.photo) + '" alt="Portrait of ' + escapeHtml(player.ign) + '">'
      : '<span aria-hidden="true">' + escapeHtml(playerInitials(player)) + '</span>';

    return [
      '<article class="player-card" style="--team-color:', escapeHtml(team.color), '">',
        '<div class="player-card__portrait">', portrait, '</div>',
        '<div class="player-card__body">',
          '<span class="player-card__role">', escapeHtml(player.role), '</span>',
          '<h4>', escapeHtml(player.ign), '</h4>',
          '<p class="player-card__name">', escapeHtml(player.name), '</p>',
          '<p class="player-card__facts">',
            '<span>Age ', escapeHtml(player.age), '</span>',
            '<span>', escapeHtml(player.level), '</span>',
          '</p>',
        '</div>',
      '</article>'
    ].join('');
  }

  function openTeam(teamId) {
    var team = leagueData.teams.find(function (item) { return item.id === teamId; });
    if (!team || !activeGame) return;

    var settings = gameSettings[activeGame];
    var roster = team.rosters[activeGame] || [];
    var honours = team.honours[activeGame] || [];

    var modalElement = document.getElementById('teamModal');
    modalElement.style.setProperty('--team-color', team.color);

    $('#teamModalMark').text(team.code);
    $('#teamModalDivision').text(settings.label + ' division');
    $('#teamModalTitle').text(team.teamName);
    $('#teamModalMeta').text('Independent youth organisation · ' + team.base + ' · Founded ' + team.founded);
    $('#teamModalIntro').text(team.introduction);
    $('#teamModalRosterTitle').text(settings.label + ' roster');
    $('#teamModalRosterCount').text(roster.length + ' starting players');

    $('#teamModalHonours').html(honours.map(function (honour) {
      return '<li><i class="bi bi-trophy" aria-hidden="true"></i><span>' + escapeHtml(honour) + '</span></li>';
    }).join(''));

    $('#teamModalRoster').html(roster.map(function (player) {
      return renderPlayer(player, team);
    }).join(''));

    teamModal.show();
  }

  function showLoadError() {
    $('#playersLoading').html([
      '<div class="nx-empty">',
        '<i class="bi bi-exclamation-triangle" aria-hidden="true"></i>',
        '<strong>Roster data could not be loaded.</strong>',
        '<p>Run the project through its local web server instead of opening players.html directly.</p>',
      '</div>'
    ].join(''));
  }

  renderGamePicker();

  $('#gamePicker').on('click', '.game-card', function () {
    selectGame($(this).data('game'));
  });

  $('#changeGame').on('click', showGamePicker);

  $('#teamGrid').on('click', '.team-card', function () {
    openTeam($(this).data('team'));
  });

  $.getJSON('data/players.json')
    .done(function (data) {
      leagueData = data;
      $('#playersLoading').attr('hidden', true);
      $('#dataNote').text(data._source);

      var savedGame = getSavedGame();
      if (gameSettings[savedGame]) {
        selectGame(savedGame, { scroll: false });
      }
    })
    .fail(showLoadError);
});
