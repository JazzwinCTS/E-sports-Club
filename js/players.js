/* ==========================================================================
   players.js — players.html only.
   Owns individual profiles. Uses localStorage `playerFilter` so the last-used
   filter is restored on the next visit (CLAUDE.md section 5).
   ========================================================================== */

$(function () {
  'use strict';

  var $grid = $('#playerGrid');
  var allPlayers = [];
  var filters = null;

  var ROLES = ['All roles', 'AWPer', 'Rifler', 'In-Game Leader', 'Carry', 'Midlane', 'Offlane', 'Duelist'];

  function gameOptions() {
    var opts = [{ value: 'all', label: 'All games' }];
    Object.keys(NXRender.gameLabels).forEach(function (key) {
      opts.push({
        value: key,
        label: NXRender.gameLabels[key],
        icon: NXRender.gameLogos[key]
      });
    });
    return opts;
  }

  function roleOptions() {
    return ROLES.map(function (r, i) {
      return { value: i === 0 ? 'all' : r, label: r };
    });
  }

  function apply(state) {
    /* Remember the filter for next visit */
    NXStore.local.set('playerFilter', { game: state.game, role: state.role });

    var rows = allPlayers.filter(function (p) {
      var gameOk = state.game === 'all' || p.game === state.game;
      var roleOk = state.role === 'all' || p.role === state.role;
      return gameOk && roleOk;
    });

    if (state.sort === 'rating') {
      rows.sort(function (a, b) { return b.rating - a.rating; });
    } else if (state.sort === 'maps') {
      rows.sort(function (a, b) { return b.maps - a.maps; });
    } else {
      rows.sort(function (a, b) { return a.ign.localeCompare(b.ign); });
    }

    $grid.html(rows.length
      ? rows.map(NXRender.playerCard).join('')
      : NXRender.empty('No players match those filters.'));

    if (filters) {
      filters.setCount(rows.length + ' of ' + allPlayers.length + ' players');
    }
  }

  NXRender.load($grid, 'data/players.json', function (data) {
    allPlayers = data.players;
    $('#dataNote').text(data._source);

    /* Restore whatever the visitor last chose */
    var saved = NXStore.local.get('playerFilter', {}) || {};

    filters = NXFilter.init({
      mount: '#playersFilter',
      controls: [
        { key: 'game', label: 'Game', value: saved.game || 'all', options: gameOptions() },
        { key: 'role', label: 'Role', value: saved.role || 'all', options: roleOptions() },
        {
          key: 'sort', label: 'Sort', value: 'name',
          options: [
            { value: 'name',   label: 'Name (A–Z)' },
            { value: 'rating', label: 'Rating' },
            { value: 'maps',   label: 'Maps played' }
          ]
        }
      ],
      onChange: apply
    });

    apply(filters.state());

    /* Deep links from rankings (players.html#ign) scroll the card into view */
    if (window.location.hash) {
      var $target = $(window.location.hash.replace(/[^\w\-#]/g, ''));
      if ($target.length) {
        $('html, body').animate({ scrollTop: $target.offset().top - 100 }, 400);
        $target.css('border-color', 'var(--accent)');
      }
    }
  }, 'Loading players…');
});
