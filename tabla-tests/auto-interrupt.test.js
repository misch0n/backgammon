const fs=require("fs");let app=fs.readFileSync(require('path').join(__dirname,'app2.js'),"utf8");
app+="\nglobalThis.__T={G,setupBoard,startGame,revealRoll,offered,playMove,finalize,passTurn,autoStep,startAutoHuman,W,K,winner};";
const stubs={};function el(id){return stubs[id]||(stubs[id]={innerHTML:"",textContent:"",value:"",checked:false,disabled:false,dataset:{},style:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},addEventListener(){},closest(){return null;},querySelector(){return null;},querySelectorAll(){return[];},appendChild(){},setAttribute(){}});}
globalThis.document={getElementById:el,createElement:()=>el("x"),addEventListener(){},querySelector(){return null;},querySelectorAll(){return[];}};
globalThis._Q=[];globalThis.setTimeout=(fn)=>{globalThis._Q.push(fn);return 0;};globalThis.clearTimeout=()=>{};globalThis.setInterval=()=>0;globalThis.clearInterval=()=>{};
globalThis.window={addEventListener:()=>{}};
eval(app);const T=globalThis.__T;const G=T.G;
let pass=0,fail=0;function ok(c,m){if(c)pass++;else{fail++;console.log("FAIL: "+m);}}
function drain(){let n=0;while(globalThis._Q.length){globalThis._Q.shift()();if(++n>3000)throw"FLOOD";}}

// --- Interruption: auto plays 1 die, stop, finish the 2nd manually ---
T.setupBoard("backgammon");T.startGame(T.W,T.W,[6,5]); // human=W starts, two distinct dice
ok(G.turn===T.W&&G.phase==='roll',"human to roll");
T.revealRoll();
ok(G.phase==='move',"move phase after reveal");
ok(G.globalMax>=2,"both dice playable (globalMax="+G.globalMax+")");
ok(G.usedCount===0,"no dice used yet");
G.spectate=true;                       // hit Auto
T.autoStep();                          // plays ONE die
ok(G.usedCount===1,"auto played exactly one die (used="+G.usedCount+")");
ok(G.phase==='move',"still mid-move after one auto die");
ok(G.turn===T.W,"still human's turn");
G.spectate=false;                      // hit Stop
T.autoStep();                          // must NOT play (auto off)
ok(G.usedCount===1,"after Stop, no further auto move (used="+G.usedCount+")");
// finish the second die manually
const mv=T.offered();
ok(mv.length>0,"second die has a legal manual move");
T.playMove(mv[0]);                     // should consume die 2 and finalize the turn
ok(G.usedCount===0||G.turn===T.K,"turn finalized after manual 2nd die (turn="+G.turn+")");
ok(G.turn===T.K,"control passed to AI after finishing manually");

// --- Full auto (no interrupt) completes the human turn and hands to AI ---
T.setupBoard("backgammon");T.startGame(T.W,T.W,[4,2]);
G.spectate=true;
T.startAutoHuman();   // reveal + schedule autoStep chain
let n=0;while(G.turn===T.W&&G.phase!=='ai'&&n++<12){drain();if(globalThis._Q.length===0)break;}
ok(G.turn!==T.W||G.phase==='ai'||G.gameOver,"full auto advanced past the human's turn");

console.log((fail?"FAILED ":"OK ")+pass+" passed, "+fail+" failed");
