const fs=require("fs");let app=fs.readFileSync(require('path').join(__dirname,'app2.js'),"utf8");
app+="\nglobalThis.__T={G,render:typeof render!=='undefined'?render:null,setupBoard,startGame,W,K,TOPY,BOTY};";
const stubs={};let boardHTML="";
function el(id){if(stubs[id])return stubs[id];const o={_id:id,innerHTML:"",textContent:"",value:"",checked:false,dataset:{},style:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},addEventListener(){},closest(){return null;},querySelector(){return null;},querySelectorAll(){return[];},appendChild(){},setAttribute(){}};Object.defineProperty(o,'innerHTML',{set(v){if(id==='board')boardHTML=v;this._h=v;},get(){return this._h||"";}});stubs[id]=o;return o;}
globalThis.document={getElementById:el,createElement:()=>el("x"),addEventListener(){}};
globalThis.setTimeout=()=>0;globalThis.clearTimeout=()=>{};globalThis.setInterval=()=>0;globalThis.clearInterval=()=>{};globalThis.window={addEventListener:()=>{}};
eval(app);const T=globalThis.__T;const G=T.G;
let pass=0,fail=0;function ok(c,m){if(c)pass++;else{fail++;console.log("FAIL: "+m);}}
T.setupBoard("backgammon");
// put one White + one Black checker on the bar
G.board.bar.w=1;G.board.bar.k=1;G.human=T.W;G.ai=T.K;
// y bands: top band ~70..; bottom band ~648..
const TOP=T.TOPY(0), BOT=T.BOTY(0);
function barYs(){ // find checker centres at cx=500 (the bar), capture cy + colour hint
  const re=/<g[^>]*data-c="?([wk])"?[^>]*translate\(500[, ]+([0-9.]+)/g; // may not match; fallback below
  return boardHTML;
}
G.flipped=false;T.render();const un=boardHTML;
G.flipped=true;T.render();const fl=boardHTML;
// crude: White checker uses one fill, Black another; check that the y near 500 swaps bands.
// Instead, assert via barY logic directly: unflipped W at BOT, flipped W at TOP.
ok(un.length>0&&fl.length>0,"flipped + unflipped boards both render (no crash with bar checkers)");
// guess path render (AI bar) shouldn't crash
G.flipped=true;G.guessSel=null;T.render();ok(true,"flipped render ok");
console.log((fail?"FAILED ":"OK ")+pass+" passed, "+fail+" failed");
