# H1 · `places-family.js` — Aarav and Swati at home (animotion v3)

Owner: scene helper H1. Only `places-family.js` was edited (≈740 lines). `PLACES.bedroom` and `PLACES.shop`, both pure
functions of `(t, road)`, with `events(road)` for sound. Story beats, captions and variants are exactly the bible's.

## What changed from v2 (the dark illustrated room) to v3 (Vox collage)
Every shot has a **flat `C.cardboard` ground**; the set is **scissor-cut stickers (`C.sticker`, white rims, halftone, grain)**
on three parallax planes (`lay(cam, k, fn)`: far 0.72 / subject 1.0 / near 1.3, with off-screen stickers culled);
a place **banner** pops in on beat 1; **ink stamps**, **sunbursts**, **confetti** keep holds alive; stickers animate
**on twos** (`C.T12`) while characters and the camera stay smooth; camera = `C.bump(C.drift(C.track()))`, `C.shake` on stamps,
`C.pushFx` push-throughs into and out of inserts. Characters are drawn only with `CAST.draw` (as stickers in the wide
shots, ~2200–2300 px tall in the close-ups).

## PLACES.bedroom — dur 8.75 s (14 beats), year 2027
| shot | beats / time | what | cardboard |
|---|---|---|---|
| 1 wide → push-in | 0–4 · 0–2.5 s | Hadapsar room as cut-outs (window with the **`pune-night` torn print**, calendar, "IIT 2030" note, torque sketch, switchboard, bag, gecko, fan, clock 11:40, god shelf, steel trunk, machine, Swati sewing, Aarav). Banner **"HADAPSAR · 11:40 PM"** pops on beat 1 (0.625). Camera drifts, then punches in on the phone / tablet with a push-through blur. | indigo `#27315e` |
| 2 device, full frame | 4–7 · 2.5–4.375 | **ban:** "NO AI IN CLASS" school sign, phone pops in, types "Explain torque like I'm 14", answer lands on beat 6 with ping marks and a **lever diagram card that draws itself on** (F, d, rotation) with a marker underline. **build:** tablet "TORQUE · 3 MISTAKES", three rows spring in (0.16 s stagger) with ✗ marks, then **Meera ma'am's message slides in** on beat 6. | teal-cyan |
| 3 Aarav, big face | 7–10 · 4.375–6.25 | face ≈ 50 % of frame height, `CAST.withTake('realize')` — focused (anticipation, eyes shut) → **pop on beat 8 (5.0)** → settle (small smile). **ink stamp slams on the same beat** with `whooshIn` 0.45 s before and a 0.3 s camera shake. ban: lever card + "GOT IT"; build: Meera's message + "STUCK: TORQUE". | cyan / teal + white sunburst |
| 4 Swati, big face | 10–14 · 6.25–8.75 | ban: cyan glow disc washes in from the left (she sees it), `withTake('worry')` pop on beat 11, reaches (IK-solved arm) for the lamp's pull chain and **pulls on beat 12 (7.5)**: lamp, sunburst and the whole cardboard dim. build: `withTake('laugh')` smile over the machine (a big machine cut-out at left, needle and wheel running). | tungsten amber → dusk (ban) · marigold (build) |

Captions: cap 1 0.3 s → beat 5 (2.8 s on screen), cap 2 beat 6 → 8.5 s (4.75 s). Variants: `road.c1` ban / build (c2 does not change the bedroom).

## PLACES.shop — dur 6.25 s (10 beats), year 2028, fee = `Agamoto.at(road, 2028).fees`
Shop interior as cut-outs: half-up corrugated shutter, rack of bolts, rate card (₹250 / ₹30 / ₹50), clock, **tally of forty
blouses**, patterns, blouse rail, dress form with a half-pinned blouse, Ganpati sticker, plastic chair, black treadle
machine with a pink cloth, tin, shears, phone. Banner **"SWATI TAILORS · 2028"** pops on beat 1.
- **viral hit** (default road build-retrain): shot 1 (beats 0–3) wide, phone pings on beats 1 and 2 with ping bubbles piling up, Swati's
  **`CAST.doubleTake`** lands its pop on beat 2 with a `C.sweatDrop`. Shot 2 (beats 3–7) the **group chat "Vidya Parents · 11-B"
  full frame** (generic green bubbles), messages arrive on beats 4, 5, 6 ("Free AI tutor app, same syllabus 😳" / "Why pay ₹64,500?" / link card
  "TutorBot · free · 10 lakh downloads") with a **FREE starburst**, the **`sewing-wheel` torn print** pushing in, and the downloads as
  **a pile of 15 download icons springing in with a counter tag that grows in size as it counts to 10,00,000**. Shot 3 (beats 7–10) big face:
  **build** — `withTake('resolve')`, progress sheet whose green ticks draw on, then "Staying." typed into the chat and sent on beat 9;
  **ban** — `withTake('worry')`, the fee receipt, **a stack of banknotes growing while the ₹ tag counts up**, "PAID" ink stamp on beat 8 with whooshIn + clank + shake.
- **no viral** (cut roads, ban-retrain): shot 1 closing time (shutter creeping down, clock 7:42, warm dusk multiply, tube light flicker, notes counted from the tin); shot 2 (beats 3–6)
  the **`sewing-wheel` torn print**, **40 blouse stickers spring in with a "N BLOUSES" banner growing with the count**, an **"ONE TERM" stamp** (beat 5) and a **banknote stack + fee tag that counts up**; shot 3 (beats 6–10) Swati big with the chat on a phone card:
  cut "Vidya cut fees again 👍" / "Meera ma'am left?" (take `sag`), build-retrain "Fees up again 😕" / "Aarav's mentor called me today!" and ban-retrain "Fees up again 😕" / "A teacher stays till 8 for doubts" (take `realize`).
Captions are the bible's verbatim, cap 1 0.3 s → beat 5, cap 2 beat 6 → 6.05 s.

## Sound (`PLACES.<name>.events(road)`, local times, all on beats where they mark a cut/pop/stamp)
bedroom: `pop` banner, `sew` bursts, `tick`, `whooshIn` (push-through), `pop` device, `click`×6 typing (ban), `notify` answer/message, `swish`+`clack` on the hard cuts, `whooshIn`→`clank` stamp, `blip`/`pop` take, `switch` on the pull. shop: `notify`
per ping, `zip`, `cash`×n, `pop`, `clank`, `swish`, `ding`/`blip` on the closing take.

## QC (all eight clips rendered with sound: `qc/place-<name>@<road>.mp4`)
| clip | dead holds ≥ 0.6 s | sync-check |
|---|---|---|
| bedroom@ban-cut / ban-retrain / build-cut / build-retrain | 0 · 0 · 0 · 0 (100 % of frames moving) | 4/4 ok each (offsets −33…+10 ms, loudness jumps ≤ 5 dB; no OFF-BEAT, no STARTLE) |
| shop@ban-cut / ban-retrain / build-cut | 0 · 0 · 0 | 2/2 ok each (−20…−7 ms) |
| shop@build-retrain (viral) | 0 | 2/2 ok (−20 ms) |
Note: an earlier bedroom render had one OFF-BEAT (+160 ms) because the stamp riser started 0.17 s after the cut; fixed by adding `clack` on the cut.
Contact sheets (`fps=2`, 4 columns): `qc/sheet-bedroom@{ban-cut,ban-retrain,build-cut,build-retrain}.jpg`, `qc/sheet-shop@{ban-cut,ban-retrain,build-cut,build-retrain}.jpg`.
Take strips (0.66 s at 15 fps, anticipation → pop → settle visible; the shut-eyed anticipation, the 1-frame pop and the settle are all there):
`qc/strip-bedroom-aarav@ban-cut.jpg`, `qc/strip-bedroom-swati@ban-cut.jpg`, `qc/strip-shop-swati@build-retrain.jpg`, `qc/strip-shop-swati@ban-cut.jpg`, `qc/strip-shop-doubletake@build-retrain.jpg`.
Other checks: `node --check` ok; `C.IMG` returning `null` falls back to a drawn skyline / drawn wheel (tested); t = −0.7 and dur + 0.7 render
(bedroom also verified inside `home-build` with the tear and the hard cut back to the classroom); the ban × viral shop branch cannot occur with the current
`company.json` luck (only build-retrain hits viral), so it was checked by faking `road.luck`.

## Self-scores (1–10, against the two yardstick sheets, not "it renders")
| axis | bedroom | shop |
|---|---|---|
| story clarity (reads without the caption) | 9 | 9 |
| composition (cardboard + stickers + parallax, faces ≥ 40 % of frame height) | 8 | 8 |
| motion (takes with follow-through, push-throughs, on-twos stickers, drift/bump, nothing static) | 8 | 8 |
| rhythm (every cut / pop / stamp on the 96 bpm grid; sync-check clean) | 9 | 9 |
| look consistency with chai-photo / correction-v5 (banners, stamps, sunbursts, rimmed stickers, torn prints) | 8 | 8 |
| type (legible captions, banners, chat text ≥ 22 px at 1080p, none under faces) | 8 | 8 |
| honesty (fictional names, no real brands, numbers shown as objects, photos credited via C.IMG) | 9 | 9 |

## Known issues / for the lead
- `dur` is now 8.75 / 6.25; chapters.js already follows `placeOf().dur`. My scenes never call `pushFx` while chapters' own push-through wraps them (shop exit), so the shared FX layer is never nested.
- Rendering is heavy (sticker pipeline, ~0.15 s/frame; 25–45 s per clip) but only offline.
- The wide establishing shots are deliberately busy (a room of cut-outs); the characters are small there and the close-ups carry the acting.
- Phone-card chat text in the shop's third shot sits at ≈ 29 px; the caption strip crosses the bottom of the card.
- "Dimming" the lamp in the bedroom is expressed as flat colour (lamp bulb, rays, cardboard) rather than a literal brightness change — consistent with the collage language.
- Nothing needed from `cast.js` or `kit2.js`; no other file was edited. Scratch harnesses used for iteration lived in the session scratchpad, not in the repo.
