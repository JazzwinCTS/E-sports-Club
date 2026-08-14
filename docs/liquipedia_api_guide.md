# Esports MediaWiki API Reference & Cheat Sheet

This project fetches esports data (schedules, results, teams, rosters, logos, player profiles, standings) using the MediaWiki Action API (Liquipedia / Wikipedia).

## Core Rules & Base URL
- **Base Endpoint Pattern:** `https://liquipedia.net/{game}/api.php`
  - Supported `{game}` slugs: `leagueoflegends`, `counterstrike`, `valorant`, `dota2`, `rocketleague`, `apexlegends`, `rainbowsix`, `overwatch`
- **CORS Requirement:** ALWAYS include `origin=*` on every `fetch()` request from the browser.
- **Format:** ALWAYS append `format=json`.
- **User-Agent Header:** When calling from Node.js/Python scripts, pass a descriptive User-Agent: `User-Agent: MyEsportsApp/1.0 (contact@yourdomain.com)`

---

## Rate Limits & Etiquette (from https://liquipedia.net/api-terms-of-use)

- General requests: max 1 per 2 seconds.
- `action=parse` requests: max **1 per 30 seconds**. Every section below (tournament overview, brackets,
  standings, team profiles, player profiles) uses `action=parse` — treat 30s as the ceiling for ALL of them
  combined, not per-endpoint.
- Required User-Agent: a descriptive, contact-identifying string (e.g. `NextGenESports/1.0 (contact@example.com)`).
  Generic agents are likely blocked. **Browsers cannot set a custom User-Agent from JS** — this means a live
  `$.ajax`/`$.getJSON` call from a page script sends the browser's own UA string and risks exactly the block
  this rule warns about. Treat this API as **fetch-once-by-hand, not call-at-runtime** — see `CLAUDE.md` §6.
- Explicit caching directive: "Re-use / cache your API results for as long as possible — do not issue repeated
  requests which return the same data." This project satisfies that by never re-requesting at all after the
  initial manual snapshot into `data/*.json`.

---

## 1. Tournaments & Schedules

### A. List Tournaments by Category
Find upcoming, ongoing, or past tournaments in a specific game:
- **Endpoint:** `GET /api.php`
- **Params:**
  - `action=query`
  - `list=categorymembers`
  - `cmtitle=Category:Tournaments` (or `Category:Premier_Tournaments`, `Category:Upcoming_Tournaments`)
  - `cmlimit=50`
  - `cmtype=page`
  - `origin=*`
  - `format=json`

### B. Fetch Tournament Overview & Match Schedule
- **Endpoint:** `GET /api.php`
- **Params:**
  - `action=parse`
  - `page={Tournament_Slug}` (e.g. `LCK/2026/Spring` or `VCT/2026/Kickoff`)
  - `prop=text|sections|images`
  - `origin=*`
  - `format=json`
- **DOM Selectors to extract:**
  - Match ticker / Upcoming: `.match-filler`, `.bracket-popup`, `.bracket-game`
  - Dates & Prize pool: `.infobox-cell-2`, `.prizepooltable`

---

## 2. Match Results & Brackets
- **Endpoint:** `GET /api.php`
- **Params:**
  - `action=parse`
  - `page={Tournament_Slug}`
  - `prop=text`
  - `origin=*`
  - `format=json`
- **DOM Selectors to extract:**
  - Bracket structures: `.bracket-cell`, `.bracket-team-top`, `.bracket-team-bottom`, `.bracket-score`
  - Match details & scores: `.match-row`, `.bracket-popup-body`

---

## 3. Team Standings & Rankings Tables
- **Endpoint:** `GET /api.php`
- **Params:**
  - `action=parse`
  - `page={Tournament_Slug}/Group_Stage` (or main tournament page)
  - `prop=text`
  - `origin=*`
  - `format=json`
- **DOM Selectors to extract:**
  - Standings table: `table.grouptable`, `.standings-card`, `table.wikitable`
  - Extract rows: `tr` elements with team cells (`.grouptable-team`), wins/losses (`.grouptable-score`, `td:nth-child(...)`), and rank position.

---

## 4. Team Profile, Roster & Name
- **Endpoint:** `GET /api.php`
- **Params:**
  - `action=parse`
  - `page={Team_Name}` (e.g. `T1`, `Sentinels`, `Team_Liquid`, `Fnatic`)
  - `prop=text|images|properties`
  - `origin=*`
  - `format=json`
- **DOM Selectors to extract:**
  - Active Roster Table: `.roster-card`, `table.roster-card tr`, `.table-roster`
  - Roles & Join Dates: `td.role`, `td.date`
  - Team Information: `.fo-nttax-infobox`

---

## 5. Team Logos & Player Images (`imageinfo`)
MediaWiki requires resolving wiki file titles (e.g., `File:T1_logo.png`) into direct CDN URLs.

### A. Convert a File Name to a Direct Image URL
- **Endpoint:** `GET /api.php`
- **Params:**
  - `action=query`
  - `titles=File:{FileName}.png` (e.g. `File:T1_2019_allmode.png`, `File:Faker_2024.jpg`)
  - `prop=imageinfo`
  - `iiprop=url|size|mime`
  - `origin=*`
  - `format=json`
- **JSON Path to CDN URL:** `response.query.pages[pageId].imageinfo[0].url`

### B. List All Images on a Page
- **Endpoint:** `GET /api.php`
- **Params:**
  - `action=query`
  - `titles={Page_Name}`
  - `prop=images`
  - `origin=*`
  - `format=json`

---

## 6. Player Profiles, Bios & Statistics
- **Endpoint:** `GET /api.php`
- **Params:**
  - `action=parse`
  - `page={Player_Handle}` (e.g. `Faker`, `s1mple`, `TenZ`, `ZywOo`)
  - `prop=text|images`
  - `origin=*`
  - `format=json`
- **DOM Selectors to extract:**
  - Real Name & Birth Date: `.infobox-cell-2`
  - Country/Flag: `.flag img`, `.infobox-center`
  - Current Team & Role: `.infobox-team`, `.infobox-role`
  - Career History / Transfers: `table.wikitable.transfer-table tr`
  - Placement & Achievements: `table.wikitable.achievement-table tr`

---

## 7. Search & Auto-Complete (OpenSearch)
To search for players or teams when the exact page slug is unknown:
- **Endpoint:** `GET /api.php`
- **Params:**
  - `action=opensearch`
  - `search={query}`
  - `limit=10`
  - `namespace=0`
  - `origin=*`
  - `format=json`
- **Output:** Returns `[searchTerm, [titles], [descriptions], [urls]]`.

---

## Reusable JavaScript/TypeScript Query Helper
```javascript
export async function queryMediaWiki(game, params) {
  const url = new URL(`[https://liquipedia.net/$](https://liquipedia.net/$){game}/api.php`);
  const defaultParams = {
    format: 'json',
    origin: '*',
  };
  
  const merged = { ...defaultParams, ...params };
  Object.entries(merged).forEach(([key, val]) => url.searchParams.set(key, val));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`MediaWiki API error: ${res.statusText}`);
  return await res.json();
}