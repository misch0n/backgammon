const fs=require("fs");let app=fs.readFileSync(require('path').join(__dirname,'app2.js'),"utf8");
app+="\nglobalThis.__T={G,setupBoard,startGame,revealRoll,offered,playMove,finalize,passTurn,afterTurn,aiPlay,W,K,winner,guessOffered,guessSources,guessDests,recordGuess,revealGuess,guessCur,enterGuess,aiChooseTurn,clone};";
const stubs={};function el(id){return stubs[id]||(stubs[id]={innerHTML:"",textContent:"",value:"",checked:false,disabled:false,dataset:{},style:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},addEventListener(){},removeEventListener(){},closest(){return null;},querySelector(){return null;},querySelectorAll(){return[];},appendChild(){},setAttribute(){}});}
globalThis.document={getElementById:el,createElement:()=>el("x"),addEventListener(){},querySelector(){return null;},querySelectorAll(){return[];}};
globalThis._Q=[];globalThis.setTimeout=(fn)=>{globalThis._Q.push(fn);return 0;};globalThis.clearTimeout=()=>{};globalThis.setInterval=()=>0;globalThis.clearInterval=()=>{};
globalThis.window={addEventListener:()=>{}};
eval(app);const T=globalThis.__T;const G=T.G;
function drain(){let n=0;while(globalThis._Q.length){globalThis._Q.shift()();if(++n>4000)throw"FLOOD";}}
let pass=0,fail=0;function ok(c,m){if(c)pass++;else{fail++;console.log("FAIL: "+m);}}
function humanTurn(){ // play out the human's (W) turn to completion
  if(G.phase==="roll")T.revealRoll();
  let s=0;while(G.phase==="move"&&s++<10){const mv=T.offered();if(!mv.length)break;T.playMove(mv[0]);}
  if(G.phase==="pass")T.passTurn();
}
function reachGuess(seed){ // play human turns until the AI's turn enters guess phase
  let g=0;while(!T.winner(G.board)&&g++<40){
    if(G.phase==="guess")return true;
    if(G.turn===G.human&&!G.spectate){humanTurn();}      // finalize() -> afterTurn -> AI beginTurn -> enterGuess (synchronous)
    else drain();
    if(G.phase==="guess")return true;
  }
  return false;
}
// ---- Scenario 1: CORRECT guess ----
T.setupBoard("backgammon");T.startGame(T.W,T.W,[3,1]);G.guessOn=true;
ok(reachGuess(),"reached guess phase on AI turn");
ok(G.phase==="guess","phase is guess");
ok(G.guessTarget&&G.guessTarget.moves.length>0,"AI target captured");
ok(G.guessMax>0,"guessMax>0");
const tgtLen=G.guessTarget.moves.length;
// replay the AI's exact moves as our guess
for(const tm of G.guessTarget.moves.slice()){
  if(G.phase!=="guess")break;
  const opts=T.guessOffered();
  const mv=opts.find(o=>o.from===tm.from&&(o.off?"off":o.to)===(tm.off?"off":tm.to)&&o.die===tm.die);
  if(!mv){ok(false,"target move offered during guess");break;}
  T.recordGuess(mv);
}
ok(G.phase==="guessrev","auto-revealed after full correct guess");
ok(G.guessResult===Math.min(2,tgtLen),"score is min(2,targetLen): got "+G.guessResult+" want "+Math.min(2,tgtLen));
const logLenBefore=G.log.length;
drain(); // heart timeout -> aiPlay animates the real move
ok(G.phase!=="guessrev"&&G.phase!=="guess","left guess phase after reveal");
ok(G.log.length>logLenBefore,"AI move logged after reveal");

// ---- Scenario 2: WRONG guess (reveal immediately, no guesses) ----
T.setupBoard("backgammon");T.startGame(T.W,T.W,[5,2]);G.guessOn=true;
ok(reachGuess(),"reached guess phase again");
T.revealGuess();
ok(G.phase==="guessrev","revealed on give-up");
ok(G.guessResult===0,"give-up scores 0/2: got "+G.guessResult);
drain();
ok(!T.winner(G.board)||true,"no crash after wrong-guess reveal");

// ---- Scenario 3: guess OFF -> AI plays normally, no guess phase ----
T.setupBoard("backgammon");T.startGame(T.W,T.W,[4,2]);G.guessOn=false;
let sawGuess=false,g=0;
while(!T.winner(G.board)&&g++<14){if(G.phase==="guess"){sawGuess=true;break;}if(G.turn===G.human&&!G.spectate)humanTurn();else drain();}
ok(!sawGuess,"no guess phase when toggle off");
console.log((fail?"FAILED ":"OK ")+pass+" passed, "+fail+" failed");
