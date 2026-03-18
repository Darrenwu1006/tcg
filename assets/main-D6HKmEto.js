var p=Object.defineProperty;var u=(i,e,t)=>e in i?p(i,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):i[e]=t;var l=(i,e,t)=>u(i,typeof e!="symbol"?e+"":e,t);import{C as h,S as m,G as k,a as v}from"./CardDetailPanel-B7IVhlZs.js";class f{constructor(e){l(this,"element");l(this,"store");l(this,"meDeckLoaded",!1);l(this,"opDeckLoaded",!1);l(this,"firstPlayerDecided",!1);l(this,"availableDecks",[]);this.store=e,this.element=document.createElement("div"),this.element.className="setup-overlay",this.loadDatabase(),this.render()}async loadDatabase(){const e=h.getInstance();await e.loadAll(),console.log("CardDatabase ready"),this.availableDecks=await e.getAvailableDecks(),this.render(),this.loadDefaultDecks()}render(){const e=this.availableDecks.map(t=>`<option value="${t.path}">${t.school} - ${t.name}</option>`).join("");this.element.innerHTML=`
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
    `,this.attachEvents()}attachEvents(){const e=this.element.querySelector("#me-deck-select"),t=this.element.querySelector("#op-deck-select"),s=this.element.querySelector("#coin-toss-btn"),n=this.element.querySelector("#start-game-btn");e==null||e.addEventListener("change",a=>this.handleDeckSelection(a,"me")),t==null||t.addEventListener("change",a=>this.handleDeckSelection(a,"opponent")),s==null||s.addEventListener("click",()=>{const a=Math.random()<.5?"me":"opponent";this.store.setState({firstPlayer:a});const o=this.element.querySelector("#toss-result");o&&(o.textContent=a==="me"?"Me":"Opponent",o.className="result decided"),this.firstPlayerDecided=!0,this.checkReady()}),n==null||n.addEventListener("click",()=>{this.startGame()})}async handleDeckSelection(e,t){const n=e.target.value;if(!n){t==="me"?this.meDeckLoaded=!1:this.opDeckLoaded=!1,this.updateStatus(t,"Not Selected"),this.checkReady();return}const a=this.availableDecks.find(o=>o.path===n);if(a)try{const c=await h.getInstance().loadDeck(a.loader);c.length>0&&(t==="me"?(this.store.setState({me:{...this.store.getState().me,deck:c,school:a.school}}),this.meDeckLoaded=!0):(this.store.setState({opponent:{...this.store.getState().opponent,deck:c,school:a.school}}),this.opDeckLoaded=!0),this.updateStatus(t,`已載入: ${a.name} (${c.length} 張卡片)`),this.checkReady())}catch(o){console.error(`Failed to load deck for ${t}:`,o),this.updateStatus(t,"載入失敗"),t==="me"?this.meDeckLoaded=!1:this.opDeckLoaded=!1,this.checkReady()}}async loadDefaultDecks(){const e=this.availableDecks.find(t=>t.school==="青葉城西"&&t.name.includes("快攻軸"));if(!e){console.warn("Default deck not found");return}try{const t=h.getInstance(),[s,n]=await Promise.all([t.loadDeck(e.loader),t.loadDeck(e.loader)]);if(s.length>0){this.store.setState({me:{...this.store.getState().me,deck:s,school:e.school}}),this.meDeckLoaded=!0,this.updateStatus("me",`Loaded: ${e.name} (${s.length} cards)`);const a=this.element.querySelector("#me-deck-select");a&&(a.value=e.path)}if(n.length>0){this.store.setState({opponent:{...this.store.getState().opponent,deck:n,school:e.school}}),this.opDeckLoaded=!0,this.updateStatus("opponent",`Loaded: ${e.name} (${n.length} cards)`);const a=this.element.querySelector("#op-deck-select");a&&(a.value=e.path)}this.checkReady()}catch(t){console.error("Failed to load default decks:",t)}}updateStatus(e,t){const s=e==="me"?"me-deck-status":"op-deck-status",n=this.element.querySelector(`#${s}`);n&&(n.textContent=t)}checkReady(){const e=this.element.querySelector("#start-game-btn");this.meDeckLoaded&&this.opDeckLoaded&&this.firstPlayerDecided&&(e.disabled=!1)}startGame(){const e=this.store.getState(),t=this.shuffle([...e.me.deck]),s=this.shuffle([...e.opponent.deck]),n=t.splice(0,6),a=s.splice(0,6),o=t.splice(0,2),c=s.splice(0,2);this.store.setState({gamePhase:"playing",me:{...e.me,deck:t,hand:n,set:o},opponent:{...e.opponent,deck:s,hand:a,set:c}}),this.element.style.display="none"}shuffle(e){for(let t=e.length-1;t>0;t--){const s=Math.floor(Math.random()*(t+1));[e[t],e[s]]=[e[s],e[t]]}return e}getElement(){return this.element}}class b{constructor(e){l(this,"element");l(this,"store");l(this,"meBaseAttack",0);l(this,"meBaseDefense",0);l(this,"opBaseAttack",0);l(this,"opBaseDefense",0);l(this,"meManualAttack",0);l(this,"meManualDefense",0);l(this,"opManualAttack",0);l(this,"opManualDefense",0);this.store=e,this.element=document.createElement("div"),this.element.className="stats-panel",this.render(),this.attachEvents(),this.setupSubscription()}setupSubscription(){this.store.subscribe(e=>{const t=e.me.currentStats;t&&(this.meBaseAttack=(t.serve||0)+(t.attack||0)+(t.toss||0),this.meBaseDefense=(t.block||0)+(t.receive||0));const s=e.opponent.currentStats;s&&(this.opBaseAttack=(s.serve||0)+(s.attack||0)+(s.toss||0),this.opBaseDefense=(s.block||0)+(s.receive||0)),this.updateAllDisplays(),this.renderLogs(e.logs)})}render(){this.element.innerHTML=`
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
    `}renderLogs(e){const t=this.element.querySelector("#game-log-container");if(t){if(!e||e.length===0){t.innerHTML="<div class='log-entry empty'>No actions yet</div>";return}t.innerHTML=e.map(s=>`<div class="log-entry">${s}</div>`).join("")}}attachEvents(){this.element.addEventListener("click",e=>{const t=e.target;if(t.classList.contains("reset-stats-btn")){const s=t.getAttribute("data-target");s==="me"?(this.meManualAttack=-this.meBaseAttack,this.meManualDefense=-this.meBaseDefense,this.store.addLog("Me reset their stats.")):s==="op"&&(this.opManualAttack=-this.opBaseAttack,this.opManualDefense=-this.opBaseDefense,this.store.addLog("Opponent stats were reset.")),this.updateAllDisplays();return}if(t.classList.contains("stat-btn")){const s=t.getAttribute("data-target"),n=t.getAttribute("data-type"),a=t.getAttribute("data-op");s==="me"?n==="attack"?this.meManualAttack+=a==="plus"?1:-1:this.meManualDefense+=a==="plus"?1:-1:n==="attack"?this.opManualAttack+=a==="plus"?1:-1:this.opManualDefense+=a==="plus"?1:-1,this.updateAllDisplays()}})}updateAllDisplays(){this.updateDisplay("me","attack",this.meBaseAttack+this.meManualAttack),this.updateDisplay("me","defense",this.meBaseDefense+this.meManualDefense),this.updateDisplay("op","attack",this.opBaseAttack+this.opManualAttack),this.updateDisplay("op","defense",this.opBaseDefense+this.opManualDefense)}updateDisplay(e,t,s){const n=this.element.querySelector(`#${e}-${t}-val`);n&&(n.textContent=s.toString())}getElement(){return this.element}}const g={viewPerspective:"me",gamePhase:"setup",firstPlayer:null,selectedCard:null,playingCard:null,me:{deck:[],hand:[],set:[],drop:[],field:[],school:"seijoh"},opponent:{deck:[],hand:[],set:[],drop:[],field:[],school:"karasuno"},logs:[],turnPlayer:"me",phase:"draw",battleState:{isAttacking:!1,defenseChoice:"none",attacker:null},winCount:{me:0,opponent:0},selectedCards:[],matchWinner:null},r=new m(g),d=document.querySelector("#app");if(d){d.innerHTML="",d.className="app-container";const i=new b(r),e=new k(r),t=new v(r),s=new f(r);d.appendChild(i.getElement()),d.appendChild(e.getElement()),d.appendChild(t.getElement()),document.body.appendChild(s.getElement())}
