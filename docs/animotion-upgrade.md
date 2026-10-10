# Animotion upgrade (v3) — every place, on top of docs/story-bible.md

The owner's verdict on v2: **"we have this skill and I was expecting it to be used to the max level, not such basic
scenes."** The skill is `~/.claude/skills/animotion` (read `SKILL.md`, `references/film-grammar.md`,
`references/motion-principles.md`, `references/collage-style.md`, `references/qc.md`). Its yardsticks, as contact
sheets in this repo:
- `refs/yardstick/chai-photo.jpg` — Vox collage: a flat bold **cardboard colour per beat**, real photos as **torn
  prints**, code drawings as **cut-out stickers with white scissor rims**, heavy condensed **banners**, red **rubber
  stamps** (1823, SOLD, IGNORED), **sunbursts**, highlighter captions, and **numbers shown as massed objects** (1.2 billion
  kg = a wall of chai glasses).
- `refs/yardstick/correction-v5.jpg` — character grammar: **big expressive faces in close-up**, a **phone UI insert**
  pushed into until readable, a **crowd of heads springing in**, a **counter tag that grows with the count**, a stamp that
  lands with a **riser and camera shake**, a **double take with a sweat drop**.

The story, captions and variants in `docs/story-bible.md` stay. What changes is the craft. The tools are in
`kit2.js` (read its header) and `cast.js` (header: takes, double take, squash, follow-through).

## 1. Beat grid (96 bpm, `C.BEAT` = 0.625 s)
- `dur`: **bedroom 8.75 s (14 beats); every other place 6.25 s (10 beats).** Change your `dur` to these.
- Every internal **cut**, **stamp slam**, **pop** and **take accent** lands on a multiple of `C.BEAT`.
- **≥ 3 shots per place**, each 1.25–3.75 s: establishing → **push-in to the key thing until it's readable** → **reaction
  close-up with a four-beat take** → (pull-out for scale). Hard cuts = two camera keys at the same t.
- Camera: `cam = C.bump(C.drift(C.track(t, keys), t), t)` (drift = moving hold; bump on beats); `C.shake(cam, t, slamT)` on a stamp.

## 2. Look (kit2.js)
- **Ground:** `C.cardboard(col)` per shot — one bold dominant colour + one accent; different from the neighbouring
  places. Set pieces are **torn-paper cut-outs** (`C.sticker(x, y, w, h, fn)` with the white rim, or `C.paperPiece` with
  `dots` + `grain`) at **2–3 depths with parallax** (near layers move more than far ones under the camera). Not a flat
  illustrated room.
- **Banner** per place for the place/time (`C.banner('HADAPSAR · 11:40 PM', …, {p})`, pops in with overshoot).
- **Stamps** for verdicts, dates and figures (`C.inkStamp(text, x, y, p)`, start 0.12 s before the beat; red only if
  something is *false* — nothing in this story is, so use ink/teal/maroon/saffron: `{col: P.tealDark}` etc.).
- **Marks:** `C.highlight`, `C.markUnder`, `C.markRing2` (saffron).
- **Accents** to keep holds alive: `C.sunburst` behind the hero beat (slowly rotating), `C.zigzag`, `C.confetti`.
- **On twos:** collage pieces (stickers, banners, confetti) move on `C.T12(t)`; the camera stays smooth.
- **Palette family** (shared): saffron #e0863e, teal #2f7f7a, mustard #d9a933, maroon #8c2a2a, coral #e2664f, cream
  #f4ead7, ink #1f1b18, plus each place's own dominant ground from the bible.

## 3. Numbers are things, never a bare counter
Whenever a number matters (fees, downloads, students, rank, batch size, years), show **countable objects that spring
in** (`C.popIn`, stagger cap 0.5 s per group) — banknotes stacking, phone pings piling up, chairs emptying, heads in a
batch — with a **tag whose type grows as it counts** (`C.countScale`).

## 4. Acting (cast.js)
- At least one **four-beat take** on the lead per place: `CAST.withTake(o, kind, lt, t0)` (kinds: surprise joy laugh sag
  resolve worry realize; t0 ≈ one beat before the beat you want the pop on). It adds squash/stretch, the hop, and
  follow-through on braid/bun/dupatta/pallu.
- `CAST.doubleTake(o, lt, t0)` where someone notices something; `C.sweatDrop` for pressure.
- Squash on landings and sits (`o.squash`); walking with `pose: 'walk', walk: phase`.
- **At least one big-face close-up per place:** a CAST face filling ≥ 40 % of the frame height (draw the character at
  h ≈ 2200–3200 and frame the head). The face carries the beat.
- Nothing still > 0.4 s (breath and blink are automatic; add secondary motion).

## 5. Inserts and photos
- **Phone/tablet inserts** as a full-frame device that types and pings in; enter them with a push-in.
- **Photos** (CC BY, credits shipped; always handle `null` with a code fallback):
  `C.IMG('fc-road')` → street establishing **torn print** (`C.tornPrint`, B&W default, slow Ken Burns push);
  `C.IMG('auto-rickshaw')` → street, a **cut-out** driving across (`C.photoSticker`, on twos);
  `C.IMG('pune-night')` → bedroom / office window view (torn print inside the window, `filter: 'saturate(1.1)'`);
  `C.IMG('sewing-wheel')` → shop close cut-in (torn print, push-in).

## 6. Sound (the score is sound.js; you add the effects)
`PLACES.<name>.events = function (road) { return [[t, 'sfx', arg?], …]; }` with **local** times — every visible event:
phone ping `notify`, typing `click`, pop-ins `pop` / `popLow` i, stamp `clank` with `whooshIn` 0.45 s before it, steps
`step`, sewing `sew`, money `cash`, clock `tick`, door `creak`, paper `swish`, crowd `zip` i, a take's pop `boing`
(sparingly). No `thud` on a downbeat (fails sync as a startle). Don't add music.

## 7. QC (in this order; report the numbers)
1. `node --check <your file>`
2. `node render.mjs place-<name> --road <road>` → `qc/place-<name>@<road>.mp4` **with sound**, for every variant.
3. Contact sheet: `ffmpeg -v error -y -i qc/place-X@R.mp4 -vf "fps=2,scale=480:-1,tile=4x4" qc/sheet-X@R.jpg` — look at it.
4. `node ~/.claude/skills/animotion/scripts/dead-holds.mjs qc/place-X@R.mp4` → **0 holds ≥ 0.6 s**.
5. `node ~/.claude/skills/animotion/vendor/javascript-animation-skills/skills/soundtrack/scripts/sync-check.mjs qc/place-X@R.mp4` → every visual event ok (no OFF-BEAT, no STARTLE).
6. Frame strip of each take: `ffmpeg -ss <t> -i qc/place-X@R.mp4 -t 0.66 -vf "fps=15,scale=240:-1,tile=10x1" qc/strip-X.jpg` → anticipation → pop → settle visible.
7. Score the rubric (story clarity, composition, motion, rhythm, look consistency, type, honesty) 1–10 per place; fix
   anything < 8 and re-run. Compare against the two yardstick sheets, not just "it renders".
