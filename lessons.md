# Lessons — Eye of Agamoto

### 2026-10-10 — A story told by counters is not a story
**Pattern:** The 2027–2030 stretch was one classroom wide shot held for 15 s while the HUD numbers ticked; the user said
"I just see a counter changing" and "I was expecting multiple scenes, things visually different".
**Rule:** Every year on screen gets a place and a person: a distinct location (own palette), a named character acting,
at least two shots. Numbers are a dashboard, never the action. Check a frame strip of every clip before shipping: if
consecutive frames look like the same shot, it fails.
**Why:** The point of the piece is "who it affects"; counters show what changed, people show why it matters.

### 2026-10-10 — Decisions must branch, not repeat
**Pattern:** The second vote ("Retrain teachers as mentors — AI explains…") was identical after "Ban AI in class",
which contradicted the first choice.
**Rule:** Each choice's follow-up question and options are worded from the earlier choice (`company.json`
`decisions[1].byPrev`, resolved by `Agamoto.decision(i, prev)`). Any new decision level must be a tree, never a list.
**Why:** A choice that changes nothing downstream makes the vote feel fake.

### 2026-10-10 — Match the interaction to who is holding the mouse
**Pattern:** Each click added a vote to a tally (built for a facilitator counting hands); a single viewer asked "what is
the use of giving me option to select multiple times?"
**Rule:** Default to one person, one pick (click picks, click the other to switch, Lock it in confirms). Room tallies
are an explicit opt-in mode.
**Why:** The common case is one person at a laptop; facilitation features must not leak into it.

### 2026-10-10 — Check for a live parallel session before building
**Pattern:** A handoff from a cloud session said "everything is pushed"; this desktop session cloned and built for an
hour while the cloud session kept pushing to `main` and its branch (branching wording, voting, a board view). Two
versions of the same fixes diverged and had to be merged by hand.
**Rule:** Before building on a handed-off repo, `git fetch` and check recent deployments/commits; if another session is
still active, agree who owns which files (or pause it) before writing code. Re-fetch before every push.
**Why:** Parallel sessions editing the same files silently duplicate work and create conflicts nobody asked for.
