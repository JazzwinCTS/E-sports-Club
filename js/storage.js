// Helpers for the three kinds of storage this site uses.
//
// Local storage holds things you would expect to still be there tomorrow.
// Session storage holds things that should disappear when the tab closes.
// A cookie is for the one value that needs a real expiry date.
//
// The key names are agreed across the whole team, so if you need a new one,
// add it to the spec first rather than inventing it here.

var NXStore = (function () {
  'use strict';

  // Private browsing can make even reading storage throw, so every call is
  // wrapped. A storage problem should never stop the page from rendering.
  function safeGet(store, key) {
    try {
      var raw = store.getItem(key);
      return raw === null ? null : JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function safeSet(store, key, value) {
    try {
      store.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function safeRemove(store, key) {
    try {
      store.removeItem(key);
    } catch (e) { /* nothing sensible to do */ }
  }

  return {
    // Local: theme, favouriteTeam, playersGame, registrations, userTickets
    local: {
      get: function (key, fallback) {
        var v = safeGet(window.localStorage, key);
        return v === null ? (fallback === undefined ? null : fallback) : v;
      },
      set: function (key, value) { return safeSet(window.localStorage, key, value); },
      remove: function (key) { safeRemove(window.localStorage, key); }
    },

    // Session: registerDraft, isLoggedIn, tournamentFilter, eventView
    session: {
      get: function (key, fallback) {
        var v = safeGet(window.sessionStorage, key);
        return v === null ? (fallback === undefined ? null : fallback) : v;
      },
      set: function (key, value) { return safeSet(window.sessionStorage, key, value); },
      remove: function (key) { safeRemove(window.sessionStorage, key); }
    },

    // Cookies: returningVisitor
    cookie: {
      get: function (name) {
        var parts = document.cookie ? document.cookie.split('; ') : [];
        for (var i = 0; i < parts.length; i++) {
          var pair = parts[i].split('=');
          if (decodeURIComponent(pair[0]) === name) {
            return decodeURIComponent(pair.slice(1).join('='));
          }
        }
        return null;
      },
      set: function (name, value, days) {
        var expires = '';
        if (days) {
          var d = new Date();
          d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
          expires = '; expires=' + d.toUTCString();
        }
        document.cookie = encodeURIComponent(name) + '=' + encodeURIComponent(value) +
          expires + '; path=/; SameSite=Lax';
      },
      remove: function (name) {
        document.cookie = encodeURIComponent(name) +
          '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax';
      }
    },

    // Signed in means a live session, not merely a saved account: signing out
    // clears this and deliberately leaves `registrations` in place so you can
    // sign back in. Shared here because more than one page gates on it, and
    // the star was gated on the rankings table but not the home page one for
    // exactly that reason.
    isSignedIn: function () {
      return NXStore.session.get('isLoggedIn') === true;
    },

    // Wipes everything the site has stored, for the decline button on the
    // cookie banner. Keep this list honest: it used to name a key nothing
    // wrote and miss two that people actually had data in, so declining
    // quietly left their tickets behind.
    clearAll: function () {
      ['theme', 'favouriteTeam', 'playersGame', 'registrations', 'userTickets']
        .forEach(function (k) {
          safeRemove(window.localStorage, k);
        });
      ['registerDraft', 'isLoggedIn', 'tournamentFilter', 'eventView'].forEach(function (k) {
        safeRemove(window.sessionStorage, k);
      });
      NXStore.cookie.remove('returningVisitor');
    }
  };
})();
