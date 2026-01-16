var T=Object.defineProperty;var w=(u,e,s)=>e in u?T(u,e,{enumerable:!0,configurable:!0,writable:!0,value:s}):u[e]=s;var i=(u,e,s)=>w(u,typeof e!="symbol"?e+"":e,s);import{_ as d,S as $,G as I,C as B}from"./CardDetailPanel-yatwvqZ5.js";const v=class v{constructor(){i(this,"cards",new Map);i(this,"loaded",!1)}static getInstance(){return v.instance||(v.instance=new v),v.instance}async loadAll(){if(!this.loaded)try{await this.loadConsolidatedPools(),this.loaded=!0,console.log(`CardDatabase loaded ${this.cards.size} cards.`)}catch(e){console.error("Failed to load card pools:",e)}}resolvePath(e){const s="/tcg/",t=e.startsWith("/")?e.slice(1):e;return`${s.endsWith("/")?s:`${s}/`}${t}`}async loadConsolidatedPools(){const e=this.resolvePath("pool/All_Characters.csv"),s=this.resolvePath("pool/All_Events.csv");try{const[t,n]=await Promise.all([fetch(e),fetch(s)]);if(t.ok){const a=await t.text();this.parsePoolCSV(a,"CHARACTER")}if(n.ok){const a=await n.text();this.parsePoolCSV(a,"EVENT")}console.log("Loaded consolidated pools")}catch(t){console.error("Failed to load consolidated pools:",t)}}parsePoolCSV(e,s){var n,a,o,c,r,h,m,g,f,b,L,P;const t=e.split(`
`);for(let A=1;A<t.length;A++){const C=t[A].trim();if(!C)continue;const l=this.parseCSVLine(C);if(l.length<4)continue;const M=(n=l[0])==null?void 0:n.trim(),D=(a=l[2])==null?void 0:a.trim(),E=(o=l[3])==null?void 0:o.trim();if(!D||!E)continue;const p=_=>{if(!_||_.trim()==="-"||_.trim()==="")return null;const R=parseInt(_.trim());return isNaN(R)?null:R};s==="CHARACTER"?this.cards.set(D,{id:D,name:E,type:"CHARACTER",school:M,timing:((c=l[4])==null?void 0:c.trim())||"-",rarity:((r=l[5])==null?void 0:r.trim())||"-",role:((h=l[6])==null?void 0:h.trim())||"-",stats:{serve:p(l[7]),block:p(l[8]),receive:p(l[9]),toss:p(l[10]),attack:p(l[11])},skill:((m=l[12])==null?void 0:m.trim())||"-",note:((g=l[13])==null?void 0:g.trim())||"-"}):this.cards.set(D,{id:D,name:E,type:"EVENT",school:M,rarity:((f=l[4])==null?void 0:f.trim())||"-",timing:((b=l[5])==null?void 0:b.trim())||"-",role:"-",stats:{serve:p(l[6]),block:p(l[7]),receive:p(l[8]),toss:p(l[9]),attack:p(l[10])},skill:((L=l[11])==null?void 0:L.trim())||"-",note:((P=l[12])==null?void 0:P.trim())||"-"})}}parseCSVLine(e){const s=[];let t="",n=!1;for(let a=0;a<e.length;a++){const o=e[a];o==='"'?n=!n:o===","&&!n?(s.push(t),t=""):t+=o}return s.push(t),s}getCard(e){return this.cards.get(e)}getAllCards(){return Array.from(this.cards.values())}getTotalCardCount(e){var n;const s=e.split(`
`);let t=0;for(let a=1;a<s.length;a++){const o=s[a].trim();if(!o)continue;const c=o.split(",");if(c.length<2)continue;let r=0;if(c.length>=3){const h=(n=c[2])==null?void 0:n.trim();if(h){const m=parseInt(h);isNaN(m)||(r=m)}}t+=r}return t}async getAvailableDecks(){const e=Object.assign({"/src/assets/decks/梟谷/template.csv":()=>d(()=>import("./template-YZRRei5E.js"),[]).then(t=>t.default),"/src/assets/decks/梟谷/爆發軸二.csv":()=>d(()=>import("./爆發軸二-DRygAH0m.js"),[]).then(t=>t.default),"/src/assets/decks/梟谷/高爆發軸.csv":()=>d(()=>import("./高爆發軸-OlfSSk9F.js"),[]).then(t=>t.default),"/src/assets/decks/混合學校/template.csv":()=>d(()=>import("./template-BL6p7JrW.js"),[]).then(t=>t.default),"/src/assets/decks/混合學校/垃圾場.csv":()=>d(()=>import("./垃圾場-DLQNSA_3.js"),[]).then(t=>t.default),"/src/assets/decks/烏野/template.csv":()=>d(()=>import("./template-Dl-KCfeZ.js"),[]).then(t=>t.default),"/src/assets/decks/烏野/山月攔網軸.csv":()=>d(()=>import("./山月攔網軸-C9q-UzZd.js"),[]).then(t=>t.default),"/src/assets/decks/烏野/日影攻擊軸.csv":()=>d(()=>import("./日影攻擊軸-B5nYVoJQ.js"),[]).then(t=>t.default),"/src/assets/decks/烏野/預組.csv":()=>d(()=>import("./預組-CkakcnPP.js"),[]).then(t=>t.default),"/src/assets/decks/青葉城西/template.csv":()=>d(()=>import("./template-BgW2zTP9.js"),[]).then(t=>t.default),"/src/assets/decks/青葉城西/中速軸.csv":()=>d(()=>import("./中速軸-Csfw3ekW.js"),[]).then(t=>t.default),"/src/assets/decks/青葉城西/快攻軸.csv":()=>d(()=>import("./快攻軸-BS8Dq3Be.js"),[]).then(t=>t.default),"/src/assets/decks/音駒/template.csv":()=>d(()=>import("./template-CxhDpovY.js"),[]).then(t=>t.default),"/src/assets/decks/音駒/預組.csv":()=>d(()=>import("./預組-1IW_7lEd.js"),[]).then(t=>t.default)}),s=[];for(const t in e){const n=t.split("/"),a=n[n.length-1],o=n[n.length-2],c=a.replace(".csv","");try{const r=await e[t](),h=this.getTotalCardCount(r);h===40&&s.push({school:o,name:c,path:t,loader:e[t],cardCount:h})}catch(r){console.warn(`Failed to load deck at ${t}:`,r)}}return s}async loadDeck(e){try{const s=await e();return this.parseDeckCSV(s)}catch(s){return console.error("Failed to load deck:",s),[]}}parseDeckCSV(e){var n,a;const s=e.split(`
`),t=[];for(let o=1;o<s.length;o++){const c=s[o].trim();if(!c)continue;const r=c.split(",");if(r.length<2)continue;const h=(n=r[1])==null?void 0:n.trim();let m=0;if(r.length>=3){const f=(a=r[2])==null?void 0:a.trim();if(f){const b=parseInt(f);isNaN(b)||(m=b)}}if(!h||m===0)continue;const g=this.getCard(h);if(g)for(let f=0;f<m;f++)t.push({...g,instanceId:crypto.randomUUID()});else console.warn(`Card ID not found in pool: ${h}`)}return t}};i(v,"instance");let y=v;class O{constructor(e){i(this,"element");i(this,"store");i(this,"meDeckLoaded",!1);i(this,"opDeckLoaded",!1);i(this,"firstPlayerDecided",!1);i(this,"availableDecks",[]);this.store=e,this.element=document.createElement("div"),this.element.className="setup-overlay",this.loadDatabase(),this.render()}async loadDatabase(){const e=y.getInstance();await e.loadAll(),console.log("CardDatabase ready"),this.availableDecks=await e.getAvailableDecks(),this.render(),this.loadDefaultDecks()}render(){const e=this.availableDecks.map(s=>`<option value="${s.path}">${s.school} - ${s.name}</option>`).join("");this.element.innerHTML=`
      <div class="setup-container">
        <div class="setup-header">
          <h1 class="retro-title-en">GAME SETUP</h1>
          <h2 class="retro-title-zh">遊戲設定</h2>
        </div>
        
        <div class="setup-section">
          <div class="player-setup">
            <h3 class="retro-subtitle-en">Me (Player)</h3>
            <h4 class="retro-subtitle-zh">我方玩家</h4>
            <div class="deck-select">
              <label>選擇牌組:</label>
              <select id="me-deck-select" class="deck-dropdown">
                <option value="">--- 請選擇 ---</option>
                ${e}
              </select>
              <span id="me-deck-status" class="status">Not Selected</span>
            </div>
          </div>

          <div class="player-setup">
            <h3 class="retro-subtitle-en">Opponent</h3>
            <h4 class="retro-subtitle-zh">對手</h4>
            <div class="deck-select">
              <label>選擇牌組:</label>
              <select id="op-deck-select" class="deck-dropdown">
                <option value="">--- 請選擇 ---</option>
                ${e}
              </select>
              <span id="op-deck-status" class="status">Not Selected</span>
            </div>
          </div>
        </div>

        <div class="setup-section">
          <h3 class="retro-subtitle-en">First Player</h3>
          <h4 class="retro-subtitle-zh">先攻玩家</h4>
          <div class="coin-toss-area">
            <button id="coin-toss-btn" class="btn">Coin Toss</button>
            <span id="toss-result" class="result">?</span>
          </div>
        </div>

        <div class="setup-actions">
          <button id="start-game-btn" class="start-btn" disabled>START GAME</button>
        </div>
      </div>
    `,this.attachEvents()}attachEvents(){const e=this.element.querySelector("#me-deck-select"),s=this.element.querySelector("#op-deck-select"),t=this.element.querySelector("#coin-toss-btn"),n=this.element.querySelector("#start-game-btn");e==null||e.addEventListener("change",a=>this.handleDeckSelection(a,"me")),s==null||s.addEventListener("change",a=>this.handleDeckSelection(a,"opponent")),t==null||t.addEventListener("click",()=>{const a=Math.random()<.5?"me":"opponent";this.store.setState({firstPlayer:a});const o=this.element.querySelector("#toss-result");o&&(o.textContent=a==="me"?"Me":"Opponent",o.className="result decided"),this.firstPlayerDecided=!0,this.checkReady()}),n==null||n.addEventListener("click",()=>{this.startGame()})}async handleDeckSelection(e,s){const n=e.target.value;if(!n){s==="me"?this.meDeckLoaded=!1:this.opDeckLoaded=!1,this.updateStatus(s,"Not Selected"),this.checkReady();return}const a=this.availableDecks.find(o=>o.path===n);if(a)try{const c=await y.getInstance().loadDeck(a.loader);c.length>0&&(s==="me"?(this.store.setState({me:{...this.store.getState().me,deck:c,school:a.school}}),this.meDeckLoaded=!0):(this.store.setState({opponent:{...this.store.getState().opponent,deck:c,school:a.school}}),this.opDeckLoaded=!0),this.updateStatus(s,`已載入: ${a.name} (${c.length} 張卡片)`),this.checkReady())}catch(o){console.error(`Failed to load deck for ${s}:`,o),this.updateStatus(s,"載入失敗"),s==="me"?this.meDeckLoaded=!1:this.opDeckLoaded=!1,this.checkReady()}}async loadDefaultDecks(){const e=this.availableDecks.find(s=>s.school==="青葉城西"&&s.name.includes("快攻軸"));if(!e){console.warn("Default deck not found");return}try{const s=y.getInstance(),[t,n]=await Promise.all([s.loadDeck(e.loader),s.loadDeck(e.loader)]);if(t.length>0){this.store.setState({me:{...this.store.getState().me,deck:t,school:e.school}}),this.meDeckLoaded=!0,this.updateStatus("me",`Loaded: ${e.name} (${t.length} cards)`);const a=this.element.querySelector("#me-deck-select");a&&(a.value=e.path)}if(n.length>0){this.store.setState({opponent:{...this.store.getState().opponent,deck:n,school:e.school}}),this.opDeckLoaded=!0,this.updateStatus("opponent",`Loaded: ${e.name} (${n.length} cards)`);const a=this.element.querySelector("#op-deck-select");a&&(a.value=e.path)}this.checkReady()}catch(s){console.error("Failed to load default decks:",s)}}updateStatus(e,s){const t=e==="me"?"me-deck-status":"op-deck-status",n=this.element.querySelector(`#${t}`);n&&(n.textContent=s)}checkReady(){const e=this.element.querySelector("#start-game-btn");this.meDeckLoaded&&this.opDeckLoaded&&this.firstPlayerDecided&&(e.disabled=!1)}startGame(){const e=this.store.getState(),s=this.shuffle([...e.me.deck]),t=this.shuffle([...e.opponent.deck]),n=s.splice(0,6),a=t.splice(0,6),o=s.splice(0,2),c=t.splice(0,2);this.store.setState({gamePhase:"playing",me:{...e.me,deck:s,hand:n,set:o},opponent:{...e.opponent,deck:t,hand:a,set:c}}),this.element.style.display="none"}shuffle(e){for(let s=e.length-1;s>0;s--){const t=Math.floor(Math.random()*(s+1));[e[s],e[t]]=[e[t],e[s]]}return e}getElement(){return this.element}}class V{constructor(e){i(this,"element");i(this,"store");i(this,"meBaseAttack",0);i(this,"meBaseDefense",0);i(this,"opBaseAttack",0);i(this,"opBaseDefense",0);i(this,"meManualAttack",0);i(this,"meManualDefense",0);i(this,"opManualAttack",0);i(this,"opManualDefense",0);this.store=e,this.element=document.createElement("div"),this.element.className="stats-panel",this.render(),this.attachEvents(),this.setupSubscription()}setupSubscription(){this.store.subscribe(e=>{const s=e.me.currentStats;s&&(this.meBaseAttack=(s.serve||0)+(s.attack||0)+(s.toss||0),this.meBaseDefense=(s.block||0)+(s.receive||0));const t=e.opponent.currentStats;t&&(this.opBaseAttack=(t.serve||0)+(t.attack||0)+(t.toss||0),this.opBaseDefense=(t.block||0)+(t.receive||0)),this.updateAllDisplays(),this.renderLogs(e.logs)})}render(){this.element.innerHTML=`
      <h2>Stats Calculator</h2>
      
      <div class="stats-section me-stats">
        <h3>Me</h3>
        <div class="stat-placeholder">
            <label>Attack</label>
            <div class="stat-controls">
                <button class="stat-btn" data-target="me" data-type="attack" data-op="minus">-</button>
                <div class="value" id="me-attack-val">${this.meBaseAttack+this.meManualAttack}</div>
                <button class="stat-btn" data-target="me" data-type="attack" data-op="plus">+</button>
            </div>
        </div>
        <div class="stat-placeholder">
            <label>Defense</label>
            <div class="stat-controls">
                <button class="stat-btn" data-target="me" data-type="defense" data-op="minus">-</button>
                <div class="value" id="me-defense-val">${this.meBaseDefense+this.meManualDefense}</div>
                <button class="stat-btn" data-target="me" data-type="defense" data-op="plus">+</button>
            </div>
        </div>
        </div>
        <button class="btn reset-stats-btn" data-target="me" style="width: 100%; margin-top: 10px;">Reset Me</button>
      </div>

      <div class="stats-section op-stats">
        <h3>Opponent</h3>
        <div class="stat-placeholder">
            <label>Attack</label>
            <div class="stat-controls">
                <button class="stat-btn" data-target="op" data-type="attack" data-op="minus">-</button>
                <div class="value" id="op-attack-val">${this.opBaseAttack+this.opManualAttack}</div>
                <button class="stat-btn" data-target="op" data-type="attack" data-op="plus">+</button>
            </div>
        </div>
        <div class="stat-placeholder">
            <label>Defense</label>
            <div class="stat-controls">
                <button class="stat-btn" data-target="op" data-type="defense" data-op="minus">-</button>
                <div class="value" id="op-defense-val">${this.opBaseDefense+this.opManualDefense}</div>
                <button class="stat-btn" data-target="op" data-type="defense" data-op="plus">+</button>
            </div>
        </div>
        </div>
        <button class="btn reset-stats-btn" data-target="op" style="width: 100%; margin-top: 10px;">Reset Opp</button>
      </div>



      <div class="game-log-section">
        <h3>Game Log</h3>
        <div class="game-log-container" id="game-log-container">
          <!-- Logs will be rendered here -->
        </div>
      </div>
    `}renderLogs(e){const s=this.element.querySelector("#game-log-container");if(s){if(!e||e.length===0){s.innerHTML="<div class='log-entry empty'>No actions yet</div>";return}s.innerHTML=e.map(t=>`<div class="log-entry">${t}</div>`).join("")}}attachEvents(){this.element.addEventListener("click",e=>{const s=e.target;if(s.classList.contains("reset-stats-btn")){const t=s.getAttribute("data-target");t==="me"?(this.meManualAttack=-this.meBaseAttack,this.meManualDefense=-this.meBaseDefense,this.store.addLog("Me reset their stats.")):t==="op"&&(this.opManualAttack=-this.opBaseAttack,this.opManualDefense=-this.opBaseDefense,this.store.addLog("Opponent stats were reset.")),this.updateAllDisplays();return}if(s.classList.contains("stat-btn")){const t=s.getAttribute("data-target"),n=s.getAttribute("data-type"),a=s.getAttribute("data-op");t==="me"?n==="attack"?this.meManualAttack+=a==="plus"?1:-1:this.meManualDefense+=a==="plus"?1:-1:n==="attack"?this.opManualAttack+=a==="plus"?1:-1:this.opManualDefense+=a==="plus"?1:-1,this.updateAllDisplays()}})}updateAllDisplays(){this.updateDisplay("me","attack",this.meBaseAttack+this.meManualAttack),this.updateDisplay("me","defense",this.meBaseDefense+this.meManualDefense),this.updateDisplay("op","attack",this.opBaseAttack+this.opManualAttack),this.updateDisplay("op","defense",this.opBaseDefense+this.opManualDefense)}updateDisplay(e,s,t){const n=this.element.querySelector(`#${e}-${s}-val`);n&&(n.textContent=t.toString())}getElement(){return this.element}}const N={viewPerspective:"me",gamePhase:"setup",firstPlayer:null,selectedCard:null,playingCard:null,me:{deck:[],hand:[],set:[],drop:[],field:[],school:"seijoh"},opponent:{deck:[],hand:[],set:[],drop:[],field:[],school:"karasuno"},logs:[],turnPlayer:"me",phase:"draw",battleState:{isAttacking:!1,defenseChoice:"none",attacker:null},winCount:{me:0,opponent:0},selectedCards:[],matchWinner:null},S=new $(N),k=document.querySelector("#app");if(k){k.innerHTML="",k.className="app-container";const u=new V(S),e=new I(S),s=new B(S),t=new O(S);k.appendChild(u.getElement()),k.appendChild(e.getElement()),k.appendChild(s.getElement()),document.body.appendChild(t.getElement())}
