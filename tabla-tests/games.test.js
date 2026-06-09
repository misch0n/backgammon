const fs=require('fs');
let app=fs.readFileSync(require('path').join(__dirname,'app2.js'),'utf8');
app+="\nglobalThis.__T={G,offered,playMove,passTurn,newGame,W,K,winner,revealRoll};";
const stubs={};
function el(id){ return stubs[id]||(stubs[id]={innerHTML:'',textContent:'',checked:false,dataset:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},closest(){return null;},querySelectorAll(){return [];}}); }
globalThis.document={getElementById:el,addEventListener(){}};
globalThis._Q=[]; globalThis.setTimeout=(fn)=>{globalThis._Q.push(fn);return 0;};
globalThis.window={addEventListener:(ev,fn)=>{if(ev==='load') window._load=fn;}};
eval(app); const T=globalThis.__T;
function drain(){let n=0;while(globalThis._Q.length){globalThis._Q.shift()();if(++n>1e5)throw'flood';}}
for(const variant of ['backgammon','gulbara','tapa']){
  T.newGame(variant);
  T.G.statsOn=false; // disable expensive stats during harness
  let ok=0,err=0,wW=0,wK=0,dr=0;
  for(let g=0;g<12;g++){
    try{
      T.newGame(variant); T.G.statsOn=false;
      let guard=0;
      while(!T.G.gameOver){
        drain(); if(T.G.gameOver) break;
        if(T.G.turn===T.W && T.G.phase==='roll'){ T.revealRoll(); }
        else if(T.G.turn===T.W && T.G.phase==='move'){
          let inner=0;
          while(T.G.turn===T.W && T.G.phase==='move' && !T.G.gameOver){
            const mv=T.offered(); if(!mv.length) throw 'empty offered';
            T.playMove(mv[Math.floor(Math.random()*mv.length)]);
            drain(); if(++inner>4000) throw 'inner';
          }
        } else if(T.G.turn===T.W && T.G.phase==='pass') T.passTurn();
        if(++guard>8000) throw 'guard';
      }
      const w=T.winner(T.G.board); if(w==='w') wW++; else if(w==='k') wK++; else dr++;
      ok++;
    }catch(e){ err++; console.log(' ',variant,g,e&&e.message||e); }
  }
  console.log(`${variant}: ${ok}/12, You ${wW} AI ${wK} Draw ${dr}`);
}
