/* ==========================================================================
   signin.js

   Two states on one page:
     no account  -> #joinPanel / #loginPanel (Sign In / Sign Up forms)
     account     -> Dashboard layout takes over (handled by dashboard JS)

   Storage (CLAUDE.md section 5, unchanged keys):
     sessionStorage `registerDraft`  half-finished form, dies with the tab
     localStorage   `registrations`  the member account, survives the browser

   `registrations` stays an array so dashboard.html keeps reading it the same
   way; this page just treats the most recent entry as "the account signed in
   on this browser".
   ========================================================================== */

$(function () {
  'use strict';

  var $form = $('#registerForm');

  /* Draft fields only — the password is deliberately absent. A half-typed
     password has no business sitting in sessionStorage, and dashboard.js
     counts exactly these six when it reports draft progress. */
  var DRAFT_FIELDS = ['fullName', 'email', 'ign', 'game', 'level', 'notes'];

  var LEVEL_LABELS = {
    casual: 'Casual — just here to play',
    improving: 'Improving — wants structured practice',
    competitive: 'Competitive — after a roster spot'
  };

  /* ---- Validation rules ---------------------------------------------------
     Each returns null when the value is acceptable, or the message to show.
     Everything here runs in the browser; there is no server to check against. */
  var PASSWORD_RULES = {
    length: function (v) { return v.length >= 8; },
    letter: function (v) { return /[A-Za-z]/.test(v); },
    number: function (v) { return /[0-9]/.test(v); }
  };

  var VALIDATORS = {
    fullName: function (v) {
      if (!v) { return 'Please enter your name.'; }
      if (v.length < 2) { return 'That looks too short.'; }
      if (!/^[\p{L}' -]+$/u.test(v)) {
        return 'Letters, spaces, hyphens and apostrophes only.';
      }
      return null;
    },
    email: function (v) {
      if (!v) { return 'Please enter your email address.'; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
        return 'That does not look like a valid email address.';
      }
      return null;
    },
    ign: function (v) {
      if (!v) { return 'Please enter the handle you play under.'; }
      if (v.length < 3) { return 'At least 3 characters.'; }
      if (!/^[A-Za-z0-9_.-]+$/.test(v)) {
        return 'Letters, numbers, and _ . - only — no spaces.';
      }
      return null;
    },
    password: function (v) {
      if (!v) { return 'Please choose a password.'; }
      var unmet = Object.keys(PASSWORD_RULES).filter(function (key) {
        return !PASSWORD_RULES[key](v);
      });
      return unmet.length ? 'Your password does not meet all three requirements yet.' : null;
    },
    confirm: function (v) {
      if (!v) { return 'Please retype your password.'; }
      if (v !== $('#password').val()) { return 'The two passwords do not match.'; }
      return null;
    },
    game: function (v) {
      return v ? null : 'Please pick your main title.';
    }
  };

  var FIELD_IDS = Object.keys(VALIDATORS);

  /* ---- Field state --------------------------------------------------------
     Green appears the moment a value becomes valid. Red is held back until the
     visitor has left the field once (or pressed submit) — flagging an email as
     wrong after the first keystroke is just noise. */
  var touched = {};

  function markState(id, message, showError) {
    var $input = $('#' + id);
    var $field = $input.closest('.nx-field');

    $field.removeClass('is-valid has-error');
    $input.removeAttr('aria-invalid');

    if (!message) {
      if ($.trim($input.val())) { $field.addClass('is-valid'); }
    } else if (showError) {
      $field.addClass('has-error').find('.nx-error').text(message).css('display', 'block');
      $input.attr('aria-invalid', 'true');
    }
  }

  var NO_TRIM = { password: true, confirm: true };

  function checkField(id, force) {
    var raw = $('#' + id).val() || '';
    var value = NO_TRIM[id] ? raw : $.trim(raw);
    var message = VALIDATORS[id](value);
    markState(id, message, force || touched[id]);
    return !message;
  }

  function paintPasswordRules() {
    var value = $('#password').val() || '';
    $('#passwordRules .reg-rule').each(function () {
      var rule = $(this).data('rule');
      $(this).toggleClass('is-met', value.length > 0 && PASSWORD_RULES[rule](value));
    });
  }

  $form.on('input change', '.nx-input, .nx-select', function (e) {
    var id = this.id;
    if (e.type === 'change' && this.tagName === 'SELECT') { touched[id] = true; }
    
    if (id === 'password') {
      paintPasswordRules();
      if ($('#confirm').val()) { checkField('confirm'); }
    }

    /* FIX: If the user clears the field, remove the red error until they hit submit */
    if ($.trim($(this).val()) === '') {
      $(this).closest('.nx-field').removeClass('has-error is-valid');
      return;
    }

    if (VALIDATORS[id]) { checkField(id); }
  });

  $form.on('blur', '.nx-input, .nx-select', function () {
    if (!VALIDATORS[this.id]) { return; }
    
    /* FIX: Don't show red errors if they just click in and out of a blank box */
    if ($.trim($(this).val()) === '') {
      $(this).closest('.nx-field').removeClass('has-error is-valid');
      return; 
    }

    touched[this.id] = true;
    checkField(this.id);
  });

  /* ---- Draft (session) ---------------------------------------------------- */
  function saveDraft() {
    var current = {};
    DRAFT_FIELDS.forEach(function (name) { current[name] = $('#' + name).val(); });
    NXStore.session.set('registerDraft', current);
  }

  $form.on('input change', 'input, select, textarea', function () {
    if (this.type === 'password') { return; }
    saveDraft();
  });

  function restoreDraft() {
    var draft = NXStore.session.get('registerDraft', {}) || {};
    DRAFT_FIELDS.forEach(function (name) {
      if (draft[name]) { $('#' + name).val(draft[name]); }
    });
    FIELD_IDS.forEach(function (id) {
      if ($.trim($('#' + id).val() || '')) { checkField(id); }
    });
  }

  function resetForm() {
    $form[0].reset();
    touched = {};
    $form.find('.nx-field').removeClass('is-valid has-error');
    $form.find('.nx-input, .nx-select').removeAttr('aria-invalid');
    paintPasswordRules();
  }

  $('#clearDraft').on('click', function () {
    NXStore.session.remove('registerDraft');
    resetForm();
  });

  /* ---- Prefill from ?event= ----------------------------------------------- */
  function applyEventParam() {
    var match = window.location.search.match(/[?&]event=([^&]+)/);
    if (!match) { return; }
    var slug = decodeURIComponent(match[1]);
    var game = slug.split('-')[0];
    if ($('#game option[value="' + game + '"]').length) {
      $('#game').val(game);
      checkField('game');
    }
    $('#notes').attr('placeholder', 'Interested in ' + slug + '…');
  }

  /* ---- Security Digest ---------------------------------------------------- */
  function digest(text) {
    var h = 5381;
    for (var i = 0; i < text.length; i++) {
      h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
    }
    return h.toString(16).toUpperCase();
  }

  function getAccount() {
    var all = NXStore.local.get('registrations', []) || [];
    return all.length ? all[all.length - 1] : null;
  }

  /* ---- NEW: Panel Toggling (Sign In <-> Sign Up) -------------------------- */
  $('#showJoinBtn, #showJoinBtnAside').on('click', function () {
    $('#loginPanel').attr('hidden', true).removeClass('panel-active');
    $('#joinPanel').removeAttr('hidden').addClass('panel-active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  $('#showLoginBtn').on('click', function () {
    $('#joinPanel').attr('hidden', true).removeClass('panel-active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    $('#loginPanel').removeAttr('hidden').addClass('panel-active');
  });

  /* ---- NEW: Login Form Submission ----------------------------------------- */
  $('#loginForm').on('submit', function (e) {
    e.preventDefault();

    var email = $.trim($('#loginEmail').val());
    var pass = $('#loginPassword').val();
    var hashedPass = digest(pass);

    var $emailField = $('#loginEmail').closest('.nx-field');
    var $passField = $('#loginPassword').closest('.nx-field');

    /* Reset previous errors */
    $emailField.removeClass('has-error');
    $passField.removeClass('has-error');

    var all = NXStore.local.get('registrations', []) || [];
    var matchIndex = -1;
    var match = null;

    /* Search for the account by email */
    for (var i = all.length - 1; i >= 0; i--) {
      if (all[i].email === email) {
        match = all[i];
        matchIndex = i;
        break;
      }
    }

    if (!match) {
      $emailField.addClass('has-error');
      $emailField.find('.nx-error').text('No account found with this email.').css('display', 'block');
      return;
    }

    if (match.passwordHash !== hashedPass) {
      $passField.addClass('has-error');
      $passField.find('.nx-error').text('Incorrect password.').css('display', 'block');
      return;
    }

    /* Success! Move this account to the end of the array so dashboard sees it as active */
    all.splice(matchIndex, 1);
    all.push(match);
    NXStore.local.set('registrations', all);
    
    /* NEW: Set active session flag */
    NXStore.session.set('isLoggedIn', true);

    /* Hide the forms and trigger the dashboard */
    $('#loginPanel, #joinPanel').css('display', 'none');
    $(window).trigger('accountChanged');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---- Register Form Submission ------------------------------------------- */
  $form.on('submit', function (e) {
    e.preventDefault();

    var valid = true;
    FIELD_IDS.forEach(function (id) {
      touched[id] = true;
      if (!checkField(id, true)) { valid = false; }
    });

    if (!valid) {
      $form.find('.has-error').first().find('input, select').trigger('focus');
      return;
    }

    var account = { id: 'REG-' + Date.now().toString(36).toUpperCase() };
    DRAFT_FIELDS.forEach(function (name) { account[name] = $.trim($('#' + name).val()); });
    account.passwordHash = digest($('#password').val());
    account.submittedAt = new Date().toISOString();

    var all = NXStore.local.get('registrations', []) || [];
    all.push(account);
    NXStore.local.set('registrations', all);

    var registeredEmail = account.email; /* Save this for the auto-fill before resetting */

    NXStore.session.remove('registerDraft');
    resetForm();
    
    /* NEW: Auto-fill email, switch back to Sign In, DO NOT trigger dashboard */
    $('#loginEmail').val(registeredEmail);
    $('#joinPanel').attr('hidden', true).removeClass('panel-active');
    $('#loginPanel').removeAttr('hidden').addClass('panel-active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---- Boot --------------------------------------------------------------- */
  var existing = getAccount();
  var isLoggedIn = NXStore.session.get('isLoggedIn');
  
  /* NEW: Requires BOTH an account and an active session flag to bypass login */
  if (existing && isLoggedIn) {
    /* User is already signed in! Hide forms so the Dashboard JS takes over cleanly */
    $('#loginPanel, #joinPanel').css('display', 'none');
  } else {
    /* No active session. Setup the Sign In/Sign Up forms */
    restoreDraft();
    applyEventParam();
    paintPasswordRules();
  }

});
/* ==========================================================================
   dashboard.js — dashboard.html only.

   The page is a profile: a mini nav across Personal info / Favourites /
   Storage. It reads all three storage technologies and never writes a
   preference of its own; each value is owned by the page that sets it
   (CLAUDE.md section 4). The one thing it does write is a deletion — signing
   out, which clears the account the same way signin.html does.
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


/* ======================================================================
     Profile
     ====================================================================== */
  /* ---- Submitted applications ------------------------------------------- */
  var LEVEL_LABELS = {
    casual: 'Casual',
    improving: 'Improving',
    competitive: 'Competitive'
  };

  function renderProfile() {
    var regs = NXStore.local.get('registrations', []) || [];
    var account = regs.length ? regs[regs.length - 1] : null;
    var isLoggedIn = NXStore.session.get('isLoggedIn');

    /* 1. Hide the entire dashboard layout AND header if nobody is signed in */
    /* NEW: Now requires both account and active session */
    if (!account || !isLoggedIn) {
      /* Targets both the header wrapper and the bottom layout wrapper */
      $('.dash-head, .dash-layout').css('display', 'none');
      return;
    }
    
    /* 2. Show everything if an account exists and is logged in */
    $('.dash-head, .dash-layout').css('display', '');

    /* ---- Header ------------------------------------------------------------ */
    function initials(name) {
      var parts = $.trim(name || '').split(/\s+/).filter(Boolean);
      if (!parts.length) { return '?'; }
      if (parts.length === 1) { return parts[0].charAt(0).toUpperCase(); }
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    $('#profileAvatar').text(initials(account.fullName)).removeAttr('hidden');
    $('#profileName').text(account.fullName || 'Profile');
    $('#profileSub').text(account.email || '');
    $('#signOut').removeAttr('hidden');

    /* ---- Personal information ---------------------------------------------- */
    function field(label, value) {
      var empty = !value;
      return '<div class="dash-field">' +
               '<p class="dash-field__label">' + NXRender.esc(label) + '</p>' +
               '<p class="dash-field__value' + (empty ? ' is-empty' : '') + '">' +
                 NXRender.esc(empty ? 'Not set' : value) +
               '</p>' +
             '</div>';
    }

    $('#personalFields').html(
      '<div class="dash-fields">' +
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
        : '')
    );

    /* ---- Favourites --------------------------------------------------------- */
    function favTile(opts) {
      return '<div class="dash-fav' + (opts.value ? '' : ' is-empty') + '">' +
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
             '</div>';
    }

    var gameIcon = NXRender.gameLogos[account.game]
      ? '<img src="' + NXRender.gameLogos[account.game] + '" alt="">'
      : '<i class="bi bi-controller" aria-hidden="true"></i>';

    function favList(key) {
      var saved = NXStore.local.get(key, []) || [];
      return Array.isArray(saved) && saved.length ? saved.join(' · ') : null;
    }
    
    var fav = NXStore.local.get('favouriteTeam');

    $('#favFields').html(
      favTile({
        label: 'Primary title',
        value: gameLabel(account.game),
        placeholder: 'Set when you join',
        icon: gameIcon,
        href: 'players.html',
        action: 'Browse this title'
      }) +
      favTile({
        label: 'Favourite club',
        value: fav,
        placeholder: 'No club starred yet',
        icon: '<i class="bi bi-shield-fill" aria-hidden="true"></i>',
        href: 'rankings.html',
        action: fav ? 'See the standings' : 'Star a club'
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

    /* ---- Headline cards (Now Dynamic!) ------------------------------------ */
    /* Note: 'fav' and 'regs' are already defined higher up in this function */
    $('#favTeam').html(fav
      ? card(fav, 'Highlighted on', { href: 'rankings.html', text: 'the standings' })
      : card('None', 'Star a club on', { href: 'rankings.html', text: 'rankings' }));

    $('#appCount').html(regs.length
      ? card('Active', 'Member account stored on this browser.')
      : card('None', 'Create one on the', { href: 'signin.html', text: 'join page' }));

    var returning = NXStore.cookie.get('returningVisitor');
    $('#visitorState').html(returning
      ? card('Returning', 'Cookie set — expires 30 days after your last accept.')
      : card('New', 'No returningVisitor cookie is set on this browser.'));

    /* ---- Storage tables (Now Dynamic!) ------------------------------------ */
    $('#localTable').html(
      row('theme', NXStore.local.get('theme'), 'Colour scheme, site-wide') +
      row('favouriteTeam', NXStore.local.get('favouriteTeam'), 'Highlighted club on rankings') +
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
  }

  /* Run immediately when the page loads (handles returning visitors) */
  renderProfile();

  /* Re-run anytime the form announces a new sign-in to populate data without a reload! */
  $(window).on('accountChanged', function () {
    renderProfile();
  });

/* ---- Sidebar Navigation (Smooth Scroll) --------------------------------
     Replaces the old tab logic. Now it scrolls the page to the stacked
     panels and updates the active sidebar link as the visitor scrolls. */
  var $navLinks = $('.dash-nav__link');
  var headerOffset = 120; /* Adjust this if your fixed header hides the top of panels */

  $navLinks.on('click', function (e) {
    e.preventDefault();
    var target = $(this).attr('href');
    var $panel = $(target);

    if ($panel.length) {
      window.scrollTo({
        top: $panel.offset().top - headerOffset,
        behavior: 'smooth'
      });

      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', target);
      }
    }
  });

  /* ScrollSpy: Highlight the active section while scrolling */
  $(window).on('scroll', function () {
    var scrollPos = $(window).scrollTop() + headerOffset + 50;

    $navLinks.each(function () {
      var $link = $(this);
      var $panel = $($link.attr('href'));

      if ($panel.length) {
        var top = $panel.offset().top;
        var bottom = top + $panel.outerHeight(true);

        if (scrollPos >= top && scrollPos < bottom) {
          $navLinks.removeClass('is-active');
          $link.addClass('is-active');
        }
      }
    });
  });

  /* Initial load: Jump to hash if present, or trigger scroll to set first active link */
  if (window.location.hash) {
    var $initial = $(window.location.hash);
    if ($initial.length) {
      setTimeout(function () {
        window.scrollTo({
          top: $initial.offset().top - headerOffset,
          behavior: 'smooth'
        });
      }, 100);
    }
  } else {
    $(window).trigger('scroll');
  }

  /* ---- Sign out ------------------------------------------------------------ */
  $('#signOut').on('click', function () {
    var ok = window.confirm(
      'Sign out of NextGen E-Sports?\n\n' +
      'You will be securely logged out. You can sign back in at any time.'
    );
    if (!ok) { return; }

    /* NEW: We now only wipe the session flag instead of deleting the whole account! */
    NXStore.session.remove('isLoggedIn');
    window.location.reload();
  });

    /* ---- Wipe everything -------------------------------------------------- */
  $('#wipeAll').on('click', function () {
    NXStore.clearAll();
    window.location.reload();
  });

});
