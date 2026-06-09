#!/usr/bin/env node
// Pulls the <script> block out of index.html into app2.js (the engine + UI logic),
// so every test runs against the SHIPPED file rather than a separate copy of the source.
//
//   node extract.js                      # expects index.html in this folder
//   node extract.js /path/to/index.html  # or point it anywhere
//
const fs = require('fs'), path = require('path');
const cands = process.argv[2] ? [process.argv[2]]
  : process.env.TABLA_HTML ? [process.env.TABLA_HTML]
  : [path.join(__dirname, 'index.html'), path.join(__dirname, '..', 'index.html')]; // inside, or next to, the folder
const html = cands.find(c => fs.existsSync(c));
if (!html) {
  console.error('index.html not found (looked in: ' + cands.join(', ') + ').');
  console.error('Put index.html in this folder or next to it, or pass a path:  node extract.js /path/to/index.html');
  process.exit(1);
}
const src = fs.readFileSync(html, 'utf8');
const m = src.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error('No <script> block found in ' + html); process.exit(1); }
fs.writeFileSync(path.join(__dirname, 'app2.js'), m[1]);
console.log('extracted app2.js (' + m[1].length + ' chars) from ' + path.basename(html));
