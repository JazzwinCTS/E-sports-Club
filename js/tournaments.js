/* ==========================================================================
   tournaments.js — tournaments.html only.
   Owns brackets, results and prize pools. Uses sessionStorage
   `tournamentFilter` so the active filter survives in-tab navigation but a
   new tab starts clean (CLAUDE.md section 5).
   ========================================================================== */

$(function () {
  'use strict';

  var $grid = $('#tournamentGrid');
  var all = [];
  var filters = null;
  var status = 'all';

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

  function apply(state) {
    NXStore.session.set('tournamentFilter', {
      status: status,
      game: state.game,
      sort: state.sort
    });

    var rows = all.filter(function (t) {
      var statusOk = status === 'all' || t.status === status;
      var gameOk = state.game === 'all' || t.game === state.game;
      return statusOk && gameOk;
    });

    if (state.sort === 'prize') {
      rows.sort(function (a, b) { return b.prizePool - a.prizePool; });
    } else if (state.sort === 'teams') {
      rows.sort(function (a, b) { return b.teams - a.teams; });
    } else {
      rows.sort(function (a, b) { return a.startDate.localeCompare(b.startDate); });
    }

    $grid.html(rows.length
      ? rows.map(NXRender.tournamentCard).join('')
      : NXRender.empty('No tournaments match those filters.'));

    if (filters) {
      filters.setCount(rows.length + ' of ' + all.length + ' tournaments');
    }
  }

  NXRender.load($grid, 'data/tournaments.json', function (data) {
    all = data.tournaments;
    $('#dataNote').text(data._source);

    var saved = NXStore.session.get('tournamentFilter', {}) || {};
    status = saved.status || 'all';

    /* Reflect a restored status on the toolbar */
    $('#statusTabs .nx-tab').removeClass('is-active').attr('aria-selected', 'false')
      .filter('[data-status="' + status + '"]')
      .addClass('is-active').attr('aria-selected', 'true');

    filters = NXFilter.init({
      mount: '#tournamentsFilter',
      controls: [
        { key: 'game', label: 'Game', value: saved.game || 'all', options: gameOptions() },
        {
          key: 'sort', label: 'Sort', value: saved.sort || 'date',
          options: [
            { value: 'date',  label: 'Start date' },
            { value: 'prize', label: 'Prize pool' },
            { value: 'teams', label: 'Team count' }
          ]
        }
      ],
      onChange: apply
    });

    apply(filters.state());
  }, 'Loading tournaments…');

  /* ---- Status toolbar --------------------------------------------------- */
  $('#statusTabs').on('click', '.nx-tab', function () {
    $('#statusTabs .nx-tab').removeClass('is-active').attr('aria-selected', 'false');
    $(this).addClass('is-active').attr('aria-selected', 'true');
    status = $(this).data('status');
    apply(filters ? filters.state() : { game: 'all', sort: 'date' });
  });
});
