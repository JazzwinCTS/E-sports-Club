// /* ==========================================================================
//    register.js — register.html only.

//    Two states on one page:
//      no account  -> #joinPanel, the sign-up form, validated live in the browser
//      account     -> #joinedPanel, the thank-you panel + sign out

//    Storage (CLAUDE.md section 5, unchanged keys):
//      sessionStorage `registerDraft`  half-finished form, dies with the tab
//      localStorage   `registrations`  the member account, survives the browser

//    `registrations` stays an array so dashboard.html keeps reading it the same
//    way; this page just treats the most recent entry as "the account signed in
//    on this browser".
//    ========================================================================== */


// $(function () {
//   'use strict';

//   var $form = $('#registerForm');

//   /* Draft fields only — the password is deliberately absent. A half-typed
//      password has no business sitting in sessionStorage, and dashboard.js
//      counts exactly these six when it reports draft progress. */
//   var DRAFT_FIELDS = ['fullName', 'email', 'ign', 'game', 'level', 'notes'];

//   var LEVEL_LABELS = {
//     casual: 'Casual — just here to play',
//     improving: 'Improving — wants structured practice',
//     competitive: 'Competitive — after a roster spot'
//   };

//   /* ---- Validation rules ---------------------------------------------------
//      Each returns null when the value is acceptable, or the message to show.
//      Everything here runs in the browser; there is no server to check against. */
//   var PASSWORD_RULES = {
//     length: function (v) { return v.length >= 8; },
//     letter: function (v) { return /[A-Za-z]/.test(v); },
//     number: function (v) { return /[0-9]/.test(v); }
//   };

//   var VALIDATORS = {
//     fullName: function (v) {
//       if (!v) { return 'Please enter your name.'; }
//       if (v.length < 2) { return 'That looks too short.'; }
//       /* \p{L} rather than A-Z so accented and non-Latin names pass — a name
//          field that rejects "Nurmagomedov" is fine, one that rejects "Renée"
//          is a bug. */
//       if (!/^[\p{L}' -]+$/u.test(v)) {
//         return 'Letters, spaces, hyphens and apostrophes only.';
//       }
//       return null;
//     },
//     email: function (v) {
//       if (!v) { return 'Please enter your email address.'; }
//       if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
//         return 'That does not look like a valid email address.';
//       }
//       return null;
//     },
//     ign: function (v) {
//       if (!v) { return 'Please enter the handle you play under.'; }
//       if (v.length < 3) { return 'At least 3 characters.'; }
//       if (!/^[A-Za-z0-9_.-]+$/.test(v)) {
//         return 'Letters, numbers, and _ . - only — no spaces.';
//       }
//       return null;
//     },
//     password: function (v) {
//       if (!v) { return 'Please choose a password.'; }
//       var unmet = Object.keys(PASSWORD_RULES).filter(function (key) {
//         return !PASSWORD_RULES[key](v);
//       });
//       return unmet.length ? 'Your password does not meet all three requirements yet.' : null;
//     },
//     confirm: function (v) {
//       if (!v) { return 'Please retype your password.'; }
//       if (v !== $('#password').val()) { return 'The two passwords do not match.'; }
//       return null;
//     },
//     game: function (v) {
//       return v ? null : 'Please pick your main title.';
//     }
//   };

//   var FIELD_IDS = Object.keys(VALIDATORS);

//   /* ---- Field state --------------------------------------------------------
//      Green appears the moment a value becomes valid. Red is held back until the
//      visitor has left the field once (or pressed submit) — flagging an email as
//      wrong after the first keystroke is just noise. */
//   var touched = {};

//   function markState(id, message, showError) {
//     var $input = $('#' + id);
//     var $field = $input.closest('.nx-field');

//     $field.removeClass('is-valid has-error');
//     $input.removeAttr('aria-invalid');

//     if (!message) {
//       if ($.trim($input.val())) { $field.addClass('is-valid'); }
//     } else if (showError) {
//       $field.addClass('has-error').find('.nx-error').text(message);
//       $input.attr('aria-invalid', 'true');
//     }
//   }

//   /* Passwords are never trimmed — a trailing space is a legitimate character
//      in one, and trimming here would validate a different string from the one
//      that actually gets stored. */
//   var NO_TRIM = { password: true, confirm: true };

//   function checkField(id, force) {
//     var raw = $('#' + id).val() || '';
//     var value = NO_TRIM[id] ? raw : $.trim(raw);
//     var message = VALIDATORS[id](value);
//     markState(id, message, force || touched[id]);
//     return !message;
//   }

//   function paintPasswordRules() {
//     var value = $('#password').val() || '';
//     $('#passwordRules .reg-rule').each(function () {
//       var rule = $(this).data('rule');
//       $(this).toggleClass('is-met', value.length > 0 && PASSWORD_RULES[rule](value));
//     });
//   }

//   $form.on('input change', '.nx-input, .nx-select', function (e) {
//     var id = this.id;

//     /* A select has no "still typing" phase — picking an option is a complete
//        answer, so it may be judged straight away. */
//     if (e.type === 'change' && this.tagName === 'SELECT') { touched[id] = true; }

//     if (id === 'password') {
//       paintPasswordRules();
//       /* Re-check the confirmation too: editing the password can silently
//          invalidate a box the visitor is no longer looking at. */
//       if ($('#confirm').val()) { checkField('confirm'); }
//     }
//     if (VALIDATORS[id]) { checkField(id); }
//   });

//   $form.on('blur', '.nx-input, .nx-select', function () {
//     if (!VALIDATORS[this.id]) { return; }
//     touched[this.id] = true;
//     checkField(this.id);
//   });

//   /* ---- Draft (session) ---------------------------------------------------- */
//   function saveDraft() {
//     var current = {};
//     DRAFT_FIELDS.forEach(function (name) { current[name] = $('#' + name).val(); });
//     NXStore.session.set('registerDraft', current);
//   }

//   $form.on('input change', 'input, select, textarea', function () {
//     if (this.type === 'password') { return; }
//     saveDraft();
//   });

//   function restoreDraft() {
//     var draft = NXStore.session.get('registerDraft', {}) || {};
//     DRAFT_FIELDS.forEach(function (name) {
//       if (draft[name]) { $('#' + name).val(draft[name]); }
//     });
//     /* Show green on whatever was already filled in, without any red. */
//     FIELD_IDS.forEach(function (id) {
//       if ($.trim($('#' + id).val() || '')) { checkField(id); }
//     });
//   }

//   function resetForm() {
//     $form[0].reset();
//     touched = {};
//     $form.find('.nx-field').removeClass('is-valid has-error');
//     $form.find('.nx-input, .nx-select').removeAttr('aria-invalid');
//     paintPasswordRules();
//   }

//   $('#clearDraft').on('click', function () {
//     NXStore.session.remove('registerDraft');
//     resetForm();
//   });

//   /* ---- Prefill from ?event= ----------------------------------------------- */
//   function applyEventParam() {
//     var match = window.location.search.match(/[?&]event=([^&]+)/);
//     if (!match) { return; }
//     var slug = decodeURIComponent(match[1]);
//     var game = slug.split('-')[0];
//     if ($('#game option[value="' + game + '"]').length) {
//       $('#game').val(game);
//       checkField('game');
//     }
//     $('#notes').attr('placeholder', 'Interested in ' + slug + '…');
//   }

//   /* ---- Account creation ---------------------------------------------------
//      There is no server and no sign-in screen, so the password is stored only
//      as a short non-reversible digest — enough to record that one was set,
//      without keeping anything readable in localStorage. A real deployment would
//      hash it server-side with bcrypt or argon2; this is not a security measure. */
//   function digest(text) {
//     var h = 5381;
//     for (var i = 0; i < text.length; i++) {
//       h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
//     }
//     return h.toString(16).toUpperCase();
//   }

//   function getAccount() {
//     var all = NXStore.local.get('registrations', []) || [];
//     return all.length ? all[all.length - 1] : null;
//   }

//   $form.on('submit', function (e) {
//     e.preventDefault();

//     var valid = true;
//     FIELD_IDS.forEach(function (id) {
//       touched[id] = true;
//       if (!checkField(id, true)) { valid = false; }
//     });

//     if (!valid) {
//       $form.find('.has-error').first().find('input, select').trigger('focus');
//       return;
//     }

//     var account = { id: 'REG-' + Date.now().toString(36).toUpperCase() };
//     DRAFT_FIELDS.forEach(function (name) { account[name] = $.trim($('#' + name).val()); });
//     account.passwordHash = digest($('#password').val());
//     account.submittedAt = new Date().toISOString();

//     var all = NXStore.local.get('registrations', []) || [];
//     all.push(account);
//     NXStore.local.set('registrations', all);

//     NXStore.session.remove('registerDraft');
//     resetForm();
//     showJoined(account);
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   });

//   /* ---- Joined state ------------------------------------------------------- */
//   function row(key, value) {
//     return '<div class="nx-trow">' +
//              '<span class="nx-trow__k">' + NXRender.esc(key) + '</span>' +
//              '<span class="nx-trow__v">' + NXRender.esc(value) + '</span>' +
//            '</div>';
//   }

//   function showJoined(account) {
//     /* Entries saved by an earlier build of this page may be missing a field,
//        so nothing here is allowed to assume one is present. */
//     var firstName = $.trim(account.fullName || '').split(' ')[0];
//     var joined = account.submittedAt ? new Date(account.submittedAt) : new Date();

//     $('#joinedLead').text(
//       (firstName ? 'You are in, ' + firstName + '.' : 'You are in.') +
//       ' Your NextGen membership is active on this browser — come say hello at the next ' +
//       'scrim night, and keep an eye on the events page for what is on.'
//     );

//     $('#memberCard').html(
//       row('Member ID', account.id || '—') +
//       row('In-game name', account.ign || '—') +
//       row('Email', account.email || '—') +
//       row('Primary title', NXRender.gameLabels[account.game] || account.game || '—') +
//       row('Experience', LEVEL_LABELS[account.level] || account.level || '—') +
//       row('Joined', joined.toLocaleDateString(undefined,
//         { day: 'numeric', month: 'long', year: 'numeric' }))
//     );

//     $('#joinPanel').attr('hidden', true);
//     $('#joinedPanel').removeAttr('hidden');
//   }

//   function showForm() {
//     $('#joinedPanel').attr('hidden', true);
//     $('#joinPanel').removeAttr('hidden');
//   }

//   $('#signOut').on('click', function () {
//     var ok = window.confirm(
//       'Sign out of NextGen E-Sports?\n\n' +
//       'Your membership details are saved in this browser only, so signing out ' +
//       'deletes them for good. You can always join again.'
//     );
//     if (!ok) { return; }

//     NXStore.local.remove('registrations');
//     NXStore.session.remove('registerDraft');
//     resetForm();
//     showForm();
//     $('#fullName').trigger('focus');
//   });

//   /* ---- Boot --------------------------------------------------------------- */
//   var existing = getAccount();
//   if (existing) {
//     showJoined(existing);
//   } else {
//     restoreDraft();
//     applyEventParam();
//     paintPasswordRules();
//   }
// });

