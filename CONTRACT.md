# Agamoto · Vidya Classes — CONTRACT

Read this, `collage.js`, `engine.js`, `company.json`. Never edit a file you don't own. If the contract needs to change, report back to the lead.

## Files and ownership
| File | Owner | Notes |
|---|---|---|
| company.json, engine.js, collage.js, CONTRACT.md, story.html, README.md, calibrate.mjs | Lead | shared, read-only for helpers |
| scenes.js | Scenes helper | classroom set (`SET`) + clips prologue, wait-1, wait-2, c1-ban, c1-build, c2-ban-cut, c2-ban-retrain, c2-build-cut, c2-build-retrain |
| endings.js | 2036 helper | end-ban-cut, end-ban-retrain, end-build-cut, end-build-retrain, rewind |
| index.html (the player), render.mjs, stage.css | Stage helper | renderer + room player |

| cast.js, chapters.js | Lead | named characters (`CAST.draw`); stitches classroom clips + PLACES into home-/c2-/mid- clips |
| places-family.js, places-city.js, places-meera.js, places-sunanda.js | one scene helper each | `PLACES` scenes, see docs/story-bible.md |

Load order in story.html: fonts/fonts.css, engine.js, collage.js, cast.js, scenes.js, endings.js, places-*.js, chapters.js.

## Story v3 (2026-10-10): places, people, sound — layered onto the board view
- The years between the decisions play through 7 places and 4 named people (Aarav, Swati, Meera, Sunanda): beats,
  captions and the PLACES contract in **docs/story-bible.md**, the craft bar in **docs/animotion-upgrade.md**.
- story.html SHOTS (what the player plays): `prologue` = prologue → board pull · `c1-<c1>` = board push → c1 →
  bedroom (places-family.js) → board pull · `c2-<road>` = board push → `c2-<road>` chapter (chapters.js: 2027 classroom
  `class27-<road>` → staffroom → shop → street → results) → `mid-<road>` chapter (meera32 → office) · `end-<road>` =
  flash → 2036 film → batch → board pull. The places replace board.js's generic HOME scenes; BOARD and BATCH stay.
- Every boundary sits on the 96 bpm grid (C.BEAT = 0.625 s): pushes and pulls are 4 beats, places 10 beats (bedroom 14).
- A clip or place may define `year(t)`, `hud(t)` → 'full' | 'year' | 'none' (places show only a year chip) and
  `events(road)` → [[t, sfx, arg?]]; sound.js + groove.js build each shot's score and render.mjs muxes it (AAC).
- `node render.mjs place-<name> --road <road>` previews one place with sound → qc/place-<name>@<road>.mp4.
- The classroom shows one teacher figure per `SET.TDIV` = 20 teachers, and Aarav always sits at desk `ORDER[6]`.
