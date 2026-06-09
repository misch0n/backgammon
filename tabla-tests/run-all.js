#!/usr/bin/env node
// Extracts app2.js from index.html, then runs every suite in its own Node process
// and prints a one-line pass/fail per suite plus an overall verdict.
//
//   node run-all.js                      # index.html in this folder
//   node run-all.js /path/to/index.html
//
const { execSync } = require('child_process');
const path = require('path');
const htmlArg = process.argv[2];

execSync('node ' + JSON.stringify(path.join(__dirname, 'extract.js')) + (htmlArg ? ' ' + JSON.stringify(htmlArg) : ''), { stdio: 'inherit' });
console.log('');

const suites = [
  ['engine.test.js',         'engine rules (40 assertions)'],
  ['games.test.js',          'full games \u00d7 3 variants (36 games)'],
  ['branching.test.js',      'history / branching (195 checks)'],
  ['ui.test.js',             'history modal / rewind / replay'],
  ['handoff.test.js',        '\u0413\u044e\u043b\u0431\u0430\u0440\u0430 doubles cascade + hand-off'],
  ['perspective.test.js',    'Black-as-human (flipped board)'],
  ['guess.test.js',          'Guess-mode scoring'],
  ['auto-interrupt.test.js', 'Auto: one die, Stop, manual finish'],
  ['auto-plan.test.js',      'Auto: full plan / resume / deviation'],
  ['flip.test.js',           'board flip 180\u00b0 consistency'],
  ['bar-flip.test.js',       'bar checkers on a flipped board'],
];

function bad(out) {
  if (/\bFAIL\b/.test(out)) return true;
  const m = out.match(/(\d+)\s+failed/); if (m && +m[1] > 0) return true;            // "N failed"
  if ([...out.matchAll(/:\s*(\d+)\/(\d+)/g)].some(g => +g[1] < +g[2])) return true;  // games "X/12"
  return false;
}

let fails = 0;
for (const [file, desc] of suites) {
  let out = '', threw = false;
  try { out = execSync('node ' + JSON.stringify(path.join(__dirname, file)), { encoding: 'utf8' }); }
  catch (e) { out = (e.stdout || '') + (e.stderr || e.message || ''); threw = true; }
  const f = threw || bad(out);
  if (f) fails++;
  console.log((f ? '\u2717 FAIL  ' : '\u2713 pass  ') + file.padEnd(22) + '  ' + desc);
  const lines = out.trim().split('\n').filter(Boolean);
  const show = lines.filter(l => /passed|failed|\/12|FAIL|ERROR|Error/.test(l)).slice(-4);
  show.forEach(l => console.log('        ' + l));
}
console.log('\n' + (fails ? '\u274c ' + fails + ' suite(s) failed' : '\u2705 ALL SUITES PASSED'));
process.exit(fails ? 1 : 0);
