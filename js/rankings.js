// rankings.html only. Owns the team standings, and remembers which team you
// starred in local storage.

$(function () {
  'use strict';

  var $board = $('#board');
  var allTeams = [];
  var filters = null;

  // The home page game strip can pre-select a game, like
     // rankings.html?game=valorant.
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

  // Every team plays all three divisions, so filtering by title would not
     // remove anyone. Picking a title swaps each row's numbers for that
     // division instead. "All games" shows the season total, which is just the
     // three added together.
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
      // The championship order. Sorted here rather than trusting the file
         // to already be in that order.
      rows.sort(function (a, b) { return a.rank - b.rank; });
    }

    // The number on a row is its position in whatever sort is active, not
       // the rank stored in the data. Starring a team highlights its row and
       // never moves it.
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

  // Load the standings
  NXRender.load($board, 'data/standings.json', function (data) {
    allTeams = data.standings;

    // The spinner wiped the board, so the header goes back in here. It comes
       // from the shared renderer so it always lines up with the rows.
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


  // The favourite team is the only thing this page stores. Clicking the star
  // on a team that is already starred clears it.
  $board.on('click', '.nx-fav', function () {
    var isLoggedIn = NXStore.session.get('isLoggedIn') === true;

    if (!isLoggedIn) {
      alert('Please sign in to your account before selecting a favourite team.');
      window.location.href = 'signin.html';
      return;
    }

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
