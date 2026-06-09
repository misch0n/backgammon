const fs=require("fs");let app=fs.readFileSync(require('path').join(__dirname,'app2.js'),"utf8");
app+="\nglobalThis.__T={G,setupBoard,startGame,revealRoll,offered,playMove,startAutoHuman,autoStep,cur,aiChooseTurn,clone,W,K,winner};";
const stubs={};function el(id){return stubs[id]||(stubs[id]={innerHTML:"",textContent:"",value:"",checked:false,dataset:{},style:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},addEventListener(){},closest(){return null;},querySelector(){return null;},querySelectorAll(){return[];},appendChild(){}});}
globalThis.document={getElementById:el,createElement:()=>el("x"),addEventListener(){}};
globalThis._Q=[];globalThis.setTimeout=(fn)=>{globalThis._Q.push(fn);return 0;};globalThis.clearTimeout=()=>{};globalThis.setInterval=()=>0;globalThis.clearInterval=()=>{};globalThis.window={addEventListener:()=>{}};
eval(app);const T=globalThis.__T;const G=T.G;
let pass=0,fail=0;function ok(c,m){if(c)pass++;else{fail++;console.log("FAIL: "+m);}}
const eq=(a,b)=>a.from===b.from&&a.die===b.die&&!!a.off===!!b.off&&(a.off||a.to===b.to);

// ---- Full plan uninterrupted == aiChooseTurn's whole turn (checked move-by-move) ----
T.setupBoard("backgammon");T.startGame(T.W,T.W,[3,3]);          // doubles → 4 dice
const plan=T.aiChooseTurn(T.clone(G.board),T.W,[3,3]).moves;
ok(plan.length>=3,"optimal doubles turn has multiple moves (len="+plan.length+")");
G.spectate=true;T.startAutoHuman();globalThis._Q.length=0;      // drive manually
T.autoStep();                                                  // fresh → builds plan, plays move 0
ok(G.usedCount===1&&G.autoPlayed===1&&eq(G.autoPlan[0],plan[1]),"played plan[0]; tail==original");

// ---- Stop, untouched, resume → continues the ORIGINAL plan ----
G.spectate=false;T.autoStep();                                 // Stop: no-op
ok(G.usedCount===1&&G.autoPlayed===1,"Stop froze auto");
G.spectate=true;T.autoStep();                                  // resume untouched → ORIGINAL plan[1]
ok(G.usedCount===2&&G.autoPlayed===2,"resume advanced one planned die");
ok(G.autoPlan&&eq(G.autoPlan[0],plan[2]),"resume followed the ORIGINAL plan (next==plan[2])");

// ---- Deviation during interruption → greedy (plan dropped) ----
T.setupBoard("backgammon");T.startGame(T.W,T.W,[3,3]);
G.spectate=true;T.startAutoHuman();globalThis._Q.length=0;
T.autoStep();                                                  // plays plan move 0
const planned1=G.autoPlan[0];
G.spectate=false;
const alt=T.offered().find(o=>!eq(o,planned1));                // a DIFFERENT legal move
ok(!!alt,"an alternative manual move exists");
T.playMove(alt);                                               // YOU play something else
ok(G.usedCount===2&&G.autoPlayed===1,"manual move advanced used beyond autoPlayed");
G.spectate=true;T.autoStep();                                  // resume → detects deviation → greedy
ok(G.autoPlan===null,"plan dropped after deviation (greedy)");
ok(G.usedCount===3,"auto continued greedily");

// ---- Start mid-turn (you moved first) → greedy, never builds a plan ----
T.setupBoard("backgammon");T.startGame(T.W,T.W,[6,4]);
T.revealRoll();
T.playMove(T.offered()[0]);                                    // you play one die manually
ok(G.usedCount===1&&G.autoPlan===null,"mid-turn: one manual die, no plan");
G.spectate=true;T.autoStep();                                  // start auto mid-turn → greedy
ok(G.autoPlan===null,"mid-turn start stays greedy");
ok(G.usedCount===2||G.turn===T.K,"auto finished the remaining die");

console.log((fail?"FAILED ":"OK ")+pass+" passed, "+fail+" failed");
