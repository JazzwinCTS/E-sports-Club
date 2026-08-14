/* ==========================================================================
   main.js — site-wide behaviour only: navigation, theme toggle, cookie
   banner, footer year, and the shared footer Discord widget.
   Page-specific logic belongs in js/[page].js (CLAUDE.md section 7).
   ========================================================================== */

$(function () {
  'use strict';

  /* ---- Mobile navigation ------------------------------------------------ */
  $('#navToggle').on('click', function () {
    var $links = $('#navLinks');
    var open = $links.toggleClass('is-open').hasClass('is-open');
    $(this).attr('aria-expanded', open ? 'true' : 'false')
      .find('i').attr('class', open ? 'bi bi-x-lg' : 'bi bi-list');
  });

  /* Mark the current page in the navbar without hardcoding it per page */
  var here = window.location.pathname.split('/').pop() || 'index.html';
  $('.nx-nav__link').each(function () {
    if ($(this).attr('href') === here) {
      $(this).addClass('is-active').attr('aria-current', 'page');
    }
  });

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
