# NextGen E-Sports

NextGen E-Sports is a **community esports team** — open to players of every level, not an elite
competitive program. The team focuses on three titles: **Valorant, Counter-Strike, and PUBG**.

It currently hosts one competition, the **2026 NextGen Youth Championship** for players aged
16–18, contested by eight member teams (VYNE, KOVA, RIFT, ZERA, AXEN, MIRA, TALO, BRIX) across
three divisions. That championship is what `players.html`, `tournaments.html` and `rankings.html`
cover; the team itself stays open to everyone. All of it — teams, players, results — is fictional
content written for this project.

This repository is a university coursework prototype: a mobile-responsive, eight-page website built
with plain HTML5, CSS3, JavaScript, jQuery and Bootstrap 5 — no backend, no build step, no
framework. Every page can be read from the source directly; this document exists to save you that
trip by walking through what each page does, what it stores in the browser, and which pages talk to
a real API.

## Running it

**Don't open `index.html` by double-clicking it.** Browsers block `XMLHttpRequest` against `file://`
URLs, so the pages that load their content from `data/*.json` (rankings, players, tournaments,
events) would show a load error, and `about.html`'s video would fail to play in Safari. The site
needs to be served over http — locally while developing, or from real hosting once it's live.

### While developing — VS Code Live Server

The fastest loop: install the **Live Server** extension (`ritwickdey.LiveServer`), then right-click
any `.html` file → *Open with Live Server*, or click *Go Live* in the status bar. It serves the
folder, opens the browser, and auto-refreshes on every save — no terminal command to re-run. It
also handles HTTP Range requests correctly, so `about.html`'s video plays properly in Safari too.

Any other static server works the same way (`npx serve`, XAMPP/Apache) — just not
`python -m http.server` on its own, which ignores the `Range` header and breaks Safari video
playback specifically (Chrome tolerates the gap and plays it anyway, which is why it only shows up
in one browser). If you don't have Node or an IDE extension handy, `python serve.py 8000` is a
small stdlib-only fallback that adds the missing Range support.

### Once it's live — GitHub Pages

Hosted through GitHub Pages (or any real static host), this stops being a concern entirely — GitHub
Pages serves Range requests correctly out of the box, so there's nothing extra to configure and
`serve.py` isn't needed at all in that environment.

## The eight pages

The navbar and footer are identical byte-for-byte on every page (`js/main.js` runs the shared
behaviour: nav highlighting, the theme toggle, the cookie banner, and the footer's live Discord
widget). Only the content between them changes per page.

One piece of that shared behaviour is signed-in state: once you have joined, the navbar's **Join**
link becomes your **email address** on all eight pages. It still points at `register.html`, which
by then shows your membership panel and the sign-out button instead of the sign-up form.

### Home — `index.html`
The landing page. A three-slide Bootstrap hero carousel, a static title strip (Valorant / CS /
PUBG icons, presented as plain badges — not clickable), a preview of 3 live/upcoming tournaments, a
preview of the top 5 club standings, and a live stream embed.
- **Storage:** sets/reads the `returningVisitor` **cookie** (30 days) — suppresses the intro
  animation and shows a "welcome back" badge on repeat visits.
- **API:** none of its own; the previews read local `data/tournaments.json` and
  `data/standings.json` via `$.getJSON`.

### Team Rankings — `rankings.html`
Club championship standings across every competing organisation the site tracks. A shared filter
bar (game + sort), and a league table with team logos, played/won/lost, points and medal counts.
- **Storage:** none of its own — the page is read-only.
- **API:** this page owns the graded "RESTful API via jQuery" feature. `$.getJSON('data/standings.json')`
  fetches real team names (cross-checked against Liquipedia) with illustrative points/records,
  rendered into the DOM with a loading spinner and an error fallback.

### Player Profiles — `players.html`
A reference database of real competitive players across Valorant, Counter-Strike and PUBG — not
NextGen's own roster (the club has no real members). A filter bar (game + role + sort) and a grid
of player cards with real photos, ratings, and achievements.
- **Storage:** reads/writes `playerFilter` (`{game, role}`) in **localStorage** — your last filter
  is restored automatically on your next visit.
- **API:** `$.getJSON('data/players.json')`, same pattern as rankings.

### Tournaments — `tournaments.html`
Brackets, prize pools and results for the competitions the club follows. A status toolbar
(All/Live/Upcoming/Completed) plus the shared filter bar, and a card grid with tournament art, a
pulsing LIVE badge on active tournaments, and a link into `register.html` pre-filled with the
tournament as context.
- **Storage:** reads/writes `tournamentFilter` (`{status, game, sort}`) in **sessionStorage** — the
  active filter survives navigating between tabs on this page in the same browser tab, but a new
  tab starts clean.
- **API:** `$.getJSON('data/tournaments.json')`, same pattern as rankings.

### Event Schedule — `events.html`
The club's own activity calendar — practices, workshops, socials and tryouts — with a list/calendar
view toggle. A dated event can link out to `tournaments.html` if it's tied to one (a watch party,
for example) without duplicating that tournament's detail.
- **Storage:** reads/writes `eventView` (`"list"` or `"calendar"`) in **sessionStorage**.
- **API:** two, and this is the only page with a genuinely *live* external call:
  1. `$.getJSON('data/events.json')` — the schedule itself, a local snapshot.
  2. `$.ajax` to **Open-Meteo** (`api.open-meteo.com/v1/forecast`) — a real, keyless, no-auth
     weather API called live on every page load, showing the actual current forecast for the
     club's venue. This is the site's clearest "real HTTP request → JSON → rendered via jQuery"
     demonstration.

### Registration — `register.html`
Creates a member account, entirely in the browser. Full name, email, in-game name, password +
confirmation, primary title (Valorant/CS/PUBG), experience level, and free-text notes. A query
param (`?event=<id>`) can prefill context when linked from another page.
- **Validation:** client-side and live. Every field is re-checked on each keystroke; the border
  turns **green** the moment the value is valid. The red error state is deliberately held back
  until you've left the field once (or pressed submit), so a half-typed email isn't flagged as
  wrong while you're still typing it. The password shows its three requirements as a checklist
  that ticks off as you meet them, and editing the password re-checks the confirmation box.
- **Two states, one page:** with no account it shows the form; once the account exists it shows a
  "Thank you for joining us" panel (artwork: `registerImgs/Joined.png`) with the membership
  summary and a **Sign out** button. Sign out goes through `confirm()` first, then deletes the
  stored account and returns you to a clean form.
- **Storage:** two, deliberately different lifetimes:
  - `registerDraft` in **sessionStorage** — every keystroke is saved so a refresh never loses your
    half-finished form, but it's gone once the tab closes (it's meant to be transient). The
    password fields are excluded from the draft on purpose.
  - `registrations` in **localStorage** — the account itself, meant to persist like a client-side
    stand-in for a real backend. The password is kept only as a short non-reversible digest;
    nothing readable is stored, and a real deployment would hash it server-side instead.
- **API:** none — account creation is entirely client-side; there is no server to send it to.

### Dashboard / Profile — `dashboard.html`
Your profile. A monogram avatar, your name and email, a sign-out button, and a segmented mini-nav
across three panels — deep-linkable as `dashboard.html#favourites` / `#storage`:
- **Personal info** — name, email, in-game name, member ID, primary title, experience and notes,
  shown as read-only boxes. They are not editable inputs on purpose: there is no server to save an
  edit to, so presenting them as editable would be a lie.
- **Favourites** — your primary title, plus tiles for favourite players and events. Those two are
  **placeholders**:
  `players.html` and `events.html` have no star yet, so nothing can set them. The code already
  reads `favouritePlayers` / `favouriteEvents` defensively, so the tiles start working the day
  those pages ship — see `CLAUDE.md` §5 "reserved, not yet implemented".
- **Storage** — the original dashboard: favourite club / membership / visitor-status tiles, a raw
  table of every key in local and session storage with a plain-language explanation of each, your
  account record, and a "clear everything stored" button.
- **Storage:** reads all three storage types and **writes no preference** of its own — every value
  shown here is owned and set by the page named next to it. This is intentional (see `CLAUDE.md`
  §7): no page's script reads a variable defined by another page's script, so `dashboard.html`
  re-reads each key independently from storage rather than depending on another page having run
  first. The one write it performs is a deletion — signing out, the same clear `register.html`
  does. The selected panel lives in the URL hash rather than storage, since a section is worth
  deep-linking to but is not a preference.
- **API:** none.

### About / Join Us — `about.html`
Club identity: a looping muted autoplay hero video, the club's story, a committee section (roles,
not real people — the club has no real members), a photo gallery, and the club's real social
presence (Instagram post embed, plus links to Discord/X/Facebook).
- **Storage:** the designated owner of `theme` (`"dark"`/`"light"`) in **localStorage**, though in
  practice the toggle lives in the navbar and works identically from every page — it's read before
  first paint everywhere to avoid a flash of the wrong theme.
- **API:** no `$.ajax` call of its own, but it hosts the site's other graded requirement — the
  **social media plugin** — via a real Instagram post embed (`instagram.com/embed.js`, no key).

## Storage, all in one place

| Type | Key | Owning page | Lifetime | Purpose |
|---|---|---|---|---|
| Cookie | `returningVisitor` | index | 30 days | Suppresses the intro animation, shows welcome-back |
| Local | `theme` | about (site-wide) | until cleared | Dark/light choice, read before first paint |
| Local | `playerFilter` | players | until cleared | Restores your last-used filter |
| Local | `registrations` | register (dashboard reads) | until cleared | The member account created on the join page |
| Session | `registerDraft` | register | tab close | In-progress form, saved on every keystroke |
| Session | `tournamentFilter` | tournaments | tab close | Active filter + sort |
| Session | `eventView` | events | tab close | List or calendar view |

## API calls, all in one place

Every network call in the project uses jQuery (`$.ajax`/`$.getJSON`) — never `fetch()`.

| Call | Where | Live or local? |
|---|---|---|
| Open-Meteo weather forecast | `js/events.js`, on `events.html` | **Live** — a real external request every page load |
| Discord invite lookup | `js/main.js`, in the shared footer on **all 8 pages** | **Live** — real member count, keyless |
| `data/standings.json` | `js/rankings.js` + homepage preview | Local snapshot (real names, illustrative stats) |
| `data/players.json` | `js/players.js` | Local snapshot (real names, illustrative stats) |
| `data/tournaments.json` | `js/tournaments.js` + homepage preview | Local snapshot |
| `data/events.json` | `js/events.js` | Local snapshot |

The local-snapshot files are still fetched with a real `$.ajax` call each time the page loads (that's
why the site can't be opened via `file://`) — they're just reading a file already sitting in the
repo rather than a live external source. Team/player/tournament **names** in those files are real
and were checked against Liquipedia by hand while building the site (never at runtime — see
`CLAUDE.md` §6); **statistics** (points, ratings, prize pools) are illustrative and each file says
so in its own `_source` field.

## Structure

```
├── serve.py              dev-only local server with Range support (see "Running it")
├── *.html                 8 pages; navbar and footer markup identical across all
├── css/
│   ├── style.css          general file: tokens, shared shell, and anything used by
│   │                        3+ pages — no hardcoded colours in pages
│   └── index.css, rankings.css, events.css, dashboard.css, register.css
│                            page-exclusive styles — one file per developer's page,
│                            see CLAUDE.md section 7
├── js/
│   ├── storage.js         helpers for cookies + local + session storage
│   ├── render.js          shared card/row renderers and the single AJAX wrapper
│   ├── filter.js          the shared filter bar (rankings, players, tournaments)
│   ├── main.js             site-wide: nav, theme, cookie banner, footer widget
│   └── <page>.js           one per page, page-specific only
├── data/*.json             content loaded at runtime with $.getJSON
├── vendor/                jQuery, Bootstrap 5, Bootstrap Icons (local copies)
├── fonts/                  Unbounded + Sora (self-hosted for offline use)
└── GameLogos/ TeamLogo/ TournamentThumbnail/ PlayerPhotos/ registerImgs/
    carousel*.png Video1.mp4
```

Some files in the asset folders (League of Legends / Dota 2 / EA SPORTS FC logos, thumbnails and
photos) are left over from before the club's scope was narrowed to three titles — they're not
referenced by any page. See `CLAUDE.md` §9 if you're deciding whether to remove or reuse them.

## Note

NextGen E-Sports is a fictional club built for coursework. Imagery is illustrative and the
competitive statistics shown are not verified results.
