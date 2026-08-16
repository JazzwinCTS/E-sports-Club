/* ==========================================================================
   rankings.js — rankings.html only.
   Owns team standings. Uses localStorage `favouriteTeam` (CLAUDE.md section 5).
   ========================================================================== */

$(function () {
  'use strict';

  var $board = $('#board');
  var allTeams = [];
  var filters = null;

  /* A game may be pre-selected from the home page game strip
     (e.g. rankings.html?game=valorant). */
  function gameFromQuery() {
    var match = window.location.search.match(/[?&]game=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : 'all';
  }

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
    var favourite = NXStore.local.get('favouriteTeam');
    var rows = allTeams.slice();

    if (state.game !== 'all') {
      rows = rows.filter(function (t) {
        return t.games.indexOf(state.game) !== -1;
      });
    }

    if (state.sort === 'points') {
      rows.sort(function (a, b) { return b.points - a.points; });
    } else if (state.sort === 'gold') {
      rows.sort(function (a, b) { return b.medals.gold - a.medals.gold; });
    } else if (state.sort === 'winrate') {
      rows.sort(function (a, b) {
        return (b.wins / (b.wins + b.losses)) - (a.wins / (a.wins + a.losses));
      });
    } else {
      /* 'rank' — the canonical championship order. Sorted explicitly rather
         than relying on data/standings.json already being stored that way. */
      rows.sort(function (a, b) { return a.rank - b.rank; });
    }

    /* Rank is each team's position in the sort above. The starred team stays
       exactly where its sort places it — starring only highlights the row
       (NXRender.boardRow adds the .is-favourite class), it never reorders
       the table. */
    var ranked = rows.map(function (t, i) { return { team: t, rank: i + 1 }; });

    $board.find('.nx-board__row, .nx-empty').remove();

    if (!ranked.length) {
      $board.append(NXRender.empty('No clubs compete in that title yet.'));
    } else {
      $board.append(ranked.map(function (r) {
        return NXRender.boardRow(r.team, favourite, r.rank);
      }).join(''));
    }

    if (filters) {
      filters.setCount(rows.length + ' of ' + allTeams.length + ' clubs');
    }
  }

  /* ---- Load standings --------------------------------------------------- */
  NXRender.load($board, 'data/standings.json', function (data) {
    allTeams = data.standings;

    $board.html(
      '<div class="nx-board__head" aria-hidden="true">' +
        '<div>Rank</div><div>Club</div>' +
        '<div style="text-align:right">Points</div>' +
        '<div style="text-align:right">Medals</div><div></div>' +
      '</div>'
    );

    $('#dataNote').text(data._source);

    filters = NXFilter.init({
      mount: '#rankingsFilter',
      controls: [
        { key: 'game', label: 'Game', value: gameFromQuery(), options: gameOptions() },
        {
          key: 'sort', label: 'Sort', value: 'rank',
          options: [
            { value: 'rank',    label: 'Championship rank' },
            { value: 'points',  label: 'Points' },
            { value: 'gold',    label: 'Gold medals' },
            { value: 'winrate', label: 'Win rate' }
          ]
        }
      ],
      onChange: apply
    });

    apply(filters.state());
  }, 'Loading standings…');

  /* ---- Favourite team (localStorage) ------------------------------------ */
  $board.on('click', '.nx-fav', function (e) {
    e.stopPropagation();
    var team = $(this).closest('.nx-board__row').data('team');
    var current = NXStore.local.get('favouriteTeam');

    if (current === team) {
      NXStore.local.remove('favouriteTeam');
    } else {
      NXStore.local.set('favouriteTeam', team);
    }
    apply(filters ? filters.state() : { game: 'all', sort: 'rank' });
  });

  /* ---- Roster peek ------------------------------------------------------ */
  $board.on('click', '.nx-board__row', function () {
    var team = $(this).data('team');
    var found = null;
    allTeams.forEach(function (t) { if (t.team === team) { found = t; } });
    if (!found) { return; }

    var $sub = $(this).find('.nx-board__sub');
    $sub.text(found.wins + 'W · ' + found.losses + 'L · ' + found.roster.join(', '));
  });
});
