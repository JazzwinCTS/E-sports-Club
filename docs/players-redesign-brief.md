# Players Directory — Design Brief

## Purpose

The Players Directory supports a fictional Malaysian youth esports league for players aged 16–18. Eight independent organisations compete in VALORANT, Counter-Strike 2 and PUBG. The page first promotes three weekly MVPs with role-aware data, then helps visitors move from a game division to a team, roster and individual profile.

## User flow

1. Review the rotating VALORANT, CS2 and PUBG Weekly MVP cards, radar chart and supporting metrics.
2. Select one of the three game divisions from the sticky game switcher.
3. Choose one of eight alphabetically ordered team cards.
4. Read the team introduction, recent honours and selected division's specialist coach.
5. Select a roster card to open a game-themed player profile showing age and recognised competitive role.

## Wireframe summary

```text
[Navigation]
[Weekly MVP: metrics] [player] [radar chart]
[Why this player won + profile action]
[VALORANT] [CS2] [PUBG]      <- sticky game switcher
[AXEN] [BRIX] [KOVA] [MIRA] [RIFT] [TALO] [VYNE] [ZERA]

Team details modal
  [Team identity + introduction + honours]
  [Selected division's specialist coach]
  [Selected game's player roster]

Player profile modal
  [Game artwork background + player portrait]
  [Team logo + IGN + real name]
  [Age + recognised game role + home base]
```

## Visual direction

- Dark competitive interface with a strong editorial hierarchy.
- Each team has a short four-letter name, its own logo and a consistent jersey.
- Portraits represent a varied Malaysian community and are fictional.
- Coach portraits use professional suits with small team-colour accents.
- Portrait assets use transparent, optimised WebP files for faster loading.

## Data and code structure

- `players.html` contains the semantic page and modal structure.
- `css/players.css` contains page-specific responsive styling.
- `js/players.js` handles game switching, team selection and modal rendering.
- `data/players.json` stores eight teams, 24 coaches and 112 players.
- `PlayerPhotos/`, `TeamLogo/`, `GameLogos/` and `GameArt/` contain the visual assets.

The page loads local JSON with `$.getJSON`; it does not scrape or request data from external esports websites at runtime. All organisations, names, histories and portraits are fictional coursework content.
