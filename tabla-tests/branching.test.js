const fs=require('fs');
let app=fs.readFileSync(require('path').join(__dirname,'app2.js'),'utf8');
app+="\nglobalThis.__T={G,offered,playMove,passTurn,newGame,branchFromTurn,W,K,winner,revealRoll};";
const stubs={};
function el(id){return stubs[id]||(stubs[id]={innerHTML:'',textContent:'',checked:false,dataset:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},closest(){return null;},querySelectorAll(){return [];}});}
globalThis.document={getElementById:el,addEventListener(){}};
globalThis._Q=[];globalThis.setTimeout=(fn)=>{globalThis._Q.push(fn);return 0;};
globalThis.window={addEventListener:(ev,fn)=>{if(ev==='load')window._load=fn;}};
eval(app);const T=globalThis.__T;
function drain(){let n=0;while(globalThis._Q.length){globalThis._Q.shift()();if(++n>1e5)throw'flood';}}

// Drive White with a "policy": pick move index via fn(offered)->idx
function playOut(pickW){
  let guard=0;
  while(!T.G.gameOver){
    drain();if(T.G.gameOver)break;
    if(T.G.turn===T.W&&T.G.phase==='roll'){T.revealRoll();}
    else if(T.G.turn===T.W&&T.G.phase==='move'){
      let inner=0;
      while(T.G.turn===T.W&&T.G.phase==='move'&&!T.G.gameOver){
        const mv=T.offered();if(!mv.length)throw'empty';
        T.playMove(mv[pickW(mv,inner)]);
        drain();if(++inner>4000)throw'inner';
      }
    }else if(T.G.turn===T.W&&T.G.phase==='pass')T.passTurn();
    if(++guard>8000)throw'guard';
  }
}
// Build per-player dice lists from a turnLog (hand-off entries carry no roll)
function perPlayerDice(log){
  const w=[],k=[];
  for(const e of log){if(e.handover)continue;(e.turn===T.W?w:k).push(e.dice.join('-'));}
  return{w,k};
}
function logSig(log){return log.filter(e=>!e.handover).map(e=>e.turn+e.dice.join('')+'|'+(e.moves||[]).map(m=>(m.from)+'>'+(m.off?'off':m.to)).join(',')).join(';');}

let pass=0,fail=0;
function check(name,cond){if(cond){pass++;}else{fail++;console.log('  FAIL:',name);}}

for(const VARIANT of ['backgammon','tapa','gulbara'])
for(let trial=0;trial<5;trial++){
  T.newGame(VARIANT);T.G.statsOn=false;
  // Original game: always pick first legal move (deterministic-ish given dice)
  playOut(()=>0);
  const origGame=T.G.savedGames[0];
  const origLog=origGame.turnLog.slice();
  const origSig=logSig(origLog);
  const origPP=perPlayerDice(origLog);

  check('one saved game after first play',T.G.savedGames.length===1);
  check('original has turns',origLog.length>2);

  // Branch from a mid turn (~40% in), choosing a White turn so we can play differently
  let bn=Math.max(1,Math.floor(origLog.length*0.4));
  while(bn<origLog.length-1 && (origLog[bn].handover||!origLog[bn].dice)) bn++; // land on a real roll, not a hand-off
  T.branchFromTurn(0,bn);
  check('branchFrom set',T.G.branchFrom===bn);
  check('board restored to boardBefore',JSON.stringify(T.G.board)===JSON.stringify(origLog[bn].boardBefore));
  check('turn restored',T.G.turn===origLog[bn].turn);
  check('dice restored',T.G.dice.join('-')===origLog[bn].dice.join('-'));
  check('context turns count (bn + freshly-started branch turn)',T.G.turnLog.length===bn+1);
  check('context turns CONTENT matches original',logSig(T.G.turnLog.slice(0,bn))===logSig(origLog.slice(0,bn)));

  // Play the branch with a DIFFERENT policy (pick last legal move when possible)
  playOut((mv)=>mv.length-1);
  check('two saved games after branch',T.G.savedGames.length===2);

  // CRITICAL 1: original game's saved log is byte-for-byte unchanged
  check('original log UNCHANGED after branch',logSig(T.G.savedGames[0].turnLog)===origSig);

  // CRITICAL 2: dice guarantee — same player gets same dice on their Nth turn
  const branchLog=T.G.savedGames[1].turnLog;
  const branchPP=perPlayerDice(branchLog);
  let diceOK=true;
  for(let i=0;i<Math.min(origPP.w.length,branchPP.w.length);i++) if(origPP.w[i]!==branchPP.w[i])diceOK=false;
  for(let i=0;i<Math.min(origPP.k.length,branchPP.k.length);i++) if(origPP.k[i]!==branchPP.k[i])diceOK=false;
  check('per-player dice identical across branch',diceOK);

  // CRITICAL 3: the branch actually diverged (different move sequence) at/after branch point
  // (only assert when the branch had a real choice; otherwise skip)
  const diverged=logSig(branchLog)!==origSig;
  // not a hard requirement every trial, but track
  if(!diverged && trial===0) console.log('  (note: trial',trial,'branch identical — no alt move existed)');

  // CRITICAL 4: branch a SECOND time from the original; original still intact, 3 games total
  const origSig2=logSig(T.G.savedGames[0].turnLog);
  T.branchFromTurn(0,Math.max(1,bn-1));
  playOut(()=>0);
  check('three saved games after 2nd branch',T.G.savedGames.length===3);
  check('original STILL unchanged after 2nd branch',logSig(T.G.savedGames[0].turnLog)===origSig2 && origSig2===origSig);
}
console.log(pass+' passed, '+fail+' failed (across backgammon, tapa, gulbara)');
