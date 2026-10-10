# H3 · places-meera.js — report (v3, animotion pass)

Owner file: `places-meera.js` only (1,337 lines, `node --check` ok). Nothing else in the repo was edited; QC artefacts are in `qc/`.
Registers `PLACES.staffroom` (dur 6.25, year 2027) and `PLACES.meera32` (dur 6.25, year 2032), each with `.events(road)` for sound.

## What was built

Every place is a **paper diorama on a flat cardboard ground** (`C.cardboard`, a different bold colour per shot) built from torn
cut-outs with white rims (`panel` / `shape` helpers on top of `C.paperPiece`, `C.tornRect2`, dot patterns, grain). Three depths with
parallax under one camera: BACK layer 0.55 (wall sheet, window, clock, boards, almirahs, lamp), ACTION layer 1.0 (floor, door,
tables, chairs, people, props), NEAR layer 1.5 (paper scraps). Camera = `C.bump(C.drift(C.track(...)))`, `C.shake` on stamp slams.
Beat grid 96 bpm: **every cut, stamp slam, pop and take accent lands on a multiple of `C.BEAT` (0.625 s)**; shots are 1.25–1.875 s
(cuts at beats 2, 5, 7 = 1.25 / 3.125 / 4.375 s). Collage pieces (confetti, sunburst, garland sway, hanging signs, popping chips)
run on twos (`C.T12`); the camera stays smooth. Characters only via `CAST.draw` (Meera, Sunanda, `extra:<n>`); two local helpers
sit on top of it: `bigFace` (close-up scale with squash/lean drift compensated) and `armTo` (two-joint IK so hands land on the
strip, the list, the pencil).

### PLACES.staffroom — 2027, banner "STAFF ROOM · 2027" (pops on beat 0)
Cool green-grey room (pale green wall sheet, olive dado, steel almirahs, long table, cutting-chai glasses with steam, ceiling fans,
window with Pune view, timetable board, faculty name board, Marathi notice board, wall clock). Four shots in every variant.

| variant (road) | S1 wide 0–1.25 | S2 big face on cardboard 1.25–3.125 | S3 3.125–4.375 | S4 4.375–6.25 |
|---|---|---|---|---|
| **box** (`build-cut`, `ban-cut`) | colleagues, letter, **twelve batch photos pop onto a garland** | maroon ground + sunburst, Meera big (head 42 % of frame) reads the taped-up letter; **sag take**, pop on beat 4 with a NOTICE stamp | she takes her **name strip** off the faculty board (IK reach), `12 YEARS` stamp on beat 6, **the twelve photos fly off the garland into the box** | colleague's hand on her shoulder, she carries the box out, door glare; pan + push to **her chai, still steaming**, empty chair, dashed gap on the board |
| **mentor workshop** (`build-retrain`) | Sunanda at the board "MENTOR = 8 STUDENTS · KNOW EACH ONE", AI printouts on the table, Meera nervous, a colleague raises a hand | mustard ground; her list: **eight names pop on one by one**, **realize take** on beat 4: Aarav Kale lights up (flare, ring, highlighter) | she carries the list to the notice board, pin pops on beat 6, `MENTOR` stamp, colleagues turn and smile | teal→saffron ground, big face again, **joy take** on beat 9 with a confetti burst, "KNOW EACH ONE" banner, list pinned on cork |
| **doubt desk** (`ban-retrain`) | hanging "DOUBT DESK 4–8 PM" sign, NO SCREENS door notice, a queue that shuffles forward on the beat | mustard ground, two big faces: Meera's hand draws a **benzene ring** (IK to the pencil), the student's **realize take** (beat 4) | clock + window **time-lapse 4:00 → 8:10** (ground fades mustard→indigo, real night photo of Pune cross-fades into the window, ticks), `8:10 PM` stamp on beat 6 | evening, last student leaves through the glare; Meera tired, then smiles on beat 9 |

### PLACES.meera32 — 2032
| variant (road) | look | S1 | S2 | S3 | S4 |
|---|---|---|---|---|---|
| **flat** (`build-cut`, `ban-cut`), banner "KOTHRUD · 2032" | warm tungsten Kothrud flat: peach wall, pendant lamp glow with brown corner shadow, pooja shelf (Ganpati, diyas, marigolds), Marathi calendar, periodic-table poster, marigold curtains, kitchen door with steel dabbas + steaming cooker, shoe rack, dhurrie, teak table with steel plates/tumblers | six students + chairs pop in round the table (one `popLow` each), Meera teaches | indigo ground, amber sunburst, Meera big, **resolve take** on beat 4 (proud, determined) with her hand-painted board "MEERA MA'AM · CHEMISTRY TUITIONS" as a big cut-out | **build-cut**: green VIDYA totes + two rings, `6 STUDENTS` stamp; **ban-cut**: three more students pop in behind (`BATCH OF 9` stamp); a student's realize take on beat 6 | pull-out to the whole flat |
| **mentor room** (`build-retrain`), banner "VIDYA MENTOR ROOM · 2032" | bright cream + teal feature wall, struggle-map screen (60 dots pop on), golden window, rug, five young mentors with tablets, head mentor Meera | dots + mentors pop in, she rings the red cluster | coral ground, big face, **resolve take**, ring on the red cluster on the beat | a parent thanks her (namaste, Marathi "धन्यवाद, मॅडम!"), Meera's **realize take** on beat 6 | her phone rings: **three parent calls pop in** before "Office · 0 calls", `HEAD MENTOR` stamp on beat 9 |
| **evening at Vidya** (`ban-retrain`), banner "VIDYA · 2032" | the 2027 staff room in golden hour: warm wall, half the tube lights off, faculty board with three dashed gaps | **three empty chairs pop in** with name cards (A. IYER, R. PATIL, S. NENE) and a farewell card | plum ground, three mentee name tags pop up (Riya, Omkar, Sana), **laugh take** on beat 4 | the three empty chairs + farewell card, `3 LEFT` stamp on beat 6 | **sag take** on beat 8 (the hours are long), smile on beat 9 |

Captions are verbatim from the bible (one at a time, `C.caption`, fade like `scenes.js cap()`; cap 1 0.3–3.0 s, cap 2 3.2–6.05 s);
build-cut / ban-cut get their own caption 2.

## Numbers are objects
Twelve years = 12 batch photos (garland → box). Eight students = 8 names popping onto the list (+ 8 dots on the board).
Six students = six chairs filling the table (ban-cut: +3). Three colleagues = three empty chairs with name cards and three gaps on
the faculty board. Calls = three pings piling up against "Office · 0 calls". Stamps are ink / teal / maroon only (nothing here is false).

## Takes (frame strips, 0.9 s at 12 fps: anticipation, pop, settle)
`qc/strip-staffroom-cut-sag.jpg` (pop 2.5) · `strip-staffroom-build-realize.jpg` (2.5) · `strip-staffroom-build-joy.jpg` (5.625) ·
`strip-staffroom-doubt-student-realize.jpg` (2.5) · `strip-meera32-flat-resolve.jpg` (2.5) · `strip-meera32-flat-student-realize.jpg`
(3.75) · `strip-meera32-mentor-resolve.jpg` (2.5) · `strip-meera32-mentor-parent-realize.jpg` (3.75) ·
`strip-meera32-evening-laugh.jpg` (2.5) · `strip-meera32-evening-sag.jpg` (5.0). Each is `CAST.withTake` (squash/stretch, hop, hair and pallu follow-through).

## Sound
`PLACES.<name>.events(road)` returns local times: `swish` 0.1 s before and `clack` on every hard cut, `popLow i` per popped object,
`pop`/`boing` on take accents, `rip` (strip), `whooshIn` 0.45 s before each `clank` stamp, `ding` on rings/highlight, `tick` ×6
on the time-lapse, `step`, `creak`, `notify` ×3 for the calls, `click` for writing. No thud on a downbeat, no music added.

## QC numbers (final code; `node render.mjs place-<name> --road <road>`, audio in; all in `qc/`)
| clip | dead holds ≥ 0.6 s | sync-check |
|---|---|---|
| staffroom@build-cut | 0 | 3/3 ok (cuts −40 / −3 / −10 ms) |
| staffroom@ban-cut | 0 | 3/3 ok (0 / −3 / −30 ms) |
| staffroom@build-retrain | 0 | 3/3 ok (−7 / −3 / −20 ms) |
| staffroom@ban-retrain | 0 | 3/3 ok (−7 / −50 / −20 ms) |
| meera32@build-cut | 0 | 2/2 ok (−40 / −3 ms) |
| meera32@ban-cut | 0 | 2/2 ok (0 / −3 ms) |
| meera32@build-retrain | 0 | 3/3 ok (−7 / −3 / −20 ms) |
| meera32@ban-retrain | 0 | 3/3 ok (−40 / −3 / −20 ms) |

No OFF-BEAT and no STARTLE in any variant. (The first drafts failed: soft `swish` alone gave OFF-BEAT at the 3.125 s cut and a pop
cluster gave a +6.4 dB startle; fixed by the sharp `clack` on each cut and soft `click`s for the name pops.) The tool only sees
cuts; stamps, pops and takes were placed on `B(n)` by construction. Joins: `qc/joins-staffroom.jpg`, `qc/joins-meera32.jpg` show every
variant at t = −0.7 and dur + 0.7; `joins.mjs` (scratch) found no exception and no leaked alpha/filter/composite state.
Render cost ≈ 70 ms/frame headless (188 frames in 8–16 s).

## Contact sheets
- Official frames (t = 0.5 2 3.5 5 5.75): `qc/sheet-staffroom-{build-retrain,build-cut,ban-retrain,ban-cut}.jpg`, `qc/sheet-meera32-{…}.jpg`.
- Full-clip sheets from the mp4 (2.4 fps, 4×4): `qc/sheet-staffroom@<road>-mp4.jpg`, `qc/sheet-meera32@<road>-mp4.jpg`.
- Chain check through the real chapters: `c2-build-retrain` t 7.2–9.5, `mid-ban-retrain`, `c2-ban-cut` frames render without errors.

## Self-scores (1–10, against `refs/yardstick/*`: bold ground per beat, cut-outs with rims, stamps/banners, objects for numbers, big faces + takes)
| place / variant | story clarity | composition | motion | rhythm | look consistency | type | honesty |
|---|---|---|---|---|---|---|---|
| staffroom · box | 9 | 8 | 8 | 9 | 8 | 8 | 9 |
| staffroom · mentor workshop | 9 | 8 | 8 | 9 | 8 | 8 | 9 |
| staffroom · doubt desk | 8 | 8 | 8 | 9 | 8 | 8 | 9 |
| meera32 · flat (build-cut) | 9 | 8 | 8 | 9 | 9 | 8 | 9 |
| meera32 · flat (ban-cut) | 8 | 8 | 8 | 9 | 9 | 8 | 8 |
| meera32 · mentor room | 8 | 8 | 8 | 9 | 8 | 8 | 9 |
| meera32 · evening at Vidya | 8 | 8 | 8 | 9 | 8 | 8 | 9 |
Honesty = nothing false stamped red, captions verbatim, fictional invented names/brands only. The ban-cut "BATCH OF 9" is a
visual flourish for "bigger than her old Vidya class", not a figure from `Agamoto.at`.

## Known issues / notes for the lead
1. Shot 1 of each place is only 1.25 s (two beats), so the wide establishing shot is brief and busy; the banner and popping objects carry it.
2. Characters are the shared vector cast (not torn cut-outs); the world around them is collage. A cast-level torn rim would unify the look further.
3. Doubt-desk last student leaves with a short alpha fade into the door glare (reads as stepping into the light, slightly ghostly).
4. The colleague's "hand on shoulder" is IK-aimed at Meera's far shoulder; it reads, but the forearm crosses Meera's arm for a frame or two.
5. The `☎` glyph in the call bubbles uses a fallback font; `Vidya` totes and the mentor-room signage are invented.
6. `sync-check` only reports cuts, so stamp/take alignment is verified by construction and by the strips, not by the tool.
7. Shared scratchpad: another helper overwrote my `sheet.py`; my build tooling moved to `scratchpad/meera/` (not part of the repo).
