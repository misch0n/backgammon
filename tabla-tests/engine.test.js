const E = require('./engine.js');
const { W, K, startState, clone, generateTurns, hitChances, entryStats, singleMoves,
        applyMove, pip, winner, ownCount, blocked, pipOf, idxOfPip, cascadeDice,
        diceListOf, maxUsable, nextLegalMoves } = E;

let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; } else { fail++; console.log('  FAIL:', name); } }
function eq(name, a, b) { ok(name + ' (' + JSON.stringify(a) + ' === ' + JSON.stringify(b) + ')', a === b); }

function blank(v) { const s = startState(v); s.points = new Array(24).fill(0); s.pinned = new Array(24).fill(0); s.bar = { w: 0, k: 0 }; s.off = { w: 0, k: 0 }; return s; }
function turnsHit(st, p, dice) { const set = new Set(); for (const t of generateTurns(st, p, dice)) for (const m of t.moves) if (m.hit) set.add(m.to); return set; }
function shotCount(st, attacker, blot) { let c = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (turnsHit(st, attacker, [a, b]).has(blot)) c++; return c; }

/* ===== BACKGAMMON REGRESSION ===== */
const bg = startState('backgammon');
eq('bg pip W = 167', pip(bg, W), 167);
eq('bg pip K = 167', pip(bg, K), 167);
eq('bg maxUsable opening 6-5 = 2', maxUsable(bg, W, [6, 5], new Map()), 2);

// opening 3-1 can make the 5-point (index 4 -> two white)
(() => { const ts = generateTurns(bg, W, [3, 1]); ok('bg 3-1 makes 5-point', ts.some(t => t.end.points[4] === 2)); })();

// exact shot counts (block-free), attacker Black hitting a lone White blot
(() => { const s = blank('backgammon'); s.points[0] = -1; s.points[1] = 1; eq('bg shots d1 = 11', shotCount(s, K, 1), 11); })();
(() => { const s = blank('backgammon'); s.points[0] = -1; s.points[6] = 1; eq('bg shots d6 = 17', shotCount(s, K, 6), 17); })();
(() => { const s = blank('backgammon'); s.points[0] = -1; s.points[18] = 1; eq('bg shots d18 (6-6 only) = 1', shotCount(s, K, 18), 1); })();
// blocked intermediate kills the indirect shot: blot at d2 but the d1 landing is blocked by 2 white
(() => { const s = blank('backgammon'); s.points[0] = -1; s.points[2] = 1; s.points[1] = 2; eq('bg d2 with blocked intermediate', shotCount(s, K, 2), 11); })();

// hit sends to bar
(() => { const s = blank('backgammon'); s.points[6] = 1; s.points[0] = -1; const ns = applyMove(s, W, { from: 6, to: 0, hit: true, die: 6 });
  eq('bg hit: white on point', ns.points[0], 1); eq('bg hit: black to bar', ns.bar.k, 1); })();

// dance: 3 home points blocked -> 9/36
(() => { const s = blank('backgammon'); s.bar.w = 1; s.points[21] = -2; s.points[22] = -2; s.points[23] = -2; const es = entryStats(s, W); eq('bg dance 3 blocked = 9/36', Math.round(es.dancePct * 36), 9); })();

// forced higher die: lone checker, both dice only bear off one -> must use the 6
(() => { const s = blank('backgammon'); s.points[0] = 1; const ts = generateTurns(s, W, [4, 6]); ok('bg higher-die forced', ts.length === 1 && ts[0].moves[0].die === 6); })();

/* ===== TAPA (Plakoto) ===== */
const tp = startState('tapa');
eq('tapa setup W on 24pt', tp.points[23], 15);
eq('tapa setup K on its 24pt', tp.points[0], -15);
eq('tapa pip W = 360', pip(tp, W), 360);
eq('tapa pip K = 360', pip(tp, K), 360);

// pin a lone enemy: White idx10 die3 lands on lone Black idx7
(() => { const s = blank('tapa'); s.points[10] = 1; s.points[7] = -1;
  const ms = singleMoves(s, W, 3); const m = ms.find(x => x.to === 7);
  ok('tapa pin move offered', !!m && m.hit === true);
  const ns = applyMove(s, W, m);
  eq('tapa pin: white on top', ns.points[7], 1);
  eq('tapa pin: pinned flag = k', ns.pinned[7], 'k');
  eq('tapa pin: NO bar', ns.bar.k, 0);
  // black cannot move the pinned checker
  const bms = singleMoves(ns, K, 4); ok('tapa pinned checker immovable', !bms.some(x => x.from === 7));
  eq('tapa pip K still counts pinned', pip(ns, K), pip(s, K)); })();

// 2+ enemy blocks landing
(() => { const s = blank('tapa'); s.points[8] = 1; s.points[5] = -2; const ms = singleMoves(s, W, 3); ok('tapa 2+ blocks', !ms.some(x => x.to === 5)); })();

// vacating a pinned point releases the trapped checker
(() => { const s = blank('tapa'); s.points[7] = 1; s.pinned[7] = 'k';   // white single pinning a black
  const m = { from: 7, to: 5, hit: false, die: 2 }; const ns = applyMove(s, W, m);
  eq('tapa release: black freed as single', ns.points[7], -1);
  eq('tapa release: pin cleared', ns.pinned[7], 0); })();

// bearing off in tapa home (White home 0..5)
(() => { const s = blank('tapa'); s.points[2] = 1; const ms = singleMoves(s, W, 3); ok('tapa bear off exact', ms.some(x => x.off)); })();

/* ===== GULBARA (Fevga) ===== */
const gb = startState('gulbara');
eq('gulbara setup W on 24pt', gb.points[23], 15);
eq('gulbara setup K on 12pt', gb.points[11], -15);
eq('gulbara pip W = 360', pip(gb, W), 360);
eq('gulbara pip K = 360', pip(gb, K), 360);

// Black moves counter-clockwise: idx11 die5 -> idx6
(() => { const ms = singleMoves(gb, K, 5); ok('gulbara black 12pt die5 -> idx6', ms.some(x => x.from === 11 && x.to === 6)); })();
// Black wraps: lone black at idx0 die1 -> idx23
(() => { const s = blank('gulbara'); s.points[0] = -1; const ms = singleMoves(s, K, 1); ok('gulbara black wrap idx0 die1 -> idx23', ms.some(x => x.to === 23)); })();
// a SINGLE checker blocks
(() => { const s = blank('gulbara'); s.points[11] = -1; s.points[6] = 1; const ms = singleMoves(s, K, 5); ok('gulbara single blocks', !ms.some(x => x.from === 11 && x.to === 6)); })();
// no hitting ever
(() => { const s = blank('gulbara'); s.points[10] = 1; s.points[7] = -1; const ms = singleMoves(s, W, 3); for (const m of ms) ok('gulbara never hits', m.hit === false); })();
// Black bears off from its home (idx 12..17)
(() => { const s = blank('gulbara'); s.points[13] = -1; const ms = singleMoves(s, K, 2); ok('gulbara black bear off', ms.some(x => x.off)); })();  // pipOf(K,13)=2
// pip symmetry for a known black index
eq('gulbara pipOf(K, idx0) = 13', pipOf(gb, K, 0), 13);
eq('gulbara idxOfPip(K, 12) = 23 (wrap)', idxOfPip(gb, K, 12), 23);

// cascade dice
eq('cascade 2-2 length = 20', cascadeDice(2).length, 20);
eq('cascade 6-6 length = 4', cascadeDice(6).length, 4);
eq('cascade 2-2 starts with 2', cascadeDice(2)[0], 2);
eq('cascade 2-2 ends with 6', cascadeDice(2)[19], 6);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
