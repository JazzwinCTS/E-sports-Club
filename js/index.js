/* ==========================================================================
   index.js — index.html only. Aggregated previews that link out to the pages
   that actually own each entity (CLAUDE.md section 4).
   ========================================================================== */

$(function () {
  'use strict';

  /* ---- Happening now ----------------------------------------------------
     One running championship, so this is a facts panel rather than a card
     grid: name, prize pool, dates, and a live countdown to the next match.
     Reads the same file tournaments.html does, so the two can never disagree.

     Deliberately no key art here — the section is about what is on and when,
     and a 16:9 image pushed the actual information below the fold. */
  var MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
                 Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

  /* The fixture list is a fixed schedule, so what the panel shows has to be
     worked out from the clock rather than from the `status` strings in the
     JSON — those never change, and would still claim the season is live long
     after it ended.

     `?now=2026-09-15` shifts this panel's clock for testing and for recording
     the demo, the same trick js/tournaments.js uses for its broadcast
     timeline. It is an offset, not a frozen instant, so countdowns still run. */
  var nowOffset = (function () {
    var m = /[?&]now=([^&]+)/.exec(window.location.search);
    if (!m) { return 0; }
    var faked = Date.parse(decodeURIComponent(m[1]));
    return isNaN(faked) ? 0 : faked - Date.now();
  })();

  function nowDate() { return new Date(Date.now() + nowOffset); }

  /* The fixtures carry "16 Aug" and "4:00 PM" with no year or zone. The
     championship's own startDateTime is +08:00, so they are read in that
     offset rather than in whatever zone the visitor happens to be in. */
  function fixtureDate(dateStr, timeStr, year) {
    var d = /^(\d{1,2})\s+([A-Za-z]{3})/.exec($.trim(dateStr || ''));
    if (!d || !(d[2] in MONTHS)) { return null; }

    var hour = 0;
    var min = 0;
    var t = /^(\d{1,2}):(\d{2})\s*([AaPp])/.exec($.trim(timeStr || ''));
    if (t) {
      hour = parseInt(t[1], 10) % 12;
      min = parseInt(t[2], 10);
      if (t[3].toLowerCase() === 'p') { hour += 12; }
    }

    function pad(n) { return (n < 10 ? '0' : '') + n; }
    return new Date(year + '-' + pad(MONTHS[d[2]] + 1) + '-' + pad(parseInt(d[1], 10)) +
                    'T' + pad(hour) + ':' + pad(min) + ':00+08:00');
  }

  /* Valorant and CS2 keep `matches`; PUBG is a battle royale and keeps
     `rounds` instead. Both are flattened to one shape so the panel does not
     care which division the next fixture belongs to. */
  function collectFixtures(games, year) {
    var out = [];
    $.each(games || {}, function (key, g) {
      var list = g.matches || g.rounds || [];

      /* PUBG runs several rounds per league day (five on each of 7, 14 and
         21 Aug), so the day number is the position of a round's date in the
         schedule — not its round number. */
      var dayOf = {};
      if (!g.matches) {
        var seen = [];
        list.forEach(function (m) {
          if (seen.indexOf(m.date) === -1) { seen.push(m.date); }
        });
        seen.forEach(function (date, i) { dayOf[date] = i + 1; });
      }

      list.forEach(function (m) {
        if (m.status === 'completed') { return; }
        var when = fixtureDate(m.date, m.time, year);
        if (!when) { return; }
        out.push({
          when: when,
          game: key,
          division: g.label || key,
          accent: g.accent,
          round: m.round ||
                 (m.number
                   ? (dayOf[m.date] ? 'League day ' + dayOf[m.date] + ' · ' : '') +
                     'Round ' + m.number
                   : 'Next round'),
          bestOf: m.bestOf || '',
          map: m.map || '',
          home: m.home || null,
          away: m.away || null,
          isBattleRoyale: !g.matches
        });
      });
    });
    return out.sort(function (a, b) { return a.when - b.when; });
  }

  function teamChip(teamsById, id) {
    var t = id ? teamsById[id] : null;
    if (!t) {
      return '<span class="hn-team hn-team--tbd"><span class="hn-team__badge">?</span>TBD</span>';
    }
    return '<span class="hn-team">' +
             '<img class="hn-team__logo" src="' + NXRender.esc(t.logo) + '" alt="">' +
             NXRender.esc(t.code) +
           '</span>';
  }

  function fact(label, value) {
    return '<div class="hn-fact">' +
             '<div class="hn-fact__k">' + NXRender.esc(label) + '</div>' +
             '<div class="hn-fact__v">' + NXRender.esc(value) + '</div>' +
           '</div>';
  }

  function longDate(d) {
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  var countdownTimer = null;

  /* One interval drives every clock on the panel — three divisions means three
     countdowns, and three separate intervals would drift apart. */
  function startClocks() {
    function tick() {
      var now = nowDate();
      var running = 0;

      $('.hn-clock[data-at]').each(function () {
        var $clock = $(this);
        var diff = new Date($clock.attr('data-at')) - now;

        if (diff <= 0) {
          $clock.html('<span class="hn-clock__live"><span class="nx-online"></span>Under way</span>');
          return;
        }

        running++;
        var s = Math.floor(diff / 1000);
        var parts = [
          [Math.floor(s / 86400), 'd'],
          [Math.floor(s % 86400 / 3600), 'h'],
          [Math.floor(s % 3600 / 60), 'm'],
          [s % 60, 's']
        ];
        $clock.html(parts.map(function (p) {
          return '<span class="hn-unit"><b>' + (p[0] < 10 ? '0' : '') + p[0] + '</b>' + p[1] + '</span>';
        }).join(''));
      });

      if (!running) { window.clearInterval(countdownTimer); }
    }

    tick();
    window.clearInterval(countdownTimer);
    countdownTimer = window.setInterval(tick, 1000);
  }

  /* The soonest fixture still to come in each division. A fixture that started
     within the last few hours is still on air so it stays; anything older is
     over in all but the data's `status` field. */
  function nextPerDivision(games, year) {
    var ON_AIR_MS = 3 * 60 * 60 * 1000;
    var now = nowDate();
    var out = [];

    $.each(games || {}, function (key) {
      var one = {};
      one[key] = games[key];
      var fixtures = collectFixtures(one, year);

      var live = fixtures.filter(function (f) {
        return f.when <= now && (now - f.when) < ON_AIR_MS;
      })[0];
      var upcoming = fixtures.filter(function (f) { return f.when > now; })[0];
      var pick = live || upcoming;

      if (pick) {
        pick.isLive = pick === live;
        out.push(pick);
      } else {
        out.push({
          game: key,
          division: (games[key] && games[key].label) || key,
          accent: games[key] && games[key].accent,
          done: true
        });
      }
    });

    return out;
  }

  var $tournaments = $('#homeTournaments');
  NXRender.load($tournaments, 'data/youth-tournament.json', function (data) {
    /* Only what is actually on. Finished events belong to tournaments.html. */
    var running = (data.tournaments || []).filter(function (t) {
      return t.status !== 'completed';
    });

    if (!running.length) {
      $tournaments.html(NXRender.empty('Nothing running right now — the next season is being scheduled.'));
      return;
    }

    var c = data.championship || {};
    var starts = running.map(function (t) { return t.startDate; }).sort();
    var ends = running.map(function (t) { return t.endDate; }).sort();
    var startDate = new Date(c.startDateTime || (starts[0] + 'T00:00:00+08:00'));
    var endDate = new Date(ends[ends.length - 1] + 'T00:00:00+08:00');

    var teamsById = {};
    (c.teams || []).forEach(function (t) { teamsById[t.id] = t; });

    /* One card per division — Valorant, CS2 and PUBG each get their own next
       fixture and countdown, so the homepage does not have to pick a favourite
       the way tournaments.html's division tabs do. */
    var fixtures = nextPerDivision(c.games, startDate.getFullYear());

    /* Each division's own logo, taken from the tournament entries so the
       homepage and tournaments.html always show the same art per title. */
    var logoByGame = {};
    (data.tournaments || []).forEach(function (t) { logoByGame[t.game] = t.gameLogo; });

    /* Header art — the same GameArt profile images tournaments.html uses for
       its division tabs, drawn the same way (cover, centred, under a gradient).
       Paths are document-relative here because they are set in an inline style
       attribute, not from inside css/. */
    var ART_BY_GAME = {
      valorant: 'GameArt/valorant-profile.jpg',
      cs2: 'GameArt/cs2-profile.png',
      pubg: 'GameArt/pubg-profile.jpg'
    };

    function cardHead(f) {
      var logo = logoByGame[f.game];
      var art = ART_BY_GAME[f.game];
      return '<div class="hn-card__head"' +
               (art ? ' style="background-image:url(\'' + NXRender.esc(art) + '\')"' : '') + '>' +
               '<div class="hn-card__headrow">' +
                 (logo
                   ? '<img class="hn-card__logo" src="' + NXRender.esc(logo) +
                     '" alt="" loading="lazy">'
                   : '') +
                 '<span class="hn-card__division">' + NXRender.esc(f.division) + '</span>' +
                 (f.isLive ? '<span class="hn-card__live">on air</span>' : '') +
               '</div>' +
             '</div>';
    }

    var cards = fixtures.map(function (f) {
      if (f.done) {
        return '<div class="hn-card"' +
                 (f.accent ? ' style="--division:' + NXRender.esc(f.accent) + '"' : '') + '>' +
                 cardHead(f) +
                 '<p class="hn-card__meta">Every fixture in this division has been played.</p>' +
                 '<p class="hn-card__when">' +
                   '<a href="rankings.html">Final standings <i class="bi bi-arrow-right" aria-hidden="true"></i></a>' +
                 '</p>' +
               '</div>';
      }

      return '<div class="hn-card"' +
               (f.accent ? ' style="--division:' + NXRender.esc(f.accent) + '"' : '') + '>' +
               cardHead(f) +
               '<div class="hn-clock" data-at="' + f.when.toISOString() + '"></div>' +
               '<div class="hn-fixture">' +
                 (f.isBattleRoyale
                   ? '<span class="hn-team hn-team--tbd">All 8 teams</span>'
                   : teamChip(teamsById, f.home) +
                     '<span class="hn-fixture__vs">vs</span>' +
                     teamChip(teamsById, f.away)) +
               '</div>' +
               '<p class="hn-card__meta">' + NXRender.esc(f.round) +
                 (f.bestOf ? ' · ' + NXRender.esc(f.bestOf) : '') +
                 (f.map ? ' · ' + NXRender.esc(f.map) : '') +
               '</p>' +
               '<p class="hn-card__when">' +
                 NXRender.esc(f.when.toLocaleDateString(undefined,
                   { weekday: 'short', day: 'numeric', month: 'short' })) + ' · ' +
                 NXRender.esc(f.when.toLocaleTimeString(undefined,
                   { hour: 'numeric', minute: '2-digit' })) + ' MYT' +
               '</p>' +
             '</div>';
    }).join('');

    /* Which phase the season is in, worked out from the dates rather than the
       data's `status` strings — otherwise the badge would still read "3
       divisions live" in September, next to three cards saying the divisions
       are complete. The end date is the last day, so the season is only over
       once that whole day has passed. */
    var now = nowDate();
    var lastDayEnd = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
    var badge;
    var fixturesLabel;

    if (now < startDate) {
      badge = '<span class="nx-badge nx-badge--upcoming">Starts ' + NXRender.esc(longDate(startDate)) + '</span>';
      fixturesLabel = 'Opening matches';
    } else if (now > lastDayEnd) {
      badge = '<span class="nx-badge nx-badge--completed">Season complete</span>';
      fixturesLabel = 'Final results';
    } else {
      badge = '<span class="nx-badge nx-badge--live">' +
                '<span class="nx-online"></span>' +
                NXRender.esc(running.length) + ' divisions live' +
              '</span>';
      fixturesLabel = 'Upcoming matches';
    }

    $tournaments.html(
      '<div class="hn">' +
        '<div class="hn-main">' +
          badge +
          '<h3 class="hn-name">' + NXRender.esc(c.name || 'NextGen Youth Championship') + '</h3>' +
          '<div class="hn-facts">' +
            fact('Prize pool', 'RM' + Number(c.totalPrize || 0).toLocaleString('en-US')) +
            fact('Starts', longDate(startDate)) +
            fact('Ends', longDate(endDate)) +
            fact('Teams', (c.teams || []).length || running[0].teams) +
          '</div>' +
        '</div>' +
        '<div class="hn-fixtures">' +
          '<p class="hn-fixtures__label">' + fixturesLabel + '</p>' +
          '<div class="hn-cards">' + cards + '</div>' +
        '</div>' +
      '</div>'
    );

    startClocks();
  }, 'Loading the championship…');

  /* ---- Standings preview (top 5) ----------------------------------------
     Always the canonical championship order (never re-sorted), so rank here
     is just this slice's position, 1 through 5. */
  var $standings = $('#homeStandings');
  var topFive = [];

  function paintStandings() {
    var favourite = NXStore.local.get('favouriteTeam');
    /* Same column headings rankings.html uses — the preview is the same
       component, so it gets the same header rather than bare rows. */
    $standings.html(NXRender.boardHead() + topFive.map(function (t, i) {
      return NXRender.boardRow(t, favourite, i + 1);
    }).join(''));
  }

  NXRender.load($standings, 'data/standings.json', function (data) {
    topFive = data.standings.slice().sort(function (a, b) { return a.rank - b.rank; }).slice(0, 5);
    paintStandings();
  }, 'Loading standings…');

  /* The rows are a read-only preview — the "Full standings" button is the way
     through to rankings.html, so the rows themselves are not click targets.
     The star inside them is, though: it writes the same localStorage
     `favouriteTeam` rankings.html reads (CLAUDE.md section 5), so the two
     pages stay in step without either script knowing about the other. */
  $standings.on('click', '.nx-fav', function () {
    var team = $(this).closest('.nx-board__row').data('team');
    var current = NXStore.local.get('favouriteTeam');

    if (current === team) {
      NXStore.local.remove('favouriteTeam');
    } else {
      NXStore.local.set('favouriteTeam', team);
    }
    paintStandings();
  });

  /* ---- Stream embed -----------------------------------------------------
     Twitch requires a `parent` matching the host serving the page, so the
     embed is built at runtime. Opened straight off disk there is no host and
     the embed cannot work — say so plainly instead of showing a dead frame.

     `parent` can be repeated to allow-list more than one host. Local dev
     servers (VS Code Live Server, `python serve.py`) commonly serve over
     `127.0.0.1` — Twitch's parent check is a plain string match against
     the embedding page's real hostname, so the literal IP won't match a
     `parent=localhost` example copied from a tutorial, and vice versa.
     Sending both covers whichever one the page actually loaded on, without
     needing to know in advance which the dev used.
     --------------------------------------------------------------------- */
  var host = window.location.hostname;
  var $mount = $('#streamMount');

  if (host) {
    var parents = 'parent=' + encodeURIComponent(host);
    if (host !== 'localhost') { parents += '&parent=localhost'; }

    $('<iframe>')
      .attr({
        src: 'https://player.twitch.tv/?channel=ewc_plus_en&' + parents + '&muted=true',
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
