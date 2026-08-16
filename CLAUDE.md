# NextGen E-Sports Club Website — Project Context

Context file for Claude Code. Read this fully before writing any code.

---

## 1. What this is

A university coursework assignment
Build a **mobile-responsive, multi-page e-sports club website**. Static front-end only.

**The club does not exist.** All content is fictional and the site is a prototype.
There are no real members, no real tournament results.

**NextGen E-Sports is a community club, not an elite competitive program.** It's framed as
welcoming amateur players and students who just want somewhere to play — membership itself has
no skill bar. An optional, lighter-touch competitive pathway (scrims, the championship below)
exists for anyone who wants it, but it's never the framing for the club as a whole.

**The club currently hosts one competition: the 2026 NextGen Youth Championship**, for players
aged 16–18, split into three divisions (Valorant / CS2 / PUBG) contested by **eight member clubs**
(VYNE, KOVA, RIFT, ZERA, AXEN, MIRA, TALO, BRIX). This is *one event the club runs*, not what the
club is — `players.html`, `tournaments.html` and `rankings.html` are all scoped to it, while
`index.html`, `about.html` and `register.html` speak for the club and stay open to everyone. Don't
let the championship's 16–18 eligibility leak into the club's own copy.

**Everything is fictional — including the clubs and players.** The eight orgs, their 112 players
and all results were written for this project. The earlier Liquipedia-sourced real players/teams
and their photos/logos were deleted on 2026-08-16 (§9); §6's Liquipedia guidance is retained only
as history of where the *old* data came from — do not source new data that way.

**The site itself carries no "prototype"/"fictional club" disclaimer.** Those lines were removed
from all 8 pages by request: it presents as a real club's site. That's a presentation choice for
the deliverable, and it does not license inventing *real-world* claims — no real people, real
orgs, or real results anywhere.

**Scope: three titles only — Valorant, Counter-Strike, PUBG.** Every page, filter, and dataset is
scoped to these three. Don't add League of Legends / Dota 2 / EA SPORTS FC content back in without
this section being revisited first — see §9 for what's still sitting unused in the asset folders
from before the scope was narrowed.


---

## 2. Hard constraints

- **Front-end only.** No backend, no database, no server-side code, no build step.
- **Plain files.** HTML + CSS + JS served directly. No React, no Vue, no bundler, no npm.
- **Must be viewable offline** from an unzipped folder. All assets local. No hotlinked images.
- **Required stack, all five must be visibly present:** HTML5, CSS3, JavaScript, jQuery, Bootstrap 5.
- **API calls must use jQuery** (`$.ajax` / `$.getJSON`). **Do not use `fetch()`** — the marking
  rubric names jQuery explicitly and a marker will look for the `$`.
- No fabricated statistics presented as verified fact (rankings/points/prize pools stay illustrative). This is an
  unpublished, non-commercial coursework prototype, so the real game/org logos and event photography already
  supplied in `GameLogos/`, `TeamLogo/`, `TournamentThumbnail/`, and `carousel*.png` are used directly. Additional
  real team logos and real player headshots may be sourced the same way (via Liquipedia's `imageinfo` endpoint,
  fetched once by hand and stored locally — see §6) for `players.json`/`standings.json` entries, since these are
  real public competitive figures/organisations, not private individuals.
- **Still off-limits:** photos of anyone claiming to be a NextGen E-Sports member, committee member, or roster
  player — the club has no real members (§1), so no real person's photo or name may be presented as part of it.
  The real-photo exception is strictly for real external pros/orgs shown as real external pros/orgs (rankings,
  players, tournaments) — never as if they belong to NextGen itself.

---

## 3. Graded requirements

These are what the assignment actually scores. Do not drop any of them.

| Requirement | Marks | Notes |
|---|---|---|
| Cookies + local storage + session storage | 15 | **All three.** Each needs a defensible purpose. |
| RESTful API via jQuery + social media plugin | 10 | Both required. |
| Overall layout / UI-UX | 15 | Largest single band. Consistency matters most. |
| 8 pages (2 per member × 4 members) | — | Checked, not scored. Minimum. |
| Mobile responsive | — | Stated requirement. |
| Colour scheme, graphics, animations, audio/video, menus | — | All named in the brief. |

---

## 4. Page structure

Eight pages. Each entity has **exactly one home page**; every other page links to it rather than
duplicating content. This rule exists to prevent overlap — please preserve it.

| # | File | Page | Owns exclusively | Storage | API / Plugin |
|---|---|---|---|---|---|
| 1 | `index.html` | Home | Hero, carousel, aggregated previews, stream embed | Cookie `returningVisitor` | Stream iframe |
| 2 | `dashboard.html` | Dashboard / Profile | Profile: mini nav across Personal info / Favourites / Storage | All three, read-only (plus sign out, which deletes) | — |
| 3 | `rankings.html` | Team Rankings | Team standings, W/L, points, team profiles | Local `favouriteTeam` | **API** — standings |
| 4 | `players.html` | Player Profiles | Individual profiles, stats, achievements | Local `playerFilter` | — |
| 5 | `tournaments.html` | Tournaments | Brackets, results, prize pools | Session `tournamentFilter` | Share buttons |
| 6 | `events.html` | Event Schedule | Calendar: practices, workshops, socials | Session `eventView` | **API** — venue/weather |
| 7 | `register.html` | Registration | Sign-up form + live client-side validation, the member account, sign out | Session draft + Local account | — |
| 8 | `about.html` | About / Join Us | Club identity, committee, concept gallery | Local `theme` (site-wide) | **Social feed embed** |

*Social feed embed, fulfilled two ways: the footer's X/Facebook/Discord plugins are shared markup present on
every page including this one, and this page additionally embeds a real Instagram post (§10) since Instagram
has no small no-auth footer widget.*

### Content boundaries — do not blur these

- **Rankings vs Players** — `rankings.html` shows *teams* only. Player names there are links out to
  `players.html#ign`. `players.html` shows *individuals* and never ranks teams.
- **Tournaments vs Events** — tournaments are *competitions with outcomes* (brackets, results).
  Events are *scheduled activities* (practice, workshops, socials). A tournament may appear on the
  events calendar as a dated entry **linking to** `tournaments.html` — never as duplicated detail.
- **Registration** lives only on `register.html`. Other pages link to it with a query param to
  prefill context (e.g. `register.html?event=valorant-open`).
- **Games** is deliberately *not* a page. Game titles are a filter dimension on rankings, players,
  and tournaments.
- **Gallery** is a section inside `about.html`, not its own page.

---

## 5. Storage specification

Implement exactly these keys. camelCase. Agreed group-wide.

| Type | Key | Page | Example value | Lifetime | Purpose |
|---|---|---|---|---|---|
| Local | `theme` | site-wide | `"dark"` \| `"light"` | until cleared | Colour scheme. Read before first paint to avoid a flash of wrong theme. |
| Local | `favouriteTeam` | rankings | `"Team Nova"` | until cleared | Highlights the team's row in the standings (does not reorder the table). |
| Local | `playerFilter` | players | `{"game":"Valorant","role":"Duelist"}` | until cleared | Last-used filter, restored next visit. |
| Local | `registrations` | register, dashboard | `[{"id":"REG…","fullName":"…","passwordHash":"…"}]` | until cleared | The member account created on the join page. Client-side store in place of a backend; still an array so `dashboard.html` reads it unchanged, and `register.html` treats the last entry as the account signed in on this browser. Signing out removes the key. The password is stored only as a short non-reversible digest — never in readable form, and never written to `registerDraft`. |
| Session | `registerDraft` | register | `{"step":2,"name":"…"}` | tab close | Partial form data, written on field change. |
| Session | `tournamentFilter` | tournaments | `"valorant"` | tab close | Active filter + sort, survives in-tab navigation. |
| Session | `eventView` | events | `"calendar"` \| `"list"` | tab close | Selected view and month. |
| Cookie | `returningVisitor` | index | `"true"` | 30 days | Suppresses intro animation, shows welcome-back. `path=/; SameSite=Lax` |

**Reserved, not yet implemented.** `dashboard.html`'s Favourites tab shows four categories.
Two of them — favourite **players** and favourite **events** — have no way to be set yet: those
pages are still to be built by the rest of the team, so the tiles render a "coming soon"
placeholder. `js/dashboard.js` already reads `favouritePlayers` and `favouriteEvents` from
localStorage defensively (array of display names) so the tiles light up the day those pages ship.
**That shape is a proposal, not an agreed key** — whoever builds the star on `players.html` /
`events.html` owns the decision and should add the real row to the table above first. Nothing in
the project writes either key today.

**Signed-in state is site-wide.** Once `registrations` holds an account, `js/main.js` relabels the
navbar's "Join" link to the member's email address on all 8 pages. The href stays `register.html`
— that page shows the membership panel and the sign-out button once an account exists. Every page
reads the key itself rather than depending on `register.js` having run (§7).

### Why each technology (this reasoning is assessed in Q&A)

- **Session storage** — tab-scoped working state that *should not* persist. A new tab starts clean.
- **Local storage** — user-owned data expected to survive the browser closing.
- **Cookies** — needs a defined expiry, and is the one value that would legitimately travel to a
  server in a real deployment.

Choosing the wrong one is worse than not using it. Do not move a key between technologies without
a reason that fits the above.

---

## 6. API approach

The requirement is that a **real HTTP request goes out, returns JSON, and is rendered into the DOM
via jQuery**. It does not have to be live esports data.

Preference order:

1. A free, **keyless, CORS-permitted** public API.
2. A **local JSON file** in `data/` fetched with `$.getJSON`. This is legitimate and will be
   declared honestly in the report as static JSON — do not label it as a live feed.

Always include an error handler that renders a fallback message. Always show a loading spinner
while the request is in flight (this doubles as an animation requirement).

```js
$.ajax({
  url: 'data/standings.json',
  method: 'GET',
  dataType: 'json',
  beforeSend: function () { $('#standings').html(spinner); },
  success:    function (data) { renderStandings(data); },
  error:      function () { $('#standings').html('<p class="text-muted">Unable to load standings.</p>'); }
});
```

**Concrete candidates (verify CORS before committing):**

- `events.html` venue/weather → Open-Meteo (`https://api.open-meteo.com/v1/forecast`) — free, keyless,
  CORS-enabled, fits a per-event forecast well.
- `rankings.html` standings → no free keyless live-esports-standings API is reliably CORS-open; default to
  the local-JSON fallback (`data/standings.json`) and document that choice honestly, per the preference order above.
  **PandaScore was evaluated and rejected** — its own FAQ states direct browser calls are blocked and it
  requires a backend proxy, which violates the no-backend constraint in §2. Not used anywhere in this project;
  don't re-investigate it without a reason to revisit the no-backend rule itself. Liquipedia (below) is the
  real data source actually in use.
- The footer's Discord invite lookup (`$.getJSON('https://discord.com/api/v10/invites/theesportsclub?with_counts=true')`,
  see §10) is itself a real keyless jQuery API call — it can stand in as a third demo, or as the one for
  whichever page's script renders it, since the footer is shared markup across all 8 pages.

**Liquipedia (where the real names/photos/logos in `data/` came from — not a live call):**

`data/players.json`, `data/standings.json`, and every real headshot in `PlayerPhotos/` and logo in `TeamLogo/`
were sourced once, by hand, from Liquipedia (`action=parse`/`imageinfo`) while building the site — never at
runtime. That's a closed, already-done task, not an ongoing integration: **there is no live MediaWiki/Liquipedia
call anywhere in this project, and none is planned.** The one-time fetch guide that used to live at
`docs/liquipedia_api_guide.md` has been removed since there's nothing left to fetch it against — the data it
described is already committed. If a new real player/team is ever added, source it the same way (Liquipedia,
by hand, real descriptive User-Agent, respecting their real rate limits — 1 req/2s general, 1 req/30s for
`action=parse`) and save the result straight into the relevant `data/*.json` file; don't reintroduce a runtime
dependency on liquipedia.net to do it.

`rankings.html`'s graded **API** slot (§4) stays exactly as already documented: `$.getJSON('data/standings.json')`
— populated with real names, mechanically just a local-JSON fetch like any other tier-2 source above.

**Rank is computed, not stored.** `data/standings.json`'s `rank` field is only the canonical
championship-points order — `js/rankings.js` never displays it directly. Every row's on-screen `#N`
is the team's actual position in whatever sort/filter is currently active, computed from array
index after sorting (`js/render.js`'s `boardRow()` takes `rank` as an explicit parameter). There is
no `movement`/rank-change indicator — with rank now computed per sort rather than fixed, a "moved up
2 places" arrow would have no single baseline to measure against, so the field was dropped rather
than left showing a number with no real basis. The four sort criteria (rank/points/gold
medals/win rate) are deliberately **decorrelated** in the data — each produces a genuinely different
#1 team — so switching the sort dropdown visibly does something, rather than re-displaying the same
order every time.

---

## 7. Shared contract — build these first, then freeze

Pages are developed independently by four people. Consistency must come from shared files.

```
/
├── index.html  dashboard.html  rankings.html  players.html
├── tournaments.html  events.html  register.html  about.html
├── css/
│   ├── style.css        ← general file: tokens, shell (nav/footer/cookie banner), base,
│   │                       buttons/cards, and any component used by 3+ pages or by a
│   │                       page outside the five below (filter bar, tabs, tournament
│   │                       cards, player cards, video frame)
│   ├── index.css         ← exclusive to index.html (hero, carousel, game strip)
│   ├── rankings.css      ← exclusive to rankings.html (leaderboard/medals/favourite —
│   │                       index.html links this too, see note below)
│   ├── events.css        ← exclusive to events.html (event rows, calendar, weather panel)
│   ├── dashboard.css     ← exclusive to dashboard.html (stat tiles, storage-table rows)
│   └── register.css      ← exclusive to register.html (form controls, live validity
│                           states, password checklist, joined/thank-you panel)
├── js/
│   ├── main.js          ← site-wide only: nav, theme toggle, cookie banner, footer widget
│   ├── storage.js       ← shared get/set helpers for all three storage types
│   ├── render.js        ← shared card/row renderers + the single $.ajax wrapper
│   ├── filter.js        ← shared filter bar (rankings, players, tournaments)
│   └── [page].js        ← one per page, page-specific only
├── data/                ← local JSON for API fetches
├── vendor/              ← jQuery, Bootstrap 5, Bootstrap Icons (local, for offline)
├── fonts/               ← Unbounded + Sora woff2 (self-hosted, see §11)
└── GameLogos/ TeamLogo/ TournamentThumbnail/ registerImgs/ carousel*.png Video1.mp4
```

`render.js` and `filter.js` are **shared components**, not page scripts — they exist so a
tournament card and a filter row are identical everywhere they appear. Treat them like
`style.css`: change them once, and every page that uses them changes together.

**CSS modularity — the five pages above are treated as two developer pairs (Home+Rankings,
Events+Dashboard) plus Register, who never need to touch `style.css` or each other's page
file for their own page's design:**

- A rule only belongs in `style.css` if it's shell/tokens/base, **or** if a page outside
  this set of five (players/tournaments/about) also depends on it. Those three pages are
  untouched by this split and still only link `style.css` — moving something they use
  would break them.
- **Forms are register-exclusive.** `.nx-field`/`.nx-label`/`.nx-input`/`.nx-select`/
  `.nx-textarea`/`.nx-error` moved out of `style.css` into `register.css`, because
  `register.html` is the only page in the site that renders a form (grep those class names
  across `*.html` and `js/*.js` before assuming otherwise). If a second page ever grows a
  form, move those base control rules back into `style.css` and leave only the `reg-`
  classes behind. The `nx-` prefix on them marks the design system, not the file they
  live in, so they kept their names when they moved.
- `index.css`/`rankings.css`/`events.css`/`dashboard.css`/`register.css` hold only what's
  genuinely exclusive to that one page. `index.html` is the one exception: it links `rankings.css`
  as well as its own `index.css`, because its homepage "Top of the table" preview reuses
  `js/render.js`'s `boardRow()` — the exact same component rankings.html's full
  leaderboard renders — so the styling has to be identical. That's only acceptable because
  both consuming pages belong to the same developer pair; never reach into a page file
  owned by the *other* pair.
- `events.js`/`dashboard.js` render dedicated classes (`ev-*`, `dash-*`) instead of inline
  `style="..."` — inline styles were the main reason those two pages had nothing of their
  own to put in a page-exclusive file in the first place.
- Before adding a new component class: if it's only ever used by one of these four pages,
  it goes in that page's file. If a page outside this set needs it too, it goes in
  `style.css`. Don't guess — grep for the class across `*.html` and `js/*.js` first.

Images stayed in the asset folders they arrived in rather than moving to `img/` — the paths
are already referenced throughout, so renaming them now buys nothing.

**Cache-busting — bump `?v=` when you change a shared file.** Every first-party `css/*.css` and
`js/*.js` link carries a `?v=N` query. Browsers (Safari especially) cache these hard, and a
phone that has already visited will keep serving the old copy — which cost us a round of
"the fix isn't showing on my iPhone" when it was really a stale `style.css`. When you edit a
file, bump its number in every page that links it. `players.*` and `tournaments.*` carry their
own numbers, managed by the pair that owns them.

**Rules:**

- All colours, fonts, and spacing come from CSS custom properties in `style.css`. **Never hardcode
  a hex value in a page.**
- Navbar and footer markup is **identical** across all eight pages.
- `js/main.js` holds only site-wide behaviour. Page scripts must not depend on it beyond helpers.
- **No page's script may read a variable defined by another page's script.** Where two pages need
  the same value, each reads it independently from storage using the key names in §5.
- Filenames lowercase-hyphenated. Every `<img>` needs `alt` text.

---

## 8. Animation

Keep it to a small, consistent set — a coherent motion language, not scattered effects.

1. **CSS transitions** on all cards, buttons, and nav links. Defined once in `style.css` so every
   page inherits identical behaviour. 200–300ms.
2. **CSS keyframes** for: a loading spinner on API sections, and a pulsing "LIVE" badge on active
   tournaments.
3. **Bootstrap built-ins** — carousel on the homepage, modal fade, accordion collapse, offcanvas nav.

Durations stay short. Slow animation reads as sluggish and costs more on the UI/UX band than it gains.

---

## 9. Asset inventory & imagery

All image/video assets already exist in the repo root — don't re-source alternates unless a folder is
genuinely missing an entry.

**Scope note:** these folders were populated back when the club fielded six titles. §1 narrowed that to
Valorant/CS2/PUBG only, so a chunk of what's physically in these folders is now unreferenced leftover from the
pre-narrowing scope, kept on disk rather than deleted (nothing was forcibly removed, only unwired). Don't treat
their presence as license to re-add League of Legends / Dota 2 / EA SPORTS FC content — check §1 first.

| Folder / file | Contents | Used for |
|---|---|---|
| `GameLogos/` | valorantLogo, CS2Logo, pubgLogo **in active use**; LOLLogo, dota2Logo, FC26Logo present but unreferenced | Game-filter tabs/icons on rankings, players, tournaments; small badges on cards |
| `TeamLogo/` | Team_Liquid, Natus_Vincere, Team_Vitality, Virtus.Pro, Team_Falcons, Faze_Clan, Team_Spirit, Aurora_Gaming, AG.AL, Fnatic, Sentinels **in active use**; T1, GenG, Team_Vision present but unreferenced (their teams were League/Dota-only, dropped with the scope) | Club badges in the rankings leaderboard / team profile cards. **NextGen E-Sports has no logo file** — render its identity as a styled CSS wordmark/emblem, not an `<img>` |
| `PlayerPhotos/` | 10 real headshots **in active use**, one per `data/players.json` entry; 10 more (League/Dota/FC players dropped with the scope) present but unreferenced | Player cards on `players.html` (`nx-avatar--photo`); falls back to a generated monogram if a player has no `photo` field. Sourced once via Liquipedia's `action=parse` infobox image (§6), not hotlinked |
| `TournamentThumbnail/` | valorantTournament, CS2Tournament, pubgTournament **in active use**; LOLTournament, dota2Tournament, FC26Tournament present but unreferenced | Card header art on `tournaments.html`; linked-event image when a tournament appears on `events.html`'s calendar |
| `registerImgs/` | `Joined.png` — celebratory group artwork | Background of `register.html`'s "Thank you for joining us" panel, behind a dark scrim in both themes. Set in `css/register.css`, not as an `<img>`, so it stays decorative and needs no alt text |
| `carousel.png`, `carousel1.png`, `carousel2.png` | real event/gameplay photography | Homepage hero carousel (3 slides) |
| `Video1.mp4` | real event footage | `about.html` hero video, framed like `design-refs/About.png` |

**Before wiring these in:** several files are well above a sane per-image budget (`pubgTournament.png` ≈ 4.5MB,
`registerImgs/Joined.png` ≈ 1.3MB, multiple `TeamLogo`/`GameLogos` PNGs > 400KB, a few `PlayerPhotos/` infobox images > 400KB) — this applies to the
in-use files; the unreferenced leftovers don't need compressing since they don't ship. Resize/recompress the
in-use ones to roughly 300–400KB (compressed PNG or WebP) before final submission — do this once, late, after
layout is frozen, not on every edit. A slow image-heavy page load costs marks on the UI/UX band.

Every `<img>` still needs `alt` text (e.g. `alt="Valorant"`, `alt="Team Vitality logo"`).

---

## 10. Wireframe & global layout

**Responsiveness:** navbar, footer, and card/grid regions are built with flexbox (`display:flex` +
`flex-wrap:wrap` for the nav links and footer columns; `gap` for spacing) so they reflow naturally at mobile
widths without separate breakpoint-specific markup. Use CSS Grid only where a genuine 2D layout is needed
(e.g. the rankings table, tournament card grid); flexbox everywhere else, per the mobile-responsive requirement
in §3.

### Global shell (identical markup on all 8 pages, per §7)

```
┌───────────────────────────────────────────────────────────┐
│ NAVBAR — solid #0B0B0E, sticky, NOT part of the gradient    │
│ [NextGen wordmark]  Home Dashboard Rankings Players …       │ ← active link underlined/accent
└───────────────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────────────┐
│ PAGE BODY — this is the only region that changes per page   │
│  vertical gradient: #0B0B0E (top) → accent-tinted #1A1A24   │
│  glow (mid) → #0B0B0E (bottom)                               │
│                                                               │
│   …page-specific content…                                   │
└───────────────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────────────┐
│ FOOTER — solid dark, identical on all 8 pages                │
│ NextGen E-Sports      [X follow][FB page][Discord][IG icon] │
│ © 2026–2026 NextGen E-Sports · Cookie Preferences · legal    │
└───────────────────────────────────────────────────────────┘
```

**Gradient implementation** — stops at 0/50/100% (not fixed px) so the bright band lands near the visual
middle regardless of each page's actual content length:

```css
--bg-top: #0B0B0E;
--bg-mid: color-mix(in srgb, var(--accent) 35%, #1A1A24);
--bg-bottom: #0B0B0E;

body { background: var(--bg-top); }
.page-body {
  background: linear-gradient(to bottom, var(--bg-top) 0%, var(--bg-mid) 50%, var(--bg-bottom) 100%);
}
```

Cards/panels sit on `--surface` (#1A1A24) so they read as raised, independent of the gradient behind them.

**Navbar** — solid `var(--bg-top)` (#0B0B0E) exactly, so it continues the gradient's own top stop while
staying opaque when sticky over scrolled content. 1px bottom border at low-opacity accent for separation
(mirrors the underline glow in `design-refs/About.png` and the divider in `design-refs/Footer.png`).

**Footer spec** (mirrors `design-refs/Footer.png`):

- Club name repeated: "NextGen E-Sports" (+ optional one-line tagline)
- Copyright: `© 2026–<span id="copyYear"></span> NextGen E-Sports`, year filled by
  `document.getElementById('copyYear').textContent = new Date().getFullYear();` in `main.js` so it never goes stale
- "Cookie Preferences" — a real control that re-opens the cookie-consent UI (the same mechanism behind §5's
  `returningVisitor` cookie), not a dead link
- Social icons — **not plain links.** Each is a real official platform plugin/widget pointed at real
  accounts, present in the footer on all 8 pages (so this alone satisfies the graded "social media plugin"
  requirement site-wide, not just on `about.html`):
  - **X** — official Follow Button widget: `platform.twitter.com/widgets.js` +
    `<a class="twitter-follow-button" href="https://x.com/UCEsportsClub">Follow @UCEsportsClub</a>`. No key.
  - **Facebook** — official Page Plugin, iframe form (no App ID needed):
    `https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fapuesportsclub%2F&tabs=timeline&small_header=true&adapt_container_width=true&hide_cover=true&show_facepile=false`,
    sized small to sit inline in the footer row.
  - **Discord** — the invite code `theesportsclub` is resolved live via jQuery, not hardcoded:
    `$.getJSON('https://discord.com/api/v10/invites/theesportsclub?with_counts=true')` returns the guild's
    name/icon/approximate member count with **no auth**; render it as a small "Join — N members online"
    card/button. (This doubles as a legitimate second real-API demo for §6.) If a numeric guild ID with
    **Server Widget** enabled becomes available instead, the fuller `https://discord.com/widget?id=<id>&theme=dark`
    iframe can replace this.
  - **Instagram** — Meta retired the small no-auth "follow badge," so a *tiny* footer-icon plugin for
    `apu_esc` isn't available without OAuth. Use the official post-embed instead
    (`https://www.instagram.com/p/<shortcode>/embed`, no key) placed as a real content block on
    `about.html`'s fandom/gallery section; the footer's Instagram icon anchor-links down to it in-page. Pick
    which real public post to embed when you're at that page.
  - Twitch/YouTube/TikTok — not in the supplied account list; drop them from the footer unless you're given
    real handles for those too.
- One-line prototype disclaimer: this is a coursework prototype and imagery is illustrative.

### Per-page layout notes

- **index.html** — hero Bootstrap carousel (`carousel.png`/`1`/`2`), a static 3-icon title strip
  (`GameLogos/` — Valorant/CS2/PUBG only, per §1; plain badges, not links or buttons), 2–3
  live/upcoming tournament preview cards (`TournamentThumbnail/`), stream embed, footer.
- **rankings.html** — filter row styled like `design-refs/filter.png` (single-row control, chevron flips on
  open) using `GameLogos/` as the game filter; leaderboard table styled like `design-refs/Leaderboard.png`
  (rank, `TeamLogo/` badge + name, points, gold/silver/bronze medal boxes) — standings data is a real
  Liquipedia group-stage/standings snapshot (§6), team names cross-mapped to the existing `TeamLogo/` files.
- **tournaments.html** — status toolbar (All/Live/Upcoming/Ongoing/Completed) like `design-refs/tournaments.png`;
  cards use `TournamentThumbnail/` as header art + a small `GameLogos/` badge, pulsing LIVE badge per §8 — card
  data (dates, prize pool, participant count, status) is a real Liquipedia tournament snapshot (§6); card art
  stays local (`TournamentThumbnail/`), not fetched from Liquipedia.
- **about.html** — hero exactly like `design-refs/About.png`: large rounded video window playing `Video1.mp4`
  with an original hook line (not "Legacy Unrivaled" — pick NextGen's own), then club story, committee,
  gallery, and the real Instagram post embed described above.
- **players.html** — no dedicated design ref — a real player database (e.g. s1mple, ZywOo, TenZ, Derke),
  sourced from a Liquipedia snapshot (§6): real name, country, current team/role, achievements. Reuses the
  shared card/list patterns from §11. Not NextGen's own roster — the club has no real members (§1).
- **dashboard.html** — a profile page, taking the *idea* of `design-refs/profile.png` (title + subtitle,
  sign-out top-right, a segmented pill mini-nav above one big panel) without copying its layout or its
  light palette: the pill is accent-filled on our dark surface, the identity block gains a hexagon
  monogram avatar reusing `.nx-avatar`, and the panels are Personal info / Favourites / Storage. The
  Storage panel is where the whole original dashboard lives — the three storage tables are the graded
  §3 requirement and must not be dropped in a redesign. The active panel is hash-linked
  (`dashboard.html#favourites`), deliberately **not** stored: a section is worth deep-linking to but is
  not a preference, so it does not take a storage key.
- **events.html, register.html** — no dedicated design ref; reuse the shared shell + the
  card/list/table patterns above with the same tokens.

---

## 11. Visual design system

**Reference screenshots:** `design-refs/filter.jpeg`,`design-refs/tournaments.jpeg`,`design-refs/Leaderboard.png`,`design-refs/About.png`,`design-refs/Footer.png`,`design-refs/profile.png`

**What to take from them:** in filter.jpeg, the single row filter control is appealing with the space and opacity being enough, the animation of the arrow when clicked on turns pointing up and a dropdown of the choices appear. intournaments.png, the presentations of tournaments below a toolbar for choosing all, live, upcoming, ongoing is clean and intuitive, integrate the idea but not copy. The leaderboard.png displays the medals for each team cleanly in boxes coloured gold, silver and bronze, along witht he points for each team. The About.png has a large round bordered window showing a video with a hook word"Legacy Unrivaled", the video serves as a hook, the club's details are then displayed below. The Footer.png is the footer of the website and lists the social media links/icons for the clubs's socials, use that idea and the copyright elements, cookie preferences.

**What NOT to copy:** layout wholesale, or anything from a site reviewed in Chapter 2 of the report.
The report argues how this site *differs* from those, so cloning one contradicts it.

**Design tokens:**

```css
:root {
  --bg:             #0B0B0E;  /* page background, gradient's dark stops */
  --surface:        #1A1A24;  /* cards, nav, footer, panels */
  --surface-raised: #22222E;  /* hover/elevated state, adjust to taste */
  --text:           #FFFFFF;
  --text-muted:     #A8A8B3;
  --accent:         #FF1E38;
  --accent-hover:   #FF4D63;
  --accent-soft:    rgba(255, 30, 56, 0.15); /* glow/tint backgrounds, badge fills */
  --radius:         12px;
  --space:          8px;      /* base unit — use multiples (8/16/24/32/48) */
  --font-heading:   'Unbounded', system-ui, sans-serif;
  --font-body:      'Sora', system-ui, sans-serif;
}
```

Fonts must be **self-hosted** (`fonts/` + `@font-face`) — a Google Fonts CDN `<link>` breaks the "viewable
offline from an unzipped folder" rule in §2. Per the aesthetic brief at the bottom of this file, avoid
Inter/Roboto/Arial — Unbounded (heading) + Sora (body) is the default pairing here, swappable as long as
neither is a default system font.

**Density:** airy — section padding roughly 64–96px desktop / 32–40px mobile
**Card style:** flat surface + 1px low-opacity border, accent glow on hover (no heavy drop shadows against the dark gradient)
**Headings:** uppercase + letterspaced — matches the condensed bold treatment in `tournaments.png`/`Leaderboard.png`

---

## 12. Working order

1. Shared contract first — `style.css` tokens, navbar/footer markup, `storage.js` helpers. Freeze it.
2. Then pages, independently, in parallel.
3. Site must be substantially complete several days before 21 Aug — Chapter 4 of the report needs a
   screenshot of every page, and the video demo is recorded after that.

**Test the API choice early.** Discovering a CORS block in the final week is the most common way
this requirement fails.


DISTILLED_AESTHETICS_PROMPT = """
<frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight. Focus on:

Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.

Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.

Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.

Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.

Avoid generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!
</frontend_aesthetics>
"""