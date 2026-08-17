/* ==========================================================================
   dashboard.js — dashboard.html only.

   The page is a profile: a mini nav across Personal info / Favourites /
   Storage. It reads all three storage technologies and never writes a
   preference of its own; each value is owned by the page that sets it
   (CLAUDE.md section 4). The one thing it does write is a deletion — signing
   out, which clears the account the same way register.html does.
   ========================================================================== */

$(function () {
  'use strict';

  function card(value, caption, link) {
    return '<div class="dash-stat__value">' +
             NXRender.esc(value) +
           '</div>' +
           '<p class="nx-muted nx-mb-0 dash-stat__caption">' +
             NXRender.esc(caption) +
             (link ? ' <a href="' + link.href + '">' + link.text + '</a>' : '') +
           '</p>';
  }

  /* ---- Human-readable formatting -----------------------------------------
     Raw storage values are JSON — a plain object like {"game":"cs2","role":
     "Duelist"} means nothing to a visitor at a glance. Each key gets its own
     small formatter instead of a blind JSON.stringify() dump. */
  var SORT_LABELS = { date: 'Start date', prize: 'Prize pool', teams: 'Team count' };

  function gameLabel(key) {
    if (!key || key === 'all') { return 'All games'; }
    return NXRender.gameLabels[key] || key;
  }

  function titleCase(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  function formatValue(key, value) {
    if (value === null || value === undefined || value === '') {
      return '— not set —';
    }

    if (key === 'theme') {
      return value === 'light' ? 'Light' : 'Dark';
    }
    if (key === 'playerFilter') {
      return 'Game: ' + gameLabel(value.game) +
             ' · Role: ' + (value.role && value.role !== 'all' ? value.role : 'All roles');
    }
    if (key === 'tournamentFilter') {
      var status = value.status && value.status !== 'all' ? titleCase(value.status) : 'All statuses';
      return status + ' · ' + gameLabel(value.game) + ' · Sort: ' + (SORT_LABELS[value.sort] || 'Start date');
    }
    if (key === 'registerDraft') {
      var fields = ['fullName', 'email', 'ign', 'game', 'level', 'notes'];
      var filled = fields.filter(function (f) { return value[f]; });
      return filled.length
        ? filled.length + ' of ' + fields.length + ' fields filled'
        : 'Started, nothing typed yet';
    }
    if (key === 'eventView') {
      return value === 'calendar' ? 'Calendar view' : 'List view';
    }
    if (key === 'returningVisitor') {
      return value ? 'Yes' : 'No';
    }

    /* theme, favouriteTeam, registrations count — already plain, human text */
    return String(value);
  }

  function row(key, value, meaning) {
    return '<div class="nx-trow">' +
             '<span class="nx-trow__k"><code>' + NXRender.esc(key) + '</code><br>' +
               '<span class="dash-row__meaning">' + NXRender.esc(meaning) + '</span>' +
             '</span>' +
             '<span class="nx-trow__v dash-row__value">' +
               NXRender.esc(formatValue(key, value)) +
             '</span>' +
           '</div>';
  }

  /* ---- Headline cards --------------------------------------------------- */
  var fav = NXStore.local.get('favouriteTeam');
  $('#favTeam').html(fav
    ? card(fav, 'Highlighted on', { href: 'rankings.html', text: 'the standings' })
    : card('None', 'Star a team on', { href: 'rankings.html', text: 'rankings' }));

  var regs = NXStore.local.get('registrations', []) || [];
  $('#appCount').html(regs.length
    ? card('Active', 'Member account stored on this browser.')
    : card('None', 'Create one on the', { href: 'register.html', text: 'join page' }));

  var returning = NXStore.cookie.get('returningVisitor');
  $('#visitorState').html(returning
    ? card('Returning', 'Cookie set — expires 30 days after your last accept.')
    : card('New', 'No returningVisitor cookie is set on this browser.'));

  /* ---- Storage tables --------------------------------------------------- */
  $('#localTable').html(
    row('theme', NXStore.local.get('theme'), 'Colour scheme, site-wide') +
    row('favouriteTeam', NXStore.local.get('favouriteTeam'), 'Highlighted team on rankings') +
    row('playerFilter', NXStore.local.get('playerFilter'), 'Last-used filter on players') +
    row('registrations', regs.length
      ? (regs.length === 1 ? '1 account' : regs.length + ' entries')
      : null, 'Your member account')
  );

  $('#sessionTable').html(
    row('registerDraft', NXStore.session.get('registerDraft'), 'Half-finished join form') +
    row('tournamentFilter', NXStore.session.get('tournamentFilter'), 'Active tournament filter') +
    row('eventView', NXStore.session.get('eventView'), 'List or calendar on events') +
    row('returningVisitor', returning, 'Cookie · 30 day expiry')
  );

  /* ---- Submitted applications ------------------------------------------- */
  var LEVEL_LABELS = {
    casual: 'Casual',
    improving: 'Improving',
    competitive: 'Competitive'
  };

  var $subs = $('#dashSubmissions');
  if (!regs.length) {
    $subs.html('<p class="nx-muted nx-mb-0" style="font-size:.86rem">' +
      'No account stored in this browser. ' +
      '<a href="register.html">Join the team</a>.</p>');
  } else {
    $subs.html(regs.slice().reverse().map(function (r) {
      var when = new Date(r.submittedAt);
      return '<div class="nx-trow">' +
        '<span class="nx-trow__k">' +
          '<strong class="dash-app__name">' + NXRender.esc(r.ign) + '</strong> · ' +
          NXRender.esc(r.fullName) + '<br>' +
          '<span class="dash-app__meta">' +
            NXRender.esc(gameLabel(r.game)) + ' · ' +
            NXRender.esc(LEVEL_LABELS[r.level] || r.level) + ' · ' +
            when.toLocaleDateString() +
          '</span>' +
        '</span>' +
        '<span class="nx-trow__v dash-app__id">' + NXRender.esc(r.id) + '</span>' +
      '</div>';
    }).join(''));
  }

  /* ---- Wipe everything -------------------------------------------------- */
  $('#wipeAll').on('click', function () {
    NXStore.clearAll();
    window.location.reload();
  });

  /* ======================================================================
     Profile
     ====================================================================== */

  /* The account is the most recent entry in `registrations`. Read straight
     from storage — this page never depends on register.js having run. */
  var account = regs.length ? regs[regs.length - 1] : null;

  /* ---- Header ------------------------------------------------------------ */
  function initials(name) {
    var parts = $.trim(name || '').split(/\s+/).filter(Boolean);
    if (!parts.length) { return '?'; }
    if (parts.length === 1) { return parts[0].charAt(0).toUpperCase(); }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  if (account) {
    $('#profileAvatar').text(initials(account.fullName));
    $('#profileName').text(account.fullName || 'Profile');
    $('#profileSub').text(account.email || '');
    $('#signOut').removeAttr('hidden');
  } else {
    /* No account: a monogram of nobody is just a question mark in a box. */
    $('#profileAvatar').attr('hidden', true);
  }

  /* ---- Personal information ---------------------------------------------- */
  /* Each field is a Bootstrap column; the .dash-fields wrapper below is a
     Bootstrap row, so the two-across / one-across switch is the grid's job. */
  function field(label, value) {
    var empty = !value;
    return '<div class="col dash-field">' +
             '<p class="dash-field__label">' + NXRender.esc(label) + '</p>' +
             '<p class="dash-field__value' + (empty ? ' is-empty' : '') + '">' +
               NXRender.esc(empty ? 'Not set' : value) +
             '</p>' +
           '</div>';
  }

  if (!account) {
    $('#personalFields').html(
      '<div class="nx-empty">' +
        '<i class="bi bi-person-x" aria-hidden="true"></i>' +
        'No account on this browser yet.<br>' +
        '<a href="register.html">Join the team</a> and your details appear here.' +
      '</div>'
    );
  } else {
    $('#personalFields').html(
      '<div class="dash-fields row row-cols-1 row-cols-md-2 g-4">' +
        field('Full name', account.fullName) +
        field('Email address', account.email) +
        field('In-game name', account.ign) +
        field('Member ID', account.id) +
        field('Primary title', gameLabel(account.game)) +
        field('Experience', LEVEL_LABELS[account.level] || account.level) +
      '</div>' +
      (account.notes
        ? '<div class="dash-field dash-field--wide">' +
            '<p class="dash-field__label">Anything else</p>' +
            '<p class="dash-field__value">' + NXRender.esc(account.notes) + '</p>' +
          '</div>'
        : '') +
      '<p class="nx-muted dash-panel__foot">' +
        'Details cannot be edited here — there is no server to save an edit to. ' +
        'Sign out and join again to change them.' +
      '</p>'
    );
  }

  /* ---- Favourites --------------------------------------------------------- */
  function favTile(opts) {
    return '<div class="col">' +
           '<div class="dash-fav h-100' + (opts.value ? '' : ' is-empty') + '">' +
             '<div class="dash-fav__icon">' + opts.icon + '</div>' +
             '<div class="dash-fav__body">' +
               '<p class="dash-fav__label">' + NXRender.esc(opts.label) + '</p>' +
               '<p class="dash-fav__value">' +
                 NXRender.esc(opts.value || opts.placeholder) +
               '</p>' +
               '<a class="dash-fav__link" href="' + opts.href + '">' +
                 NXRender.esc(opts.action) +
                 ' <i class="bi bi-arrow-right" aria-hidden="true"></i>' +
               '</a>' +
             '</div>' +
           '</div>' +
           '</div>';
  }

  var gameIcon = account && NXRender.gameLogos[account.game]
    ? '<img src="' + NXRender.gameLogos[account.game] + '" alt="">'
    : '<i class="bi bi-controller" aria-hidden="true"></i>';

  /* `favouritePlayers` / `favouriteEvents` do not exist yet — players.html and
     events.html are still to be built by the rest of the team. Read them
     defensively so these two tiles start working the day those pages ship,
     without this file needing another edit. The shape assumed here is an array
     of display names; it is a proposal, not an agreed key (CLAUDE.md section 5
     lists both as reserved). */
  function favList(key) {
    var saved = NXStore.local.get(key, []) || [];
    return Array.isArray(saved) && saved.length ? saved.join(' · ') : null;
  }

  $('#favFields').html(
    favTile({
      label: 'Primary title',
      value: account ? gameLabel(account.game) : null,
      placeholder: 'Set when you join',
      icon: gameIcon,
      href: 'register.html',
      action: account ? 'Browse this title' : 'Join the team'
    }) +
    favTile({
      label: 'Favourite team',
      value: fav,
      placeholder: 'No team starred yet',
      icon: '<i class="bi bi-shield-fill" aria-hidden="true"></i>',
      href: 'rankings.html',
      action: fav ? 'See the standings' : 'Star a team'
    }) +
    favTile({
      label: 'Favourite players',
      value: favList('favouritePlayers'),
      placeholder: 'Coming soon — the players page has no star yet',
      icon: '<i class="bi bi-person-badge" aria-hidden="true"></i>',
      href: 'players.html',
      action: 'Browse players'
    }) +
    favTile({
      label: 'Favourite events',
      value: favList('favouriteEvents'),
      placeholder: 'Coming soon — the events page has no star yet',
      icon: '<i class="bi bi-calendar-heart" aria-hidden="true"></i>',
      href: 'events.html',
      action: 'Browse events'
    })
  );

  /* ---- Mini nav ------------------------------------------------------------
     Hash-linked rather than stored: a section is worth deep-linking to, and it
     is not a preference, so it has no business taking a storage key. */
  var PANELS = ['personal', 'favourites', 'storage'];

  function showPanel(name) {
    if (PANELS.indexOf(name) === -1) { name = PANELS[0]; }

    $('.dash-tab').each(function () {
      var on = $(this).data('panel') === name;
      $(this).toggleClass('is-active', on)
        .attr('aria-selected', on ? 'true' : 'false')
        .attr('tabindex', on ? 0 : -1);
    });

    $('.dash-panel').attr('hidden', true);
    $('#panel-' + name).removeAttr('hidden');
  }

  $('.dash-tab').on('click', function () {
    var name = $(this).data('panel');
    showPanel(name);
    /* replaceState, not location.hash — setting the hash would jump the page
       to the panel and undo the visitor's scroll position. */
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', '#' + name);
    }
  });

  /* Left/right arrows move between tabs, as a tablist is expected to. */
  $('.dash-tabs').on('keydown', '.dash-tab', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') { return; }
    e.preventDefault();
    var $tabs = $('.dash-tab');
    var i = $tabs.index(this);
    var next = e.key === 'ArrowRight' ? (i + 1) % $tabs.length
                                      : (i - 1 + $tabs.length) % $tabs.length;
    $tabs.eq(next).trigger('click').trigger('focus');
  });

  showPanel((window.location.hash || '').replace('#', ''));

  /* ---- Sign out ------------------------------------------------------------
     Same deletion register.html performs, reached from the profile instead.
     Each page reads and clears the key independently (CLAUDE.md section 7). */
  $('#signOut').on('click', function () {
    var ok = window.confirm(
      'Sign out of NextGen E-Sports?\n\n' +
      'Your membership details are saved in this browser only, so signing out ' +
      'deletes them for good. You can always join again.'
    );
    if (!ok) { return; }

    NXStore.local.remove('registrations');
    NXStore.session.remove('registerDraft');
    window.location.reload();
  });
});
