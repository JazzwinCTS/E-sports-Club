/* ==========================================================================
   main.js — site-wide behaviour only: navigation, theme toggle, cookie
   banner, footer year, and the shared footer Discord widget.
   Page-specific logic belongs in js/[page].js (CLAUDE.md section 7).
   ========================================================================== */

$(function () {
  'use strict';

  /* ---- Mobile navigation ------------------------------------------------
     Bootstrap's collapse plugin opens and closes the menu via data-bs-toggle
     and keeps aria-expanded in step, so the only thing left to do by hand is
     swap the icon between the burger and the close cross. */
  $('#navLinks')
    .on('show.bs.collapse', function () {
      $('#navToggle i').attr('class', 'bi bi-x-lg');
    })
    .on('hide.bs.collapse', function () {
      $('#navToggle i').attr('class', 'bi bi-list');
    });

  /* Mark the current page in the navbar without hardcoding it per page */
  var here = window.location.pathname.split('/').pop() || 'index.html';
  $('.nx-nav__link').each(function () {
    if ($(this).attr('href') === here) {
      $(this).addClass('is-active').attr('aria-current', 'page');
    }
  });

  /* ---- Signed-in state in the navbar (site-wide) -------------------------
     Once an account exists in localStorage `registrations`, the "Join" link
     becomes the member's email address. The href is left alone: register.html
     is still where the account lives, and it shows the membership panel with
     the sign-out button rather than the sign-up form.

     Every page reads the key itself here rather than depending on
     register.js having run — no page script reads another page script's
     state (CLAUDE.md section 7). */
  var accounts = NXStore.local.get('registrations', []) || [];
  var account = accounts.length ? accounts[accounts.length - 1] : null;

  if (account && account.email) {
    /* Built with .text() rather than an HTML string: main.js runs on all 8
       pages and must not depend on render.js being loaded (players.html and
       tournaments.html do not load it). Using NXRender.esc here threw on
       those two pages, which killed every later handler in this file. */
    $('.nx-nav__link[href="register.html"]')
      .addClass('nx-nav__link--account')
      .attr('title', account.email)
      .attr('aria-label', 'Signed in as ' + account.email)
      .empty()
      .append($('<i class="bi bi-person-circle" aria-hidden="true"></i>'))
      .append($('<span class="nx-nav__email"></span>').text(account.email));
  }

  /* ---- Theme toggle (localStorage `theme`, site-wide) -------------------- */
  function applyTheme(theme) {
    $('html').attr('data-theme', theme);
    $('#themeToggle i').attr('class', theme === 'light' ? 'bi bi-moon-stars' : 'bi bi-sun');
    $('#themeToggle').attr('aria-label',
      theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
  }

  applyTheme(NXStore.local.get('theme', 'dark'));

  $('#themeToggle').on('click', function () {
    var next = NXStore.local.get('theme', 'dark') === 'dark' ? 'light' : 'dark';
    NXStore.local.set('theme', next);
    applyTheme(next);
  });

  /* ---- Footer copyright year -------------------------------------------- */
  var yearEl = document.getElementById('copyYear');
  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }

  /* ---- Cookie consent (cookie `returningVisitor`, 30 days) --------------- */
  var $banner = $('#cookieBanner');

  if (!NXStore.cookie.get('returningVisitor')) {
    /* First visit in 30 days — ask for consent. */
    setTimeout(function () { $banner.addClass('is-visible'); }, 700);
  } else {
    /* Returning visitor: greet them instead of replaying the intro. */
    $('#welcomeBack').removeClass('nx-sr');
  }

  $('#cookieAccept').on('click', function () {
    NXStore.cookie.set('returningVisitor', 'true', 30);
    $banner.removeClass('is-visible');
  });

  $('#cookieDecline').on('click', function () {
    NXStore.clearAll();
    $banner.removeClass('is-visible');
  });

  /* Footer "Cookie Preferences" re-opens the banner on any page */
  $('#cookiePrefs').on('click', function (e) {
    e.preventDefault();
    $banner.addClass('is-visible');
    $('html, body').animate({ scrollTop: $(document).height() }, 300);
  });

  /* ---- Footer Discord widget -------------------------------------------
     A real, keyless REST call over jQuery. The invite code is resolved live
     rather than hardcoding a member count. Fails quietly to a plain join
     link so the footer still works offline (CLAUDE.md section 2).
     --------------------------------------------------------------------- */
  var $discord = $('#discordWidget');
  if ($discord.length) {
    $.ajax({
      url: 'https://discord.com/api/v10/invites/theesportsclub?with_counts=true',
      method: 'GET',
      dataType: 'json',
      timeout: 6000,
      success: function (data) {
        if (data && data.approximate_presence_count) {
          $discord.find('.nx-discord__count').html(
            '<span class="nx-online"></span>' +
            data.approximate_presence_count.toLocaleString() + ' online'
          );
        }
      },
      error: function () {
        $discord.find('.nx-discord__count').text('Join the server');
      }
    });
  }
});
