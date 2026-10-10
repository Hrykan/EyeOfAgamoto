# Eye of Agamoto · Vidya Classes

A school board rehearses a decision before taking it.

AI tutors now explain any topic, in any language, almost for free, and that is the heart of a coaching institute's work. What AI can't easily replace is mentoring, accountability and trust with parents. Eye of Agamoto seats the board of **Vidya Classes**, a fictional coaching institute in Pune (classes 9–12 and entrance exams, founded in 2009 by Sunanda Joshi, a former physics teacher; 2,000 students, 80 teachers), around a table. The board takes two decisions, and a motion-graphics film plays out what follows: for the school, for families at home, and for the students who grow up with those decisions.

**A fictional company. Illustrative futures — a rehearsal, not a prediction.**

## The experience

- **Board view.** Every decision is taken in the boardroom: Sunanda (chair) with members for finance, parents, teachers and students. The wall screen shows the agenda and the numbers, and how they moved since the last meeting; decisions are pinned on the board.
  1. 2026 · *What do we do about AI tutors?* Ban AI in class, or build AI into every class.
  2. 2027 · *What happens to the teachers?* Worded for the first answer ("AI is banned in class…" or "AI now does the explaining…"): cut staff to cut fees, or retrain teachers as mentors.
- **Impact view.** After each decision the camera pushes into the board's screen and the impact plays full frame: the school, then a family at home (the fee bill, the report card, what the parents say). After the second decision it runs on to 2036 and to **where the 2026 batch ended up** (four students, ten years on), then pulls back out to the board.
- **Board briefing.** Back at the table: what each decision did to students, teachers, fees and results, what was luck (a viral free AI app, a rival chain collapsing, a state topper) and what was ordinary ups and downs. Then **What if?** rewinds to try another road and compares the two, same luck.
- **100 futures, same luck.** Every road is run as 100 futures from one seeded engine; future *k* sees the same random draws on every road, so the only difference between roads is the decision. The film follows the road's most common ending.
- **Write your own choice.** On the home page, take the board's seat for the 2027 decision: write your own, Claude designs its yearly effects and its 2036, and the same 100 futures run. You get the outcome, the board briefing, a same-luck comparison with the board's own options, and your road's 2036 drawn live.

## Live

- Home page: `index.html` (what this is, the four roads, Write your own choice)
- The film / room player: `play.html` (also `play.html#story`, `#vote`, `#<road>`, `#<road>-2036`, e.g. `#build-retrain`)
- Drawn live on a canvas (renderer and fallback): `story.html`
- Ultimate fallback: `walkthrough.mp4`

### Vercel

Import the repository (Framework Preset **Other**, no build command, no output directory). The root opens the home page.

To make **Write your own choice** call Claude, add an environment variable in the Vercel project: **Settings → Environment Variables → `ANTHROPIC_API_KEY`** (an Anthropic API key), then redeploy. The function `api/design.js` keeps the key on the server, uses Claude Opus 5.5 with structured JSON output and Anthropic's server-side refusal fallback, validates and clamps every answer before the engine uses it, and limits each visitor to 6 designs per 10 minutes. Without a key the page says Claude isn't connected and offers three examples Claude designed in advance.

In the claude.ai published version, the page uses the viewer's own Claude account instead (no key needed; the first design asks the viewer's permission).

## Story v3: the years, told through people and places

Between the decisions the story leaves the boardroom and follows four people: **Aarav** (14 in 2026, wants to be an
engineer), his mother **Swati** (a tailor who pays the fees), **Meera** (chemistry teacher, 12 years at Vidya) and
**Sunanda** (the founder). Each road visits the same places, and what happens there depends on the road and its luck:
Aarav's room at midnight (2027), the staff room (2027), Swati's tailoring shop and the parents' group chat (2028),
FC Road (2029), results day (2030), Meera in 2032 and Sunanda's office in 2034.

It is built with the animotion skill's grammar: paper-collage cut-outs, torn photo prints (CC BY, credits in
`assets/web/CREDITS.md`), stamps, close-ups with four-beat takes, transitions on a 96 bpm beat grid, and a score with a
sound for every visible event, baked into each clip. The player unmutes when you press Start (S toggles sound).

## Run it locally

```bash
python3 -m http.server 8000
# open http://localhost:8000/        (home page; Write your own choice runs the examples)
# open http://localhost:8000/play.html
```

## Room controls (play.html)

On the menu, choose **Playing alone** (one click or key press chooses and the story moves on) or **With a room · votes** (each click or key press adds a vote; Enter, **Lock it in**, or a 10-second timer takes the majority). A control bar appears when you move the mouse: **Menu · Restart · −5s · Pause · +5s · Skip**.

| Key | Action |
|---|---|
| Enter (on the menu) | start the story |
| 1–4 (on the menu) | play that scenario from 2026 |
| 1 / 2 or click a card | choose (with a room: add a vote) |
| Enter, **Lock it in**, or the 10 s timer | lock a room vote |
| Space | pause / resume |
| ← / → | back / forward 5 seconds |
| N | skip to the next part (on the briefing: go on) |
| R | restart the story |
| M | back to the menu |
| click a road on the What if? map (or 1–4) | rewind and try that road |

## How it's made

- `company.json` — the company, two decisions (the second worded per first answer), three luck events, four endings, the number of futures (100).
- `engine.js` — pure, seeded engine (mulberry32; future *k* seeded from hash(seed, k), same draw order on every road). `road()`, `customRoad()`, `compare()`, `explain()` (what each decision, each luck event and chance did to each number). `calibrate.mjs` runs 4 roads × 2,000 futures and picks the seed whose 100 futures best match.
- `collage.js` — the paper-collage kit: torn paper, halftone, silhouettes, captions, stamps, rings, callouts, camera tracks, grain, vignette.
- `scenes.js` — the classroom and the school clips (prologue, 2026–27, 2027–30); `endings.js` — the 2036 films and the rewind; `board.js` — the boardroom, the family at home, the 2026 batch in 2036.
- `story.html` — one 1920×1080 canvas; each clip is a pure function of time. It wraps the school clips in the board view (push into the board's screen, school, home, pull back out); the screen shows the exact first or last frame of the clip it opens onto, so every join is pixel-exact (`node joincheck.mjs`).
- `render.mjs` — Playwright steps each clip at 30 fps and pipes frames to ffmpeg → `clips/<id>.mp4`.
- `play.html` + `stage.css` — the room player: menu, double-buffered videos, choice cards with helped/hurt tags, votes, control bar, board briefing (`why.js`), What if? map, rewind, compare card, Web Audio cues.
- `index.html` — the home page; `design-prompt.js` (what Claude is asked, the JSON schema, validation, the examples), `designer.js` (claude.ai, the site's `api/design`, or examples), `api/design.js` (the Vercel function).
- Tests: `node joincheck.mjs`, `node tools/apitest.js`, `node tools/clicktest.mjs <dir>`, `node tools/flowtest.mjs <dir>`, `node tools/hometest.mjs <dir>` (headless Chromium has no H.264: point the player tests at a copy whose clips are VP8).

Built from an empty folder in 30 minutes from one prompt by Opus 5.5 (lead) with three Sonnet 5.5 subagents, then extended in the same session.
