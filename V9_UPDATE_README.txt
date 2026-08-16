NEXTGEN PLAYERS + TOURNAMENTS V9 UPDATE
========================================

This is an update package for the existing Players/Tournaments project.
Copy every folder and file into the project root and choose Replace when asked.
Do not delete the existing PlayerPhotos, TeamLogo, GameLogos, vendor or font folders.

Main V9 changes
---------------
- Weekly MVP records are now stored in data/weekly-mvp.json.
- The newest published week is shown automatically and Previous Weeks can be selected.
- The Weekly MVP section has a new original award-stage background.
- MVP portraits are vertically centred and the portrait halo no longer overlaps the radar chart.
- Player Profile portraits are slightly larger and vertically centred without changing their horizontal position.
- The tournament hero content was shifted left and the prize card now shows RM60,000 without clipping.
- The prize-card watermark is now RM instead of a star.
- VALORANT, Counter-Strike 2 and PUBG each have an independent next-match countdown.
- Live simulation uses a pulsing red on-air dot followed by LIVE.

Weekly publishing workflow
--------------------------
1. Add a new week at the top of the weeks array in data/weekly-mvp.json.
2. Set published to true after the Sunday VALORANT matches finish.
3. Set publishedAt to the following Monday.
4. The page automatically selects the newest published record.
5. Keep earlier records in the file so they remain available in Previous Weeks.

Weekly match pattern
--------------------
- Friday: PUBG
- Saturday: Counter-Strike 2
- Sunday: VALORANT
- Monday: publish the new Weekly MVP selection

Broadcast demo links
--------------------
- Normal: tournaments.html
- Live simulation: tournaments.html?demo=live
- Final simulation: tournaments.html?demo=final

The Weekly MVP highlight video is intentionally not included yet.
