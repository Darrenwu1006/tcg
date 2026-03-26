var p=Object.defineProperty;var u=(l,t,e)=>t in l?p(l,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):l[t]=e;var n=(l,t,e)=>u(l,typeof t!="symbol"?t+"":t,e);import{C as h,S as m,G as v,a as k}from"./CardDetailPanel-0ysThmFc.js";class S{constructor(t){n(this,"element");n(this,"store");n(this,"meDeckLoaded",!1);n(this,"opDeckLoaded",!1);n(this,"firstPlayerDecided",!1);n(this,"availableDecks",[]);this.store=t,this.element=document.createElement("div"),this.element.className="setup-overlay",this.loadDatabase(),this.render()}async loadDatabase(){const t=h.getInstance();await t.loadAll(),console.log("CardDatabase ready"),this.availableDecks=await t.getAvailableDecks(),this.render(),this.loadDefaultDecks()}render(){const t=this.availableDecks.map(e=>`<option value="${e.path}">${e.school} - ${e.name}</option>`).join("");this.element.innerHTML=`
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
                ${t}
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
                ${t}
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
    `,this.attachEvents()}attachEvents(){const t=this.element.querySelector("#me-deck-select"),e=this.element.querySelector("#op-deck-select"),s=this.element.querySelector("#coin-toss-btn"),a=this.element.querySelector("#start-game-btn");t==null||t.addEventListener("change",o=>this.handleDeckSelection(o,"me")),e==null||e.addEventListener("change",o=>this.handleDeckSelection(o,"opponent")),s==null||s.addEventListener("click",()=>{const o=Math.random()<.5?"me":"opponent";this.store.setState({firstPlayer:o});const i=this.element.querySelector("#toss-result");i&&(i.textContent=o==="me"?"Me":"Opponent",i.className="result decided"),this.firstPlayerDecided=!0,this.checkReady()}),a==null||a.addEventListener("click",()=>{this.startGame()})}async handleDeckSelection(t,e){const a=t.target.value;if(!a){e==="me"?this.meDeckLoaded=!1:this.opDeckLoaded=!1,this.updateStatus(e,"Not Selected"),this.checkReady();return}const o=this.availableDecks.find(i=>i.path===a);if(o)try{const c=await h.getInstance().loadDeck(o.loader);c.length>0&&(e==="me"?(this.store.setState({me:{...this.store.getState().me,deck:c,school:o.school}}),this.meDeckLoaded=!0):(this.store.setState({opponent:{...this.store.getState().opponent,deck:c,school:o.school}}),this.opDeckLoaded=!0),this.updateStatus(e,`已載入: ${o.name} (${c.length} 張卡片)`),this.checkReady())}catch(i){console.error(`Failed to load deck for ${e}:`,i),this.updateStatus(e,"載入失敗"),e==="me"?this.meDeckLoaded=!1:this.opDeckLoaded=!1,this.checkReady()}}async loadDefaultDecks(){const t=this.availableDecks.find(e=>e.school==="青葉城西"&&e.name.includes("快攻軸"));if(!t){console.warn("Default deck not found");return}try{const e=h.getInstance(),[s,a]=await Promise.all([e.loadDeck(t.loader),e.loadDeck(t.loader)]);if(s.length>0){this.store.setState({me:{...this.store.getState().me,deck:s,school:t.school}}),this.meDeckLoaded=!0,this.updateStatus("me",`Loaded: ${t.name} (${s.length} cards)`);const o=this.element.querySelector("#me-deck-select");o&&(o.value=t.path)}if(a.length>0){this.store.setState({opponent:{...this.store.getState().opponent,deck:a,school:t.school}}),this.opDeckLoaded=!0,this.updateStatus("opponent",`Loaded: ${t.name} (${a.length} cards)`);const o=this.element.querySelector("#op-deck-select");o&&(o.value=t.path)}this.checkReady()}catch(e){console.error("Failed to load default decks:",e)}}updateStatus(t,e){const s=t==="me"?"me-deck-status":"op-deck-status",a=this.element.querySelector(`#${s}`);a&&(a.textContent=e)}checkReady(){const t=this.element.querySelector("#start-game-btn");this.meDeckLoaded&&this.opDeckLoaded&&this.firstPlayerDecided&&(t.disabled=!1)}startGame(){const t=this.store.getState(),e=this.shuffle([...t.me.deck]),s=this.shuffle([...t.opponent.deck]),a=e.splice(0,6),o=s.splice(0,6),i=e.splice(0,2),c=s.splice(0,2);this.store.setState({gamePhase:"playing",me:{...t.me,deck:e,hand:a,set:i},opponent:{...t.opponent,deck:s,hand:o,set:c}}),this.element.style.display="none"}shuffle(t){for(let e=t.length-1;e>0;e--){const s=Math.floor(Math.random()*(e+1));[t[e],t[s]]=[t[s],t[e]]}return t}getElement(){return this.element}}class g{constructor(t){n(this,"element");n(this,"store");n(this,"meStats",{serve:0,toss:0,attack:0,receive:0,block:0});n(this,"opStats",{serve:0,toss:0,attack:0,receive:0,block:0});this.store=t,this.element=document.createElement("div"),this.element.className="stats-panel",this.render(),this.attachEvents(),this.setupSubscription()}setupSubscription(){this.store.subscribe(t=>{this.renderLogs(t.logs)})}render(){this.element.innerHTML=`
      <div class="stats-section me-stats">
        <h3>Me</h3>
        
        <div class="stat-group">
            <div class="stat-group-title">
              <span>攻擊 (Attack)</span>
              <span class="stat-group-total" id="me-attack-total">0</span>
            </div>
            ${this.renderStatRow("me","serve","發球",this.meStats.serve)}
            ${this.renderStatRow("me","toss","舉球",this.meStats.toss)}
            ${this.renderStatRow("me","attack","攻擊",this.meStats.attack)}
        </div>

        <div class="stat-group">
            <div class="stat-group-title">
              <span>防守 (Defense)</span>
              <span class="stat-group-total" id="me-defense-total">0</span>
            </div>
            ${this.renderStatRow("me","receive","接球",this.meStats.receive)}
            ${this.renderStatRow("me","block","攔網",this.meStats.block)}
        </div>
        
        <button class="btn reset-stats-btn" data-target="me" style="width: 100%; margin-top: 10px;">Reset Me</button>
      </div>

      <div class="stats-section op-stats">
        <h3>Opponent</h3>

        <div class="stat-group">
            <div class="stat-group-title">
              <span>攻擊 (Attack)</span>
              <span class="stat-group-total" id="op-attack-total">0</span>
            </div>
            ${this.renderStatRow("op","serve","發球",this.opStats.serve)}
            ${this.renderStatRow("op","toss","舉球",this.opStats.toss)}
            ${this.renderStatRow("op","attack","攻擊",this.opStats.attack)}
        </div>

        <div class="stat-group">
            <div class="stat-group-title">
              <span>防守 (Defense)</span>
              <span class="stat-group-total" id="op-defense-total">0</span>
            </div>
            ${this.renderStatRow("op","receive","接球",this.opStats.receive)}
            ${this.renderStatRow("op","block","攔網",this.opStats.block)}
        </div>

        <button class="btn reset-stats-btn" data-target="op" style="width: 100%; margin-top: 10px;">Reset Opp</button>
      </div>

      <div class="game-log-section">
        <h3>Game Log</h3>
        <div class="game-log-container" id="game-log-container">
          <!-- Logs will be rendered here -->
        </div>
      </div>
    `}renderStatRow(t,e,s,a){return`
      <div class="stat-placeholder">
          <label>${s}</label>
          <div class="stat-controls">
              <button class="stat-btn" data-target="${t}" data-type="${e}" data-op="minus">-</button>
              <div class="value" id="${t}-${e}-val">${a}</div>
              <button class="stat-btn" data-target="${t}" data-type="${e}" data-op="plus">+</button>
          </div>
      </div>
    `}renderLogs(t){const e=this.element.querySelector("#game-log-container");if(e){if(!t||t.length===0){e.innerHTML="<div class='log-entry empty'>No actions yet</div>";return}e.innerHTML=t.map(s=>`<div class="log-entry">${s}</div>`).join("")}}attachEvents(){this.element.addEventListener("click",t=>{const e=t.target;if(e.classList.contains("reset-stats-btn")){const s=e.getAttribute("data-target");s==="me"?(this.meStats={serve:0,toss:0,attack:0,receive:0,block:0},this.store.addLog("Me reset their stats.")):s==="op"&&(this.opStats={serve:0,toss:0,attack:0,receive:0,block:0},this.store.addLog("Opponent stats were reset.")),this.updateAllDisplays();return}if(e.classList.contains("stat-btn")){const s=e.getAttribute("data-target"),a=e.getAttribute("data-type"),i=e.getAttribute("data-op")==="plus"?1:-1;s==="me"?this.meStats[a]+=i:this.opStats[a]+=i,this.updateAllDisplays()}})}updateAllDisplays(){Object.keys(this.meStats).forEach(t=>{this.updateDisplay("me",t,this.meStats[t]),this.updateDisplay("op",t,this.opStats[t])}),this.updateTotalDisplay("me","attack",this.meStats.serve+this.meStats.toss+this.meStats.attack),this.updateTotalDisplay("me","defense",this.meStats.receive+this.meStats.block),this.updateTotalDisplay("op","attack",this.opStats.serve+this.opStats.toss+this.opStats.attack),this.updateTotalDisplay("op","defense",this.opStats.receive+this.opStats.block)}updateTotalDisplay(t,e,s){const a=this.element.querySelector(`#${t}-${e}-total`);a&&(a.textContent=s.toString())}updateDisplay(t,e,s){const a=this.element.querySelector(`#${t}-${e}-val`);a&&(a.textContent=s.toString())}getElement(){return this.element}}const b={viewPerspective:"me",gamePhase:"setup",firstPlayer:null,selectedCard:null,playingCard:null,me:{deck:[],hand:[],set:[],drop:[],field:[],school:"seijoh"},opponent:{deck:[],hand:[],set:[],drop:[],field:[],school:"karasuno"},logs:[],turnPlayer:"me",phase:"draw",battleState:{isAttacking:!1,defenseChoice:"none",attacker:null},winCount:{me:0,opponent:0},selectedCards:[],matchWinner:null},r=new m(b),d=document.querySelector("#app");if(d){d.innerHTML="",d.className="app-container";const l=new g(r),t=new v(r),e=new k(r),s=new S(r);d.appendChild(l.getElement()),d.appendChild(t.getElement()),d.appendChild(e.getElement()),document.body.appendChild(s.getElement())}
