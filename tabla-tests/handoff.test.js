const fs=require('fs');
let app=fs.readFileSync(require('path').join(__dirname,'app2.js'),'utf8');
app=app.replace('function render(){','function render(){ if(globalThis.__NR) return;');
app=app.replace('function renderPanel(disp){','function renderPanel(disp){ if(globalThis.__NR) return;');
app=app.replace('function renderHistModal(viewable,idx){','function renderHistModal(viewable,idx){ if(globalThis.__NR) return;');
app+="\nglobalThis.__T={G,newGame,beginTurn,aiPlay,offered,playMove,W,K,winner,cascadeDice,other,revealRoll};";
const stubs={};
function el(id){return stubs[id]||(stubs[id]={innerHTML:'',textContent:'',checked:false,dataset:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},closest(){return null;},querySelectorAll(){return [];}});}
globalThis.document={getElementById:el,addEventListener(){}};
globalThis._Q=[];globalThis.setTimeout=(fn)=>{globalThis._Q.push(fn);return 0;};
globalThis.window={addEventListener:()=>{}};globalThis.__NR=true;
eval(app);const T=globalThis.__T;
function drain(){let n=0;while(globalThis._Q.length){globalThis._Q.shift()();if(++n>2e5)throw'flood';}}
let pass=0,fail=0;const check=(n,c)=>{if(c)pass++;else{fail++;console.log('  FAIL:',n);}};
const eqArr=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>x===b[i]);

// ── Test A: cascade timing — only from a player's 4th roll onward ──
function timing(rollsBefore){
  T.newGame('gulbara');T.G.statsOn=false;T.G.spectate=false;
  T.G.turn=T.W;T.G.globalRolls=rollsBefore;   // beginTurn increments -> roll number = rollsBefore+1
  T.G.dice=[2,2];                        // forced double (beginTurn does not re-roll)
  T.beginTurn();
  return T.G;
}
let g=timing(2); // 3rd roll
check('3rd-roll double plays x4, no cascade', g.cascade===false && g.used.length===4);
g=timing(3);     // 4th roll
check('4th-roll double cascades to 6-6', g.cascade===true && g.used.length===20 && g.cascadeList[0]===2);
g=timing(4);     // 5th roll
check('5th-roll double still cascades', g.cascade===true && g.used.length===20);
g=timing(0);     // 1st roll
check('1st-roll double plays x4, no cascade', g.cascade===false && g.used.length===4);

// ── Test B: hand-off semantics, observed from real AI-vs-AI gulbara games ──
let handoffs=0, games=0, ended=0;
for(let i=0;i<600 && handoffs<12;i++){
  T.newGame('gulbara');T.G.statsOn=false;T.G.spectate=true;T.G.flipped=false;
  if(T.G.turn===T.W&&(T.G.phase==='roll'||T.G.phase==='move')){T.G.phase='ai';globalThis._Q.push(T.aiPlay);}
  drain();                                // runs the whole spectate game to completion
  games++;
  const log=(T.G.savedGames[T.G.savedGames.length-1]||{turnLog:[]}).turnLog;
  for(let j=0;j<log.length;j++){
    const ho=log[j]; if(!ho.handover) continue;
    handoffs++;
    const prev=log[j-1];
    check('hand-off follows a stalled cascade', !!prev && prev.stopped===true && prev.cascade===true);
    check('staller is the receiver\u2019s opponent', !!prev && prev.turn===T.other(ho.turn));
    if(prev && prev.cascade && prev.dice){  // entire remaining ladder transfers (guard null-dice hand-off entries)
      const full=T.cascadeDice(prev.dice[0]);
      const playedCount=(prev.moves||[]).length;
      check('handoverDice == full ladder minus what staller played', eqArr(ho.handoverDice, full.slice(playedCount)));
    }
    if(T.winner(ho.boardAfter)){ ended++; }
    else{                                 // receiver immediately takes its OWN normal turn (no bounce)
      const nxt=log[j+1];
      check('receiver plays a normal roll right after hand-off', !!nxt && nxt.turn===ho.turn && !nxt.handover);
      // no bounce-back: the turn after the hand-off is NOT another hand-off to the staller
      check('no bounce-back to staller', !(nxt && nxt.handover));
    }
  }
}
console.log('  (sampled '+handoffs+' hand-offs across '+games+' gulbara games; '+ended+' ended the game)');
check('hand-offs actually occurred in sampling', handoffs>0);

console.log('\n'+pass+' passed, '+fail+' failed');
if(fail)process.exit(1);
