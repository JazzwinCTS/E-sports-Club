/* ==========================================================================
   register.js — register.html only.
   sessionStorage `registerDraft` holds the half-finished form (dies with the
   tab); localStorage `registrations` holds submitted entries (CLAUDE.md §5).
   ========================================================================== */

$(function () {
  'use strict';

  var $form = $('#registerForm');
  var FIELDS = ['fullName', 'email', 'ign', 'game', 'level', 'notes'];

  /* ---- Prefill from ?event= --------------------------------------------- */
  var eventMatch = window.location.search.match(/[?&]event=([^&]+)/);
  if (eventMatch) {
    var slug = decodeURIComponent(eventMatch[1]);
    var game = slug.split('-')[0];
    if ($('#game option[value="' + game + '"]').length) {
      $('#game').val(game);
    }
    $('#notes').attr('placeholder', 'Interested in ' + slug + '…');
  }

  /* ---- Restore the in-tab draft ----------------------------------------- */
  var draft = NXStore.session.get('registerDraft', {}) || {};
  FIELDS.forEach(function (name) {
    if (draft[name]) { $('#' + name).val(draft[name]); }
  });

  /* ---- Save the draft on every change ----------------------------------- */
  $form.on('input change', 'input, select, textarea', function () {
    var current = {};
    FIELDS.forEach(function (name) { current[name] = $('#' + name).val(); });
    NXStore.session.set('registerDraft', current);
  });

  $('#clearDraft').on('click', function () {
    NXStore.session.remove('registerDraft');
    $form[0].reset();
    $form.find('.nx-field').removeClass('has-error');
  });

  /* ---- Validation ------------------------------------------------------- */
  function validate() {
    var ok = true;
    $form.find('.nx-field').removeClass('has-error');

    ['fullName', 'ign', 'game'].forEach(function (name) {
      if (!$.trim($('#' + name).val())) {
        $('#' + name).closest('.nx-field').addClass('has-error');
        ok = false;
      }
    });

    var email = $.trim($('#email').val());
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      $('#email').closest('.nx-field').addClass('has-error');
      ok = false;
    }

    return ok;
  }

  /* ---- Submit ----------------------------------------------------------- */
  $form.on('submit', function (e) {
    e.preventDefault();
    if (!validate()) {
      $form.find('.has-error').first().find('input, select').trigger('focus');
      return;
    }

    var entry = { id: 'REG-' + Date.now().toString(36).toUpperCase() };
    FIELDS.forEach(function (name) { entry[name] = $.trim($('#' + name).val()); });
    entry.submittedAt = new Date().toISOString();

    var all = NXStore.local.get('registrations', []) || [];
    all.push(entry);
    NXStore.local.set('registrations', all);

    NXStore.session.remove('registerDraft');
    $form[0].reset();

    paintSubmissions();

    $('#submissions').prepend(
      '<div class="nx-badge nx-badge--live" style="margin-bottom:12px">' +
        '<i class="bi bi-check-lg"></i> Application received' +
      '</div>'
    );
  });

  /* ---- Saved submissions ------------------------------------------------ */
  function paintSubmissions() {
    var all = NXStore.local.get('registrations', []) || [];
    var $out = $('#submissions');

    if (!all.length) {
      $out.html('<p class="nx-muted nx-mb-0" style="font-size:.86rem">' +
        'Nothing submitted from this browser yet.</p>');
      return;
    }

    $out.html(all.slice().reverse().map(function (r) {
      return '<div class="nx-trow">' +
        '<span class="nx-trow__k">' + NXRender.esc(r.ign) +
          ' <span style="opacity:.6">(' + NXRender.esc(r.game) + ')</span></span>' +
        '<span class="nx-trow__v" style="font-size:.76rem">' + NXRender.esc(r.id) + '</span>' +
      '</div>';
    }).join('') +
      '<button class="nx-btn nx-btn--ghost nx-btn--sm" id="clearSubs" type="button" ' +
      'style="margin-top:14px">Clear submissions</button>');
  }

  $('#submissions').on('click', '#clearSubs', function () {
    NXStore.local.remove('registrations');
    paintSubmissions();
  });

  paintSubmissions();
});
