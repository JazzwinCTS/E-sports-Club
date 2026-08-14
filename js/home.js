/* ==========================================================================
   home.js — index.html only. Aggregated previews that link out to the pages
   that actually own each entity (CLAUDE.md section 4).
   ========================================================================== */

$(function () {
  'use strict';

  /* ---- Live & upcoming tournaments (top 3) ------------------------------ */
  var $tournaments = $('#homeTournaments');
  NXRender.load($tournaments, 'data/tournaments.json', function (data) {
    var order = { live: 0, upcoming: 1, completed: 2 };
    var top = data.tournaments
      .slice()
      .sort(function (a, b) { return order[a.status] - order[b.status]; })
      .slice(0, 3);

    $tournaments.html(top.map(NXRender.tournamentCard).join(''));
  }, 'Loading tournaments…');

  /* ---- Standings preview (top 5) ---------------------------------------- */
  var $standings = $('#homeStandings');
  NXRender.load($standings, 'data/standings.json', function (data) {
    var favourite = NXStore.local.get('favouriteTeam');
    var top = data.standings.slice(0, 5);

    $standings.html(top.map(function (t) {
      return NXRender.boardRow(t, favourite);
    }).join(''));
  }, 'Loading standings…');

  /* Rows link through to the page that owns team detail */
  $standings.on('click', '.nx-board__row', function () {
    window.location.href = 'rankings.html';
  });

  /* ---- Stream embed -----------------------------------------------------
     Twitch requires a `parent` matching the host serving the page, so the
     embed is built at runtime. Opened straight off disk there is no host and
     the embed cannot work — say so plainly instead of showing a dead frame.
     --------------------------------------------------------------------- */
  var host = window.location.hostname;
  var $mount = $('#streamMount');

  if (host) {
    $('<iframe>')
      .attr({
        src: 'https://player.twitch.tv/?channel=esl_csgo&parent=' + encodeURIComponent(host) + '&muted=true',
        title: 'Live esports broadcast',
        allowfullscreen: 'true',
        frameborder: '0'
      })
      .css({ width: '100%', height: '100%', border: '0' })
      .appendTo($mount);
  } else {
    $mount.html(
      '<div class="nx-spinner" style="height:100%">' +
        '<i class="bi bi-broadcast" style="font-size:2rem;color:var(--accent)"></i>' +
        '<span>Serve this folder over http to load the live stream.</span>' +
      '</div>'
    );
  }
});
