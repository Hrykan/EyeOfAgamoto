# H2 · `places-city.js` — Pune outside (v3, animotion pass)

Owns `PLACES.street` (2029) and `PLACES.results` (2030). Both are 6.25 s (10 beats at 96 bpm), pure functions of `(t, road)`,
and carry `.events(road)` for the sound layer. Built on `kit2.js` (cardboard ground, stickers with scissor rims, banner,
ink stamps, sunburst, confetti, T12, bump/drift/shake, tornPrint-style Ken Burns) and `cast.js` (CAST.withTake,
CAST.doubleTake, `pivot: 'chest'` for the big faces).

## What changed from v2
v2 was one illustrated street / one illustrated lane per place with a roving camera. v3 is four shots per place, each on its
own flat **cardboard colour** with a slowly turning sunburst, set pieces as **torn cut-outs with white rims** at 2–3
**parallax depths** (`lay(cam, k, fn)`: far layers 0.5–0.6, mid 0.8–0.9, near 1.0–1.22), one **banner**, **stamps**, and a
**big-face close-up with a four-beat take** in every variant. Every cut, stamp slam, take pop and count-up lands on a multiple
of `C.BEAT` (cuts at beats 3, 5, 7; stamps at beats 2/4/8; take pops at beats 6, 8, 9).

## PLACES.street (year 2029)
Banner **FC ROAD · 2029**. Grounds: sky-blue (#8fc6e8) → mustard → teal → sky-blue (hoarding variants); sky-blue → mustard → saffron → teal (collapse).
Photos: `C.IMG('fc-road')` is the establishing torn print with a Ken Burns push (cropped below the shop sign on purpose, so no real
brand reads; scooters, steps and paving stones stay); `C.IMG('auto-rickshaw')` crosses as a rimmed cut-out on twos (null → the code
autos still run). Both fall back cleanly when the photo is null.

| variant (engine road) | shots (beats) |
|---|---|
| **collapse hit** (`build-retrain`) | 0–3 FC Road wide: MegaRank (invented) board hanging crooked, shutters down, parents with phones, a placard "GIVE OUR FEES BACK!", foreground auto cut-out · 3–5 push-in on the CLOSED notice + padlock, **SHUT** stamp on beat 4 (camera shake), two parents' big faces take *sag* / *surprise* · 5–7 Vidya's gate: **14 parent heads spring in** (staggered ≤ 0.5 s), tag **+560 STUDENTS** counts up and grows (14 heads × 40 students per point, read from `company.json`), Sunanda at the door in namaste · 7–10 Sunanda big-face close-up, take *realize* on beat 8 (focused → surprised → smile) |
| **no collapse** (`build-cut`, `ban-retrain`, `ban-cut`) | 0–3 FC Road wide: Aarav (17) + two friends walk in, BrightPath banner unrolls on twos, workers on a ladder · 3–5 push-in, **₹500 notes spring in**, tag counts to **₹9,999**, stamp lands on beat 4 · 5–7 Aarav big face, **double-take** whose pop lands on beat 6 (sweat drop on ban) · 7–10 the road between the two doors (BrightPath across, Vidya's modest board near): **ban** friends cross the zebra to BrightPath while Aarav (take *worry* → *sag*, sweat drop) stays; **build-retrain** Aarav takes *joy*, Meera waves from the Vidya window (mentor), all three go in; **build-cut** take *resolve*, the door shows "NEW FEE ₹60,000" (`Agamoto.at(road, 2029).fees`) |

Captions (verbatim): collapse "2029. A big coaching chain shuts *overnight*." / "Parents look for a name they *trust*."; no-collapse
"2029. Across the road, an AI academy *opens*." / build-retrain "Aarav already has AI, and a *mentor*." · build-cut "Vidya is cheaper now. Aarav
*stays*." · ban "Two of Aarav's friends cross the *road*."

## PLACES.results (year 2030)
Banner **RESULTS DAY · 2030**. Variant is read from `road.luck` (topper hit) then `Agamoto.at(road, 2030).results` (≥ 50 / < 50).

| variant | shots (beats) |
|---|---|
| **topper** (`build-retrain`, `build-cut`) | 0–3 "Pune Herald" front page slaps onto teal cardboard (saffron rays), **TOPPER** stamp on beat 2, Aarav's photo (CAST portrait, halftone) · 3–5 push-in, marker highlight on "TOPS STATE", saffron ring round the photo on beat 4 · 5–7 Aarav big face, take *joy* on beat 6, sunburst + confetti, gold medal "1" pops in · 7–10 the lane outside Swati Tailors (festive: toran, bunting, marigold cardboard): Swati crying with joy hands out pedhas, **40 pedhas spring into the tray**, tag counts to 40, Aarav runs in and the hug lands on beat 9 (Swati turns on the beat-8 hop) |
| **ok, no topper** (`ban-retrain`) | 0–3 phone insert: notification, "Fetching…", Aarav's worried face in a bubble · 3–5 push-in: rank counts up (type grows with the count) to **4,812**, **RANK 4,812** stamp on beat 4, "✓ SEAT · ENGINEERING COLLEGE, PUNE" · 5–7 big face, take *realize* on beat 6 · 7–10 midday shop step: Aarav with the phone, Swati reads over his shoulder, take *realize*, a breath puff (relief) |
| **low, no topper** (`ban-cut`) | 0–3 same phone, slate cardboard · 3–5 rank counts to **41,370**, the pin lands past the 25,000 cut-off, **NO SEAT** stamp · 5–7 big face, take *sag* on beat 6 · 7–10 dusk shop step (violet cardboard, lit shop, shutter half down): Swati walks out with chai, sits, hand on his shoulder, **DROP YEAR** stamp on beat 8, Aarav lifts his head (*resolve*) |

Captions: topper "2030. Aarav tops the state *exam*." / "Swati hands out pedhas to the whole *lane*."; ok "2030. Aarav gets a seat, *just*." / "An engineering college in Pune. Swati *exhales*."; low "2030. Aarav misses the *cut-off*." / "He'll take a drop year and try *again*."
No red anywhere as a mark: stamps are maroon / teal / ink.

## Sound (`PLACES.street.events`, `PLACES.results.events`)
A `swish` 0.075 s before and a `clack` on every hard cut (a bare swish is too soft for the sync check to call an onset), `whooshIn` 0.45 s before each stamp and
`clank` on it, `step` for walking, `pop`/`popLow` i as things spring in, `cash` on the notes, `zip` i for the crowd, `notify`, `blip` i on the rank
count, `ding` on relief, `pop` on a take's accent (a `boing` startled the sync check, +6.2 dB), `drip` on the sweat drop, `creak` on Vidya's door.

## QC (all eight variants rendered with sound via `node render.mjs place-<name> --road <road>`)
| variant | dead holds ≥ 0.6 s | sync-check (visual events within ±100 ms of a strong onset, no STARTLE) |
|---|---|---|
| street · build-retrain (collapse) | 0 | 4/4 |
| street · build-cut | 0 | 3/3 |
| street · ban-retrain | 0 | 3/3 |
| street · ban-cut | 0 | 3/3 |
| results · build-retrain (topper) | 0 | 4/4 |
| results · build-cut (topper) | 0 | 4/4 |
| results · ban-retrain (ok) | 0 | 3/3 |
| results · ban-cut (low) | 0 | 4/4 |

`node --check places-city.js` clean. Take strips (anticipation with eyes shut and a dip → one-frame pop with wide eyes and lift → settle) checked by eye
for the Aarav double-take (ban), Sunanda *realize* and Aarav *joy*; the *realize* and *sag* strips for results are in `qc/` too.

Contact sheets: `qc/sheet-street@{build-retrain,build-cut,ban-retrain,ban-cut}.jpg`, `qc/sheet-results@{…}.jpg` (2 fps, 4×4).
Take strips: `qc/strip-street-doubletake-ban.jpg`, `qc/strip-street-sunanda-realize.jpg`, `qc/strip-results-aarav-joy.jpg`,
`qc/strip-results-aarav-realize.jpg`, `qc/strip-results-aarav-sag.jpg`. Joins: rendered raw at t = −0.7, −0.35, dur, dur + 0.7 for street and results
(topper and ban-cut): all draw cleanly (the results page is already in place at t = 0; at −0.7 it is still sliding in).

### Rubric (1–10, against `refs/yardstick/chai-photo.jpg` and `correction-v5.jpg`)
| | story clarity | composition | motion | rhythm | look consistency | type | honesty |
|---|---|---|---|---|---|---|---|
| street, collapse | 9 | 8 | 8 | 9 | 9 | 8 | 9 |
| street, no collapse (ban / build) | 9 | 8 | 8 | 9 | 9 | 8 | 9 |
| results, topper | 9 | 9 | 8 | 9 | 9 | 8 | 9 |
| results, ok / low | 9 | 8 | 8 | 9 | 9 | 8 | 9 |

Against the yardsticks: bold cardboard colour per beat, rimmed cut-outs, banners and stamps, numbers as objects (heads, ₹ notes, pedhas, rank tag,
the +560 tag) and the big-face-plus-take beat are all present. Where they are stronger than ours: the chai film's stamps carry a riser and the
objects are drawn as photo cut-outs; ours are code drawings except the FC Road print and the auto.

## Known issues / notes for the lead
- The big faces are CAST at 7× scale: flat vector shapes, so they read cartoonish next to the photo prints. That is cast.js, not the place.
- `FC Road` print: `fc-road-crossword-1000.jpg` is a bookshop at night; the crop (zoom 1.4–1.7, focus bottom) hides the shop's sign. If the print
  is ever re-cropped, keep the sign out of frame (real brand).
- `C.sticker` is the heaviest call (12 rim draws): a frame is ~60–120 ms in headless Chrome. Fine for rendering; not for live canvas play.
- `cap()` copies the H1 off-screen strip so the caption strip and text fade together; it calls `setTransform` only on that private canvas, never on the main ctx.
- The Devanagari "वडापाव" sign needs `Tiro Devanagari Hindi` loaded; the file starts a `document.fonts.load` for it, but `story.html`'s `ready` promise does
  not wait for that face. If a render ever shows a fallback glyph on the first frame, add the load to `ready`.
- `docs/story-bible.md` still says dur 6 and describes one-shot scenes; this file and `docs/animotion-upgrade.md` are the current spec.
