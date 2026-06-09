// Loads the rules engine out of app2.js (extracted from index.html) so engine.test.js
// validates the SHIPPED engine. DOM/timers are stubbed so the UI layer in the same
// <script> doesn't throw while we eval it just to reach the engine functions.
const fs = require('fs'), path = require('path');
let app;
try { app = fs.readFileSync(path.join(__dirname, 'app2.js'), 'utf8'); }
catch (e) { console.error('app2.js missing — run:  node extract.js [path/to/index.html]'); process.exit(1); }

const stub = () => ({
  innerHTML: '', textContent: '', value: '', checked: false, disabled: false,
  dataset: {}, style: {},
  classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
  addEventListener() {}, closest() { return null; },
  querySelector() { return null; }, querySelectorAll() { return []; },
  appendChild() {}, setAttribute() {}
});
global.document = { getElementById: stub, createElement: stub, addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; } };
global.window = { addEventListener() {} };
global.setTimeout = () => 0; global.clearTimeout = () => {}; global.setInterval = () => 0; global.clearInterval = () => {};

const NAMES = ['W','K','other','startState','clone','generateTurns','hitChances','entryStats','evalState',
  'aiChooseTurn','aiCascade','cascadeDice','pip','winner','singleMoves','applyMove','scoreEnd','topScored',
  'isRace','allHome','turnNotation','ownCount','whiteCount','blackCount','topOwner','blocked','pointNum',
  'diceListOf','maxUsable','nextLegalMoves','pipOf','idxOfPip'];
eval(app + '\n;globalThis.__ENGINE__={' + NAMES.map(n => n + ':typeof ' + n + '!=="undefined"?' + n + ':undefined').join(',') + '};');
module.exports = globalThis.__ENGINE__;
