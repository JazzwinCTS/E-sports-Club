/* ==========================================================================
   dashboard.js — dashboard.html only.
   Reads all three storage technologies and never writes a preference of its
   own; each value is owned by the page that sets it (CLAUDE.md section 4).
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
    : card('None', 'Star a club on', { href: 'rankings.html', text: 'rankings' }));

  var regs = NXStore.local.get('registrations', []) || [];
  $('#appCount').html(regs.length
    ? card(regs.length, regs.length === 1 ? 'application submitted' : 'applications submitted')
    : card('0', 'Apply on the', { href: 'register.html', text: 'join page' }));

  var returning = NXStore.cookie.get('returningVisitor');
  $('#visitorState').html(returning
    ? card('Returning', 'Cookie set — expires 30 days after your last accept.')
    : card('New', 'No returningVisitor cookie is set on this browser.'));

  /* ---- Storage tables --------------------------------------------------- */
  $('#localTable').html(
    row('theme', NXStore.local.get('theme'), 'Colour scheme, site-wide') +
    row('favouriteTeam', NXStore.local.get('favouriteTeam'), 'Highlighted club on rankings') +
    row('playerFilter', NXStore.local.get('playerFilter'), 'Last-used filter on players') +
    row('registrations', regs.length ? regs.length + ' entries' : null, 'Submitted applications')
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
      'No applications submitted from this browser. ' +
      '<a href="register.html">Apply to join</a>.</p>');
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
});
