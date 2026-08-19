// Shared renderers, plus the one AJAX wrapper every page uses. Kept together
// so a tournament card looks the same on the home page as it does anywhere
// else.

var NXRender = (function ($) {
  'use strict';

  // We only cover three games. Trimming this one map trims every game filter
  // and strip on the site.
  var GAME_LOGOS = {
    valorant: 'GameLogos/valorantLogo.png',
    cs2:      'GameLogos/CS2Logo.png',
    pubg:     'GameLogos/pubgLogo.png'
  };

  var GAME_LABELS = {
    valorant: 'Valorant',
    cs2:      'Counter-Strike 2',
    pubg:     'PUBG'
  };

  // Escape anything from a JSON file before it goes near innerHTML.
  function esc(value) {
    return $('<div></div>').text(value == null ? '' : value).html();
  }

  // Prize money is in ringgit. The tournaments page and the data file both
  // say RM, so this card must not print a dollar sign.
  function money(n) {
    return 'RM' + Number(n).toLocaleString('en-US');
  }

  function dateRange(start, end) {
    var opts = { month: 'short', day: 'numeric' };
    var s = new Date(start + 'T00:00:00');
    var e = new Date(end + 'T00:00:00');
    return s.toLocaleDateString('en-US', opts) + ' – ' +
           e.toLocaleDateString('en-US', opts) + ', ' + e.getFullYear();
  }

  function statusBadge(status) {
    if (status === 'live') {
      return '<span class="nx-badge nx-badge--live"><span class="nx-dot"></span>Live</span>';
    }
    if (status === 'upcoming') {
      return '<span class="nx-badge nx-badge--upcoming">Upcoming</span>';
    }
    return '<span class="nx-badge nx-badge--completed">Completed</span>';
  }

  return {
    gameLogos: GAME_LOGOS,
    gameLabels: GAME_LABELS,
    esc: esc,
    money: money,

    spinner: function (label) {
      return '<div class="nx-spinner">' +
               '<div class="nx-spinner__ring" role="status" aria-label="Loading"></div>' +
               '<span>' + esc(label || 'Loading…') + '</span>' +
             '</div>';
    },

    empty: function (message) {
      return '<div class="nx-empty">' +
               '<i class="bi bi-inbox" aria-hidden="true"></i>' +
               esc(message || 'Nothing matches those filters.') +
             '</div>';
    },

    // Every request in the project comes through here: jQuery only, always a
       // spinner while it loads, always something sensible if it fails.
    load: function ($target, url, onSuccess, loadingLabel) {
      $.ajax({
        url: url,
        method: 'GET',
        dataType: 'json',
        beforeSend: function () {
          $target.html(NXRender.spinner(loadingLabel));
        },
        success: function (data) {
          onSuccess(data);
        },
        error: function () {
          $target.html(
            '<div class="nx-empty">' +
              '<i class="bi bi-exclamation-triangle" aria-hidden="true"></i>' +
              '<strong>Unable to load ' + esc(url) + '</strong><br>' +
              '<span style="font-size:.84rem">Browsers block local file reads. ' +
              'Serve the folder over http (see README.md) and reload.</span>' +
            '</div>'
          );
        }
      });
    },

    tournamentCard: function (t) {
      return '' +
        '<article class="nx-card nx-tcard nx-reveal">' +
          '<div class="nx-tcard__media">' +
            '<img src="' + esc(t.thumbnail) + '" alt="' + esc(t.name) + ' key art" loading="lazy">' +
            '<div class="nx-tcard__status">' + statusBadge(t.status) + '</div>' +
            '<div class="nx-tcard__game">' +
              '<img src="' + esc(t.gameLogo) + '" alt="' + esc(t.gameLabel) + '">' +
            '</div>' +
          '</div>' +
          '<div class="nx-tcard__body">' +
            '<h3 class="nx-tcard__title">' + esc(t.name) + '</h3>' +
            '<div class="nx-tcard__rows">' +
              '<div class="nx-trow"><span class="nx-trow__k">Main event</span>' +
                '<span class="nx-trow__v">' + esc(dateRange(t.startDate, t.endDate)) + '</span></div>' +
              '<div class="nx-trow"><span class="nx-trow__k">Prize pool</span>' +
                '<span class="nx-trow__v">' + money(t.prizePool) + '</span></div>' +
              '<div class="nx-trow"><span class="nx-trow__k">Participating teams</span>' +
                '<span class="nx-trow__v">' + esc(t.teams) + '</span></div>' +
              (t.champion
                ? '<div class="nx-trow"><span class="nx-trow__k">Champion</span>' +
                  '<span class="nx-trow__v">' + esc(t.champion) + '</span></div>'
                : '<div class="nx-trow"><span class="nx-trow__k">Format</span>' +
                  '<span class="nx-trow__v">' + esc(t.format) + '</span></div>') +
            '</div>' +
            '<div class="nx-tcard__foot">' +
              '<a class="nx-btn nx-btn--primary nx-btn--block nx-btn--sm" ' +
                 'href="signin.html?event=' + encodeURIComponent(t.id) + '">' +
                (t.status === 'completed' ? 'View results' : 'Register interest') +
              '</a>' +
            '</div>' +
          '</div>' +
        '</article>';
    },

    // `rank` is the team's place in whatever list is on screen right now, so
       // the caller works it out from the order after sorting. It is never the
       // rank stored on the team, which is only the championship-points order.
       //
       // There is deliberately no "moved up 2 places" arrow. Once rank depends
       // on the sort you picked, there is nothing single to measure against.
    // The leaderboard headings. Shared so the home page preview and the
       // rankings page cannot drift apart. These columns have to match
       // boardRow below exactly, or the headings sit over the wrong numbers.
    boardHead: function () {
      return '' +
        '<div class="nx-board__head" aria-hidden="true">' +
          // "Rank" is wider than its own column once the table shrinks, so it
             // would run into "Team". The short form takes over there.
          '<div><span class="nx-lbl-full">Rank</span><span class="nx-lbl-short">#</span></div>' +
          '<div>Team</div>' +
          '<div class="nx-board__pl" style="text-align:center" title="Played">PL</div>' +
          '<div class="nx-board__w" style="text-align:center" title="Won">W</div>' +
          '<div class="nx-board__l" style="text-align:center" title="Lost">L</div>' +
          '<div style="text-align:right">' +
            '<span class="nx-lbl-full">Points</span><span class="nx-lbl-short">Pts</span>' +
          '</div>' +
          '<div style="text-align:right">Medals</div>' +
          '<div></div>' +
        '</div>';
    },

    // One league-table row: rank, team, played, wins, losses, points, medals
       // and the star. Rank and team read from the left; every number gets its
       // own narrow column so the values line up down the table. Nothing here
       // can end in a draw, so played is just wins plus losses.
       //
       // `favourite` is the starred team. Its row is highlighted where it
       // stands, and never moved.
    boardRow: function (team, favourite, rank) {
      var isFav = favourite === team.team;
      var played = Number(team.wins) + Number(team.losses);

      return '' +
        '<div class="nx-board__row nx-reveal' + (isFav ? ' is-favourite' : '') +
          '" data-team="' + esc(team.team) + '">' +
          '<div class="nx-board__rank">' + esc(rank) + '</div>' +
          '<div class="nx-board__team">' +
            '<img class="nx-board__logo" src="' + esc(team.logo) + '" alt="' + esc(team.team) + ' logo" loading="lazy">' +
            '<div style="min-width:0">' +
              '<div class="nx-board__name">' + esc(team.team) + '</div>' +
              // Narrow screens drop the played/won/lost columns, so this line
                 // carries the same three numbers instead.
              '<div class="nx-board__mini nx-num">' + played + ' PL · ' +
                esc(team.wins) + 'W · ' + esc(team.losses) + 'L</div>' +
            '</div>' +
          '</div>' +
          '<div class="nx-board__num nx-board__pl nx-num">' + played + '</div>' +
          '<div class="nx-board__num nx-board__w nx-num">' + esc(team.wins) + '</div>' +
          '<div class="nx-board__num nx-board__l nx-num">' + esc(team.losses) + '</div>' +
          '<div class="nx-board__pts nx-num">' + Number(team.points).toLocaleString('en-US') + '</div>' +
          '<div class="nx-medals">' +
            '<span class="nx-medal nx-medal--gold"><i class="bi bi-trophy-fill"></i>' + esc(team.medals.gold) + '</span>' +
            '<span class="nx-medal nx-medal--silver"><i class="bi bi-award-fill"></i>' + esc(team.medals.silver) + '</span>' +
            '<span class="nx-medal nx-medal--bronze"><i class="bi bi-award"></i>' + esc(team.medals.bronze) + '</span>' +
          '</div>' +
          '<button class="nx-fav' + (isFav ? ' is-on' : '') + '" type="button" ' +
                  'aria-pressed="' + (isFav ? 'true' : 'false') + '" ' +
                  'aria-label="Star ' + esc(team.team) + ' as your favourite team">' +
            '<i class="bi bi-star' + (isFav ? '-fill' : '') + '"></i>' +
          '</button>' +
        '</div>';
    },

    playerCard: function (p) {
      var monogram = String(p.ign).slice(0, 2).toUpperCase();
      var teamChip = !p.team
        ? '<i class="bi bi-person"></i> Independent'
        : p.teamLogo
          ? '<img src="' + esc(p.teamLogo) + '" alt=""> ' + esc(p.team)
          : '<i class="bi bi-shield"></i> ' + esc(p.team);
      var avatar = p.photo
        ? '<img class="nx-avatar nx-avatar--photo" src="' + esc(p.photo) + '" alt="' + esc(p.ign) + '" loading="lazy">'
        : '<div class="nx-avatar" aria-hidden="true">' + esc(monogram) + '</div>';

      return '' +
        '<article class="nx-card nx-pcard nx-reveal" data-game="' + esc(p.game) + '" id="' + esc(p.ign) + '">' +
          avatar +
          '<h3 class="nx-pcard__ign">' + esc(p.ign) + '</h3>' +
          '<p class="nx-pcard__name">' + esc(p.name && p.country ? p.name + ' · ' + p.country : (p.name || p.country || '')) + '</p>' +
          '<span class="nx-pcard__team">' + teamChip + '</span>' +
          '<div class="nx-pcard__stats">' +
            '<div class="nx-stat"><div class="nx-stat__v">' + Number(p.rating).toFixed(2) + '</div>' +
              '<div class="nx-stat__k">Rating</div></div>' +
            '<div class="nx-stat"><div class="nx-stat__v">' + esc(p.maps) + '</div>' +
              '<div class="nx-stat__k">Maps</div></div>' +
          '</div>' +
          '<div class="d-flex flex-wrap align-items-center justify-content-center gap-1 mb-2">' +
            '<span class="nx-badge nx-badge--game">' + esc(p.role) + '</span>' +
            '<span class="nx-badge nx-badge--game">' + esc(p.gameLabel) + '</span>' +
          '</div>' +
          '<p class="nx-pcard__ach nx-mb-0">' + esc(p.achievement) + '</p>' +
        '</article>';
    }
  };
})(jQuery);
