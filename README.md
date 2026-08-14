# NextGen E-Sports

A mobile-responsive, eight-page esports club website. Static front-end only —
HTML5, CSS3, JavaScript, jQuery and Bootstrap 5, with no backend and no build step.

## Running it

**Do not open `index.html` by double-clicking it.** Browsers block `XMLHttpRequest`
against `file://` URLs for security, so the pages that load their content from
`data/*.json` (rankings, players, tournaments, events) will show a load error.

Serve the folder over http instead. From this directory:

```bash
python serve.py 8000
```

Then open <http://localhost:8000>. `serve.py` is a tiny stdlib-only wrapper around
`python -m http.server` that adds HTTP Range support — **use it instead of
`python -m http.server` directly.** Range support is what lets `about.html`'s video
play in Safari: Python's built-in server always returns the whole file with `200 OK`
and ignores the `Range` header, and Safari's `<video>` engine requires a real `206
Partial Content` response to play media at all (Chrome tolerates the missing support
and plays it anyway, which is why it can look fine in one browser and not the other).

VS Code's *Live Server* extension and Apache/XAMPP both already handle Range requests
correctly and work too — `serve.py` exists for anyone without either installed.

## What needs an internet connection

Everything except these works fully offline (jQuery, Bootstrap, icons and both fonts
are vendored locally):

| Feature | Page | Notes |
|---|---|---|
| Venue weather forecast | `events.html` | Open-Meteo REST API, keyless |
| Discord member count | footer, all pages | Discord invite API, keyless |
| X follow button | footer, all pages | Official X widget |
| Facebook page plugin | footer, all pages | Official Meta iframe plugin |
| Instagram embed | `about.html` | Official Instagram embed |
| Twitch stream | `index.html` | Needs a real host; falls back on `file://` |

Each one degrades to a readable fallback rather than a broken frame.

## Structure

```
├── serve.py              dev-only local server with Range support (see "Running it")
├── *.html               8 pages; navbar and footer markup identical across all
├── css/style.css        every design token — no hardcoded colours in pages
├── js/
│   ├── storage.js       helpers for cookies + local + session storage
│   ├── render.js        shared card/row renderers and the single AJAX wrapper
│   ├── filter.js        the shared filter bar (rankings, players, tournaments)
│   ├── main.js          site-wide: nav, theme, cookie banner, footer widget
│   └── <page>.js        one per page, page-specific only
├── data/*.json          content loaded at runtime with $.getJSON
├── vendor/              jQuery, Bootstrap 5, Bootstrap Icons (local copies)
├── fonts/               Unbounded + Sora (self-hosted for offline use)
└── GameLogos/ TeamLogo/ TournamentThumbnail/ carousel*.png Video1.mp4
```

## Data

`data/*.json` files carry a `_source` field stating exactly which parts are real and
which are illustrative. Organisation, player and tournament **names** are real and
were checked against liquipedia.net; **statistics** (points, ratings, prize pools)
are illustrative coursework data and are labelled as such on the pages that show them.

No request is made to liquipedia.net at runtime — see `CLAUDE.md` section 6 for why.

## Storage

| Type | Key | Set on | Purpose |
|---|---|---|---|
| Cookie | `returningVisitor` | index | 30-day expiry; suppresses the intro, shows a welcome-back |
| Local | `theme` | site-wide | Dark/light choice, read before first paint |
| Local | `favouriteTeam` | rankings | Pins a club to the top of the standings |
| Local | `playerFilter` | players | Restores the last-used filter |
| Local | `registrations` | register | Submitted applications |
| Session | `registerDraft` | register | Half-finished form, dies with the tab |
| Session | `tournamentFilter` | tournaments | Active filter and sort |
| Session | `eventView` | events | List or calendar view |

`dashboard.html` reads all three and writes none of them.

## Note

NextGen E-Sports is a fictional club built for coursework. Imagery is illustrative and
the competitive statistics shown are not verified results.

---

<!-- Design brief kept from the original README. The same block also appears at the
     end of CLAUDE.md, which is the file Claude Code reads. -->

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
