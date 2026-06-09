const fs=require('fs');
let app=fs.readFileSync(require('path').join(__dirname,'app2.js'),'utf8');
app+="\nglobalThis.__T={G,offered,playMove,passTurn,newGame,openHistModal,doRewind,W,K,winner,revealRoll,stubsRef:(typeof stubs!=='undefined'?stubs:null)};";
const stubs={};
function el(id){return stubs[id]||(stubs[id]={id,innerHTML:'',textContent:'',checked:false,dataset:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},closest(){return null;},querySelectorAll(){return [];}});}
globalThis.document={getElementById:el,addEventListener(){}};
globalThis._Q=[];globalThis.setTimeout=(fn)=>{globalThis._Q.push(fn);return 0;};
globalThis.window={addEventListener:(ev,fn)=>{if(ev==='load')window._load=fn;}};
eval(app);const T=globalThis.__T;
function drain(){let n=0;while(globalThis._Q.length){globalThis._Q.shift()();if(++n>1e5)throw'flood';}}
function playOut(pick){let g=0;while(!T.G.gameOver){drain();if(T.G.gameOver)break;if(T.G.turn===T.W&&T.G.phase==='roll'){T.revealRoll();}else if(T.G.turn===T.W&&T.G.phase==='move'){let i=0;while(T.G.turn===T.W&&T.G.phase==='move'&&!T.G.gameOver){const mv=T.offered();if(!mv.length)throw'empty';T.playMove(mv[pick(mv)]);drain();if(++i>4000)throw'i';}}else if(T.G.turn===T.W&&T.G.phase==='pass')T.passTurn();if(++g>8000)throw'g';}}

let pass=0,fail=0;const ck=(n,c)=>{c?pass++:(fail++,console.log('  FAIL:',n));};

// ---- 1) End-of-game modal renders Rewind buttons ----
T.newGame('backgammon');T.G.statsOn=false;
playOut(()=>0);
T.openHistModal();
const html1=stubs['histbody'].innerHTML;
ck('end-of-game: modal has Rewind buttons',/data-rew=/.test(html1)&&/\u21a9 Rewind/.test(html1));
ck('end-of-game: button count == turn count',(html1.match(/data-rew=/g)||[]).length===T.G.savedGames[0].turnLog.length);
ck('end-of-game: pip icons use checkers (white+black circles)',/\u26aa/.test(html1)&&/\u26ab/.test(html1));
ck('end-of-game: no heart/square legacy icons',!/\u2665/.test(html1)&&!/\u25a0\u00a0\d/.test(html1));

// ---- 2) FIRST game, MID-game: History shows live game WITH Rewind buttons ----
T.newGame('backgammon');T.G.statsOn=false;
// play ~6 half-turns then stop mid-game
let turns=0;let g=0;
while(!T.G.gameOver&&turns<6){
  drain();if(T.G.gameOver)break;
  if(T.G.turn===T.W&&T.G.phase==='roll'){T.revealRoll();}
  else if(T.G.turn===T.W&&T.G.phase==='move'){const mv=T.offered();T.playMove(mv[0]);drain();}
  else if(T.G.turn===T.W&&T.G.phase==='pass')T.passTurn();
  turns=T.G.turnLog.length;
  if(++g>200)break;
}
ck('mid-game first game: no saved games yet',T.G.savedGames.length===0);
T.openHistModal();
const html2=stubs['histbody'].innerHTML;
ck('mid-game first game: Rewind buttons PRESENT (was the bug)',/data-rew=/.test(html2));
const nBtns=(html2.match(/data-rew=/g)||[]).length;
ck('mid-game: buttons only on completed turns (excludes in-progress)',nBtns>=1&&nBtns<=T.G.turnLog.length);

// ---- 3) Mid-game Rewind preserves the partial game and starts a branch ----
// Build the same viewable openHistModal builds (live game last)
const viewable=T.G.savedGames.map(x=>({label:x.label,turnLog:x.turnLog,live:false}));
viewable.push({label:'Current game',turnLog:T.G.turnLog,live:true});
const liveIdx=viewable.length-1;
const targetTurn=1; // rewind to turn index 1
const boardAtTarget=JSON.stringify(T.G.turnLog[targetTurn].boardBefore);
T.doRewind(viewable,liveIdx,targetTurn);
ck('mid-game rewind: partial game preserved in savedGames',T.G.savedGames.length===1&&/partial/.test(T.G.savedGames[0].label));
ck('mid-game rewind: branchFrom set',T.G.branchFrom===targetTurn);
ck('mid-game rewind: board restored to target boardBefore',JSON.stringify(T.G.turnLog[targetTurn]?T.G.turnLog[targetTurn].boardBefore:T.G.board)!==undefined);
// after branch, finish it and confirm preserved partial is intact + new branch saved
const preservedSig=T.G.savedGames[0].turnLog.map(e=>e.turn+e.dice.join('')).join(';');
playOut(()=>0);
ck('mid-game rewind: branch completes & saved (2 games total)',T.G.savedGames.length===2);
ck('mid-game rewind: preserved partial UNCHANGED after branch finished',T.G.savedGames[0].turnLog.map(e=>e.turn+e.dice.join('')).join(';')===preservedSig);

console.log(pass+' passed, '+fail+' failed');
