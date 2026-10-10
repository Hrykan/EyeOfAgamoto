# Sunanda helper (H4) — `places-sunanda.js` (PLACES.office) and `endings.js` (the four 2036 films + rewind)

Both files are rebuilt for the animotion v3 brief (`docs/animotion-upgrade.md`): cardboard grounds, cut-outs with white
rims at three parallax depths, beat-grid cuts, big-face takes, numbers as objects, sound events. Characters are always
`CAST.draw` (Sunanda, Meera, Aarav named; everyone else `extra:<n>`). Both files are pure functions of `(t, road)` and
pass `node --check`. `kit2.js` helpers used: `C.cardboard`, `C.sticker`, `C.paperPiece`, `C.tornPrint`, `C.banner`,
`C.inkStamp`, `C.sunburst`, `C.confetti`, `C.popIn`, `C.countScale`, `C.bump`, `C.drift`, `C.shake`, `C.T12`, `C.IMG`.

## 1. `PLACES.office` — dur 6.25 s (10 beats), year 2034, night

Four shots per variant, every cut on a beat. Captions are verbatim from the bible (caption 1 0.3–3.0 s, caption 2
3.1–6.05 s). A banner "SUNANDA'S OFFICE · 2034" pops on beat 1 and leaves with the first close-up cut.
The window shows `C.IMG('pune-night')` as a torn print; with the photo missing (null) it falls back to a drawn skyline
(tested). Stamps are ink/teal/maroon only (nothing in this story is false).

| ending (road) | shot 1 · 0–1.875 | shot 2 · 1.875–3.125 | shot 3 | shot 4 |
|---|---|---|---|---|
| **trusted** (build-retrain) | wide: mentor wall + full batch cards spring in; phone pings, Sunanda double-takes | one thin register vs a stack of fourteen waiting-list files; phone chat; stamp **WAITING LIST** lands beat 4 | 3.125–5.0 **big face**: reads the phone, a message pops in, the **joy** take lands on beat 7 (4.375 s) | 5.0–6.25 she pulls the lamp chain, lamp dies on beat 9, room goes dark (the join frame) |
| **lean** (build-cut) | wide: dashboard on the wall, faculty photo, she is alone | push-in on the dashboard: tiles count up (numbers from `Agamoto.at(road, 2034)`), fifty room chairs fill; stamp **LOWEST FEES** beat 4 | 3.125–4.375 faculty photo, faces fade one by one | 4.375–6.25 **big face**: **sag** take lands beat 8 |
| **smaller** (ban-retrain) | wide: she stands at the batch wall holding a card, cards spring in | push-in: six cards peel off and fall; stamp **LOYAL FAMILIES** | 3.125–4.375 corridor wide: she flips switch A, room 4 goes dark | 4.375–6.25 **big face** in the corridor light: **sag** take lands beat 8 as switch B clicks and the door glow dies |
| **empty** (ban-cut) | wide: lease notice and a box on the desk; the third-floor row of cards falls off the wall (count follows the 2034 student figure) | the lease notice, full frame; stamp **LEASE ENDS** beat 4 | 3.125–4.375 she lifts the 2009 first-batch photo off its nail | 4.375–6.25 **big face** holding the photo: **sag** take lands beat 8, then a tender smile |

`PLACES.office.events(road)` gives the local sound events (pop on the banner, notify on pings, whooshIn 0.45 s before each
clank, a click and a switch for the lamp, swish + pop on every cut, `pop` — not `boing` — on take accents).

## 2. `endings.js` — the four 2036 films, 12 s each

`CLIPS['end-<road>']` has `dur 12`, `events(road)`, `year(t)` (2034 → 2036 across the flash) and `hud(t)` (year chip, then
the dashboard at 0.12 s). The join: `t < 0.05` draws `CLIPS['mid-'+road.id].draw(ctx, CLIPS['mid-'+road.id].dur, road)`,
falling back to `c2-<road>` at its own `dur` (never a hard-coded time). `rewind` at t = 0 still draws the end clip at 12 s.
`ENDINGS.startState` is now the 2034 office frame (`shot: 'OFFICE'`, year 2034); `endState` is the closing shot's camera.

Six shots, cuts on the beat (no hard cut on a bar line where the score brings in kick + bass: those cuts read as a startle):

| t | shot | what is on screen |
|---|---|---|
| 0–1.875 | wide | white flash from the office; the 2036 classroom on a cardboard ground; **"2036"** and the label as banners (pop on beat 1); glimpse 1 types |
| 1.875–5.0 | key | push-in to the key thing, saffron ring + callout 1 (trusted/lean: the AI screen, trusted a struggle map springing in, lean sixty dots; smaller: the loyal block; empty: the lit door in the dawn corridor) |
| 5.0–6.875 | cameo | **big-face cameo with a four-beat take** (pop on beat 10): trusted Aarav (24, Saturday mentor, joy) beside Meera; lean the lone teacher beside Meera's empty chair and name strip (worry); smaller Meera mid-lesson (laugh); empty Sunanda with the 6 a.m. batch (realize → smile) |
| 6.875–8.75 | numbers | the student count as a **wall of heads** (one head per student, the 2026 batch as the frame; extra students in amber, missing ones hollow), a counting tag whose type grows, then the ink stamp slams on beat 13 (8.125 s): whooshIn 0.45 s before, clank on the slam, `C.shake`. Stamp text `≈ N students · up/down P%`, all from `Agamoto.at(road, 2036)` and `Agamoto.at(road, 2026)`; "X of N futures end here" uses `road.n` |
| 8.75–10.0 | pull-out | the room wide (trusted: Aarav and Meera among the mentors; smaller: the quiet half; empty: three students among empty desks) |
| 10.0–12.0 | close | ring + callout 2 + closing line (trusted: parents queue at the enrolment door; lean: the fee card ₹ old → new; smaller: the empty half; empty: Sunanda writes on the board) |

The empty ending now agrees with its stamp: the corridor shows a pictogram "rooms in use N of 40" (N = 40 × students 2036 /
students 2026) and a row of CLOSED doors; the wall of heads shows the students that remain and, hollow, the ones that left.

## 3. QC (run in the v3 worktree, 2026-10-11)

Gates: `node --check` on both files; `node render.mjs place-office --road <road>`; `node render.mjs end-<road>` (the whole
integrated shot: flash, my clip from 0.12 s, batch, board); `dead-holds.mjs`; `sync-check.mjs`; frame strips; join check
(raw clips, pixel diff, HUD off).

| gate | result |
|---|---|
| `node --check places-sunanda.js endings.js` | both pass |
| `node render.mjs place-office --road <road>` (4 roads) | 188 frames, 6.25 s each, with sound, no page errors |
| dead-holds (office, 4 roads) | 0 holds ≥ 0.6 s on every road (99–100 % of frames moving) |
| sync-check (office) | build-retrain 3/3 · build-cut 4/4 · ban-retrain 4/4 · ban-cut 4/4 events ok; no OFF-BEAT, no STARTLE |
| `node render.mjs end-<road>` (4 roads, the integrated 22 s shot) | 661 frames each, rendered with sound |
| dead-holds (my 12 s of each end shot) | 0 holds on all four |
| sync-check (my 12 s of each end shot, cuts at 1.93 / 5.03 / 6.93 / 8.80 / 10.03 s in shot time) | 5/5 ok on all four; largest offset 53 ms, largest loudness jump +2.8 dB |
| join check (raw clips, pixel diff, HUD off) | mid-<road>@12.50 → end-<road>@0: 0–0.014 · end-<road>@12 → rewind@0: 0–0.001 (all four roads) |
| null photo / sweep | `C.IMG` forced null: office and end clips draw at t = −0.7 … 6.95 and 0 … 12 with no errors |
| take strips | `qc/strip-office-{trusted,lean,smaller,empty}.jpg`, `qc/strip-end-<road>.jpg` show anticipation → pop (squash, hop, hair/pallu follow-through) → settle |

Outside my 12 s: sync-check on the whole end shot reports one OFF-BEAT hard cut at ≈ 20.2 s (the batch → board pull-out cut,
`story.html`, not mine); dead-holds is 0 over the whole shot.

Files: `qc/place-office@<road>.mp4`, `qc/sheet-office-<road>.jpg` (3 fps, 5×4), `qc/strip-office-*.jpg`,
`qc/mine/end-<road>-clip.mp4` (my 12 s cut from the shot), `qc/sheet-end-<road>.jpg` (2 fps, 5×5), `qc/strip-end-<road>.jpg`,
`clips/end-<road>.mp4` (the integrated shots, re-rendered here with the new `endings.js`).

## 4. Self-score against `refs/yardstick/*.jpg` (rubric 1–10)

| | story clarity | composition | motion | rhythm | look consistency | type | honesty |
|---|---|---|---|---|---|---|---|
| office · trusted | 9 | 8 | 8.5 | 9 | 8.5 | 8.5 | 9 |
| office · lean | 9 | 8 | 8.5 | 9 | 8.5 | 8.5 | 8 (photo vs counter, see below) |
| office · smaller | 8.5 | 8 | 8.5 | 9 | 8.5 | 8.5 | 8 (half-blank wall is the bible's) |
| office · empty | 9 | 8.5 | 8.5 | 9 | 8.5 | 9 | 9 |
| end · trusted | 8.5 | 8 | 8 | 9 | 8.5 | 8.5 | 9 |
| end · lean | 9 | 8 | 8 | 9 | 8.5 | 8.5 | 8.5 |
| end · smaller | 8 | 8 | 8 | 9 | 8.5 | 8.5 | 8 (copy vs +7 %) |
| end · empty | 9 | 8.5 | 8 | 9 | 8.5 | 9 | 9 (stamp, rooms board and wall of heads all from the engine) |

Against the yardsticks: the flat bold ground, white-rimmed cut-outs, heavy banners, ink stamps with a slam and a shake, sunburst
behind the hero beat, and a count shown as massed objects (a wall of heads) are all there, as in `chai-photo.jpg`; big faces in
close-up with a held anticipation, a pop and a settle, and phone UI inserts that ping in, as in `correction-v5.jpg`. Where I am
below the yardsticks: the big faces are flat vector (no paper grain on the head itself), the wide classroom shots are busy, and
the corridor in the smaller office is plainer than the other sets.

## 5. Known issues and notes for the lead (files I do not own)

- **Number vs line, lean office:** the bible caption "Most of the people in this photo are *gone*" sits over a faculty
  photo whose faces fade (12 of 20). With the 100-future engine the lean road's teachers are 78 in 2034 and 63 in 2036 (80
  in 2026), so the picture is a stylisation, not the counter. Either soften the line ("Many of the people…") or tie the
  lit-future choice to a larger staff drop. I kept the bible copy.
- **Number vs line, smaller:** the 2036 stamp now reads `≈ 2,149 students · up 7%` while company.json says "Half the rooms
  are empty" (and the office chart shows half the batch cards blank, per the bible). The wall of heads is honest; the copy is
  what disagrees. Suggest "Some rooms are quiet."
- **Sound:** `sound.js` brings kick + bass in at 2.5 s and 7.5 s in the good endings, so a hard cut on those two bar lines
  measures as a STARTLE; my cuts are on 1.875 / 5.0 / 6.875 / 8.75 / 10.0 instead. A bare `swish` is too soft for sync-check,
  so every cut has swish + `clack`.
- **segFlash in story.html** (not mine) is labelled year 2030 and HUD full; the frame it flashes from is the 2034 office,
  whose chip says 2034. Suggest `year: 2034`, `hud: 'year'` there.
- The end clip starts at t = 0.12 in the shot, so its own events before 0.12 s (the 0.04 whoosh) are dropped by `segInner`;
  its flash is already full white at 0.12 and fades from there.
- Ghost/closed counts in the office wall for `smaller` (six blank cards) are the bible's, not derived; for `empty` they follow
  the 2034 student figure (4–8 cards).
- Custom roads (`film-custom`) draw the build-retrain end clip with a custom road object: every figure and label comes from
  `road` / `road.endingInfo`, nothing is hard-coded, but the cameo characters (Aarav, Meera, Sunanda) are the ending's.
