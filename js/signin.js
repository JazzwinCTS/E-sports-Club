/* ==========================================================================
   signin.js

   Handles:
     1. Authentication (Sign In / Sign Up form switching & validation)
     2. Profile Dashboard, Favourites Switcher & Stored Ticket Display
   ========================================================================== */

$(function () {
  'use strict';

  var $form = $('#registerForm');
  var DRAFT_FIELDS = ['fullName', 'email', 'ign', 'game', 'level', 'notes'];

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
  var touched = {};

  function markState(id, message, showError) {
    var $input = $('#' + id);
    var $field = $input.closest('.nx-field');

    $field.removeClass('is-valid has-error');
    $input.removeAttr('aria-invalid');

    if (!message) {
      if ($.trim($input.val())) { $field.addClass('is-valid'); }
    } else if (showError) {
      // Visibility is the stylesheet's job: .nx-error is display:none until
      // .nx-field gains .has-error. Setting display inline here as well made
      // the message permanent - removing the class could not override an
      // inline style, so "The two passwords do not match." stayed on screen
      // after the two passwords already matched.
      $field.addClass('has-error').find('.nx-error').text(message);
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

    if ($.trim($(this).val()) === '') {
      $(this).closest('.nx-field').removeClass('has-error is-valid');
      return;
    }

    if (VALIDATORS[id]) { checkField(id); }
  });

  $form.on('blur', '.nx-input, .nx-select', function () {
    if (!VALIDATORS[this.id]) { return; }

    if ($.trim($(this).val()) === '') {
      $(this).closest('.nx-field').removeClass('has-error is-valid');
      return;
    }

    touched[this.id] = true;
    checkField(this.id);
  });

  /* Session Draft Handlers */
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

  /* Panel Toggling */
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

  /* Login Form Submission */
  $('#loginForm').on('submit', function (e) {
    e.preventDefault();

    var email = $.trim($('#loginEmail').val()).toLowerCase();
    var pass = $('#loginPassword').val();
    var hashedPass = digest(pass);

    var $emailField = $('#loginEmail').closest('.nx-field');
    var $passField = $('#loginPassword').closest('.nx-field');

    $emailField.removeClass('has-error');
    $passField.removeClass('has-error');

    var all = NXStore.local.get('registrations', []) || [];
    var matchIndex = -1;
    var match = null;

    for (var i = all.length - 1; i >= 0; i--) {
      if ((all[i].email || '').toLowerCase() === email) {
        match = all[i];
        matchIndex = i;
        break;
      }
    }

    if (!match) {
      $emailField.addClass('has-error');
      $emailField.find('.nx-error').text('No account found with this email.');
      return;
    }

    if (match.passwordHash !== hashedPass) {
      $passField.addClass('has-error');
      $passField.find('.nx-error').text('Incorrect password.');
      return;
    }

    all.splice(matchIndex, 1);
    all.push(match);
    NXStore.local.set('registrations', all);
    NXStore.session.set('isLoggedIn', true);

    $('#loginPanel, #joinPanel').css('display', 'none');
    $(window).trigger('accountChanged');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* Register Form Submission (With Existing Email Check) */
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

    var inputEmail = $.trim($('#email').val()).toLowerCase();
    var all = NXStore.local.get('registrations', []) || [];
    
    var emailExists = all.some(function (acc) {
      return (acc.email || '').toLowerCase() === inputEmail;
    });

    if (emailExists) {
      markState('email', 'An account with this email address already exists.', true);
      $('#email').trigger('focus');
      return;
    }

    var account = { id: 'REG-' + Date.now().toString(36).toUpperCase() };
    DRAFT_FIELDS.forEach(function (name) { account[name] = $.trim($('#' + name).val()); });
    account.passwordHash = digest($('#password').val());
    account.submittedAt = new Date().toISOString();

    all.push(account);
    NXStore.local.set('registrations', all);

    var registeredEmail = account.email;
    NXStore.session.remove('registerDraft');
    resetForm();

    $('#loginEmail').val(registeredEmail);
    $('#joinPanel').attr('hidden', true).removeClass('panel-active');
    $('#loginPanel').removeAttr('hidden').addClass('panel-active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* Auth Boot Checks */
  var existing = getAccount();
  var isLoggedIn = NXStore.session.get('isLoggedIn');

  if (existing && isLoggedIn) {
    $('#loginPanel, #joinPanel').css('display', 'none');
  } else {
    restoreDraft();
    applyEventParam();
    paintPasswordRules();
  }
});

/* ==========================================================================
   Dashboard & Profile Display Logic
   ========================================================================== */

$(function () {
  'use strict';

  var LEVEL_LABELS = {
    casual: 'Casual',
    improving: 'Improving',
    competitive: 'Competitive'
  };

  function gameLabel(key) {
    if (!key || key === 'all') { return 'All games'; }
    return NXRender.gameLabels[key] || key;
  }

  /* Fine-tuned Ticket HTML Card Builder */
  function buildTicketCardHTML(t, isExpired) {
    var posterStyle = t.poster
      ? 'background-image: url(\'' + NXRender.esc(t.poster) + '\'); background-size: cover; background-position: center;'
      : 'background: linear-gradient(135deg, #1f2937 0%, #111827 100%); display: flex; align-items: center; justify-content: center;';

    var posterInner = t.poster
      ? ''
      : '<i class="bi bi-ticket-perforated" style="font-size: 2.5rem; opacity: 0.3;"></i>';

    return `
      <div class="nx-card ticket-card" data-ticket-id="${NXRender.esc(t.id)}">
        <div class="ticket-card__header" style="${posterStyle} height: 140px; position: relative;">
          ${posterInner}
          <span class="ticket-card__badge" style="position: absolute; top: 10px; right: 10px;">${NXRender.esc(t.type || 'Standard Pass')}</span>
        </div>
        <div class="ticket-card__body" style="padding: 16px;">
          <h4 class="ticket-card__title" style="margin-bottom: 8px;">${NXRender.esc(t.title || 'Event Pass')}</h4>
          <div class="ticket-card__meta" style="display: flex; flex-direction: column; gap: 4px; font-size: 0.9rem;">
            <div class="ticket-card__meta-item"><i class="bi bi-calendar-event"></i> ${NXRender.esc(t.date || 'TBA')}</div>
            <div class="ticket-card__meta-item"><i class="bi bi-geo-alt"></i> ${NXRender.esc(t.venue || 'Online / TBD')}</div>
            <div class="ticket-card__meta-item"><i class="bi bi-ticket-perforated"></i> Ticket ID: <strong>${NXRender.esc(t.id || 'N/A')}</strong></div>
          </div>
          <div class="ticket-card__footer" style="margin-top: 14px;">
            <button type="button" 
                    class="nx-btn nx-btn--block ${isExpired ? 'nx-btn--ghost is-disabled' : 'nx-btn--outline view-pass-btn'}" 
                    ${isExpired ? 'disabled' : ''} 
                    data-ticket-id="${NXRender.esc(t.id)}">
              ${isExpired ? 'Pass Expired' : '<i class="bi bi-qr-code-scan"></i> View Pass'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /* Fine-tuned User Ticket Rendering Function */
  function renderUserTickets(userEmail) {
    var $validGrid = $('#validTicketsGrid');
    var $expireGrid = $('#expireTicketsGrid');

    if (!$validGrid.length || !$expireGrid.length) return;

    var allTickets = NXStore.local.get('userTickets', []) || [];
    var normalizedEmail = (userEmail || '').trim().toLowerCase();

    var myTickets = allTickets.filter(function (t) {
      return t && t.userEmail && t.userEmail.trim().toLowerCase() === normalizedEmail;
    });

    var validTickets = myTickets.filter(function (t) {
      var status = (t.status || 'valid').toLowerCase();
      return status === 'valid' || status === 'active';
    });

    var expireTickets = myTickets.filter(function (t) {
      var status = (t.status || '').toLowerCase();
      return status === 'expired' || status === 'expire' || status === 'used';
    });

    $('#validTicketCount').text(validTickets.length);
    $('#expireTicketCount').text(expireTickets.length);

    if (validTickets.length === 0) {
      $validGrid.html(`
        <div class="ticket-empty" style="grid-column: 1 / -1; text-align: center; padding: 40px 20px;">
          <i class="bi bi-ticket-perforated" style="font-size: 2.5rem; opacity: 0.4;"></i>
          <p class="nx-muted" style="margin-top: 12px; margin-bottom: 0;">No active tickets found. Book a match from the Tickets page!</p>
        </div>
      `);
    } else {
      $validGrid.html(validTickets.map(function (t) {
        return buildTicketCardHTML(t, false);
      }).join(''));
    }

    if (expireTickets.length === 0) {
      $expireGrid.html(`
        <div class="ticket-empty" style="grid-column: 1 / -1; text-align: center; padding: 40px 20px;">
          <i class="bi bi-ticket-detailed" style="font-size: 2.5rem; opacity: 0.4;"></i>
          <p class="nx-muted" style="margin-top: 12px; margin-bottom: 0;">No past or expired tickets recorded.</p>
        </div>
      `);
    } else {
      $expireGrid.html(expireTickets.map(function (t) {
        return buildTicketCardHTML(t, true);
      }).join(''));
    }
  }

  function renderProfile() {
    var regs = NXStore.local.get('registrations', []) || [];
    var account = regs.length ? regs[regs.length - 1] : null;
    var isLoggedIn = NXStore.session.get('isLoggedIn');

    if (!account || !isLoggedIn) {
      $('.dash-head, .dash-layout').css('display', 'none');
      return;
    }

    $('.dash-head, .dash-layout').css('display', '');

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

    /* Render Favourites & Game Switcher into #favFields */
    var favTeam = NXStore.local.get('favouriteTeam');
    var favHTML = `
      <div class="dash-field" style="margin-bottom: 20px;">
        <label class="dash-field__label" for="profileGameSelect" style="display: block; margin-bottom: 8px;">Primary Title</label>
        <select class="nx-select" id="profileGameSelect" style="max-width: 320px;">
          <option value="valorant" ${account.game === 'valorant' ? 'selected' : ''}>Valorant</option>
          <option value="cs2" ${account.game === 'cs2' ? 'selected' : ''}>Counter-Strike 2</option>
          <option value="pubg" ${account.game === 'pubg' ? 'selected' : ''}>PUBG</option>
        </select>
        <span class="nx-muted" style="font-size: 0.85rem; margin-top: 6px; display: block;">
          Select your primary competitive title.
        </span>
      </div>

      <div class="dash-field">
        <p class="dash-field__label">Starred Team</p>
        ${favTeam ? `
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-2" style="margin-top: 8px;">
            <div>
              <strong style="font-size: 1.1rem;">${NXRender.esc(favTeam)}</strong>
              <p class="nx-muted" style="margin: 4px 0 0 0; font-size: 0.875rem;">Starred team highlighted on standings.</p>
            </div>
            <a href="rankings.html" class="nx-btn nx-btn--ghost nx-btn--sm">View Rankings</a>
          </div>
        ` : `
          <p class="dash-field__value is-empty" style="margin-top: 4px;">No team starred yet. Star a club on the <a href="rankings.html">rankings page</a>.</p>
        `}
      </div>
    `;

    $('#favFields').html(favHTML);

    // Render tickets for logged in account
    renderUserTickets(account.email);
  }

  /* Handle dynamic Primary Title changes from Profile Favourites tab */
  $(document).on('change', '#profileGameSelect', function () {
    var newGame = $(this).val();
    var all = NXStore.local.get('registrations', []) || [];
    if (!all.length) return;

    all[all.length - 1].game = newGame;
    NXStore.local.set('registrations', all);
    $(window).trigger('accountChanged');
  });

  /* Ticket Tab Switching */
  $(document).on('click', '#tabValidTickets', function () {
    $('.ticket-tab-btn').removeClass('is-active');
    $(this).addClass('is-active');
    $('#expireTicketsGrid').hide();
    $('#validTicketsGrid').fadeIn(150);
  });

  $(document).on('click', '#tabExpireTickets', function () {
    $('.ticket-tab-btn').removeClass('is-active');
    $(this).addClass('is-active');
    $('#validTicketsGrid').hide();
    $('#expireTicketsGrid').fadeIn(150);
  });

  /* Full-Screen Page Centered Ticket Modal */
  function renderPassModal(ticketId) {
    var allTickets = NXStore.local.get('userTickets', []) || [];
    var ticket = allTickets.find(function (t) {
      return t && String(t.id) === String(ticketId);
    });

    if (!ticket) return;

    var categoryQrMap = {
      'valorant': 'TicketsQR/valorant-qr.jpg',
      'cs2': 'TicketsQR/cs2-qr.jpg',
      'pubg': 'TicketsQR/pubg-qr.jpg'
    };

    var gameCategory = (ticket.game || ticket.category || 'valorant').toLowerCase();
    var fallbackQr = categoryQrMap[gameCategory] || 'TicketsQR/valorant-qr.jpg';
    var qrUrl = ticket.qrImage || ('TicketsQR/' + ticket.id + '.jpg');

    var posterBg = ticket.poster
      ? 'background-image: url(\'' + NXRender.esc(ticket.poster) + '\');'
      : 'background: linear-gradient(135deg, #111827 0%, #1f2937 100%);';

    var modalHTML = `
    <div id="ticketPassModal" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 999999; padding: 20px;">
      <div style="position: relative; max-width: 420px; width: 100%; max-height: 90vh; overflow-y: auto;">
        <button type="button" id="closePassModal" style="position: absolute; top: 12px; right: 12px; background: rgba(239, 68, 68, 0.9); color: #fff; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; z-index: 10; font-weight: bold; font-size: 18px; line-height: 1; display: flex; align-items: center; justify-content: center;">&times;</button>
        <div class="pass-card" style="${posterBg} background-size: cover; background-position: center; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7);">
          <div class="pass-card__inner" style="background: rgba(15, 23, 42, 0.94); padding: 24px; color: #fff;">
            
            <div class="pass-card__top" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-right: 32px;">
              <span class="pass-card__badge" style="background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; letter-spacing: 1px; text-transform: uppercase;">${NXRender.esc(ticket.type || 'ENTRY PASS')}</span>
              <span class="pass-card__id" style="font-family: monospace; opacity: 0.8;">#${NXRender.esc(ticket.id)}</span>
            </div>

            <h3 class="pass-card__title" style="margin: 0 0 4px 0; font-size: 1.25rem;">${NXRender.esc(ticket.title || 'Esports Match')}</h3>
            <div class="pass-card__subtitle" style="opacity: 0.7; font-size: 0.875rem; margin-bottom: 16px;">${NXRender.esc(ticket.subtitle || ticket.stage || 'Match Event Pass')}</div>

            <div class="pass-card__info-box" style="background: rgba(255,255,255,0.05); border-radius: 10px; padding: 12px; margin-bottom: 20px; font-size: 0.875rem;">
              <div class="pass-card__info-row" style="margin-bottom: 6px;"><i class="bi bi-calendar-event"></i> <strong>Date:</strong> ${NXRender.esc(ticket.date || 'TBA')}</div>
              <div class="pass-card__info-row" style="margin-bottom: 6px;"><i class="bi bi-clock"></i> <strong>Time:</strong> ${NXRender.esc(ticket.time || '20:00 MYT')}</div>
              <div class="pass-card__info-row" style="margin-bottom: 6px;"><i class="bi bi-geo-alt"></i> <strong>Venue:</strong> ${NXRender.esc(ticket.venue || 'Online / TBD')}</div>
              <div class="pass-card__info-row"><i class="bi bi-people"></i> <strong>Quantity:</strong> ${NXRender.esc(ticket.quantity || '1')} Pax</div>
            </div>

            <div class="pass-card__qr-section" style="text-align: center;">
              <div class="pass-card__qr-box" style="background: #fff; padding: 12px; border-radius: 12px; display: inline-block; margin-bottom: 8px;">
                <img src="${NXRender.esc(qrUrl)}" onerror="this.onerror=null;this.src='${fallbackQr}';" alt="Ticket QR Code" style="width: 160px; height: 160px; object-fit: contain; display: block;">
              </div>
              <div class="pass-card__footer-text" style="display: block; font-size: 0.75rem; opacity: 0.6; text-transform: uppercase; letter-spacing: 1px;">Scan at Venue Counter</div>
            </div>

          </div>
        </div>
      </div>
    </div>
  `;

    $('#ticketPassModal').remove();
    $('body').append(modalHTML).css('overflow', 'hidden');
  }

  /* Event listeners for closing centered modal */
  $(document).on('click', '#closePassModal', function () {
    $('#ticketPassModal').fadeOut(150, function () { $(this).remove(); });
    $('body').css('overflow', '');
  });

  $(document).on('click', '#ticketPassModal', function (e) {
    if (e.target === this) {
      $('#ticketPassModal').fadeOut(150, function () { $(this).remove(); });
      $('body').css('overflow', '');
    }
  });

  /* Ticket Pass Modal Click Listeners */
  $(document).on('click', '.view-pass-btn', function () {
    var ticketId = $(this).data('ticket-id');
    renderPassModal(ticketId);
  });

  /* Sidebar Navigation & ScrollSpy */
  var $navLinks = $('.dash-nav__link');
  var headerOffset = 120;

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

  /* Sign Out Action */
  $('#signOut').on('click', function () {
    if (window.confirm('Sign out of NextGen E-Sports?')) {
      NXStore.session.remove('isLoggedIn');
      window.location.reload();
    }
  });

  $(window).on('accountChanged', renderProfile);

  /* Boot Execution */
  renderProfile();
});