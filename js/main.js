// Runs on every page. Nav, theme toggle, cookie banner, footer year and the
// Discord widget. Anything specific to one page belongs in that page's file.

$(function () {
  'use strict';

  // Bootstrap opens and closes the mobile menu itself and keeps aria-expanded
  // right, so all we do here is swap the burger for a cross.
  $('#navLinks')
    .on('show.bs.collapse', function () {
      $('#navToggle i').attr('class', 'bi bi-x-lg');
    })
    .on('hide.bs.collapse', function () {
      $('#navToggle i').attr('class', 'bi bi-list');
    });

  // Highlight the current page, rather than hardcoding it on each one
  var here = window.location.pathname.split('/').pop() || 'index.html';
  $('.nx-nav__link').each(function () {
    if ($(this).attr('href') === here) {
      $(this).addClass('is-active').attr('aria-current', 'page');
    }
  });

  // Once someone has joined, the "Join" link becomes their email address. The
  // link still points at signin.html, which by then shows their profile
  // instead of the sign-up form.
  //
  // We read the account here rather than waiting on the signin page's script,
  // because no page's script should depend on another one having run.
  var accounts = NXStore.local.get('registrations', []) || [];
  var account = accounts.length ? accounts[accounts.length - 1] : null;

  if (account && account.email) {
    // Built with .text() instead of an HTML string. This file runs on all
    // eight pages and two of them do not load render.js, so reaching for its
    // escape helper here used to throw and take out everything below it.
    $('.nx-nav__link[href="signin.html"]')
      .addClass('nx-nav__link--account')
      .attr('title', account.email)
      .attr('aria-label', 'Signed in as ' + account.email)
      .empty()
      .append($('<i class="bi bi-person-circle" aria-hidden="true"></i>'))
      .append($('<span class="nx-nav__email"></span>').text(account.email));
  }

  // Theme toggle, remembered in local storage
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

  // Footer copyright year
  var yearEl = document.getElementById('copyYear');
  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }

  // Cookie consent. The cookie lasts 30 days.
  var $banner = $('#cookieBanner');

  if (!NXStore.cookie.get('returningVisitor')) {
    // First visit in 30 days, so ask.
    setTimeout(function () { $banner.addClass('is-visible'); }, 700);
  } else {
    // They have been here before, so welcome them back rather than replaying
    // the intro.
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

  // "Cookie Preferences" in the footer brings the banner back on any page
  $('#cookiePrefs').on('click', function (e) {
    e.preventDefault();
    $banner.addClass('is-visible');
    $('html, body').animate({ scrollTop: $(document).height() }, 300);
  });

  // The Discord widget. A real request over jQuery, no key needed, so the
  // member count is live rather than a number typed in by hand. If it fails
  // it quietly becomes a plain join link, which matters because the site has
  // to work offline.
  var $discord = $('#discordWidget');
  if ($discord.length) {
    $.ajax({
      url: 'https://discord.com/api/v10/invites/vibes-tribe-719490731047125014?with_counts=true',
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
