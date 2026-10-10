# Agamoto · Vidya Classes — CONTRACT

Read this, `collage.js`, `engine.js`, `company.json`. Never edit a file you don't own. If the contract needs to change, report back to the lead.

## Files and ownership
| File | Owner | Notes |
|---|---|---|
| company.json, engine.js, collage.js, CONTRACT.md, index.html, README.md, calibrate.mjs | Lead | shared, read-only for helpers |
| scenes.js | Scenes helper | classroom set (`SET`) + clips prologue, wait-1, wait-2, c1-ban, c1-build, c2-ban-cut, c2-ban-retrain, c2-build-cut, c2-build-retrain |
| endings.js | 2036 helper | end-ban-cut, end-ban-retrain, end-build-cut, end-build-retrain, rewind |
| play.html, render.mjs, stage.css | Stage helper | renderer + room player |

Load order in index.html: fonts/fonts.css, engine.js, collage.js, scenes.js, endings.js.

## Roads and clip ids (14 clips, exact lengths)
Road id = `<c1>-<c2>`, c1 ∈ {ban, build}, c2 ∈ {cut, retrain}. Default road: **build-retrain**.

| id | dur (s) | years shown (HUD) | starts on | ends on |
|---|---|---|---|---|
| prologue | 15 | 2026 | — | REST-2026 |
| wait-1 | 4 (loop) | 2026 | REST-2026 | REST-2026 |
| c1-ban, c1-build | 15 | 2026→2027 | REST-2026 | REST-2027(c1) |
| wait-2 | 4 (loop) | 2027 | REST-2027(c1) | REST-2027(c1) |
| c2-ban-cut, c2-ban-retrain, c2-build-cut, c2-build-retrain | 15 | 2027→2030 | REST-2027(c1) | REST-2030(road) |
| end-ban-cut, end-ban-retrain, end-build-cut, end-build-retrain | 12 | 2030→2036 (jump during the flash) | = last frame of c2-same-road | END-2036(road) (helper's choice) |
| rewind | 3 | 2036→2026 | = last frame of end-<road> | REST-2026 |

`REST-<year>(...)` = the classroom set drawn by `SET.draw` for that year/road through camera `C.REST` ({x:960,y:540,z:1}), no captions, no stamps, pinned choice cards only as listed below.
`rewind` takes the road that just ended; it is rendered per road as `clips/rewind-<road>.mp4` (and `clips/rewind.mp4` = the default road).

## Drawing interface
Each module registers clips:
```js
CLIPS[id] = { dur: 15, draw(ctx, t, road) { ... } };   // global var CLIPS = window.CLIPS || {}
```
- `draw` is a **pure function of (t, road)**: no Date, no Math.random (use `C.rand(seed)`), no state carried between frames. t ∈ [0, dur].
- `road` = `Agamoto.road(roadId)` → `{ id, c1, c2, counters: {2026..2036: {students, teachers, results, fees}}, litFuture, lit, luck: [{id, year, sign, headline, hit}], ending, endingInfo, endings: {trusted, lean, empty, smaller → count of 10}, stamp }`. Use `Agamoto.at(road, yearFloat)` for interpolated counters. Counters for ≤2027 depend only on c1, so both roads sharing a first choice meet on the same frame.
- For prologue/wait-1 any road is passed (use only 2026). For c1-* and wait-2 the road is `<c1>-retrain`; use only years ≤ 2027.
- Draw in world space 1920×1080. Begin with `C.use(ctx)`. Use `C.track(t, keys)` + `C.withCam(cam, fn)` for camera. Two keys at the same t = a hard cut.
- **Never** call `ctx.setTransform`/`resetTransform`/`ctx.canvas.width` (the renderer pre-scales the context). Use save/restore. Leave `globalAlpha`, `filter`, composite op as you found them.
- **Do not** draw grain, vignette, the HUD counters or the trust line — index.html draws those on top of every frame.
- Ambient motion must be seamless at joins: use `C.amb(t, dur, phase)` (same value at t=0 and t=dur). Nothing is ever frozen: something always moves.
- Captions: `C.caption(text, emph, p, y)`, narration in Instrument Serif italic; labels via `C.label` (Barlow Condensed, UPPERCASE).

### Join rule
The frame at `t = dur` of a clip equals the frame at `t = 0` of the next one (pixel-identical apart from grain). Each module exports
```js
SCENES.startState(id, road) / SCENES.endState(id, road)     // scenes.js
ENDINGS.startState(id, road) / ENDINGS.endState(id, road)   // endings.js
// → { cam: {x,y,z}, year: <number>, shot: 'REST' | 'END' | ..., cards: ['ban'|'build', 'cut'|'retrain'] }
```
The lead checks these and diffs real frames. Simplest way to honour it: start and end every scene clip on the REST shot of the set; `end-*` at t<0.05 may literally call `CLIPS['c2-'+road.id].draw(ctx, 15, road)` before its white flash; `rewind` at t=0 may call `CLIPS['end-'+road.id].draw(ctx, 12, road)`.

### Choice cards (the card flying into the scene)
The stage player flies an HTML card into the frame during the first 0.6 s of c1-* and c2-*. The video draws the chosen card **pinned on the notice board from t ≥ 0.6 s** (landing squash 0.6–0.8 s, and the room reacts), in screen space at REST:
- slot 1 (first choice): centre (1610, 235), 360×120, rotation −3°, `C.PALETTE.saffron` paper, option label UPPERCASE.
- slot 2 (second choice): centre (1610, 375), 360×120, rotation +2°, `C.PALETTE.teal` paper.
wait-2 and c2-* show slot 1 pinned from t=0; end-* drops the cards after the flash.

## The set (scenes.js exports `SET`)
```js
SET.config(road, yearFloat) → { year, students, teachers, seated: round(students/50), teacherFigs: round(teachers/4),
                                ai: bool, mentors: bool, light: 0..1, cards: [...] }
SET.draw(ctx, cfg, t, dur)   // whole classroom in world space, no camera; ambient motion via C.amb(t, dur)
SET.layout                   // { window:{x,y,w,h}, board:{x,y,w,h}, screen:{x,y,w,h}, notice:{x,y,w,h}, sunanda:{x,y}, desks:[{x,y}] }
```
Regions at REST (so other modules can aim callouts): window with Pune skyline x 60–600, y 110–520; blackboard x 660–1300, y 140–470; notice board x 1400–1840, y 140–470; desks/floor y 540–1040. One seated student per 50 students, one teacher figure per 4 teachers; mentors sit with small groups (`lean-in-to-group`), lecturers stand at a board (`point-at-board`); the AI "struggle map" on a screen when `ai`; skyline light changes with the year.

## HUD (index.html draws it)
Bottom-left counters `STUDENTS · TEACHERS · FEES · RESULTS` from `Agamoto.at(road, year(t))`, coloured by direction vs 2026 (`C.dirColor`); bottom trust line "10 futures · same luck · a fictional company · a rehearsal, not a prediction"; top-left the Eye · EYE OF AGAMOTO · VIDYA CLASSES. Keep the bottom 110 px and top-left 300×90 px free of important content.

## index.html API (for render.mjs and play.html)
- `index.html?clip=<id>&road=<roadId>&s=<scale>` plays one clip on a fixed clock, no audio. `s=0.6667` renders at 1280×720.
- `window.AGAMOTO = { ready: Promise, dur(id), frame(id, t, roadId), canvas }` — `await AGAMOTO.ready; AGAMOTO.frame('prologue', 1.5, 'build-retrain')` draws that frame synchronously.
- `index.html` alone plays the whole story live (keys 1/2 to choose, Enter to lock).

## QC
Each helper: `node --check` its files; render 3 test frames per clip to `qc/<id>-t.jpg` (`node qc.mjs <id> <t1> <t2> <t3>` — lead provides qc.mjs) and look at them.
