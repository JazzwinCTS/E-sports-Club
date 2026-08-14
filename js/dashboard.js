/* ==========================================================================
   dashboard.js — dashboard.html only.
   Reads all three storage technologies and never writes a preference of its
   own; each value is owned by the page that sets it (CLAUDE.md section 4).
   ========================================================================== */

$(function () {
  'use strict';

  function card(value, caption, link) {
    return '<div style="font-family:var(--font-heading);font-size:1.6rem;font-weight:800;line-height:1.1">' +
             NXRender.esc(value) +
           '</div>' +
           '<p class="nx-muted nx-mb-0" style="font-size:.84rem;margin-top:6px">' +
             NXRender.esc(caption) +
             (link ? ' <a href="' + link.href + '">' + link.text + '</a>' : '') +
           '</p>';
  }

  function row(key, value, meaning) {
    return '<div class="nx-trow">' +
             '<span class="nx-trow__k"><code>' + NXRender.esc(key) + '</code><br>' +
               '<span style="font-size:.74rem;opacity:.75">' + NXRender.esc(meaning) + '</span>' +
             '</span>' +
             '<span class="nx-trow__v" style="max-width:50%;text-align:right;word-break:break-word">' +
               NXRender.esc(value === null || value === undefined ? '— not set —' : JSON.stringify(value)) +
             '</span>' +
           '</div>';
  }

  /* ---- Headline cards --------------------------------------------------- */
  var fav = NXStore.local.get('favouriteTeam');
  $('#favTeam').html(fav
    ? card(fav, 'Pinned to the top of', { href: 'rankings.html', text: 'the standings' })
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
    row('favouriteTeam', NXStore.local.get('favouriteTeam'), 'Pinned club on rankings') +
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
          '<strong style="color:var(--text)">' + NXRender.esc(r.ign) + '</strong> · ' +
          NXRender.esc(r.fullName) + '<br>' +
          '<span style="font-size:.74rem;opacity:.75">' +
            NXRender.esc(r.game) + ' · ' + NXRender.esc(r.level) + ' · ' +
            when.toLocaleDateString() +
          '</span>' +
        '</span>' +
        '<span class="nx-trow__v" style="font-size:.76rem">' + NXRender.esc(r.id) + '</span>' +
      '</div>';
    }).join(''));
  }

  /* ---- Wipe everything -------------------------------------------------- */
  $('#wipeAll').on('click', function () {
    NXStore.clearAll();
    window.location.reload();
  });
});
