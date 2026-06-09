# Tabla Trainer — test suite

Pure-Node tests that run against the **shipped** app. They extract the `<script>`
block from `index.html` and exercise the real engine + UI logic (DOM and timers
stubbed), so they validate exactly what you deploy — there is no separate copy of
the source to drift out of sync.

## Requirements

- **Node.js 18+** — that's it. No `npm install`; only Node built-ins are used.

## Run everything

Put this folder next to your `index.html` and run:

```
node run-all.js
```

If `index.html` lives elsewhere, pass its path:

```
node run-all.js /path/to/index.html
```

You'll get one line per suite (`✓ pass` / `✗ FAIL`) with each suite's own summary,
ending in `✅ ALL SUITES PASSED`. Exit code is non-zero if anything fails (handy for CI).

## Run a single suite

First make sure the extracted script is current:

```
node extract.js                     # index.html in this folder
node extract.js /path/to/index.html # or elsewhere
```

Then run any suite directly:

```
node engine.test.js
node games.test.js
node auto-plan.test.js
# ...etc
```

## What each suite covers

| Suite | Checks |
|---|---|
| `engine.test.js` | 40 assertions on the pure rules engine — hits, entry/dance odds, pip count, maximal-use & higher-die rules, bear-off, per-variant setups. |
| `games.test.js` | Plays 12 complete games in each variant (Табла / Гюлбара / Тапа) to a legal finish — 36 games total. |
| `branching.test.js` | 195 checks on the history model, branch-from-turn/log, and the canonical append-only dice. |
| `ui.test.js` | History modal, rewind/branch, and step-through replay. |
| `handoff.test.js` | Гюлбара doubles cascade and the hand-off of the remaining ladder to the opponent. |
| `perspective.test.js` | Black-as-human (flipped board): renders and plays a full game without crashing, panel labels correct. |
| `guess.test.js` | Guess-mode scoring (0 / 1 / 2 of the opponent's moves predicted). |
| `auto-interrupt.test.js` | Auto plays exactly one die; Stop halts it; you finish the turn manually; control passes to the AI. |
| `auto-plan.test.js` | Auto computes and follows the whole optimal turn; resume continues the original plan if untouched; a manual move during the pause drops the plan to greedy. |
| `flip.test.js` | Board flip is an exact 180° rotation; point numbers renumber per perspective and home sectors rotate consistently. |
| `bar-flip.test.js` | Bar checkers and bar highlights render on the correct side of a flipped board. |

## Notes

- `app2.js` is **generated** (the extracted `<script>`). Delete it anytime — `extract.js`
  / `run-all.js` recreate it. It's intentionally not part of the bundle.
- Win/loss tallies vary run-to-run because dice are random. The suites assert that games
  **complete legally and invariants hold**, not who wins.
- Everything runs against the same `app2.js`, so a green run means the engine *and* the
  UI flow in your `index.html` are behaving.
