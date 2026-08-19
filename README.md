# NextGen E-Sports

NextGen E-Sports is a **community esports team** — open to players of every level, not an elite
competitive program. The team plays three titles: **Valorant, Counter-Strike 2 and PUBG**.

It runs one competition, the **2026 NextGen Youth Championship** for players aged 16–18, contested
by eight teams (VYNE, KOVA, RIFT, ZERA, AXEN, MIRA, TALO, BRIX) across three divisions. That
championship is what `rankings.html`, `players.html`, `tournaments.html` and `tickets.html` cover;
the team itself stays open to everyone.

**Everything here is fictional.** The eight teams, their 112 players, the 24 coaches and every
result were written for this coursework project. Each file in `data/` says so in its own `_source`
field.

The site is eight pages of plain HTML5, CSS3, JavaScript, jQuery and Bootstrap 5. No backend, no
build step, no framework, no npm.

## Running it

The pages load their content from `data/*.json` over `XMLHttpRequest`, and browsers block that
against `file://` URLs. So **don't open `index.html` by double-clicking it** — it has to be served
over http.

Two ways, both already in use:

- **GitHub Pages** for the live site. Nothing to configure.
- **VS Code Live Server** while developing. Install the Live Server extension, then right-click any
  `.html` file → *Open with Live Server*, or hit *Go Live* in the status bar. It reloads on save.

One thing worth knowing if you swap in another server: `about.html`'s hero video needs HTTP Range
requests to play in Safari. Live Server and GitHub Pages both handle that. Plain
`python -m http.server` does not, and the video silently fails there in Safari while still working
in Chrome.

## The eight pages

The navbar and footer are the same on every page. `js/main.js` runs everything shared: highlighting
the current nav link, the theme toggle, the cookie banner, the footer copyright year and the
footer's live Discord widget.

One piece of that shared behaviour is signed-in state — once you have joined, the navbar's **Join**
link becomes your **email address** on all eight pages. It still points at `signin.html`, which by
then shows your profile instead of the sign-up form.

### Home — `index.html`
A three-slide Bootstrap carousel, a strip of the three game badges, a "Happening now" panel for the
running championship, a five-row standings preview, and a Twitch embed.

The Happening now panel shows the championship's prize pool and dates, then one card per division
with a **live countdown** to that division's next match. It works off the clock rather than a
status field in the data, so it still reads correctly once those dates pass.

- **Storage:** the `returningVisitor` **cookie** (30 days). Suppresses the intro animation and
  shows a welcome-back badge on repeat visits.
- **Fetches:** `data/youth-tournament.json` and `data/standings.json`.

### Team Rankings — `rankings.html`
The championship league table: rank, team, played, won, lost, points, and gold/silver/bronze medal
counts. A shared filter bar switches game division and sort.

The rank shown on a row is its position in the **current** sort, not a stored number. The four sort
options are deliberately decorrelated in the data, so each one produces a genuinely different top
team.

- **Storage:** `favouriteTeam` in **localStorage**. The starred team's row is highlighted wherever
  the current sort places it; starring never reorders the table. The home page preview reads and
  writes the same key.
- **Fetches:** `data/standings.json`.

### Player Profiles — `players.html`
Two halves. A **Weekly MVP** feature with a radar chart of that player's stats for the week, and a
**team directory** — pick a game division, then a team, and a modal opens with its story, honours,
coach and full roster.

- **Storage:** `playersGame` in **localStorage** — the division you last looked at, restored next
  visit.
- **Fetches:** `data/players.json` and `data/weekly-mvp.json`.

### Tournaments — `tournaments.html`
The championship itself: prize pool, dates, venue and broadcast plan, then a division picker.
Each division shows its schedule, format and results — a knockout bracket for Valorant and CS2, and
a round-by-round table for PUBG.

- **Storage:** `tournamentFilter` in **sessionStorage** — the active division and filter survive
  moving around the page, but a new tab starts clean.
- **Fetches:** `data/youth-tournament.json`.

### Event Schedule — `events.html`
The team's own calendar — practices, workshops, socials and tryouts — with a list/calendar toggle.
Past events dim, today's is highlighted. An event tied to a competition links across to
`tournaments.html` rather than repeating its detail.

- **Storage:** `eventView` in **sessionStorage** (`"list"` or `"calendar"`).
- **Fetches:** `data/events.json`, plus a **live** call to Open-Meteo for the venue forecast.

### Tickets — `tickets.html`
Pick a division and a quantity, and get a QR pass. Includes a checkout step.

- **Storage:** `userTickets` in **localStorage** — persistent, because a ticket should survive
  closing the browser. `signin.html`'s Tickets panel reads it back.
- **Fetches:** `data/youth-tournament.json`.

### Sign In / Join / Profile — `signin.html`
One page, three views. A query param (`?event=<id>`) can prefill context when another page links in.

**Join** creates a member account entirely in the browser: name, email, in-game name, password and
confirmation, primary title, experience level and notes.

- **Validation** is live. Every field is rechecked on each keystroke and the border turns green as
  soon as the value is valid. The red error state is held back until you have left the field once,
  or pressed submit, so a half-typed email is not flagged while you are still typing it. The
  password shows its three requirements as a checklist, and editing it rechecks the confirm box.
- Once the account exists you get a thank-you panel and a **Sign out** button, which asks for
  confirmation before clearing the account.

**Sign In** signs an existing account back in on this browser.

**Profile** has three panels, deep-linkable as `signin.html#panel-favourites`:

- **Personal information** — your details as read-only boxes. Not editable inputs on purpose: there
  is no server to save an edit to.
- **Favourites** — your primary title and your favourite team.
- **Your Tickets** — read back from `userTickets`.

- **Storage:** `registrations` in **localStorage** (the account; the password is kept only as a
  short non-reversible digest, never in readable form), plus `registerDraft` and `isLoggedIn` in
  **sessionStorage**.

### About — `about.html`
A hero video, then the team's story: who we are, more than competition, the Youth Championship,
committee and coaches, our games, a gallery, and a Stay Connected section linking the real socials.

- **Storage:** the owner of `theme` in **localStorage**, though the toggle sits in the navbar and
  works identically from every page. It is read before first paint everywhere so there is no flash
  of the wrong theme.

## Storage, all in one place

| Type | Key | Owning page | Lifetime | Purpose |
|---|---|---|---|---|
| Cookie | `returningVisitor` | index | 30 days | Suppresses the intro animation, shows welcome-back |
| Local | `theme` | about (site-wide) | until cleared | Dark/light choice, read before first paint |
| Local | `favouriteTeam` | rankings | until cleared | Highlights a team's row in the standings |
| Local | `playersGame` | players | until cleared | Last-viewed game division |
| Local | `registrations` | signin | until cleared | The member account created on the join view |
| Local | `userTickets` | tickets (signin reads) | until cleared | Tickets claimed, shown again in the profile |
| Session | `registerDraft` | signin | tab close | In-progress form, saved as you type |
| Session | `isLoggedIn` | signin | tab close | Whether this tab is signed in |
| Session | `tournamentFilter` | tournaments | tab close | Active division and filter |
| Session | `eventView` | events | tab close | List or calendar view |

The reasoning behind each choice: local storage is for things you would expect to still be there
tomorrow, session storage for working state that should not outlive the tab, and the cookie for the
one value that needs a real expiry date.

`NXStore.clearAll()` in `js/storage.js` wipes all ten, and the cookie banner's decline button calls
it.

## Network calls

Every call uses jQuery (`$.ajax` / `$.getJSON`), never `fetch()`.

| Call | Where | Live or local |
|---|---|---|
| Open-Meteo forecast | `js/events.js` | **Live** — real external request, no key |
| Discord invite lookup | `js/main.js`, footer on all 8 pages | **Live** — real member count, no key |
| `data/standings.json` | `js/rankings.js`, `js/index.js` | Local file |
| `data/players.json`, `data/weekly-mvp.json` | `js/players.js` | Local file |
| `data/youth-tournament.json` | `js/tournaments.js`, `js/tickets.js`, `js/index.js` | Local file |
| `data/events.json` | `js/events.js` | Local file |

The local files still go through a real request on every page load — that is why the site cannot be
opened over `file://`. They are just reading a file already in the repo rather than a live source.

## Structure

```
├── *.html                  8 pages; navbar and footer the same on each
├── css/
│   ├── style.css           tokens, shared shell, anything used across pages
│   └── index.css  rankings.css  players.css  tournaments.css
│       events.css  about.css  signin.css  tickets.css
│                            one file per page, nothing shared
├── js/
│   ├── main.js             site-wide: nav, theme, cookie banner, Discord widget
│   ├── storage.js          helpers for cookies + local + session storage
│   ├── render.js           shared renderers and the one AJAX wrapper
│   ├── filter.js           the filter bar (used by rankings)
│   └── <page>.js           one per page
├── data/*.json             loaded at runtime with $.getJSON
├── vendor/                 jQuery, Bootstrap 5, Bootstrap Icons (local copies)
├── fonts/                  Unbounded + Sora, self-hosted
└── GameArt/ GameLogos/ PlayerPhotos/ TeamLogo/ TicketsQR/ TournamentThumbnail/
    TournamentVideo/ registerImgs/ socials/ indexImages/ Video1.mp4
```

Responsiveness is Bootstrap's, not hand-written: `container-fluid` for the shell, a collapsing
`navbar-expand-lg`, and `row` / `row-cols-*` / `col` for every card grid. The few things Bootstrap
cannot express stay as CSS and say so in a comment — the leaderboard's fixed-pixel numeric columns,
`clamp()` type scaling, and the events calendar's `auto-fill` month grid.

Some files in the asset folders (League of Legends, Dota 2 and EA SPORTS FC logos and thumbnails)
are left over from before the scope narrowed to three titles. Nothing references them.

## Known issues

- `events.html` loads Bootstrap Icons from a CDN instead of `vendor/`, so its icons disappear
  without an internet connection. Every other page uses the local copy.
- `js/tickets.js` contains a **Stripe secret key** (`sk_test_…`) and posts to the Stripe API from
  the browser. A secret key must never be in client-side code or a public repo, and Stripe blocks
  direct browser calls to that endpoint anyway. The key needs rotating in the Stripe dashboard.
- No page displays the contents of the three storage technologies any more. The old dashboard had a
  panel that did; it did not survive the merge into `signin.html`.

## Note

NextGen E-Sports is a fictional team built for coursework. Imagery is illustrative and the
statistics shown are not real results.
