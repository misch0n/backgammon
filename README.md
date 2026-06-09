# Tabla Trainer — Табла · Гюлбара · Тапа

A single-file, offline, mobile-first trainer for three Bulgarian backgammon
variants, with a real opponent AI and live probability analysis. The whole app —
rules engine, expectimax AI, statistics, and SVG board — lives in one
self-contained [`index.html`](index.html) with **no build step and no
dependencies**.

> Open `index.html` in any modern browser (or add it to your phone's home
> screen as a PWA-style web app) and play. Nothing is sent anywhere; all state
> lives in the page.

---

## The three variants

| Variant | Cyrillic | Capture rule | Direction | Blocking |
|---|---|---|---|---|
| **Backgammon** (standard tabla) | Табла | Hit a lone enemy → **bar** | Opposing | 2+ checkers make a point |
| **Tapa** (Plakoto) | Тапа | Land on a lone enemy → **pin (⊗)** it in place | Opposing | 2+ checkers, plus any pinned point |
| **Gulbara** (Fevga / Gioul) | Гюлбара | No capturing | **Same** (both counter-clockwise) | A **single** checker blocks |

All three share one pip-coordinate movement engine, so the rules differences are
expressed as small, isolated predicates (`blocked`, `hitDetect`, `homeRange`,
`pipOf`). Starting positions, home boards, and bear-off all adapt per variant.

### Variant-specific mechanics
- **Tapa pinning** — landing on a lone enemy traps it *underneath* your checker
  (no bar in this game). A pinned checker cannot move until you vacate the point;
  the board renders it with a dashed "lock" badge. Pin counts and pin-risk drive
  the AI evaluation and the stats panel.
- **Gulbara doubles cascade** — from the 4th roll of the game onward, rolling
  doubles makes you play that value **and every higher double** (e.g. 3-3 →
  3,4,5,6 each ×4), unrolling up the ladder. Whatever you can't complete **hands
  off** the remaining dice to your opponent, who plays them before their own
  roll. Fully modelled in both the engine and the UI, including history/replay.

---

## Gameplay features

- **Play any of the three variants** from a single segmented switcher.
- **Pre-game setup** — choose White or Black, then a dice roll-off decides who
  opens. Board auto-orients so *your* home board is at the bottom.
- **Tap-to-move** interaction with legal-move highlighting, source/destination
  rings, and an explicit **Bear off** action when available.
- **Correct dice rules** — enforces playing the **maximum number of dice**, the
  **higher-die** rule when only one can be played, doubles (×4), bar entry, and
  bear-off (including over-rolls from the highest occupied point).
- **Undo** within a turn, **Restart**, and a **Flip** board control.
- **Canonical dice sequences** — each side's rolls are seeded per turn, so
  branches of the same game replay identical dice (see *Branching* below).

## Opponent AI

- **Expectimax search** (1-ply with a full opponent-roll rollout over all 21
  distinct dice combinations, probability-weighted).
- **Adaptive candidate set** — every turn within 28 eval units of the best
  static score is evaluated (capped at 14), so non-obvious plays aren't pruned
  prematurely.
- **Per-variant evaluation functions** weighing pip race vs. contact, home-board
  points, **primes** (quadratic bonus for long walls), back anchors, blot
  exposure scaled by board strength, pinning value (Tapa), and blocking/control
  (Gulbara). Race vs. contact is detected to re-weight the pip count.
- **Configurable speed** (0.2–2.0 s per move) and an **Auto** self-play mode that
  can play out *your* side too — interruptible at any point so you can take over.

## Training & analysis tools

- **Stats panel** (toggle): live **pip counts** and lead, **borne-off** tallies,
  and a recent-moves log.
- **Exact hit/pin probabilities** rendered *on the board* — the number on each
  blot is the true chance (over all 36 rolls, blocks respected) that it gets
  hit/pinned next turn: red for your risk, teal for your opportunity. Dim numbers
  on empty points show where the opponent threatens to make a point.
- **Bar entry odds** (backgammon) — enter % and dance % when on the bar.
- **Hint mode** (toggle) — highlights and spells out the AI's suggested play for
  your roll.
- **Guess mode** (toggle) — before the opponent moves, predict their play by
  tapping it out; you're scored 0–2 on how well you matched the engine's choice.

## History, branching & replay

- **Full turn-by-turn history** for every game (and every branch), with dice,
  board notation, stall/hand-off markers, and pip snapshots.
- **Branch from any past turn** ("Rewind") — replays from that point with the
  **same dice** the game originally dealt, so you can explore *"what if I'd
  played differently?"* Each branch is preserved as its own labelled game; the
  in-progress game is saved before branching so nothing is lost.
- **Step-through replay** of any saved game, forward and back.

## Presentation

- Hand-built **SVG board** with gradient checkers, dice (with a doubles "pulse"
  animation and a per-variant strength colour-coding of doubles), pinned-checker
  badges, and home-board highlighting.
- Dark, tactile visual theme; **mobile-first** layout with safe-area insets,
  installable web-app meta tags, and an inline SVG icon.

---

## Architecture

Everything is in [`index.html`](index.html), split into two layers:

1. **Engine** (top of the `<script>`, pure functions, no DOM). Exposed via
   `module.exports` when run under Node, so it can be unit-tested or driven
   headlessly. Key pieces:
   - State model: `points[24]` (signed = top controller), `bar`, `off`,
     `pinned[24]`.
   - Move generation: `singleMoves`, `generateTurns` (max-dice + higher-die
     rules), `applyMove`.
   - Analysis: `hitChances`, `entryStats`, `pip`, `isRace`, `primeLen`.
   - AI: `evalState` (per-variant), `aiChooseTurn`, `scoreEnd`, `topScored`,
     plus the Gulbara cascade helpers (`cascadeDice`, `aiCascade`, `aiDiceSeq`).
2. **UI** (the `G` game-state object + `render()` and event handlers) — the
   variant-aware game loop, board rendering, stats, hints, guess mode, and the
   history/branch/replay system.

### Using the engine headlessly

```js
// Node — the script's module.exports surfaces the engine
const { startState, clone, aiChooseTurn, turnNotation, pip } = require('./engine');
let st = startState('backgammon');
const turn = aiChooseTurn(clone(st), 'w', [3, 1]);
console.log(turnNotation('w', turn.moves)); // => "8/5 6/5"
```

(The engine block is the portion of `index.html` between the opening `<script>`
and the `if (typeof module !== 'undefined') module.exports = …` line.)

## Running

No server, no install:

```
open index.html        # macOS
xdg-open index.html    # Linux
```

…or serve the folder with any static file server and visit it on your phone.

## Testing

A pure-Node test suite lives in [`tabla-tests/`](tabla-tests/). It runs against
the **shipped** `index.html` — `extract.js` pulls the `<script>` block out into a
generated `app2.js` (DOM and timers stubbed) so the tests validate exactly what
ships, with no separate copy of the source to drift. **Node 18+, no `npm install`.**

```
node tabla-tests/run-all.js
```

One line per suite plus an overall verdict; non-zero exit on failure (CI-friendly).
Coverage: engine rules (40 assertions), 36 full games across all three variants,
history/branching (195 checks), the history modal / rewind / replay UI, the
Гюлбара doubles cascade + hand-off, flipped-board (Black-as-human) perspective,
guess-mode scoring, and the Auto self-play planner. See
[`tabla-tests/README.md`](tabla-tests/README.md) for a per-suite breakdown.

The generated `tabla-tests/app2.js` is git-ignored.

## License

No license specified yet — add one before distributing.
