var P=Object.defineProperty;var N=(v,t,e)=>t in v?P(v,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):v[t]=e;var l=(v,t,e)=>N(v,typeof t!="symbol"?t+"":t,e);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))s(a);new MutationObserver(a=>{for(const n of a)if(n.type==="childList")for(const i of n.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&s(i)}).observe(document,{childList:!0,subtree:!0});function e(a){const n={};return a.integrity&&(n.integrity=a.integrity),a.referrerPolicy&&(n.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?n.credentials="include":a.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(a){if(a.ep)return;a.ep=!0;const n=e(a);fetch(a.href,n)}})();const w=class w{constructor(t){l(this,"state");l(this,"listeners",[]);l(this,"history",[]);this.state={...t,logs:[]}}getState(){return this.state}setState(t,e=!0){e&&(this.history.push({...this.state}),this.history.length>w.MAX_HISTORY&&this.history.shift()),this.state={...this.state,...t},this.notify()}undo(){if(this.history.length===0)return;const t=this.history.pop();t&&(this.state=t,this.notify())}addLog(t){const a=[`[${new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"})}] ${t}`,...this.state.logs||[]].slice(0,50);this.setState({logs:a},!1)}getNewLogs(t){return[`[${new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"})}] ${t}`,...this.state.logs||[]].slice(0,50)}subscribe(t){return this.listeners.push(t),()=>{this.listeners=this.listeners.filter(e=>e!==t)}}notify(){this.listeners.forEach(t=>t(this.state))}};l(w,"MAX_HISTORY",20);let T=w;class C{static render(t,e=!1,s="karasuno"){if(e)return`
        <div class="card back ${s}">
          <div class="card-back-design">
             <div class="school-name">${s==="seijoh"?"Aoba Johsai":s==="karasuno"?"Karasuno":s==="nekoma"?"Nekoma":s==="fukurodani"?"Fukurodani":"Unknown"}</div>
          </div>
        </div>
      `;const a=t.type==="EVENT",n=t.stats||{serve:0,block:0,receive:0,toss:0,attack:0},i=c=>c===null?"-":c??0,o=a?"":`
        <div class="card-stats">
          <div class="stat serve">S:${i(n.serve)}</div>
          <div class="stat block">B:${i(n.block)}</div>
          <div class="stat receive">R:${i(n.receive)}</div>
          <div class="stat toss">T:${i(n.toss)}</div>
          <div class="stat attack">A:${i(n.attack)}</div>
        </div>
      `;return`
      <div class="card ${a?"event":"character"}" data-id="${t.id}">
        <div class="card-header">
          <div class="card-name">${t.name}</div>
        </div>
        ${o}
      </div>
    `}}class H{constructor(t,e){l(this,"element");l(this,"playerType");l(this,"store");this.playerType=t,this.store=e,this.element=document.createElement("div"),this.element.className=`player-zone ${this.playerType}`,this.render(),this.setupSubscription()}setupSubscription(){this.store.subscribe(t=>{this.updateCounts(t)})}updateCounts(t){const e=this.playerType==="me"?t.me:t.opponent;try{const s=this.element.querySelector(".set-area"),a=this.element.querySelector(".deck-slot"),n=this.playerType==="me"?t.me.school:t.opponent.school;if(s){s.querySelectorAll(".set-card, .slot").forEach(u=>u.remove());const r=s.querySelector("h2");s.innerHTML="",r&&s.appendChild(r);const p=document.createElement("div");if(p.className="set-cards-container",s.appendChild(p),e.set.length>0)e.set.forEach(u=>{const m=C.render(u,!0,n),b=document.createElement("div");b.innerHTML=m;const k=b.firstElementChild;k.classList.add("set-card");const E=this.store.getState();this.playerType===E.viewPerspective&&(k.addEventListener("click",()=>{confirm("Add this card to your hand?")&&this.moveSetCardToHand(u)}),k.style.cursor="pointer"),p.appendChild(k)});else{const u=document.createElement("div");u.className="slot set-card-slot",u.setAttribute("data-pos","set"),u.textContent="Set",p.appendChild(u)}}if(a&&(a.innerHTML="Deck",e.deck.length>0)){const d=C.render(e.deck[0],!0,n),r=document.createElement("div");r.innerHTML=d,a.appendChild(r.firstElementChild)}const i=this.element.querySelector(".set-area .count"),o=this.element.querySelector(".deck-area .count"),c=this.element.querySelector(".drop-area .count");i&&(i.textContent=e.set.length.toString()),o&&(o.textContent=e.deck.length.toString()),c&&(c.textContent=e.drop.length.toString())}catch(s){console.error("Error updating counts:",s)}this.updateHand(e.hand,t.playingCard),this.updateField(e.field)}moveSetCardToHand(t){const s=this.store.getState()[this.playerType],a=s.set.filter(i=>i.instanceId!==t.instanceId),n=[...s.hand,t];this.store.setState({[this.playerType]:{...s,set:a,hand:n}})}attachDrawEvent(){const t=this.element.querySelector(".draw-btn");t==null||t.addEventListener("click",()=>{const e=this.store.getState();if(this.playerType!==e.viewPerspective)return;const s=e[this.playerType],a=[...s.deck];if(a.length===0){alert("Deck is empty!");return}const n=a.shift();if(n){const i=[...s.hand,n];this.store.setState({[this.playerType]:{...s,deck:a,hand:i}})}})}updateHand(t,e){const s=this.element.querySelector(".hand-cards");if(!s)return;const a=this.store.getState(),n=this.playerType==="me"?a.me.school:a.opponent.school,i=this.playerType===a.viewPerspective;s.innerHTML="",t.forEach(o=>{const c=C.render(o,!i,n),d=document.createElement("div");d.innerHTML=c;const r=d.firstElementChild;i&&(r.addEventListener("contextmenu",p=>{p.preventDefault(),this.store.setState({selectedCard:o})}),r.addEventListener("click",()=>{e&&e.instanceId===o.instanceId?this.store.setState({playingCard:null}):this.store.setState({playingCard:o})}),e&&e.instanceId===o.instanceId&&r.classList.add("playing")),s.appendChild(r)})}updateField(t){this.element.querySelectorAll(".slot").forEach(s=>{const a=s.querySelector(".card");a&&a.remove()}),t.forEach(s=>{if(!s.position)return;const a=this.element.querySelector(`.${s.position}-slot`);if(a){const n=this.store.getState(),i=this.playerType==="opponent"?n.opponent.school:n.me.school,o=C.render(s,!1,i),c=document.createElement("div");c.innerHTML=o;const d=c.firstElementChild;d.addEventListener("contextmenu",r=>{r.preventDefault(),r.stopPropagation(),this.store.setState({selectedCard:s})}),a.appendChild(d)}})}render(){this.element.innerHTML=`
      <div class="left-side container">
        <div class="info-area">
          <h3>Info</h3>
          <div class="info-content">Phase: Main</div>
        </div>
        <div class="set-area">
          <h2>Set Area <span class="count">0</span></h2>
          <div class="slot set-card-slot" data-pos="set">Set</div>
        </div>
        <div class="function-area">
          <button class="btn shuffle-btn">Shuffle</button>
          <button class="btn back-btn">Back</button>
        </div>
      </div>

      <div class="center-court">
        <div class="court-area">
          <!-- Left: Serve -->
          <div class="serve-container">
            <div class="slot serve-slot" data-pos="serve">Serve</div>
          </div>

          <!-- Center: 2x3 Grid -->
          <div class="central-grid">
            <div class="row top-row block-row">
              <div class="slot block-left-slot" data-pos="block-left">Side</div>
              <div class="slot block-center-slot" data-pos="block-center">Center</div>
              <div class="slot block-right-slot" data-pos="block-right">Side</div>
            </div>
            <div class="row mid-row action-row">
              <div class="slot receive-slot" data-pos="receive">Receive</div>
              <div class="slot toss-slot" data-pos="toss">Toss</div>
              <div class="slot attack-slot" data-pos="attack">Attack</div>
            </div>
          </div>

          <!-- Right: Event -->
          <div class="event-container">
            <div class="slot event-slot" data-pos="event">Event</div>
          </div>
        </div>

        <div class="hand-area">
           <div class="hand-cards">Hand Area</div>
        </div>
      </div>

      <div class="right-side container">
        <div class="deck-area">
          <h2>Deck <span class="count">0</span></h2>
          <div class="slot deck-slot">Deck</div>
          <button class="btn draw-btn">Draw</button>
        </div>
        <div class="drop-area">
          <h2>Drop <span class="count">0</span></h2>
          <div class="slot drop-slot">Drop</div>
        </div>
      </div>
    `,this.attachSlotEvents(),this.attachDrawEvent(),this.attachFunctionEvents()}attachFunctionEvents(){const t=this.element.querySelector(".shuffle-btn"),e=this.element.querySelector(".back-btn");t==null||t.addEventListener("click",()=>{const s=this.store.getState();if(this.playerType!==s.viewPerspective)return;const a=s[this.playerType],n=this.shuffle([...a.deck]);this.store.setState({[this.playerType]:{...a,deck:n},logs:this.store.getNewLogs(`${this.playerType==="me"?"我方":"對手"} 洗切了牌庫`)})}),e==null||e.addEventListener("click",()=>{const s=this.store.getState();this.playerType===s.viewPerspective&&this.store.undo()})}shuffle(t){for(let e=t.length-1;e>0;e--){const s=Math.floor(Math.random()*(e+1));[t[e],t[s]]=[t[s],t[e]]}return t}attachSlotEvents(){this.element.querySelectorAll(".slot").forEach(e=>{e.addEventListener("click",()=>{const s=this.store.getState();if(this.playerType!==s.viewPerspective)return;const a=s.playingCard,n=e.getAttribute("data-pos");if(a){if(e.classList.contains("deck-slot")){this.moveCard(a,"deck");return}if(e.classList.contains("drop-slot")){this.moveCard(a,"drop");return}}a&&n&&this.moveCard(a,n)})})}moveCard(t,e){const a=this.store.getState()[this.playerType],n=a.hand.find(m=>m.instanceId===t.instanceId),i=a.field.find(m=>m.instanceId===t.instanceId);if(!n&&!i){alert("Can only move cards from your Hand or Field.");return}let o=[...a.hand],c=[...a.field],d=[...a.deck],r=[...a.drop];n?o=o.filter(m=>m.instanceId!==t.instanceId):i&&(c=c.filter(m=>m.instanceId!==t.instanceId));let p="";e==="deck"?(d=[...d,t],p=`將 ${t.name} 放回牌庫`):e==="drop"?(r=[...r,t],p=`將 ${t.name} 放入棄牌區`):(c=[...c,{...t,position:e}],p=`將 ${t.name} 放置於 ${e}`);const u=this.calculateStats(c);this.store.setState({[this.playerType]:{...a,hand:o,field:c,deck:d,drop:r,currentStats:u},playingCard:null,logs:this.store.getNewLogs(`${this.playerType==="me"?"我方":"對手"} ${p}`)})}calculateStats(t){const e={serve:0,block:0,receive:0,toss:0,attack:0};return t.forEach(s=>{!s.stats||!s.position||(s.position==="serve"&&(e.serve+=s.stats.serve||0),s.position.startsWith("block")&&(e.block+=s.stats.block||0),s.position==="receive"&&(e.receive+=s.stats.receive||0),s.position==="toss"&&(e.toss+=s.stats.toss||0),s.position==="attack"&&(e.attack+=s.stats.attack||0))}),e}getElement(){return this.element}}class I{constructor(t){l(this,"element");l(this,"store");l(this,"opponentZone");l(this,"meZone");this.store=t,this.element=document.createElement("div"),this.element.className="game-board",this.opponentZone=new H("opponent",this.store),this.meZone=new H("me",this.store),this.render(),this.setupSubscription()}setupSubscription(){this.store.subscribe(t=>{this.updatePerspective(t.viewPerspective)})}updatePerspective(t){t==="opponent"?this.element.classList.add("rotated"):this.element.classList.remove("rotated")}render(){this.element.appendChild(this.opponentZone.getElement());const t=document.createElement("div");t.className="net",this.element.appendChild(t),this.element.appendChild(this.meZone.getElement());const e=document.createElement("button");e.className="switch-view-btn",e.innerText="Switch View",e.onclick=()=>{const s=this.store.getState().viewPerspective;this.store.setState({viewPerspective:s==="me"?"opponent":"me"})},document.body.appendChild(e)}getElement(){return this.element}}const y=class y{constructor(){l(this,"cards",new Map);l(this,"loaded",!1)}static getInstance(){return y.instance||(y.instance=new y),y.instance}async loadAll(){if(!this.loaded)try{const t=["青葉城西","烏野","音駒"];for(const e of t)await this.loadSchoolPool(e);this.loaded=!0,console.log(`CardDatabase loaded ${this.cards.size} cards from ${t.length} school(s).`)}catch(t){console.error("Failed to load card pools:",t)}}async loadSchoolPool(t){const e=`/pool/${t}/${t}卡表 - 卡池_角色卡.csv`,s=`/pool/${t}/${t}卡表 - 卡池_事件卡.csv`;try{const[a,n]=await Promise.all([fetch(e),fetch(s)]);if(a.ok){const i=await a.text();this.parsePoolCSV(i,"CHARACTER")}if(n.ok){const i=await n.text();this.parsePoolCSV(i,"EVENT")}console.log(`Loaded pool for ${t}`)}catch(a){console.error(`Failed to load pool for ${t}:`,a)}}parsePoolCSV(t,e){var a,n,i,o,c,d,r,p,u,m,b;const s=t.split(`
`);for(let k=1;k<s.length;k++){const E=s[k].trim();if(!E)continue;const h=this.parseCSVLine(E);if(h.length<3)continue;const S=(a=h[1])==null?void 0:a.trim(),A=(n=h[2])==null?void 0:n.trim();if(!S||!A)continue;const f=L=>{if(!L||L.trim()==="-"||L.trim()==="")return null;const M=parseInt(L.trim());return isNaN(M)?null:M};e==="CHARACTER"?this.cards.set(S,{id:S,name:A,type:"CHARACTER",timing:((i=h[3])==null?void 0:i.trim())||"-",rarity:((o=h[4])==null?void 0:o.trim())||"-",role:((c=h[5])==null?void 0:c.trim())||"-",stats:{serve:f(h[6]),block:f(h[7]),receive:f(h[8]),toss:f(h[9]),attack:f(h[10])},skill:((d=h[11])==null?void 0:d.trim())||"-",note:((r=h[12])==null?void 0:r.trim())||"-"}):this.cards.set(S,{id:S,name:A,type:"EVENT",rarity:((p=h[3])==null?void 0:p.trim())||"-",timing:((u=h[4])==null?void 0:u.trim())||"-",role:"-",stats:{serve:f(h[5]),block:f(h[6]),receive:f(h[7]),toss:f(h[8]),attack:f(h[9])},skill:((m=h[10])==null?void 0:m.trim())||"-",note:((b=h[11])==null?void 0:b.trim())||"-"})}}parseCSVLine(t){const e=[];let s="",a=!1;for(let n=0;n<t.length;n++){const i=t[n];i==='"'?a=!a:i===","&&!a?(e.push(s),s=""):s+=i}return e.push(s),e}getCard(t){return this.cards.get(t)}getAllCards(){return Array.from(this.cards.values())}async loadDeck(t,e){const s=`/deck/${t}/${e}.csv`;try{const a=await fetch(s);if(!a.ok)throw new Error(`Failed to fetch deck: ${s}`);const n=await a.text();return this.parseDeckCSV(n)}catch(a){return console.error(`Failed to load deck ${e} for ${t}:`,a),[]}}parseDeckCSV(t){var a,n;const e=t.split(`
`),s=[];for(let i=1;i<e.length;i++){const o=e[i].trim();if(!o)continue;const c=o.split(",");if(c.length<3)continue;const d=(a=c[1])==null?void 0:a.trim(),r=(n=c[2])==null?void 0:n.trim(),p=parseInt(r);if(!d||isNaN(p)||p===0)continue;const u=this.getCard(d);if(u)for(let m=0;m<p;m++)s.push({...u,instanceId:crypto.randomUUID()});else console.warn(`Card ID not found in pool: ${d}`)}return s}};l(y,"instance");let D=y;class q{constructor(t){l(this,"element");l(this,"store");l(this,"meDeckLoaded",!1);l(this,"opDeckLoaded",!1);l(this,"firstPlayerDecided",!1);l(this,"AVAILABLE_DECKS",[{school:"青葉城西",name:"青葉城西卡表 - 極簡軸",label:"青葉城西 - 極簡軸",schoolKey:"seijoh"},{school:"烏野",name:"烏野卡表 - 預組",label:"烏野 - 預組",schoolKey:"karasuno"},{school:"烏野",name:"烏野卡表 - 爆發控制軸",label:"烏野 - 爆發控制軸",schoolKey:"karasuno"},{school:"音駒",name:"音駒卡表 - 預組",label:"音駒 - 預組",schoolKey:"nekoma"}]);this.store=t,this.element=document.createElement("div"),this.element.className="setup-overlay",this.loadDatabase(),this.render()}async loadDatabase(){await D.getInstance().loadAll(),console.log("CardDatabase ready")}render(){const t=this.AVAILABLE_DECKS.map(e=>`<option value="${e.school}|${e.name}|${e.schoolKey}">${e.label}</option>`).join("");this.element.innerHTML=`
      <div class="setup-container">
        <h1>Game Setup</h1>
        
        <div class="setup-section">
          <div class="player-setup">
            <h3>Me (Player)</h3>
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
            <h3>Opponent</h3>
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
          <h3>First Player</h3>
          <div class="coin-toss-area">
            <button id="coin-toss-btn" class="btn">Coin Toss</button>
            <span id="toss-result" class="result">?</span>
          </div>
        </div>



        <div class="setup-actions">
            <button id="load-defaults-btn" class="btn">Load Defaults (青葉城西 vs 青葉城西)</button>
        </div>

        <div class="setup-actions">
          <button id="start-game-btn" class="start-btn" disabled>Start Game</button>
        </div>
      </div>
    `,this.attachEvents()}attachEvents(){const t=this.element.querySelector("#me-deck-select"),e=this.element.querySelector("#op-deck-select"),s=this.element.querySelector("#coin-toss-btn"),a=this.element.querySelector("#start-game-btn"),n=this.element.querySelector("#load-defaults-btn");t==null||t.addEventListener("change",i=>this.handleDeckSelection(i,"me")),e==null||e.addEventListener("change",i=>this.handleDeckSelection(i,"opponent")),n==null||n.addEventListener("click",()=>this.loadDefaultDecks()),s==null||s.addEventListener("click",()=>{const i=Math.random()<.5?"me":"opponent";this.store.setState({firstPlayer:i});const o=this.element.querySelector("#toss-result");o&&(o.textContent=i==="me"?"Me":"Opponent",o.className="result decided"),this.firstPlayerDecided=!0,this.checkReady()}),a==null||a.addEventListener("click",()=>{this.startGame()})}async handleDeckSelection(t,e){var c;const a=t.target.value;if(!a){e==="me"?this.meDeckLoaded=!1:this.opDeckLoaded=!1,this.updateStatus(e,"Not Selected"),this.checkReady();return}const[n,i,o]=a.split("|");try{const r=await D.getInstance().loadDeck(n,i);if(r.length>0){e==="me"?(this.store.setState({me:{...this.store.getState().me,deck:r,school:o}}),this.meDeckLoaded=!0):(this.store.setState({opponent:{...this.store.getState().opponent,deck:r,school:o}}),this.opDeckLoaded=!0);const p=((c=this.AVAILABLE_DECKS.find(u=>u.school===n&&u.name===i))==null?void 0:c.label)||i;this.updateStatus(e,`已載入: ${p} (${r.length} 張卡片)`),this.checkReady()}}catch(d){console.error(`Failed to load deck for ${e}:`,d),this.updateStatus(e,"載入失敗"),e==="me"?this.meDeckLoaded=!1:this.opDeckLoaded=!1,this.checkReady()}}async loadDefaultDecks(){const t="青葉城西",e="青葉城西卡表 - 極簡軸",s="seijoh";try{const a=D.getInstance(),[n,i]=await Promise.all([a.loadDeck(t,e),a.loadDeck(t,e)]);n.length>0&&(this.store.setState({me:{...this.store.getState().me,deck:n,school:s}}),this.meDeckLoaded=!0,this.updateStatus("me",`Loaded: ${t} - 極簡軸 (${n.length} cards)`)),i.length>0&&(this.store.setState({opponent:{...this.store.getState().opponent,deck:i,school:s}}),this.opDeckLoaded=!0,this.updateStatus("opponent",`Loaded: ${t} - 極簡軸 (${i.length} cards)`)),this.checkReady()}catch(a){console.error("Failed to load default decks:",a),alert("Failed to load default decks. Check console.")}}updateStatus(t,e){const s=t==="me"?"me-deck-status":"op-deck-status",a=this.element.querySelector(`#${s}`);a&&(a.textContent=e)}checkReady(){const t=this.element.querySelector("#start-game-btn");this.meDeckLoaded&&this.opDeckLoaded&&this.firstPlayerDecided&&(t.disabled=!1)}startGame(){const t=this.store.getState(),e=this.shuffle([...t.me.deck]),s=this.shuffle([...t.opponent.deck]),a=e.splice(0,6),n=s.splice(0,6),i=e.splice(0,2),o=s.splice(0,2);this.store.setState({gamePhase:"playing",me:{...t.me,deck:e,hand:a,set:i},opponent:{...t.opponent,deck:s,hand:n,set:o}}),this.element.style.display="none"}shuffle(t){for(let e=t.length-1;e>0;e--){const s=Math.floor(Math.random()*(e+1));[t[e],t[s]]=[t[s],t[e]]}return t}getElement(){return this.element}}class B{constructor(t){l(this,"element");l(this,"store");this.store=t,this.element=document.createElement("div"),this.element.className="card-detail-panel",this.render(),this.setupSubscription()}setupSubscription(){this.store.subscribe(t=>{this.updateContent(t.selectedCard)})}updateContent(t){t?this.renderCardDetails(t):this.render()}renderCardDetails(t){var n,i,o,c,d;const e=t.type==="EVENT",s=r=>r===null?"-":r??0,a=e?'<div class="detail-type">EVENT CARD</div>':`
        <div class="detail-stats">
          <div class="detail-stat"><span>Serve</span><span>${s((n=t.stats)==null?void 0:n.serve)}</span></div>
          <div class="detail-stat"><span>Block</span><span>${s((i=t.stats)==null?void 0:i.block)}</span></div>
          <div class="detail-stat"><span>Receive</span><span>${s((o=t.stats)==null?void 0:o.receive)}</span></div>
          <div class="detail-stat"><span>Toss</span><span>${s((c=t.stats)==null?void 0:c.toss)}</span></div>
          <div class="detail-stat"><span>Attack</span><span>${s((d=t.stats)==null?void 0:d.attack)}</span></div>
        </div>
      `;this.element.innerHTML=`
      <div class="detail-content ${e?"event":"character"}">
        <div class="detail-header">
          <h2>${t.name}</h2>
          <div class="detail-id">${t.id}</div>
          <div class="detail-meta">
              ${t.rarity?`<span class="rarity">稀有度: ${t.rarity}</span>`:""}
              ${t.role?`<span class="role">位置: ${t.role}</span>`:""}
          </div>
        </div>
        ${a}
        <div class="detail-text">
          <div class="detail-text-header">
            <h3>技能</h3>
            ${t.timing&&t.timing!=="-"?`<div class="timing-badges">${this.renderTimingBadges(t.timing)}</div>`:""}
          </div>
          <p>${t.skill||t.description||"無技能"}</p>
          ${t.note&&t.note!=="-"?`
            <h3>注釋</h3>
            <p>${t.note}</p>
          `:""}
        </div>
      </div>
    `}renderTimingBadges(t){return!t||t==="-"?"":t.split(",").map(a=>a.trim()).map(a=>`<span class="timing-badge">${a}</span>`).join("")}render(){this.element.innerHTML=`
      <div class="placeholder">
        <h3>Card Details</h3>
        <p>Right-click a card to view details.</p>
      </div>
    `}getElement(){return this.element}}class R{constructor(t){l(this,"element");l(this,"store");l(this,"meBaseAttack",0);l(this,"meBaseDefense",0);l(this,"opBaseAttack",0);l(this,"opBaseDefense",0);l(this,"meManualAttack",0);l(this,"meManualDefense",0);l(this,"opManualAttack",0);l(this,"opManualDefense",0);this.store=t,this.element=document.createElement("div"),this.element.className="stats-panel",this.render(),this.attachEvents(),this.setupSubscription()}setupSubscription(){this.store.subscribe(t=>{const e=t.me.currentStats;e&&(this.meBaseAttack=(e.serve||0)+(e.attack||0)+(e.toss||0),this.meBaseDefense=(e.block||0)+(e.receive||0));const s=t.opponent.currentStats;s&&(this.opBaseAttack=(s.serve||0)+(s.attack||0)+(s.toss||0),this.opBaseDefense=(s.block||0)+(s.receive||0)),this.updateAllDisplays(),this.renderLogs(t.logs)})}render(){this.element.innerHTML=`
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

      <button class="btn reset-stats-btn">Force Reset to 0</button>

      <div class="game-log-section">
        <h3>Game Log</h3>
        <div class="game-log-container" id="game-log-container">
          <!-- Logs will be rendered here -->
        </div>
      </div>
    `}renderLogs(t){const e=this.element.querySelector("#game-log-container");if(e){if(!t||t.length===0){e.innerHTML="<div class='log-entry empty'>No actions yet</div>";return}e.innerHTML=t.map(s=>`<div class="log-entry">${s}</div>`).join("")}}attachEvents(){this.element.addEventListener("click",t=>{const e=t.target;if(e.classList.contains("reset-stats-btn")){this.meManualAttack=-this.meBaseAttack,this.meManualDefense=-this.meBaseDefense,this.opManualAttack=-this.opBaseAttack,this.opManualDefense=-this.opBaseDefense,this.updateAllDisplays();return}if(e.classList.contains("stat-btn")){const s=e.getAttribute("data-target"),a=e.getAttribute("data-type"),n=e.getAttribute("data-op");s==="me"?a==="attack"?this.meManualAttack+=n==="plus"?1:-1:this.meManualDefense+=n==="plus"?1:-1:a==="attack"?this.opManualAttack+=n==="plus"?1:-1:this.opManualDefense+=n==="plus"?1:-1,this.updateAllDisplays()}})}updateAllDisplays(){this.updateDisplay("me","attack",this.meBaseAttack+this.meManualAttack),this.updateDisplay("me","defense",this.meBaseDefense+this.meManualDefense),this.updateDisplay("op","attack",this.opBaseAttack+this.opManualAttack),this.updateDisplay("op","defense",this.opBaseDefense+this.opManualDefense)}updateDisplay(t,e,s){const a=this.element.querySelector(`#${t}-${e}-val`);a&&(a.textContent=Math.max(0,s).toString())}getElement(){return this.element}}const x={count:0,viewPerspective:"me",gamePhase:"setup",firstPlayer:null,selectedCard:null,playingCard:null,me:{deck:[],hand:[],set:[],drop:[],field:[],school:"seijoh"},opponent:{deck:[],hand:[],set:[],drop:[],field:[],school:"karasuno"},logs:[]},$=new T(x),g=document.querySelector("#app");if(g){g.innerHTML="",g.className="app-container";const v=new R($),t=new I($),e=new B($),s=new q($);g.appendChild(v.getElement()),g.appendChild(t.getElement()),g.appendChild(e.getElement()),document.body.appendChild(s.getElement())}
