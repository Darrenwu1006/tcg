var M=Object.defineProperty;var O=(C,e,s)=>e in C?M(C,e,{enumerable:!0,configurable:!0,writable:!0,value:s}):C[e]=s;var u=(C,e,s)=>O(C,typeof e!="symbol"?e+"":e,s);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))t(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const a of i.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&t(a)}).observe(document,{childList:!0,subtree:!0});function s(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function t(n){if(n.ep)return;n.ep=!0;const i=s(n);fetch(n.href,i)}})();const D=class D{constructor(e){u(this,"state");u(this,"listeners",[]);u(this,"history",[]);this.state={...e,logs:[],selectedCards:[],turnPlayer:"me",phase:"draw",battleState:{isAttacking:!1,defenseChoice:"none",attacker:null},winCount:{me:0,opponent:0},matchWinner:null}}getState(){return this.state}setState(e,s=!0){s&&(this.history.push({...this.state}),this.history.length>D.MAX_HISTORY&&this.history.shift()),this.state={...this.state,...e},this.notify()}undo(){if(this.history.length===0)return;const e=this.history.pop();e&&(this.state=e,this.notify())}addLog(e){const s=this.getNewLogs(e);this.setState({logs:s},!1)}getNewLogs(e){return[`[${new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"})}] ${e}`,...this.state.logs||[]].slice(0,50)}subscribe(e){return this.listeners.push(e),()=>{this.listeners=this.listeners.filter(s=>s!==e)}}notify(){this.listeners.forEach(e=>e(this.state))}shuffleDeck(e){const s=e==="me"?[...this.state.me.deck]:[...this.state.opponent.deck];for(let n=s.length-1;n>0;n--){const i=Math.floor(Math.random()*(n+1));[s[n],s[i]]=[s[i],s[n]]}const t={};e==="me"?t.me={...this.state.me,deck:s}:t.opponent={...this.state.opponent,deck:s},t.logs=this.getNewLogs(`${e==="me"?"我方":"對手"} 洗切了牌庫`),this.setState(t)}};u(D,"MAX_HISTORY",20);let $=D;const R={青葉城西:"seijoh",烏野:"karasuno",音駒:"nekoma",梟谷:"fukurodani",混合學校:"mixed",稲荷崎:"inarizaki",白鳥沢:"shiratorizawa",伊達工業:"datekou"},B="karasuno";function q(C){return R[C]||B}function w(C,e=!1){const s=C===null,t=s?0:C??0,n=6,i=Math.min(Math.max(t,0),n),a=n-i;let o='<div class="block-bar-container">';for(let c=0;c<i;c++)o+='<div class="block filled"></div>';for(let c=0;c<a;c++)o+='<div class="block empty"></div>';if(o+="</div>",e){const c=s?"-":t.toString();return`${o} <span class="block-value">${c}</span>`}return o}class L{static render(e,s=!1,t="烏野"){const n=s?t:e.school||t,i=q(n);if(s)return`
        <div class="card back ${i}">
          <div class="card-back-design">
          </div>
        </div>
      `;const a=e.type==="EVENT",o=e.stats||{serve:0,block:0,receive:0,toss:0,attack:0},c=a?"":`
        <div class="card-stats">
          <div class="stat">S: ${w(o.serve)}</div>
          <div class="stat">B: ${w(o.block)}</div>
          <div class="stat">R: ${w(o.receive)}</div>
          <div class="stat">T: ${w(o.toss)}</div>
          <div class="stat">A: ${w(o.attack)}</div>
        </div>
      `;return`
      <div class="card ${a?"event":"character"} ${i}" data-id="${e.id}">
        <div class="card-header">
          <div class="card-name">${e.name}</div>
        </div>
        ${c}
      </div>
    `}}class V{constructor(e,s){u(this,"store");u(this,"playerType");u(this,"isDragging",!1);u(this,"startX",0);u(this,"startY",0);u(this,"selectionBox",null);u(this,"initialShiftKey",!1);u(this,"mouseDownHandler");u(this,"mouseMoveHandler");u(this,"mouseUpHandler");u(this,"touchStartHandler");u(this,"touchMoveHandler");u(this,"touchEndHandler");this.store=e,this.playerType=s,this.mouseDownHandler=this.handleMouseDown.bind(this),this.mouseMoveHandler=this.handleMouseMove.bind(this),this.mouseUpHandler=this.handleMouseUp.bind(this),this.touchStartHandler=this.handleTouchStart.bind(this),this.touchMoveHandler=this.handleTouchMove.bind(this),this.touchEndHandler=this.handleTouchEnd.bind(this),this.setupGlobalDragSelection()}setupGlobalDragSelection(){document.addEventListener("mousedown",this.mouseDownHandler),document.addEventListener("mousemove",this.mouseMoveHandler),document.addEventListener("mouseup",this.mouseUpHandler),document.addEventListener("touchstart",this.touchStartHandler,{passive:!1}),document.addEventListener("touchmove",this.touchMoveHandler,{passive:!1}),document.addEventListener("touchend",this.touchEndHandler)}handleMouseDown(e){e.target.closest(".card, button, .slot")||this.store.getState().viewPerspective!==this.playerType||(this.isDragging=!0,this.startX=e.clientX,this.startY=e.clientY,this.initialShiftKey=e.shiftKey,this.selectionBox=document.createElement("div"),this.selectionBox.className="selection-box",this.selectionBox.style.left=`${this.startX}px`,this.selectionBox.style.top=`${this.startY}px`,document.body.appendChild(this.selectionBox),this.initialShiftKey||this.store.setState({selectedCards:[]}))}handleMouseMove(e){if(!this.isDragging||!this.selectionBox)return;const s=e.clientX,t=e.clientY,n=Math.abs(s-this.startX),i=Math.abs(t-this.startY),a=Math.min(s,this.startX),o=Math.min(t,this.startY);this.selectionBox.style.width=`${n}px`,this.selectionBox.style.height=`${i}px`,this.selectionBox.style.left=`${a}px`,this.selectionBox.style.top=`${o}px`}handleMouseUp(){this.finishDrag()}handleTouchStart(e){e.target.closest(".card, button, .slot")||this.store.getState().viewPerspective!==this.playerType||(this.isDragging=!0,this.startX=e.touches[0].clientX,this.startY=e.touches[0].clientY,this.initialShiftKey=!1,this.selectionBox=document.createElement("div"),this.selectionBox.className="selection-box",this.selectionBox.style.left=`${this.startX}px`,this.selectionBox.style.top=`${this.startY}px`,document.body.appendChild(this.selectionBox),this.store.setState({selectedCards:[]}))}handleTouchMove(e){if(!this.isDragging||!this.selectionBox)return;e.preventDefault();const s=e.touches[0].clientX,t=e.touches[0].clientY,n=Math.abs(s-this.startX),i=Math.abs(t-this.startY),a=Math.min(s,this.startX),o=Math.min(t,this.startY);this.selectionBox.style.width=`${n}px`,this.selectionBox.style.height=`${i}px`,this.selectionBox.style.left=`${a}px`,this.selectionBox.style.top=`${o}px`}handleTouchEnd(){this.finishDrag()}finishDrag(){if(this.isDragging&&(this.isDragging=!1,this.selectionBox)){const e=this.selectionBox.getBoundingClientRect();this.selectionBox.remove(),this.selectionBox=null;const s=document.querySelectorAll(".card"),t=this.store.getState(),n=t[this.playerType],i=[...n.hand,...n.field,...n.deck,...n.drop,...n.set];let a=this.initialShiftKey?[...t.selectedCards||[]]:[];s.forEach(o=>{const c=o.getBoundingClientRect(),r=o.dataset.instanceId;if(!r)return;const l=i.find(h=>h.instanceId===r);l&&c.left<e.right&&c.right>e.left&&c.top<e.bottom&&c.bottom>e.top&&(a.find(h=>h.instanceId===r)||a.push(l))}),this.store.setState({selectedCards:a,playingCard:a.length===1?a[0]:null})}}cleanup(){document.removeEventListener("mousedown",this.mouseDownHandler),document.removeEventListener("mousemove",this.mouseMoveHandler),document.removeEventListener("mouseup",this.mouseUpHandler),document.removeEventListener("touchstart",this.touchStartHandler),document.removeEventListener("touchmove",this.touchMoveHandler),document.removeEventListener("touchend",this.touchEndHandler),this.selectionBox&&(this.selectionBox.remove(),this.selectionBox=null)}}class N{constructor(e,s,t,n){u(this,"store");u(this,"playerType");u(this,"overlay",null);u(this,"attachCardEventsCallback");u(this,"moveCardCallback");this.store=e,this.playerType=s,this.attachCardEventsCallback=t,this.moveCardCallback=n}render(e){var p;if(this.overlay||(this.overlay=document.getElementById("global-expanded-overlay"),this.overlay||(this.overlay=document.createElement("div"),this.overlay.id="global-expanded-overlay",document.body.appendChild(this.overlay))),!e){this.overlay&&(this.overlay.style.display="none",this.overlay.innerHTML="");return}const s=this.store.getState(),t=s[this.playerType];let n=[];e==="drop"?n=t.drop:n=t.field.filter(d=>d.position===e);const i=this.playerType===s.viewPerspective;this.overlay.className="expanded-overlay",i?this.overlay.classList.add("overlay-top"):this.overlay.classList.add("overlay-bottom");let a=null,o=[];n.length>0&&(a=n[n.length-1],o=n.slice(0,n.length-1)),this.overlay.style.display="flex",this.overlay.innerHTML=`
        <div class="expanded-content">
            <div class="expanded-header">
                <h3>${e.toUpperCase()} Stack ${i?"":"(Read Only)"}</h3>
                <div class="header-buttons">
                    ${i?'<button class="btn move-to-hand-btn">Move to Hand</button>':""}
                    <button class="close-btn">Close</button>
                </div>
            </div>
            
            <div class="stack-layout">
                <div class="active-unit-section">
                    <h4>Active Unit</h4>
                    <div class="active-card-container"></div>
                </div>
                <div class="guts-section">
                    <h4>Guts / Stack</h4>
                    <div class="expanded-grid">
                        <!-- Guts cards go here -->
                    </div>
                </div>
            </div>
        </div>
      `;const c=this.overlay.querySelector(".active-card-container"),r=this.overlay.querySelector(".expanded-grid"),l=this.overlay.querySelector(".close-btn"),h=this.overlay.querySelector(".move-to-hand-btn");if(l==null||l.addEventListener("click",()=>{this.close()}),h==null||h.addEventListener("click",()=>{const d=this.store.getState();d.selectedCards&&d.selectedCards.length>0&&(this.moveCardCallback(d.selectedCards[0],"hand"),this.close())}),this.overlay.addEventListener("click",d=>{d.target===this.overlay&&this.close()}),i&&this.setupOverlayDragSelection(r,n),a&&c){const d=L.render(a,!1,t.school),v=document.createElement("div");v.innerHTML=d;const m=v.firstElementChild;m.dataset.instanceId=a.instanceId,this.attachCardEventsCallback(m,a,i),(p=s.selectedCards)!=null&&p.find(f=>f.instanceId===a.instanceId)&&(m.classList.add("selected"),m.style.border="2px solid #00ff88"),c.appendChild(m)}o.forEach(d=>{var g;const v=L.render(d,!1,t.school),m=document.createElement("div");m.innerHTML=v;const f=m.firstElementChild;f.dataset.instanceId=d.instanceId,this.attachCardEventsCallback(f,d,i),(g=s.selectedCards)!=null&&g.find(y=>y.instanceId===d.instanceId)&&(f.classList.add("selected"),f.style.border="2px solid #00ff88"),r==null||r.appendChild(f)})}setupOverlayDragSelection(e,s){var p,d;let t=!1,n=0,i=0,a=null,o=!1;const c=v=>{if(!t||!a)return;const m=v.clientX,f=v.clientY,g=Math.abs(m-n),y=Math.abs(f-i),S=Math.min(m,n),k=Math.min(f,i);a.style.width=`${g}px`,a.style.height=`${y}px`,a.style.left=`${S}px`,a.style.top=`${k}px`},r=()=>{if(t&&(t=!1,document.removeEventListener("mousemove",c),document.removeEventListener("mouseup",r),a)){const v=a.getBoundingClientRect();a.remove(),a=null;const m=e.querySelectorAll(".card");let f=o?[...this.store.getState().selectedCards||[]]:[];m.forEach(g=>{const y=g.getBoundingClientRect(),S=g.dataset.instanceId;if(!S)return;const k=s.find(I=>I.instanceId===S);k&&y.left<v.right&&y.right>v.left&&y.top<v.bottom&&y.bottom>v.top&&(f.find(I=>I.instanceId===S)||f.push(k))}),this.store.setState({selectedCards:f,playingCard:f.length===1?f[0]:null})}};e.addEventListener("mousedown",v=>{v.target.closest(".card")||(t=!0,n=v.clientX,i=v.clientY,o=v.shiftKey,a=document.createElement("div"),a.className="selection-box",a.style.left=`${n}px`,a.style.top=`${i}px`,document.body.appendChild(a),o||this.store.setState({selectedCards:[]}),document.addEventListener("mousemove",c),document.addEventListener("mouseup",r))});const l=()=>{document.removeEventListener("mousemove",c),document.removeEventListener("mouseup",r),a&&a.remove(),t=!1},h=(p=this.overlay)==null?void 0:p.querySelector(".close-btn");h==null||h.addEventListener("click",l),(d=this.overlay)==null||d.addEventListener("click",v=>{v.target===this.overlay&&l()})}close(){this.overlay&&(this.overlay.style.display="none",this.overlay.innerHTML="")}}class A{constructor(e,s){u(this,"element");u(this,"playerType");u(this,"store");u(this,"expandedZone",null);u(this,"lastPerspective",null);u(this,"dragSelection");u(this,"expandedOverlay");this.playerType=e,this.store=s,this.element=document.createElement("div"),this.element.className=`player-zone ${this.playerType}`,this.render(),this.setupSubscription(),this.dragSelection=new V(s,e),this.expandedOverlay=new N(s,e,this.attachCardEvents.bind(this),this.moveCard.bind(this))}setupSubscription(){this.store.subscribe(e=>{this.updateCounts(e),this.lastPerspective&&this.lastPerspective!==e.viewPerspective&&(this.expandedZone=null,this.expandedOverlay.render(null)),this.lastPerspective=e.viewPerspective,this.expandedZone&&this.expandedOverlay.render(this.expandedZone)})}updateCounts(e){const s=this.playerType==="me"?e.me:e.opponent,t=this.playerType==="me"?e.me.school:e.opponent.school;this.updateSetArea(s.set,t,e.viewPerspective),this.updateDeckArea(s.deck,t),this.updateDropArea(s.drop,t);const n=this.element.querySelector(".set-area .count"),i=this.element.querySelector(".deck-area .count");n&&(n.textContent=s.set.length.toString()),i&&(i.textContent=s.deck.length.toString()),this.updateHand(s.hand),this.updateField(s.field)}updateSetArea(e,s,t){const n=this.element.querySelector(".set-area");if(!n)return;const i=n.querySelector(".set-cards-container");if(!i)return;const a=Array.from(i.querySelectorAll(".set-card")),o=new Set(e.map(l=>l.instanceId));a.forEach(l=>{o.has(l.dataset.instanceId)||l.remove()}),e.forEach(l=>{const h=a.find(p=>p.dataset.instanceId===l.instanceId);if(h){const p=this.playerType===t,d=h.style.cursor==="pointer";if(p!==d){const v=L.render(l,!0,s),m=document.createElement("div");m.innerHTML=v;const f=m.firstElementChild;f.classList.add("set-card"),f.dataset.instanceId=l.instanceId,p&&(f.addEventListener("click",()=>{confirm("Add this card to your hand?")&&this.moveSetCardToHand(l)}),f.style.cursor="pointer"),h.replaceWith(f)}}else{const p=L.render(l,!0,s),d=document.createElement("div");d.innerHTML=p;const v=d.firstElementChild;v.classList.add("set-card"),v.dataset.instanceId=l.instanceId,this.playerType===t&&(v.addEventListener("click",()=>{confirm("Add this card to your hand?")&&this.moveSetCardToHand(l)}),v.style.cursor="pointer"),i.appendChild(v)}});const c=i.querySelector(".set-card-slot");if(e.length>0)c&&c.remove();else if(!c){const l=document.createElement("div");l.className="slot set-card-slot",l.setAttribute("data-pos","set"),l.textContent="Set",i.appendChild(l)}const r=i.querySelector(".surrender-btn");if(e.length===0&&this.playerType===t){if(!r){const l=document.createElement("button");l.className="btn surrender-btn",l.textContent="Surrender",l.addEventListener("click",()=>this.handleSurrender()),i.appendChild(l)}}else r&&r.remove()}updateDeckArea(e,s){const t=this.element.querySelector(".deck-slot");if(!t)return;const n=t.querySelector(".card-stack");if(e.length>0)if(n){n.dataset.count=e.length.toString();const i=n.querySelector(".card");if(i){const a={id:"deck-back",instanceId:"deck-back",name:"Deck",type:"CHARACTER"},o=L.render(a,!0,s),c=document.createElement("div");c.innerHTML=o;const r=c.firstElementChild;r&&i.replaceWith(r)}}else{t.innerHTML="";const i=document.createElement("div");i.className="card-stack",i.dataset.count=e.length.toString();const a={id:"deck-back",instanceId:"deck-back",name:"Deck",type:"CHARACTER"},o=L.render(a,!0,s),c=document.createElement("div");c.innerHTML=o;const r=c.firstElementChild;r&&i.appendChild(r),t.appendChild(i)}else n&&(t.innerHTML="Deck")}updateDropArea(e,s){const t=this.element.querySelector(".drop-slot");if(!t)return;const n=e.length>0?e[e.length-1]:null,i=t.querySelector(".card"),a=t.querySelector(".stack-count");if(n){if(!i||i.dataset.instanceId!==n.instanceId){i&&i.remove();const o=L.render(n,!1,s);if(o&&o.trim().length>0){const c=document.createElement("div");c.innerHTML=o;const r=c.firstElementChild;t.prepend(r)}}}else i&&(i.remove(),t.textContent="Drop");if(e.length>1)if(a)a.textContent=e.length.toString();else{const o=document.createElement("div");o.className="stack-count",o.textContent=e.length.toString(),t.appendChild(o)}else a&&a.remove()}moveSetCardToHand(e){const t=this.store.getState()[this.playerType],n=t.set.filter(a=>a.instanceId!==e.instanceId),i=[...t.hand,e];this.store.setState({[this.playerType]:{...t,set:n,hand:i}})}handleSurrender(){if(confirm("確定投降嗎？")){const s=this.store.getState(),t=this.playerType==="me"?"opponent":"me",n={...s.winCount};n[t]++,this.store.setState({matchWinner:t,winCount:n}),this.store.addLog(`${this.playerType==="me"?"我方":"對手"} 投降了！勝者：${t==="me"?"我方":"對手"}`)}}attachDrawEvent(){const e=this.element.querySelector(".draw-btn");e==null||e.addEventListener("click",()=>{const t=this.store.getState();if(this.playerType!==t.viewPerspective)return;const n=t[this.playerType],i=[...n.deck];if(i.length===0){alert("Deck is empty!");return}const a=i.shift();if(a){const o=[...n.hand,a];this.store.setState({[this.playerType]:{...n,deck:i,hand:o}}),this.store.addLog(`${this.playerType==="me"?"我方":"對手"} 抽了一張卡`)}});const s=this.element.querySelector(".shuffle-btn");s==null||s.addEventListener("click",()=>{this.store.getState().viewPerspective===this.playerType?this.store.shuffleDeck(this.playerType):alert("You can only shuffle your own deck.")})}updateHand(e){const s=this.element.querySelector(".hand-cards");if(!s)return;const t=this.store.getState(),n=this.playerType==="me"?t.me.school:t.opponent.school,i=this.playerType===t.viewPerspective,a=Array.from(s.querySelectorAll(".card[data-instance-id]")),o=new Set(a.map(r=>r.dataset.instanceId)),c=new Set(e.map(r=>r.instanceId));a.forEach(r=>{const l=r.dataset.instanceId;l&&!c.has(l)&&r.remove()}),e.forEach(r=>{var l,h,p;if(o.has(r.instanceId)){const d=s.querySelector(`.card[data-instance-id="${r.instanceId}"]`);if(d)if(!d.classList.contains("back")!==i){const m=L.render(r,!i,n),f=document.createElement("div");f.innerHTML=m;const g=f.firstElementChild;g&&(g.dataset.instanceId=r.instanceId,i&&this.attachCardInteractionEvents(g,r),(l=t.selectedCards)!=null&&l.find(S=>S.instanceId===r.instanceId)&&(g.classList.add("playing","selected"),g.style.border="2px solid #00ff88"),d.replaceWith(g))}else!!((h=t.selectedCards)!=null&&h.find(f=>f.instanceId===r.instanceId))?(d.classList.add("playing","selected"),d.style.border="2px solid #00ff88"):(d.classList.remove("playing","selected"),d.style.border="")}else{const d=L.render(r,!i,n),v=document.createElement("div");v.innerHTML=d;const m=v.firstElementChild;if(!m)return;m.dataset.instanceId=r.instanceId,i&&this.attachCardInteractionEvents(m,r),!!((p=t.selectedCards)!=null&&p.find(g=>g.instanceId===r.instanceId))&&(m.classList.add("playing","selected"),m.style.border="2px solid #00ff88"),s.appendChild(m)}})}attachCardInteractionEvents(e,s){e.addEventListener("contextmenu",t=>{t.preventDefault(),this.store.setState({selectedCard:s})}),e.addEventListener("click",t=>{t.stopPropagation();const n=this.store.getState();this.store.setState({selectedCard:s});let i=[...n.selectedCards||[]];t.shiftKey?i.find(a=>a.instanceId===s.instanceId)?i=i.filter(a=>a.instanceId!==s.instanceId):i.push(s):i=[s],this.store.setState({selectedCards:i,playingCard:i.length===1?i[0]:null})})}updateField(e){const s=this.store.getState(),t=this.playerType==="opponent"?s.opponent.school:s.me.school,n={};e.forEach(a=>{a.position&&(n[a.position]||(n[a.position]=[]),n[a.position].push(a))}),this.element.querySelectorAll(".slot[data-pos]").forEach(a=>{const o=a.dataset.pos;if(o&&["serve","event","receive","toss","attack","block-left","block-center","block-right"].includes(o)){const c=n[o]||[],r=c.length>0?c[c.length-1]:null,l=a.querySelector(".card[data-instance-id]"),h=l==null?void 0:l.dataset.instanceId,p=a.querySelector(".stack-count");if(r){if(!(l&&h===r.instanceId)){l&&l.remove();const d=L.render(r,!1,t),v=document.createElement("div");v.innerHTML=d;const m=v.firstElementChild;m&&(m.dataset.instanceId=r.instanceId,this.attachFieldCardEvents(m,r),a.appendChild(m))}}else l&&l.remove();if(c.length>1)if(p)p.textContent=c.length.toString();else{const d=document.createElement("div");d.className="stack-count",d.textContent=c.length.toString(),a.appendChild(d)}else p&&p.remove()}})}attachFieldCardEvents(e,s){e.addEventListener("contextmenu",t=>{t.preventDefault(),t.stopPropagation(),this.store.setState({selectedCard:s})}),e.addEventListener("click",t=>{t.preventDefault(),this.store.setState({selectedCard:s})}),e.style.cursor="pointer"}render(){this.element.innerHTML=`
      <div class="left-side container">

        <div class="set-area">
          <h2>Set Area <span class="count">0</span></h2>
          <div class="set-cards-container">
            <div class="slot set-card-slot" data-pos="set">Set</div>
          </div>
        </div>
        <div class="function-area">
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

        <div class="hand-area" data-pos="hand">
           <div class="hand-cards"></div>
        </div>
      </div>

      <div class="right-side container">
        <div class="deck-area">
        <h2>Deck <span class="count">0</span></h2>
        <div class="slot deck-slot" data-pos="deck">Deck</div>
        <div class="function-area">
          <button class="btn draw-btn">Draw</button>
          <button class="btn shuffle-btn">Shuffle</button>
        </div>
      </div>
      <div class="drop-area">
          <h2>Drop</h2>
          <div class="slot drop-slot" data-pos="drop">Drop</div>
        </div>
      </div>
    `,this.attachSlotEvents(),this.attachDrawEvent(),this.attachFunctionEvents(),this.attachHandEvents()}attachFunctionEvents(){const e=this.element.querySelector(".back-btn");e==null||e.addEventListener("click",()=>{const s=this.store.getState();this.playerType===s.viewPerspective&&this.store.undo()})}attachHandEvents(){const e=this.element.querySelector(".hand-area");e==null||e.addEventListener("click",s=>{if(s.target.closest(".card"))return;const t=this.store.getState();this.playerType===t.viewPerspective&&t.selectedCards&&t.selectedCards.length>0&&this.moveCard(t.selectedCards[0],"hand")})}attachSlotEvents(){this.element.querySelectorAll(".slot").forEach(t=>{t.addEventListener("click",()=>{const n=this.store.getState(),i=t.getAttribute("data-pos"),a=n.playingCard,o=n.selectedCards||[];if(this.playerType===n.viewPerspective){let r=!1;if(o.length>0){const l=n[this.playerType].field.filter(p=>p.position===i);o.every(p=>l.find(d=>d.instanceId===p.instanceId))||(r=!0)}if(r){if(t.classList.contains("deck-slot")){this.moveCard(o[0],"deck");return}if(t.classList.contains("drop-slot")){this.moveCard(o[0],"drop");return}if(i){this.moveCard(o[0],i);return}}}(!a||o.length>0&&o.every(r=>r.position===i))&&i&&["serve","event","receive","toss","attack","block-left","block-center","block-right","drop"].includes(i)&&(this.expandedZone=i,this.expandedOverlay.render(i))})});const s=this.element.querySelector('.slot[data-pos="deck"]');s==null||s.addEventListener("contextmenu",t=>{t.preventDefault(),this.store.setState({viewingDeckInfo:{player:this.playerType}})})}attachCardEvents(e,s,t){e.addEventListener("contextmenu",l=>{l.preventDefault(),l.stopPropagation(),this.store.setState({selectedCard:s})});let n;const i=500;let a=0,o=0;e.addEventListener("touchstart",l=>{a=l.touches[0].clientX,o=l.touches[0].clientY,n=setTimeout(()=>{this.store.setState({selectedCard:s}),navigator.vibrate&&navigator.vibrate(50)},i)},{passive:!0});let c=0;const r=300;e.addEventListener("touchend",()=>{clearTimeout(n);const l=new Date().getTime(),h=l-c;h<r&&h>0&&(this.store.setState({selectedCard:s}),navigator.vibrate&&navigator.vibrate(50)),c=l}),e.addEventListener("touchmove",l=>{const h=l.touches[0].clientX,p=l.touches[0].clientY,d=Math.abs(h-a),v=Math.abs(p-o);(d>10||v>10)&&clearTimeout(n)},{passive:!0}),t?e.addEventListener("click",l=>{const h=this.store.getState();this.store.setState({selectedCard:s});let p=[...h.selectedCards||[]];l.shiftKey?p.find(d=>d.instanceId===s.instanceId)?p=p.filter(d=>d.instanceId!==s.instanceId):p.push(s):p=[s],this.store.setState({selectedCards:p,playingCard:p.length===1?p[0]:null})}):(e.addEventListener("click",()=>{this.store.setState({selectedCard:s})}),e.style.cursor="pointer")}moveCard(e,s){const t=this.store.getState(),n=t[this.playerType];let i=[e];t.selectedCards&&t.selectedCards.length>0&&t.selectedCards.find(d=>d.instanceId===e.instanceId)&&(i=t.selectedCards);let a=[...n.hand],o=[...n.field],c=[...n.deck],r=[...n.drop],l="",h=0;if(i.forEach(d=>{const v=a.find(g=>g.instanceId===d.instanceId),m=o.find(g=>g.instanceId===d.instanceId),f=r.find(g=>g.instanceId===d.instanceId);if(v)a=a.filter(g=>g.instanceId!==d.instanceId);else if(m)o=o.filter(g=>g.instanceId!==d.instanceId);else if(f)r=r.filter(g=>g.instanceId!==d.instanceId);else return;s==="deck"?c.push(d):s==="drop"?r.push(d):s==="hand"?a.push(d):o.push({...d,position:s}),h++}),h===0)return;h===1?l=`移動了 ${i[0].name} 到 ${s}`:l=`移動了 ${h} 張卡片 到 ${s}`;const p=this.calculateStats(o);this.store.setState({[this.playerType]:{...n,hand:a,field:o,deck:c,drop:r,currentStats:p},playingCard:null,selectedCards:[],logs:this.store.getNewLogs(`${this.playerType==="me"?"我方":"對手"} ${l}`)})}calculateStats(e){const s={serve:0,block:0,receive:0,toss:0,attack:0};return e.forEach(t=>{!t.stats||!t.position||(t.position==="serve"&&(s.serve+=t.stats.serve||0),t.position.startsWith("block")&&(s.block+=t.stats.block||0),t.position==="receive"&&(s.receive+=t.stats.receive||0),t.position==="toss"&&(s.toss+=t.stats.toss||0),t.position==="attack"&&(s.attack+=t.stats.attack||0))}),s}cleanup(){this.dragSelection.cleanup(),this.expandedOverlay.close()}getElement(){return this.element}}class Y{constructor(e){u(this,"element");u(this,"store");this.store=e,this.element=document.createElement("div"),this.element.className="match-end-overlay",this.element.style.display="none",this.render(),this.setupSubscription()}setupSubscription(){this.store.subscribe(e=>{e.matchWinner?this.show(e.matchWinner):this.hide()})}show(e){const s=this.store.getState(),t=e==="me"?"opponent":"me",n=s[e].school,i=s[t].school,a=e==="me"?"我方":"對手",o=t==="me"?"我方":"對手",c=this.element.querySelector(".match-end-content");if(c){c.innerHTML=`
        <h1 class="match-end-title">MATCH END</h1>
        
        <div class="match-end-result">
          <div class="match-end-winner">
            🏆 ${a} [${n}] WINS 🏆
          </div>
          <div class="match-end-loser">
            ${o} [${i}] surrendered
          </div>
        </div>
        
        <div class="match-end-score">
          戰績: 我方 ${s.winCount.me} - ${s.winCount.opponent} 對手
        </div>
        
        <div class="match-end-buttons">
          <button class="btn match-end-btn back-to-setup-btn">Back to Setup</button>
          <button class="btn match-end-btn rematch-btn">Rematch</button>
        </div>
      `;const r=c.querySelector(".back-to-setup-btn"),l=c.querySelector(".rematch-btn");r==null||r.addEventListener("click",()=>this.handleBackToSetup()),l==null||l.addEventListener("click",()=>this.handleRematch())}this.element.style.display="flex"}hide(){this.element.style.display="none"}handleBackToSetup(){location.reload()}handleRematch(){const e=this.store.getState(),s=[...e.me.deck,...e.me.hand,...e.me.field,...e.me.drop,...e.me.set],t=[...e.opponent.deck,...e.opponent.hand,...e.opponent.field,...e.opponent.drop,...e.opponent.set],n=e.me.school,i=e.opponent.school,a=e.firstPlayer==="me"?"opponent":"me",o=this.shuffleArray(s),c=this.shuffleArray(t),r=o.splice(0,2).map(h=>({...h,position:"set"})),l=c.splice(0,2).map(h=>({...h,position:"set"}));this.store.setState({matchWinner:null,firstPlayer:a,turnPlayer:a,phase:"draw",me:{deck:o,hand:[],set:r,drop:[],field:[],school:n},opponent:{deck:c,hand:[],set:l,drop:[],field:[],school:i},selectedCard:null,selectedCards:[],playingCard:null,battleState:{isAttacking:!1,defenseChoice:"none",attacker:null}}),this.store.addLog(`新回合開始！先手：${a==="me"?"我方":"對手"}`)}shuffleArray(e){const s=[...e];for(let t=s.length-1;t>0;t--){const n=Math.floor(Math.random()*(t+1));[s[t],s[n]]=[s[n],s[t]]}return s}render(){this.element.innerHTML=`
      <div class="match-end-content">
        <!-- Content will be populated by show() method -->
      </div>
    `}getElement(){return this.element}}class F{constructor(e){u(this,"element");u(this,"store");u(this,"opponentZone");u(this,"meZone");u(this,"matchEndOverlay");this.store=e,this.element=document.createElement("div"),this.element.className="game-board",this.opponentZone=new A("opponent",this.store),this.meZone=new A("me",this.store),this.matchEndOverlay=new Y(this.store),this.render(),this.setupSubscription()}setupSubscription(){this.store.subscribe(e=>{this.updatePerspective(e.viewPerspective)})}updatePerspective(e){e==="opponent"?this.element.classList.add("rotated"):this.element.classList.remove("rotated")}render(){this.element.appendChild(this.opponentZone.getElement());const e=document.createElement("div");e.className="net",this.element.appendChild(e),this.element.appendChild(this.meZone.getElement());const s=document.createElement("button");s.className="switch-view-btn",s.innerText="Switch View",s.onclick=()=>{const t=this.store.getState().viewPerspective;this.store.setState({viewPerspective:t==="me"?"opponent":"me"})},document.body.appendChild(s),document.body.appendChild(this.matchEndOverlay.getElement())}getElement(){return this.element}}const X="modulepreload",W=function(C){return"/tcg/"+C},H={},E=function(e,s,t){let n=Promise.resolve();if(s&&s.length>0){document.getElementsByTagName("link");const a=document.querySelector("meta[property=csp-nonce]"),o=(a==null?void 0:a.nonce)||(a==null?void 0:a.getAttribute("nonce"));n=Promise.allSettled(s.map(c=>{if(c=W(c),c in H)return;H[c]=!0;const r=c.endsWith(".css"),l=r?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${c}"]${l}`))return;const h=document.createElement("link");if(h.rel=r?"stylesheet":X,r||(h.as="script"),h.crossOrigin="",h.href=c,o&&h.setAttribute("nonce",o),document.head.appendChild(h),r)return new Promise((p,d)=>{h.addEventListener("load",p),h.addEventListener("error",()=>d(new Error(`Unable to preload CSS for ${c}`)))})}))}function i(a){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=a,window.dispatchEvent(o),!o.defaultPrevented)throw a}return n.then(a=>{for(const o of a||[])o.status==="rejected"&&i(o.reason);return e().catch(i)})},T=class T{constructor(){u(this,"cards",new Map);u(this,"loaded",!1)}static getInstance(){return T.instance||(T.instance=new T),T.instance}async loadAll(){if(!this.loaded)try{await this.loadConsolidatedPools(),this.loaded=!0,console.log(`CardDatabase loaded ${this.cards.size} cards.`)}catch(e){console.error("Failed to load card pools:",e)}}resolvePath(e){const s="/tcg/",t=e.startsWith("/")?e.slice(1):e;return`${s.endsWith("/")?s:`${s}/`}${t}`}async loadConsolidatedPools(){const e=this.resolvePath("pool/All_Characters.csv"),s=this.resolvePath("pool/All_Events.csv");try{const[t,n]=await Promise.all([fetch(e),fetch(s)]);if(t.ok){const i=await t.text();this.parsePoolCSV(i,"CHARACTER")}if(n.ok){const i=await n.text();this.parsePoolCSV(i,"EVENT")}console.log("Loaded consolidated pools")}catch(t){console.error("Failed to load consolidated pools:",t)}}parsePoolCSV(e,s){var n,i,a,o,c,r,l,h,p,d,v,m;const t=e.split(`
`);for(let f=1;f<t.length;f++){const g=t[f].trim();if(!g)continue;const y=this.parseCSVLine(g);if(y.length<4)continue;const S=(n=y[0])==null?void 0:n.trim(),k=(i=y[2])==null?void 0:i.trim(),I=(a=y[3])==null?void 0:a.trim();if(!k||!I)continue;const b=x=>{if(!x||x.trim()==="-"||x.trim()==="")return null;const _=parseInt(x.trim());return isNaN(_)?null:_};s==="CHARACTER"?this.cards.set(k,{id:k,name:I,type:"CHARACTER",school:S,timing:((o=y[4])==null?void 0:o.trim())||"-",rarity:((c=y[5])==null?void 0:c.trim())||"-",role:((r=y[6])==null?void 0:r.trim())||"-",stats:{serve:b(y[7]),block:b(y[8]),receive:b(y[9]),toss:b(y[10]),attack:b(y[11])},skill:((l=y[12])==null?void 0:l.trim())||"-",note:((h=y[13])==null?void 0:h.trim())||"-"}):this.cards.set(k,{id:k,name:I,type:"EVENT",school:S,rarity:((p=y[4])==null?void 0:p.trim())||"-",timing:((d=y[5])==null?void 0:d.trim())||"-",role:"-",stats:{serve:b(y[6]),block:b(y[7]),receive:b(y[8]),toss:b(y[9]),attack:b(y[10])},skill:((v=y[11])==null?void 0:v.trim())||"-",note:((m=y[12])==null?void 0:m.trim())||"-"})}}parseCSVLine(e){const s=[];let t="",n=!1;for(let i=0;i<e.length;i++){const a=e[i];a==='"'?n=!n:a===","&&!n?(s.push(t),t=""):t+=a}return s.push(t),s}getCard(e){return this.cards.get(e)}getAllCards(){return Array.from(this.cards.values())}getTotalCardCount(e){var n;const s=e.split(`
`);let t=0;for(let i=1;i<s.length;i++){const a=s[i].trim();if(!a)continue;const o=a.split(",");if(o.length<2)continue;let c=0;if(o.length>=3){const r=(n=o[2])==null?void 0:n.trim();if(r){const l=parseInt(r);isNaN(l)||(c=l)}}t+=c}return t}async getAvailableDecks(){const e=Object.assign({"/src/assets/decks/伊達工業/攔網軸.csv":()=>E(()=>import("./攔網軸-D3jIr5hL.js"),[]).then(t=>t.default),"/src/assets/decks/梟谷/template.csv":()=>E(()=>import("./template-YZRRei5E.js"),[]).then(t=>t.default),"/src/assets/decks/梟谷/爆發軸二.csv":()=>E(()=>import("./爆發軸二-DRygAH0m.js"),[]).then(t=>t.default),"/src/assets/decks/梟谷/高爆發軸.csv":()=>E(()=>import("./高爆發軸-OlfSSk9F.js"),[]).then(t=>t.default),"/src/assets/decks/混合學校/template.csv":()=>E(()=>import("./template-BL6p7JrW.js"),[]).then(t=>t.default),"/src/assets/decks/混合學校/垃圾場.csv":()=>E(()=>import("./垃圾場-DLQNSA_3.js"),[]).then(t=>t.default),"/src/assets/decks/烏野/template.csv":()=>E(()=>import("./template-Dl-KCfeZ.js"),[]).then(t=>t.default),"/src/assets/decks/烏野/山月攔網軸.csv":()=>E(()=>import("./山月攔網軸-C9q-UzZd.js"),[]).then(t=>t.default),"/src/assets/decks/烏野/日影攻擊軸.csv":()=>E(()=>import("./日影攻擊軸-B5nYVoJQ.js"),[]).then(t=>t.default),"/src/assets/decks/烏野/預組.csv":()=>E(()=>import("./預組-CkakcnPP.js"),[]).then(t=>t.default),"/src/assets/decks/白鳥沢/白板軸.csv":()=>E(()=>import("./白板軸-p2O_xymA.js"),[]).then(t=>t.default),"/src/assets/decks/白鳥沢/白鳥沢 - All Cards.csv":()=>E(()=>import("./白鳥沢 - All Cards-fWYDIa0f.js"),[]).then(t=>t.default),"/src/assets/decks/稲荷崎/六名軸.csv":()=>E(()=>import("./六名軸-y2KcxgZM.js"),[]).then(t=>t.default),"/src/assets/decks/稲荷崎/稲荷崎 - All Cards.csv":()=>E(()=>import("./稲荷崎 - All Cards-DeyQNAiw.js"),[]).then(t=>t.default),"/src/assets/decks/青葉城西/template.csv":()=>E(()=>import("./template-BgW2zTP9.js"),[]).then(t=>t.default),"/src/assets/decks/青葉城西/中速軸.csv":()=>E(()=>import("./中速軸-Csfw3ekW.js"),[]).then(t=>t.default),"/src/assets/decks/青葉城西/快攻軸.csv":()=>E(()=>import("./快攻軸-BS8Dq3Be.js"),[]).then(t=>t.default),"/src/assets/decks/音駒/template.csv":()=>E(()=>import("./template-CxhDpovY.js"),[]).then(t=>t.default),"/src/assets/decks/音駒/預組.csv":()=>E(()=>import("./預組-1IW_7lEd.js"),[]).then(t=>t.default)}),s=[];for(const t in e){const n=t.split("/"),i=n[n.length-1],a=n[n.length-2],o=i.replace(".csv","");try{const c=await e[t](),r=this.getTotalCardCount(c);r===40&&s.push({school:a,name:o,path:t,loader:e[t],cardCount:r})}catch(c){console.warn(`Failed to load deck at ${t}:`,c)}}return s}async loadDeck(e){try{const s=await e();return this.parseDeckCSV(s)}catch(s){return console.error("Failed to load deck:",s),[]}}parseDeckCSV(e){var n,i;const s=e.split(`
`),t=[];for(let a=1;a<s.length;a++){const o=s[a].trim();if(!o)continue;const c=o.split(",");if(c.length<2)continue;const r=(n=c[1])==null?void 0:n.trim();let l=0;if(c.length>=3){const p=(i=c[2])==null?void 0:i.trim();if(p){const d=parseInt(p);isNaN(d)||(l=d)}}if(!r||l===0)continue;const h=this.getCard(r);if(h)for(let p=0;p<l;p++)t.push({...h,instanceId:crypto.randomUUID()});else console.warn(`Card ID not found in pool: ${r}`)}return t}};u(T,"instance");let P=T;class K{constructor(e){u(this,"element");u(this,"store");this.store=e,this.element=document.createElement("div"),this.element.className="card-detail-panel",this.render(),this.setupSubscription()}setupSubscription(){this.store.subscribe(e=>{e.viewingDeckInfo?this.renderDeckInfo(e):this.updateContent(e.selectedCard)})}updateContent(e){e?this.renderCardDetails(e):this.render()}renderDeckInfo(e){var l;const s=e.viewingDeckInfo;if(!s)return;const t=e[s.player],n=[...t.deck,...t.hand,...t.field,...t.drop,...t.set],i=new Map;n.forEach(h=>{const p=h.id;i.has(p)||i.set(p,{name:h.name,total:0,remaining:0,id:h.id,rarity:h.rarity||"",type:h.type});const d=i.get(p);d.total++}),t.deck.forEach(h=>{const p=h.id;i.has(p)&&i.get(p).remaining++});const a=Array.from(i.values()).sort((h,p)=>h.id.localeCompare(p.id)),o=a.filter(h=>h.type==="CHARACTER"),c=a.filter(h=>h.type==="EVENT"),r=h=>h.map(p=>`
            <tr class="${p.remaining===0?"empty":""}">
                <td class="card-info-cell">
                    <div class="card-name-row">
                        <span class="card-name">${p.name}</span>
                        ${p.rarity?`<span class="card-rarity">(${p.rarity})</span>`:""}
                    </div>
                    <div class="card-id">${p.id}</div>
                </td>
                <td class="card-count">${p.remaining}/${p.total}</td>
            </tr>
        `).join("");this.element.innerHTML=`
        <div class="deck-info-panel">
            <div class="deck-info-header">
                <h3>Deck List (${s.player==="me"?"My":"Opponent"})</h3>
                <button class="close-btn">Close</button>
            </div>
            <div class="deck-info-content">
                ${o.length>0?`
                <div class="deck-group">
                    <h4 class="deck-group-header">角色卡 Character Cards</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>卡片資訊</th>
                                <th>剩餘/總數</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${r(o)}
                        </tbody>
                    </table>
                </div>
                `:""}
                ${c.length>0?`
                <div class="deck-group">
                    <h4 class="deck-group-header">事件卡 Event Cards</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>卡片資訊</th>
                                <th>剩餘/總數</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${r(c)}
                        </tbody>
                    </table>
                </div>
                `:""}
            </div>
        </div>
      `,(l=this.element.querySelector(".close-btn"))==null||l.addEventListener("click",()=>{this.store.setState({viewingDeckInfo:null})})}renderCardDetails(e){var n,i,a,o,c;const s=e.type==="EVENT",t=s?"":`
        <div class="detail-stats">
          <div class="detail-stat"><span>Serve</span><span>${w((n=e.stats)==null?void 0:n.serve,!0)}</span></div>
          <div class="detail-stat"><span>Block</span><span>${w((i=e.stats)==null?void 0:i.block,!0)}</span></div>
          <div class="detail-stat"><span>Receive</span><span>${w((a=e.stats)==null?void 0:a.receive,!0)}</span></div>
          <div class="detail-stat"><span>Toss</span><span>${w((o=e.stats)==null?void 0:o.toss,!0)}</span></div>
          <div class="detail-stat"><span>Attack</span><span>${w((c=e.stats)==null?void 0:c.attack,!0)}</span></div>
        </div>
      `;this.element.innerHTML=`
      <div class="detail-content ${s?"event":"character"}">
        <div class="detail-header">
          <h2>${e.name}</h2>
          <div class="detail-id">${e.id}</div>
          <div class="detail-meta">
              ${e.rarity?`<span class="rarity">稀有度: ${e.rarity}</span>`:""}
              ${e.role?`<span class="role">位置: ${e.role}</span>`:""}
          </div>
        </div>
        ${t}
        <div class="detail-text">
          <div class="detail-text-header">
            <h3>技能</h3>
            ${e.timing&&e.timing!=="-"?`<div class="timing-badges">${this.renderTimingBadges(e.timing)}</div>`:""}
          </div>
          <p>${e.skill||e.description||"無技能"}</p>
          ${e.note&&e.note!=="-"?`<h3>注釋</h3><p>${e.note}</p>`:""}
        </div>
      </div>
    `}renderTimingBadges(e){return!e||e==="-"?"":e.split(",").map(n=>n.trim()).map(n=>`<span class="timing-badge">${n}</span>`).join("")}render(){this.element.innerHTML=`
      <div class="placeholder">
        <h3>Card Details</h3>
        <p>Click a card to view details.</p>
      </div>
    `}getElement(){return this.element}}export{P as C,F as G,$ as S,E as _,K as a};
