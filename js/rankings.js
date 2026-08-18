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

  /* Every team fields all three divisions, so filtering by title would change
     nothing on its own. Selecting a title instead swaps each row's numbers for
     that division's record; "All games" shows the season total, which
     data/standings.json stores as the sum of the three. */
  function divisionView(t, game) {
    if (game === 'all' || !t.divisions || !t.divisions[game]) { return t; }
    var d = t.divisions[game];
    return {
      rank: t.rank,
      team: t.team,
      logo: t.logo,
      games: t.games,
      roster: t.roster,
      points: d.points,
      wins: d.wins,
      losses: d.losses,
      medals: d.medals
    };
  }

  function apply(state) {
    var favourite = NXStore.local.get('favouriteTeam');
    var rows = allTeams.slice();

    if (state.game !== 'all') {
      rows = rows.filter(function (t) {
        return t.games.indexOf(state.game) !== -1;
      }).map(function (t) {
        return divisionView(t, state.game);
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

    /* Rank is each team's position in the sort above, not the `rank` field in
       the data — that is only the canonical championship-points order. The
       starred team stays exactly where the sort puts it; starring highlights
       the row, it never reorders the table. */
    var ranked = rows.map(function (t, i) { return { team: t, rank: i + 1 }; });

    $board.find('.nx-board__row, .nx-empty').remove();

    if (!ranked.length) {
      $board.append(NXRender.empty('No teams compete in that title yet.'));
    } else {
      $board.append(ranked.map(function (r) {
        return NXRender.boardRow(r.team, favourite, r.rank);
      }).join(''));
    }

    if (filters) {
      filters.setCount(rows.length + ' of ' + allTeams.length + ' teams');
    }
  }

  /* ---- Load standings --------------------------------------------------- */
  NXRender.load($board, 'data/standings.json', function (data) {
    allTeams = data.standings;

    /* NXRender.load replaced the board with a spinner, so the header goes back
       in here — from the shared renderer, so it always matches the rows. */
    $board.html(NXRender.boardHead());

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


  /* ---- Favourite team (localStorage `favouriteTeam`) ---------------------
     The only value this page stores, and the reason rankings.html is the
     localStorage demonstration in the graded storage requirement. Clicking a
     starred team again clears it. */
  $board.on('click', '.nx-fav', function () {
    var team = $(this).closest('.nx-board__row').data('team');
    var current = NXStore.local.get('favouriteTeam');

    if (current === team) {
      NXStore.local.remove('favouriteTeam');
    } else {
      NXStore.local.set('favouriteTeam', team);
    }
    apply(filters ? filters.state() : { game: 'all', sort: 'rank' });
  });

});
