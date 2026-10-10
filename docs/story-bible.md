# Story bible v2 — Vidya Classes across many places

> **Superseded in part (v3):** durations and craft are in `docs/animotion-upgrade.md` (places 6.25 s, bedroom 8.75 s,
> beat grid, collage look, sound). The places now sit inside story.html's board-view shots (see CONTRACT.md "Story v3").
> The 'smaller' and lean office captions were rewritten to match the 100-future numbers.

The first version told 2027–2036 through one classroom shot and ticking counters. v2 tells it through **people in
visually different places**. Every road (`ban-cut`, `ban-retrain`, `build-cut`, `build-retrain`) visits the same
places, but what happens there splits by the road and its luck.

**Reference grammar:** Vox paper-collage explainers. A wide establishing shot, a push-in to a face or prop, a reaction
cut, one idea per shot. **Anti-pattern:** a static wide shot held while numbers change. **Bar:** no shot held > 6 s,
nothing frozen > 0.4 s, every scene has a person doing something we can read without the caption.

## The people (drawn only with `CAST.draw` from `cast.js`)

| who | in 2026 | look (fixed — never redraw them yourself) |
|---|---|---|
| `aarav` — Aarav Kale | 14, Class 9; wants to be an engineer; 18 in 2030 (exam year), 24 in 2036 | mustard tee, open blue checked shirt, messy hair |
| `swati` — Swati Kale | his mother, a tailor; pays the fees from her sewing | maroon kurta, mustard dupatta, braid, bindi, measuring tape round her neck |
| `meera` — Meera Deshpande | chemistry teacher, 12 years at Vidya | teal-green saree with red border, low bun, wristwatch |
| `sunanda` — Sunanda Joshi | founder (2009), former physics teacher | saffron saree, rust pallu, grey-streaked bun, glasses |
| `extra:<n>` | anyone else (students, parents, colleagues) | deterministic per n |

`CAST.draw(ctx, who, x, y, h, { pose, face, armL, armR, holdL, holdR, look, lean, tilt, flip, walk, t, glow })` returns
`{ head, handL, handR }` in world coords. Faces: neutral smile grin worried sad tired surprised determined focused talk cry.
Arm recipes: `CAST.ARMS.{down,wave,hips,phoneLook,carryBox,point,think,clap,write,hug,raise,headInHands}` (spread them:
`Object.assign({ face: 'smile', t: t }, CAST.ARMS.wave)`). Props: phone tablet box chalk cup book letter pen sweets bag.
Always pass `t` (blink + breath). Use `face: 'talk'` while someone speaks. h ≈ 520–900 px for medium shots, 1400+ for
close-ups (crop the body off-frame). Preview the cast: `node tools/shot.mjs tools/castsheet.html out.png`.

## Where the places sit (lead owns `chapters.js`, which stitches them)

```
prologue → vote 1 → c1-<c1> → home-<c1>: [classroom] → BEDROOM 2027 night → [classroom] → vote 2 (worded per first choice)
→ c2-<road>: 2027 classroom (7 s) → STAFFROOM 2027 → SHOP 2028 → STREET 2029 → RESULTS 2030
→ mid-<road>: → MEERA32 2032 → OFFICE 2034 → end-<road>: flash → 2036 classroom ending (endings.js)
```
Scenes change with a torn-paper wipe (0.7 s) centred on each boundary, so a place must draw correctly for
**t ∈ [−0.7, dur + 0.7]** (clamp your progress values; let camera drift continue).

## PLACES contract

```js
var PLACES = window.PLACES = window.PLACES || {};
PLACES.bedroom = { dur: 8, year: 2027, draw: function (ctx, t, road) { C.use(ctx); /* … */ } };
```
- **Own only your file(s).** Never edit another file; if you need a change elsewhere, write it in your report.
- Pure function of `(t, road)`: no `Math.random` (use `C.rand(seed)`), no `Date`, no state between frames.
- Paint every pixel of 1920×1080 every frame, at any camera zoom (paint the backdrop generously or in screen space).
- Begin with `C.use(ctx)`. Never `setTransform`/`resetTransform`; balance save/restore; leave `globalAlpha`, `filter`,
  composite op as found. Don't draw grain, vignette or the HUD (story.html adds them). In place scenes the HUD is only a
  small year chip at bottom-left (x 28–180, y 958–1024) and a trust line at bottom-right (y 1030–1070): keep the bottom
  110 px and the top-left 360×100 px free of anything important.
- `road`: `road.c1` ('ban'|'build'), `road.c2` ('cut'|'retrain'), `road.id`, `road.luck` (`[{id:'viral'|'collapse'|'topper', year, hit}]`),
  `road.ending` ('trusted'|'lean'|'smaller'|'empty'), `Agamoto.at(road, year)` → `{students, teachers, results, fees}`.
  Format fees as `'₹' + (Math.round(f / 500) * 500).toLocaleString('en-IN')`.
- **Captions:** verbatim from this file, one at a time, `C.caption(text, emph, p, 880)` with `*word*` marking the highlight;
  fade like scenes.js `cap()` (alpha = clamp((t−a)/0.05) · clamp((b−t)/0.45); p = C.prog(t, a, a + max(1, (b−a)·0.55))).
  Each caption ≥ 2.2 s on screen; caption 1 starts ≈ 0.3 s, caption 2 ends by dur − 0.2.
- **Film grammar:** at least 2 shots per scene (establishing wide → push-in on a face or prop → reaction cut), with
  `C.track(t, keys)` + `C.withCam(cam, fn)`; two keys at the same t = a hard cut. Slow drift on holds.
- **Acting:** the lead character changes expression at least once (anticipation → action → settle); hands do things
  (type, sew, carry, point). Something always moves (fan, steam from chai, traffic, phone pings, ambient `C.amb`).
- **Look:** paper collage, not flat vector: sets built from torn-paper shapes (`C.paper`, `C.torn`, `C.rect` with
  `halftone`), soft paper shadows, 2–3 depth layers. Each place has its **own palette** (below) so no two consecutive
  scenes look alike. Indian specificity: real objects of a Pune home/street/staff room, never generic.
- Fonts: narration Instrument Serif italic (via `C.caption`), labels Barlow Condensed UPPERCASE (`C.label`), Devanagari
  `C.FONTS.deva`. Kit: `C.label C.stamp C.callout C.headline C.ring C.paper C.torn C.rect C.halftone C.flash C.amb C.ease C.back`.
- Fictional company. No real brand names (no WhatsApp/Usha/real coaching chains); invented names are fine.

## QC (every helper)
1. `node --check <your file>`.
2. `node qc.mjs place-<name> 0.5 2 3.5 5 <dur−0.5> --road <road>` for **every** road → `qc/place-<name>@<road>-<t>.jpg`
   (the default road `build-retrain` has no `@road` in the name). Open and look at them.
3. Contact sheet per place, e.g. `ffmpeg -v error -y -pattern_type glob -i 'qc/place-shop@ban-cut-*.jpg' -vf "scale=640:-1,tile=3x2" qc/sheet-shop-ban-cut.jpg`.
4. Score each place 1–10 on: reads without the caption · characters act · distinct place · captions legible and not
   covering faces · paper-collage craft · joins (t = −0.7 and dur + 0.7 render fine). Fix anything below 8.
5. Write `docs/helpers/<your-name>.md`: what you built, the variants, the QC sheet paths, known issues.

---

## H1 · `places-family.js` — Aarav and Swati at home

### `PLACES.bedroom` — dur 8, year 2027 (late night)
The Kales' one-room flat in Hadapsar. **Palette:** indigo night (#1e2742 / #2b3550), a warm tungsten lamp pool where
Swati sews (#f2c48d), cyan screen glow. Window with Pune night lights and power lines; ceiling fan turning; a steel
trunk; a calendar; school bag; a handwritten note "IIT 2030" stuck above his desk; a black pedestal sewing machine and
folded fabric in Swati's corner.
- **ban** — Shot 1 (0–3) wide: Aarav on a floor mattress under a blanket, the phone lighting his face; Swati at her
  machine in the lamp pool. Shot 2 (3–5.5) push-in: Aarav's face in cyan, focused → small smile; a phone insert shows
  "Explain torque like I'm 14" and a simple lever diagram. Shot 3 (5.5–8) reaction: Swati stops sewing, sees the glow,
  worried; says nothing; dims the lamp.
  Captions: "The ban ends at the classroom *door*." · "At midnight, Aarav asks the AI *anyway*."
- **build** — Shot 1 wide: Aarav at a small desk with the institute tablet; Swati sewing. Shot 2 close on the tablet:
  AI tutor screen "Torque · 3 mistakes", then a message slides in: "Meera ma'am: Stay back tomorrow. We'll fix torque
  together." Aarav surprised → smile. Shot 3: Swati smiles over her sewing.
  Captions: "At midnight, Aarav practises with the *AI*." · "By morning, Meera ma'am knows where he's *stuck*."

### `PLACES.shop` — dur 6, year 2028
"Swati Tailors", a ground-floor shop in Hadapsar: shutter half up, bolts of saturated fabric (magenta, turquoise,
marigold, parrot green), blouse patterns pinned up, the machine, a tube light, a small Ganpati sticker. **Palette:**
saturated fabric colours on warm white. A full-frame **phone insert** of the parents' group chat "Vidya Parents · 11-B"
(generic green chat bubbles, no real app branding). Fee = `Agamoto.at(road, 2028).fees`.
- **viral hit** (`road.luck` viral hit): Swati at the machine; the phone pings and pings. Insert: "Free AI tutor app,
  same syllabus 😳", "Why pay ₹<fee>?", a link card "TutorBot · free · 10 lakh downloads".
  Caption 1: "2028. A free AI tutor app goes *viral*."
  Then: **build** — she looks at Aarav's progress sheet (green ticks), determined, types "Staying." Caption 2:
  "Swati stays: the app can't sit *beside* Aarav." **ban** — she looks at the fee receipt, worried. Caption 2:
  "Swati wonders what her fees still *buy*."
- **no viral**: closing time, Swati counts notes from a tin box. Insert: **cut** roads "Vidya cut fees again 👍" /
  "Meera ma'am left?"; **build-retrain** "Fees up again 😕" / "Aarav's mentor called me today!"; **ban-retrain**
  "Fees up again 😕" / "A teacher stays till 8 for doubts".
  Caption 1: "2028. Swati sews forty blouses to pay one *term*."
  Caption 2: **cut** "This year the fee is lower. So are the *teachers*." **retrain** "The fee went up. Someone at Vidya knows Aarav's *name*."

## H2 · `places-city.js` — Pune outside

### `PLACES.street` — dur 6, year 2029
FC Road in daylight: a building facade stacked with coaching-class hoardings (Pune's specific clutter), yellow-black
auto-rickshaws and scooters passing, a gulmohar tree, a vada-pav cart, overhead wires; Vidya Classes' modest board on
a first floor. **Palette:** bright daylight, sky #8fc6e8, loud hoarding colours.
- **collapse hit**: "MegaRank Academy" (invented) shut — shutters down, a padlock, a CLOSED notice; parents crowd
  outside with phones. Cut to Vidya's gate: a queue of parents; Sunanda at the door greeting them.
  Captions: "2029. A big coaching chain shuts *overnight*." · "Parents look for a name they *trust*."
- **no collapse**: workers on a ladder unroll a glossy hoarding across the road: "BrightPath AI Academy · ₹9,999 a year"
  (invented). Aarav (17) walks past with two friends, looks up.
  **build-retrain**: he shrugs and walks on into Vidya, smiling. **build-cut**: he looks, then walks on. **ban**: his two
  friends peel off toward BrightPath; Aarav hesitates, worried.
  Caption 1: "2029. Across the road, an AI academy *opens*."
  Caption 2: **build-retrain** "Aarav already has AI, and a *mentor*." **build-cut** "Vidya is cheaper now. Aarav *stays*."
  **ban** "Two of Aarav's friends cross the *road*."

### `PLACES.results` — dur 6, year 2030 (Aarav's exam results; he is 18)
Must still look right at t = dur + 0.7 (the next chapter starts on its last frame).
- **topper hit** (`road.luck` topper hit): Shot 1 a newspaper front page (newsprint, halftone, invented masthead "Pune
  Herald"): "VIDYA STUDENT TOPS STATE" with Aarav's photo (CAST close-up inside the photo frame). Shot 2 the lane
  outside Swati's shop: Swati crying with joy, handing out pedhas to neighbours; Aarav hugs her.
  Captions: "2030. Aarav tops the state *exam*." · "Swati hands out pedhas to the whole *lane*."
- **no topper, results ≥ 50** (`Agamoto.at(road, 2030).results`): Shot 1 a phone results page: "Rank 4,812 · Seat:
  an engineering college in Pune". Shot 2 quiet relief, Aarav and Swati smile.
  Captions: "2030. Aarav gets a seat, *just*." · "An engineering college in Pune. Swati *exhales*."
- **no topper, results < 50**: Shot 1 the phone result, below the cut-off. Shot 2 Aarav sits on the shop step at dusk;
  Swati sits beside him, a hand on his shoulder.
  Captions: "2030. Aarav misses the *cut-off*." · "He'll take a drop year and try *again*."

## H3 · `places-meera.js` — Meera

### `PLACES.staffroom` — dur 6, year 2027
Vidya's staff room: pale institutional green walls (#c9d6c2), steel almirahs, a long table, cutting-chai glasses with
steam, attendance registers, a wall clock, a timetable grid on a whiteboard, tube light; Meera's name strip
"MEERA D. · CHEMISTRY". **Palette:** cool green-grey with chai amber accents.
- **build-cut / ban-cut**: Shot 1 wide: colleagues at the table, a printed letter in front of Meera. Shot 2 close:
  Meera reads it (sad), takes down her name strip. Shot 3 she lifts her box (beaker, framed batch photo, register) and
  walks out; a colleague's hand on her shoulder; her chai left steaming.
  Captions: "Twelve years teaching chemistry at *Vidya*." · "Today Meera packs them into a *box*."
- **build-retrain**: a mentor workshop: Sunanda at the whiteboard "MENTOR = 8 STUDENTS · KNOW EACH ONE"; AI
  struggle-map printouts on the table. Meera nervous → reads her list of eight names; "Aarav Kale" is on it
  (highlighted); she smiles and pins the list.
  Captions: "Meera learns a new job: *mentor*." · "Eight students. She'll know *each* one."
- **ban-retrain**: the room is now a "DOUBT DESK · 4–8 PM": students queue with notebooks, no screens; Meera explains
  with a pencil sketch; the wall clock jumps to 8:10; Meera tired but smiling as the last student leaves.
  Captions: "No screens. More teachers, more *hours*." · "Meera now stays till *eight*."

### `PLACES.meera32` — dur 6, year 2032
- **cut roads**: Meera's flat in Kothrud, evening: dining table, steel plates pushed aside, six students around her; a
  hand-painted board by the door "MEERA MA'AM · CHEMISTRY TUITIONS". Close on her face: proud, determined.
  Caption 1: "2032. Meera teaches at her dining *table*." Caption 2: **build-cut** "Six students. Two came from *Vidya*."
  **ban-cut** "Her batch is bigger than her old Vidya *class*."
- **build-retrain**: Vidya's mentor room: Meera, now head mentor, leads a circle of younger mentors, a struggle-map
  screen behind; then a parent (extra) thanks her.
  Captions: "2032. Meera now trains Vidya's *mentors*." · "Parents call her before they call the *office*."
- **ban-retrain**: late evening at Vidya: Meera with her mentee group; empty chairs where colleagues sat; a farewell card
  on the table.
  Captions: "2032. Meera still knows every student by *name*." · "Three colleagues have left. The hours are *long*."

## H4 · `places-sunanda.js` + `endings.js` — Sunanda and 2036

### `PLACES.office` — dur 6, year 2034 (night)
Sunanda's office: desk lamp pool of light, teal-blue night outside with Pune lights, the framed 2009 first-batch photo,
the enrolment register, a wall chart of batches (cards pinned full/empty), files. **Palette:** deep teal night + amber lamp.
Varies by `road.ending`:
- **trusted**: a thick waiting-list file, the phone lighting up, a wall of mentor photos; she smiles, turns off the lamp.
  Captions: "2034. The waiting list is longer than the *register*." · "Sunanda goes home before *nine*."
- **lean**: a big analytics screen, few staff photos; she is alone.
  Captions: "2034. Lowest fees in Pune, and the rooms are *full*." · "Most of the people in this photo are *gone*."
- **smaller**: half the batch cards on the wall are blank; cut to her switching off the lights of two empty rooms.
  Captions: "2034. Loyal families *stay*." · "Sunanda switches off the lights in two empty *rooms*."
- **empty**: a lease notice on the desk, "Third floor · lease ends"; she takes down the 2009 batch photo, holds it.
  Captions: "2034. Sunanda gives up the third *floor*." · "She keeps one room, and the first batch *photo*."

### `endings.js` changes (H4 owns endings.js)
1. **Join:** `end-<road>` at t < 0.05 must draw `CLIPS['mid-' + road.id].draw(ctx, CLIPS['mid-' + road.id].dur, road)`
   (fall back to `c2-` + road if no `mid-` exists) — never a hard-coded 15. `rewind` at t = 0 still draws end at 12.
2. **Empty ending mismatch:** the shot shows three students while the stamp says "≈ 1,254 students". company.json now
   frames it as the 6 a.m. batch (glimpse/callouts updated). Make the visuals and the stamp agree, e.g. stamp
   "1,254 students · down 37%" and show more than one room is dimmed/closed; the dawn batch is one room.
3. **Cameo payoffs with CAST** (readable, not tiny), keeping the 12 s structure and the stamp timing:
   trusted — Aarav, 24, back as a Saturday mentor beside Meera; lean — one teacher, a big screen, Meera absent;
   smaller — Meera teaching a half-full room; empty — Sunanda with three students at dawn.
4. Keep `ENDINGS.startState/endState` honest about what the first frame now is.
