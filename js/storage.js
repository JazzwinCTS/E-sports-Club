/* ==========================================================================
   storage.js — shared helpers for all three storage technologies.
   Key names are frozen in CLAUDE.md section 5. Do not invent new keys here;
   add them to the spec first so all four pages agree.

   Local   -> user-owned data expected to survive the browser closing.
   Session -> tab-scoped working state that should NOT persist.
   Cookie  -> needs a defined expiry; the one value that would legitimately
              travel to a server in a real deployment.
   ========================================================================== */

var NXStore = (function () {
  'use strict';

  /* Private browsing and disabled-storage modes throw on access, so every
     call is guarded — a storage failure must never break page rendering. */
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
    /* ---- localStorage: theme, favouriteTeam, playersGame, registrations,
       userTickets ------------------------------------------------------- */
    local: {
      get: function (key, fallback) {
        var v = safeGet(window.localStorage, key);
        return v === null ? (fallback === undefined ? null : fallback) : v;
      },
      set: function (key, value) { return safeSet(window.localStorage, key, value); },
      remove: function (key) { safeRemove(window.localStorage, key); }
    },

    /* ---- sessionStorage: registerDraft, tournamentFilter, eventView ------ */
    session: {
      get: function (key, fallback) {
        var v = safeGet(window.sessionStorage, key);
        return v === null ? (fallback === undefined ? null : fallback) : v;
      },
      set: function (key, value) { return safeSet(window.sessionStorage, key, value); },
      remove: function (key) { safeRemove(window.sessionStorage, key); }
    },

    /* ---- cookies: returningVisitor -------------------------------------- */
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

    /* Wipe everything this site owns — used by the cookie preferences modal.
       Keep this list in step with the table in CLAUDE.md section 5: it listed
       a `playerFilter` key that nothing ever wrote (players.js uses
       `playersGame`), while `userTickets` and `isLoggedIn` arrived later and
       were never added — so "Decline & clear" was leaving real user data
       behind and deleting a key that did not exist. */
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
