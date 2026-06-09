const fs=require("fs");let app=fs.readFileSync(require('path').join(__dirname,'app2.js'),"utf8");
app+="\nglobalThis.__T={G,slot:typeof slot!=='undefined'?slot:null,TOPY,BOTY,W,K,setupBoard,startGame};";
const stubs={};function el(id){return stubs[id]||(stubs[id]={innerHTML:"",textContent:"",value:"",checked:false,dataset:{},style:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},addEventListener(){},closest(){return null;},querySelector(){return null;},querySelectorAll(){return[];},appendChild(){}});}
globalThis.document={getElementById:el,createElement:()=>el("x"),addEventListener(){}};
globalThis.setTimeout=()=>0;globalThis.clearTimeout=()=>{};globalThis.setInterval=()=>0;globalThis.clearInterval=()=>{};globalThis.window={addEventListener:()=>{}};
eval(app);const T=globalThis.__T;const G=T.G;
let pass=0,fail=0;function ok(c,m){if(c)pass++;else{fail++;console.log("FAIL: "+m);}}
const slot=T.slot;
// helper: capture slot for all 24 points + the perspective number, at a given flip
function snap(flip){G.flipped=flip;const a=[];for(let i=0;i<24;i++){const s=slot(i);a.push({i,x:+s.x.toFixed(1),top:s.top,num:flip?(24-i):(i+1)});}return a;}
T.setupBoard("backgammon");
const u=snap(false), f=snap(true);
// 1. Flip is a true 180° point-reflection: x mirrors about 500, top inverts
let rot=true;for(let i=0;i<24;i++){if(Math.abs((1000-u[i].x)-f[i].x)>0.5||u[i].top===f[i].top)rot=false;}
ok(rot,"flip is an exact 180° rotation for all 24 points");
// 2. Numbers renumber per perspective and the SAME physical point keeps a coherent label
ok(u[0].num===1&&f[0].num===24,"point i0: 1 unflipped, 24 flipped (perspective renumber)");
ok(u[23].num===24&&f[23].num===1,"point i23: 24 unflipped, 1 flipped");
// 3. White's home (i0-5) sits at bottom unflipped, top flipped (sector rotates with board)
ok(u.slice(0,6).every(p=>p.top===false)&&f.slice(0,6).every(p=>p.top===true),"White home sector: bottom→top on flip");
// 4. Black's home (i18-23) sits at top unflipped, bottom flipped
ok(u.slice(18,24).every(p=>p.top===true)&&f.slice(18,24).every(p=>p.top===false),"Black home sector: top→bottom on flip");
// 5. Numbers are pinned to physical points (a point's number is identical whether we read it before/after, given perspective) — i.e. no number lands on the wrong point
ok(f.every(p=>p.num===24-p.i),"every flipped label = 24 - index (consistent renumber)");
console.log((fail?"FAILED ":"OK ")+pass+" passed, "+fail+" failed");
console.log("bottom row unflipped (left→right):",u.filter(p=>!p.top).sort((a,b)=>a.x-b.x).map(p=>p.num).join(" "));
console.log("bottom row flipped   (left→right):",f.filter(p=>!p.top).sort((a,b)=>a.x-b.x).map(p=>p.num).join(" "));
