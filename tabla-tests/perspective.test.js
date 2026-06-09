const fs=require("fs");let app=fs.readFileSync(require('path').join(__dirname,'app2.js'),"utf8");
app+="\nglobalThis.__T={G,setupBoard,startGame,revealRoll,offered,playMove,finalize,passTurn,afterTurn,aiPlay,render,renderPanel,W,K,winner,nextLegalMoves,cur};";
const stubs={};function el(id){return stubs[id]||(stubs[id]={innerHTML:"",textContent:"",value:"",checked:false,disabled:false,dataset:{},style:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},addEventListener(){},removeEventListener(){},closest(){return null;},querySelector(){return null;},querySelectorAll(){return[];},appendChild(){},setAttribute(){},getAttribute(){return null;}});}
globalThis.document={getElementById:el,createElement:()=>el("x"),addEventListener(){},querySelector(){return null;},querySelectorAll(){return[];}};
globalThis._Q=[];globalThis.setTimeout=(fn)=>{globalThis._Q.push(fn);return 0;};globalThis.clearTimeout=()=>{};globalThis.setInterval=()=>0;globalThis.clearInterval=()=>{};
globalThis.window={addEventListener:()=>{}};globalThis.requestAnimationFrame=fn=>{globalThis._Q.push(fn);return 0;};
eval(app);const T=globalThis.__T;const G=T.G;
function drain(){let n=0;while(globalThis._Q.length){globalThis._Q.shift()();if(++n>3000)throw"FLOOD";}}
let pass=0,fail=0;function ok(c,m){if(c)pass++;else{fail++;console.log("FAIL: "+m);}}
// Human plays BLACK; Black starts the opening
T.setupBoard("backgammon");
T.startGame(T.K, T.K, [3,1]);
ok(G.human===T.K,"human=K");
ok(G.ai===T.W,"ai=W");
ok(G.flipped===true,"board flipped for black");
ok(G.turn===T.K,"black to move first");
ok(G.phase==="roll","human(black) must roll");
// render + panel must not throw, and panel must show "You" tied to black
G.statsOn=true;
let threw=false;try{T.render();T.renderPanel(G.board);}catch(e){threw=true;console.log("RENDER THREW:",e.message);}
ok(!threw,"render+panel run for black human");
const panelHtml=stubs.panel?stubs.panel.innerHTML:"";
ok(/You &middot; pip/.test(panelHtml),"panel labels human column 'You'");
ok(/White &middot; pip/.test(panelHtml),"panel labels opponent 'White' when human is black");
// drive ~5 turns (human black + AI white), ensure no crash / no flood
let guard=0;
while(!T.winner(G.board)&&guard++<6){
  if(G.turn===G.human&&!G.spectate){
    if(G.phase==="roll"){T.revealRoll();}
    let steps=0;
    while(G.phase==="move"&&steps++<8){
      const mv=T.offered();
      if(mv.length===0)break;
      T.playMove(mv[0]);
    }
    if(G.phase==="move")T.finalize&&T.finalize();
    if(G.phase==="pass")T.passTurn();
    drain();
  }else{drain();}
}
ok(guard>1,"several turns advanced without flood (guard="+guard+")");
ok(true,"no crash through "+guard+" turns; winner="+(T.winner(G.board)||"none"));
console.log((fail?"FAILED ":"OK ")+pass+" passed, "+fail+" failed");
