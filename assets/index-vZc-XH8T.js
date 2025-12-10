var O=Object.defineProperty;var R=(k,e,t)=>e in k?O(k,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):k[e]=t;var u=(k,e,t)=>R(k,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const a of n)if(a.type==="childList")for(const i of a.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&s(i)}).observe(document,{childList:!0,subtree:!0});function t(n){const a={};return n.integrity&&(a.integrity=n.integrity),n.referrerPolicy&&(a.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?a.credentials="include":n.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function s(n){if(n.ep)return;n.ep=!0;const a=t(n);fetch(n.href,a)}})();const M=class M{constructor(e){u(this,"state");u(this,"listeners",[]);u(this,"history",[]);this.state={...e,logs:[],selectedCards:[],turnPlayer:"me",phase:"draw",battleState:{isAttacking:!1,defenseChoice:"none",attacker:null},winCount:{me:0,opponent:0},matchWinner:null}}getState(){return this.state}setState(e,t=!0){t&&(this.history.push({...this.state}),this.history.length>M.MAX_HISTORY&&this.history.shift()),this.state={...this.state,...e},this.notify()}undo(){if(this.history.length===0)return;const e=this.history.pop();e&&(this.state=e,this.notify())}addLog(e){const t=this.getNewLogs(e);this.setState({logs:t},!1)}getNewLogs(e){return[`[${new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"})}] ${e}`,...this.state.logs||[]].slice(0,50)}subscribe(e){return this.listeners.push(e),()=>{this.listeners=this.listeners.filter(t=>t!==e)}}notify(){this.listeners.forEach(e=>e(this.state))}shuffleDeck(e){const t=e==="me"?[...this.state.me.deck]:[...this.state.opponent.deck];for(let n=t.length-1;n>0;n--){const a=Math.floor(Math.random()*(n+1));[t[n],t[a]]=[t[a],t[n]]}const s={};e==="me"?s.me={...this.state.me,deck:t}:s.opponent={...this.state.opponent,deck:t},s.logs=this.getNewLogs(`${e==="me"?"我方":"對手"} 洗切了牌庫`),this.setState(s)}};u(M,"MAX_HISTORY",20);let H=M;const q={青葉城西:"seijoh",烏野:"karasuno",音駒:"nekoma",梟谷:"fukurodani",混合學校:"mixed"},N="karasuno";function V(k){return q[k]||N}function L(k,e=!1){const t=k===null,s=t?0:k??0,n=6,a=Math.min(Math.max(s,0),n),i=n-a;let o='<div class="block-bar-container">';for(let l=0;l<a;l++)o+='<div class="block filled"></div>';for(let l=0;l<i;l++)o+='<div class="block empty"></div>';if(o+="</div>",e){const l=t?"-":s.toString();return`${o} <span class="block-value">${l}</span>`}return o}class D{static render(e,t=!1,s="烏野"){const n=t?s:e.school||s,a=V(n);if(t)return`
        <div class="card back ${a}">
          <div class="card-back-design">
          </div>
        </div>
      `;const i=e.type==="EVENT",o=e.stats||{serve:0,block:0,receive:0,toss:0,attack:0},l=i?"":`
        <div class="card-stats">
          <div class="stat">S: ${L(o.serve)}</div>
          <div class="stat">B: ${L(o.block)}</div>
          <div class="stat">R: ${L(o.receive)}</div>
          <div class="stat">T: ${L(o.toss)}</div>
          <div class="stat">A: ${L(o.attack)}</div>
        </div>
      `;return`
      <div class="card ${i?"event":"character"} ${a}" data-id="${e.id}">
        <div class="card-header">
          <div class="card-name">${e.name}</div>
        </div>
        ${l}
      </div>
    `}}class Y{constructor(e,t){u(this,"store");u(this,"playerType");u(this,"isDragging",!1);u(this,"startX",0);u(this,"startY",0);u(this,"selectionBox",null);u(this,"initialShiftKey",!1);u(this,"mouseDownHandler");u(this,"mouseMoveHandler");u(this,"mouseUpHandler");u(this,"touchStartHandler");u(this,"touchMoveHandler");u(this,"touchEndHandler");this.store=e,this.playerType=t,this.mouseDownHandler=this.handleMouseDown.bind(this),this.mouseMoveHandler=this.handleMouseMove.bind(this),this.mouseUpHandler=this.handleMouseUp.bind(this),this.touchStartHandler=this.handleTouchStart.bind(this),this.touchMoveHandler=this.handleTouchMove.bind(this),this.touchEndHandler=this.handleTouchEnd.bind(this),this.setupGlobalDragSelection()}setupGlobalDragSelection(){document.addEventListener("mousedown",this.mouseDownHandler),document.addEventListener("mousemove",this.mouseMoveHandler),document.addEventListener("mouseup",this.mouseUpHandler),document.addEventListener("touchstart",this.touchStartHandler,{passive:!1}),document.addEventListener("touchmove",this.touchMoveHandler,{passive:!1}),document.addEventListener("touchend",this.touchEndHandler)}handleMouseDown(e){e.target.closest(".card, button, .slot")||this.store.getState().viewPerspective!==this.playerType||(this.isDragging=!0,this.startX=e.clientX,this.startY=e.clientY,this.initialShiftKey=e.shiftKey,this.selectionBox=document.createElement("div"),this.selectionBox.className="selection-box",this.selectionBox.style.left=`${this.startX}px`,this.selectionBox.style.top=`${this.startY}px`,document.body.appendChild(this.selectionBox),this.initialShiftKey||this.store.setState({selectedCards:[]}))}handleMouseMove(e){if(!this.isDragging||!this.selectionBox)return;const t=e.clientX,s=e.clientY,n=Math.abs(t-this.startX),a=Math.abs(s-this.startY),i=Math.min(t,this.startX),o=Math.min(s,this.startY);this.selectionBox.style.width=`${n}px`,this.selectionBox.style.height=`${a}px`,this.selectionBox.style.left=`${i}px`,this.selectionBox.style.top=`${o}px`}handleMouseUp(){this.finishDrag()}handleTouchStart(e){e.target.closest(".card, button, .slot")||this.store.getState().viewPerspective!==this.playerType||(this.isDragging=!0,this.startX=e.touches[0].clientX,this.startY=e.touches[0].clientY,this.initialShiftKey=!1,this.selectionBox=document.createElement("div"),this.selectionBox.className="selection-box",this.selectionBox.style.left=`${this.startX}px`,this.selectionBox.style.top=`${this.startY}px`,document.body.appendChild(this.selectionBox),this.store.setState({selectedCards:[]}))}handleTouchMove(e){if(!this.isDragging||!this.selectionBox)return;e.preventDefault();const t=e.touches[0].clientX,s=e.touches[0].clientY,n=Math.abs(t-this.startX),a=Math.abs(s-this.startY),i=Math.min(t,this.startX),o=Math.min(s,this.startY);this.selectionBox.style.width=`${n}px`,this.selectionBox.style.height=`${a}px`,this.selectionBox.style.left=`${i}px`,this.selectionBox.style.top=`${o}px`}handleTouchEnd(){this.finishDrag()}finishDrag(){if(this.isDragging&&(this.isDragging=!1,this.selectionBox)){const e=this.selectionBox.getBoundingClientRect();this.selectionBox.remove(),this.selectionBox=null;const t=document.querySelectorAll(".card"),s=this.store.getState(),n=s[this.playerType],a=[...n.hand,...n.field,...n.deck,...n.drop,...n.set];let i=this.initialShiftKey?[...s.selectedCards||[]]:[];t.forEach(o=>{const l=o.getBoundingClientRect(),c=o.dataset.instanceId;if(!c)return;const r=a.find(h=>h.instanceId===c);r&&l.left<e.right&&l.right>e.left&&l.top<e.bottom&&l.bottom>e.top&&(i.find(h=>h.instanceId===c)||i.push(r))}),this.store.setState({selectedCards:i,playingCard:i.length===1?i[0]:null})}}cleanup(){document.removeEventListener("mousedown",this.mouseDownHandler),document.removeEventListener("mousemove",this.mouseMoveHandler),document.removeEventListener("mouseup",this.mouseUpHandler),document.removeEventListener("touchstart",this.touchStartHandler),document.removeEventListener("touchmove",this.touchMoveHandler),document.removeEventListener("touchend",this.touchEndHandler),this.selectionBox&&(this.selectionBox.remove(),this.selectionBox=null)}}class X{constructor(e,t,s,n){u(this,"store");u(this,"playerType");u(this,"overlay",null);u(this,"attachCardEventsCallback");u(this,"moveCardCallback");this.store=e,this.playerType=t,this.attachCardEventsCallback=s,this.moveCardCallback=n}render(e){var p;if(this.overlay||(this.overlay=document.getElementById("global-expanded-overlay"),this.overlay||(this.overlay=document.createElement("div"),this.overlay.id="global-expanded-overlay",document.body.appendChild(this.overlay))),!e){this.overlay&&(this.overlay.style.display="none",this.overlay.innerHTML="");return}const t=this.store.getState(),s=t[this.playerType];let n=[];e==="drop"?n=s.drop:n=s.field.filter(d=>d.position===e);const a=this.playerType===t.viewPerspective;this.overlay.className="expanded-overlay",a?this.overlay.classList.add("overlay-top"):this.overlay.classList.add("overlay-bottom");let i=null,o=[];n.length>0&&(i=n[n.length-1],o=n.slice(0,n.length-1)),this.overlay.style.display="flex",this.overlay.innerHTML=`
        <div class="expanded-content">
            <div class="expanded-header">
                <h3>${e.toUpperCase()} Stack ${a?"":"(Read Only)"}</h3>
                <div class="header-buttons">
                    ${a?'<button class="btn move-to-hand-btn">Move to Hand</button>':""}
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
      `;const l=this.overlay.querySelector(".active-card-container"),c=this.overlay.querySelector(".expanded-grid"),r=this.overlay.querySelector(".close-btn"),h=this.overlay.querySelector(".move-to-hand-btn");if(r==null||r.addEventListener("click",()=>{this.close()}),h==null||h.addEventListener("click",()=>{const d=this.store.getState();d.selectedCards&&d.selectedCards.length>0&&(this.moveCardCallback(d.selectedCards[0],"hand"),this.close())}),this.overlay.addEventListener("click",d=>{d.target===this.overlay&&this.close()}),a&&this.setupOverlayDragSelection(c,n),i&&l){const d=D.render(i,!1,s.school),m=document.createElement("div");m.innerHTML=d;const v=m.firstElementChild;v.dataset.instanceId=i.instanceId,this.attachCardEventsCallback(v,i,a),(p=t.selectedCards)!=null&&p.find(f=>f.instanceId===i.instanceId)&&(v.classList.add("selected"),v.style.border="2px solid #00ff88"),l.appendChild(v)}o.forEach(d=>{var g;const m=D.render(d,!1,s.school),v=document.createElement("div");v.innerHTML=m;const f=v.firstElementChild;f.dataset.instanceId=d.instanceId,this.attachCardEventsCallback(f,d,a),(g=t.selectedCards)!=null&&g.find(y=>y.instanceId===d.instanceId)&&(f.classList.add("selected"),f.style.border="2px solid #00ff88"),c==null||c.appendChild(f)})}setupOverlayDragSelection(e,t){var p,d;let s=!1,n=0,a=0,i=null,o=!1;const l=m=>{if(!s||!i)return;const v=m.clientX,f=m.clientY,g=Math.abs(v-n),y=Math.abs(f-a),S=Math.min(v,n),C=Math.min(f,a);i.style.width=`${g}px`,i.style.height=`${y}px`,i.style.left=`${S}px`,i.style.top=`${C}px`},c=()=>{if(s&&(s=!1,document.removeEventListener("mousemove",l),document.removeEventListener("mouseup",c),i)){const m=i.getBoundingClientRect();i.remove(),i=null;const v=e.querySelectorAll(".card");let f=o?[...this.store.getState().selectedCards||[]]:[];v.forEach(g=>{const y=g.getBoundingClientRect(),S=g.dataset.instanceId;if(!S)return;const C=t.find(w=>w.instanceId===S);C&&y.left<m.right&&y.right>m.left&&y.top<m.bottom&&y.bottom>m.top&&(f.find(w=>w.instanceId===S)||f.push(C))}),this.store.setState({selectedCards:f,playingCard:f.length===1?f[0]:null})}};e.addEventListener("mousedown",m=>{m.target.closest(".card")||(s=!0,n=m.clientX,a=m.clientY,o=m.shiftKey,i=document.createElement("div"),i.className="selection-box",i.style.left=`${n}px`,i.style.top=`${a}px`,document.body.appendChild(i),o||this.store.setState({selectedCards:[]}),document.addEventListener("mousemove",l),document.addEventListener("mouseup",c))});const r=()=>{document.removeEventListener("mousemove",l),document.removeEventListener("mouseup",c),i&&i.remove(),s=!1},h=(p=this.overlay)==null?void 0:p.querySelector(".close-btn");h==null||h.addEventListener("click",r),(d=this.overlay)==null||d.addEventListener("click",m=>{m.target===this.overlay&&r()})}close(){this.overlay&&(this.overlay.style.display="none",this.overlay.innerHTML="")}}class _{constructor(e,t){u(this,"element");u(this,"playerType");u(this,"store");u(this,"expandedZone",null);u(this,"lastPerspective",null);u(this,"dragSelection");u(this,"expandedOverlay");this.playerType=e,this.store=t,this.element=document.createElement("div"),this.element.className=`player-zone ${this.playerType}`,this.render(),this.setupSubscription(),this.dragSelection=new Y(t,e),this.expandedOverlay=new X(t,e,this.attachCardEvents.bind(this),this.moveCard.bind(this))}setupSubscription(){this.store.subscribe(e=>{this.updateCounts(e),this.lastPerspective&&this.lastPerspective!==e.viewPerspective&&(this.expandedZone=null,this.expandedOverlay.render(null)),this.lastPerspective=e.viewPerspective,this.expandedZone&&this.expandedOverlay.render(this.expandedZone)})}updateCounts(e){const t=this.playerType==="me"?e.me:e.opponent,s=this.playerType==="me"?e.me.school:e.opponent.school;this.updateSetArea(t.set,s,e.viewPerspective),this.updateDeckArea(t.deck,s),this.updateDropArea(t.drop,s);const n=this.element.querySelector(".set-area .count"),a=this.element.querySelector(".deck-area .count");n&&(n.textContent=t.set.length.toString()),a&&(a.textContent=t.deck.length.toString()),this.updateHand(t.hand),this.updateField(t.field)}updateSetArea(e,t,s){const n=this.element.querySelector(".set-area");if(!n)return;const a=n.querySelector(".set-cards-container");if(!a)return;const i=Array.from(a.querySelectorAll(".set-card")),o=new Set(e.map(r=>r.instanceId));i.forEach(r=>{o.has(r.dataset.instanceId)||r.remove()}),e.forEach(r=>{const h=i.find(p=>p.dataset.instanceId===r.instanceId);if(h){const p=this.playerType===s,d=h.style.cursor==="pointer";if(p!==d){const m=D.render(r,!0,t),v=document.createElement("div");v.innerHTML=m;const f=v.firstElementChild;f.classList.add("set-card"),f.dataset.instanceId=r.instanceId,p&&(f.addEventListener("click",()=>{confirm("Add this card to your hand?")&&this.moveSetCardToHand(r)}),f.style.cursor="pointer"),h.replaceWith(f)}}else{const p=D.render(r,!0,t),d=document.createElement("div");d.innerHTML=p;const m=d.firstElementChild;m.classList.add("set-card"),m.dataset.instanceId=r.instanceId,this.playerType===s&&(m.addEventListener("click",()=>{confirm("Add this card to your hand?")&&this.moveSetCardToHand(r)}),m.style.cursor="pointer"),a.appendChild(m)}});const l=a.querySelector(".set-card-slot");if(e.length>0)l&&l.remove();else if(!l){const r=document.createElement("div");r.className="slot set-card-slot",r.setAttribute("data-pos","set"),r.textContent="Set",a.appendChild(r)}const c=a.querySelector(".surrender-btn");if(e.length===0&&this.playerType===s){if(!c){const r=document.createElement("button");r.className="btn surrender-btn",r.textContent="Surrender",r.addEventListener("click",()=>this.handleSurrender()),a.appendChild(r)}}else c&&c.remove()}updateDeckArea(e,t){const s=this.element.querySelector(".deck-slot");if(!s)return;const n=s.querySelector(".card-stack");if(e.length>0)if(n){n.dataset.count=e.length.toString();const a=n.querySelector(".card");if(a){const i={id:"deck-back",instanceId:"deck-back",name:"Deck",type:"CHARACTER"},o=D.render(i,!0,t),l=document.createElement("div");l.innerHTML=o;const c=l.firstElementChild;c&&a.replaceWith(c)}}else{s.innerHTML="";const a=document.createElement("div");a.className="card-stack",a.dataset.count=e.length.toString();const i={id:"deck-back",instanceId:"deck-back",name:"Deck",type:"CHARACTER"},o=D.render(i,!0,t),l=document.createElement("div");l.innerHTML=o;const c=l.firstElementChild;c&&a.appendChild(c),s.appendChild(a)}else n&&(s.innerHTML="Deck")}updateDropArea(e,t){const s=this.element.querySelector(".drop-slot");if(!s)return;const n=e.length>0?e[e.length-1]:null,a=s.querySelector(".card"),i=s.querySelector(".stack-count");if(n){if(!a||a.dataset.instanceId!==n.instanceId){a&&a.remove();const o=D.render(n,!1,t);if(o&&o.trim().length>0){const l=document.createElement("div");l.innerHTML=o;const c=l.firstElementChild;s.prepend(c)}}}else a&&(a.remove(),s.textContent="Drop");if(e.length>1)if(i)i.textContent=e.length.toString();else{const o=document.createElement("div");o.className="stack-count",o.textContent=e.length.toString(),s.appendChild(o)}else i&&i.remove()}moveSetCardToHand(e){const s=this.store.getState()[this.playerType],n=s.set.filter(i=>i.instanceId!==e.instanceId),a=[...s.hand,e];this.store.setState({[this.playerType]:{...s,set:n,hand:a}})}handleSurrender(){if(confirm("確定投降嗎？")){const t=this.store.getState(),s=this.playerType==="me"?"opponent":"me",n={...t.winCount};n[s]++,this.store.setState({matchWinner:s,winCount:n}),this.store.addLog(`${this.playerType==="me"?"我方":"對手"} 投降了！勝者：${s==="me"?"我方":"對手"}`)}}attachDrawEvent(){const e=this.element.querySelector(".draw-btn");e==null||e.addEventListener("click",()=>{const s=this.store.getState();if(this.playerType!==s.viewPerspective)return;const n=s[this.playerType],a=[...n.deck];if(a.length===0){alert("Deck is empty!");return}const i=a.shift();if(i){const o=[...n.hand,i];this.store.setState({[this.playerType]:{...n,deck:a,hand:o}}),this.store.addLog(`${this.playerType==="me"?"我方":"對手"} 抽了一張卡`)}});const t=this.element.querySelector(".shuffle-btn");t==null||t.addEventListener("click",()=>{this.store.getState().viewPerspective===this.playerType?this.store.shuffleDeck(this.playerType):alert("You can only shuffle your own deck.")})}updateHand(e){const t=this.element.querySelector(".hand-cards");if(!t)return;const s=this.store.getState(),n=this.playerType==="me"?s.me.school:s.opponent.school,a=this.playerType===s.viewPerspective,i=Array.from(t.querySelectorAll(".card[data-instance-id]")),o=new Set(i.map(c=>c.dataset.instanceId)),l=new Set(e.map(c=>c.instanceId));i.forEach(c=>{const r=c.dataset.instanceId;r&&!l.has(r)&&c.remove()}),e.forEach(c=>{var r,h,p;if(o.has(c.instanceId)){const d=t.querySelector(`.card[data-instance-id="${c.instanceId}"]`);if(d)if(!d.classList.contains("back")!==a){const v=D.render(c,!a,n),f=document.createElement("div");f.innerHTML=v;const g=f.firstElementChild;g&&(g.dataset.instanceId=c.instanceId,a&&this.attachCardInteractionEvents(g,c),(r=s.selectedCards)!=null&&r.find(S=>S.instanceId===c.instanceId)&&(g.classList.add("playing","selected"),g.style.border="2px solid #00ff88"),d.replaceWith(g))}else!!((h=s.selectedCards)!=null&&h.find(f=>f.instanceId===c.instanceId))?(d.classList.add("playing","selected"),d.style.border="2px solid #00ff88"):(d.classList.remove("playing","selected"),d.style.border="")}else{const d=D.render(c,!a,n),m=document.createElement("div");m.innerHTML=d;const v=m.firstElementChild;if(!v)return;v.dataset.instanceId=c.instanceId,a&&this.attachCardInteractionEvents(v,c),!!((p=s.selectedCards)!=null&&p.find(g=>g.instanceId===c.instanceId))&&(v.classList.add("playing","selected"),v.style.border="2px solid #00ff88"),t.appendChild(v)}})}attachCardInteractionEvents(e,t){e.addEventListener("contextmenu",s=>{s.preventDefault(),this.store.setState({selectedCard:t})}),e.addEventListener("click",s=>{s.stopPropagation();const n=this.store.getState();this.store.setState({selectedCard:t});let a=[...n.selectedCards||[]];s.shiftKey?a.find(i=>i.instanceId===t.instanceId)?a=a.filter(i=>i.instanceId!==t.instanceId):a.push(t):a=[t],this.store.setState({selectedCards:a,playingCard:a.length===1?a[0]:null})})}updateField(e){const t=this.store.getState(),s=this.playerType==="opponent"?t.opponent.school:t.me.school,n={};e.forEach(i=>{i.position&&(n[i.position]||(n[i.position]=[]),n[i.position].push(i))}),this.element.querySelectorAll(".slot[data-pos]").forEach(i=>{const o=i.dataset.pos;if(o&&["serve","event","receive","toss","attack","block-left","block-center","block-right"].includes(o)){const l=n[o]||[],c=l.length>0?l[l.length-1]:null,r=i.querySelector(".card[data-instance-id]"),h=r==null?void 0:r.dataset.instanceId,p=i.querySelector(".stack-count");if(c){if(!(r&&h===c.instanceId)){r&&r.remove();const d=D.render(c,!1,s),m=document.createElement("div");m.innerHTML=d;const v=m.firstElementChild;v&&(v.dataset.instanceId=c.instanceId,this.attachFieldCardEvents(v,c),i.appendChild(v))}}else r&&r.remove();if(l.length>1)if(p)p.textContent=l.length.toString();else{const d=document.createElement("div");d.className="stack-count",d.textContent=l.length.toString(),i.appendChild(d)}else p&&p.remove()}})}attachFieldCardEvents(e,t){e.addEventListener("contextmenu",s=>{s.preventDefault(),s.stopPropagation(),this.store.setState({selectedCard:t})}),e.addEventListener("click",s=>{s.preventDefault(),this.store.setState({selectedCard:t})}),e.style.cursor="pointer"}render(){this.element.innerHTML=`
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
    `,this.attachSlotEvents(),this.attachDrawEvent(),this.attachFunctionEvents(),this.attachHandEvents()}attachFunctionEvents(){const e=this.element.querySelector(".back-btn");e==null||e.addEventListener("click",()=>{const t=this.store.getState();this.playerType===t.viewPerspective&&this.store.undo()})}attachHandEvents(){const e=this.element.querySelector(".hand-area");e==null||e.addEventListener("click",t=>{if(t.target.closest(".card"))return;const s=this.store.getState();this.playerType===s.viewPerspective&&s.selectedCards&&s.selectedCards.length>0&&this.moveCard(s.selectedCards[0],"hand")})}attachSlotEvents(){this.element.querySelectorAll(".slot").forEach(s=>{s.addEventListener("click",()=>{const n=this.store.getState(),a=s.getAttribute("data-pos"),i=n.playingCard,o=n.selectedCards||[];if(this.playerType===n.viewPerspective){let c=!1;if(o.length>0){const r=n[this.playerType].field.filter(p=>p.position===a);o.every(p=>r.find(d=>d.instanceId===p.instanceId))||(c=!0)}if(c){if(s.classList.contains("deck-slot")){this.moveCard(o[0],"deck");return}if(s.classList.contains("drop-slot")){this.moveCard(o[0],"drop");return}if(a){this.moveCard(o[0],a);return}}}(!i||o.length>0&&o.every(c=>c.position===a))&&a&&["serve","event","receive","toss","attack","block-left","block-center","block-right","drop"].includes(a)&&(this.expandedZone=a,this.expandedOverlay.render(a))})});const t=this.element.querySelector('.slot[data-pos="deck"]');t==null||t.addEventListener("contextmenu",s=>{s.preventDefault(),this.store.setState({viewingDeckInfo:{player:this.playerType}})})}attachCardEvents(e,t,s){e.addEventListener("contextmenu",r=>{r.preventDefault(),r.stopPropagation(),this.store.setState({selectedCard:t})});let n;const a=500;let i=0,o=0;e.addEventListener("touchstart",r=>{i=r.touches[0].clientX,o=r.touches[0].clientY,n=setTimeout(()=>{this.store.setState({selectedCard:t}),navigator.vibrate&&navigator.vibrate(50)},a)},{passive:!0});let l=0;const c=300;e.addEventListener("touchend",()=>{clearTimeout(n);const r=new Date().getTime(),h=r-l;h<c&&h>0&&(this.store.setState({selectedCard:t}),navigator.vibrate&&navigator.vibrate(50)),l=r}),e.addEventListener("touchmove",r=>{const h=r.touches[0].clientX,p=r.touches[0].clientY,d=Math.abs(h-i),m=Math.abs(p-o);(d>10||m>10)&&clearTimeout(n)},{passive:!0}),s?e.addEventListener("click",r=>{const h=this.store.getState();this.store.setState({selectedCard:t});let p=[...h.selectedCards||[]];r.shiftKey?p.find(d=>d.instanceId===t.instanceId)?p=p.filter(d=>d.instanceId!==t.instanceId):p.push(t):p=[t],this.store.setState({selectedCards:p,playingCard:p.length===1?p[0]:null})}):(e.addEventListener("click",()=>{this.store.setState({selectedCard:t})}),e.style.cursor="pointer")}moveCard(e,t){const s=this.store.getState(),n=s[this.playerType];let a=[e];s.selectedCards&&s.selectedCards.length>0&&s.selectedCards.find(d=>d.instanceId===e.instanceId)&&(a=s.selectedCards);let i=[...n.hand],o=[...n.field],l=[...n.deck],c=[...n.drop],r="",h=0;if(a.forEach(d=>{const m=i.find(g=>g.instanceId===d.instanceId),v=o.find(g=>g.instanceId===d.instanceId),f=c.find(g=>g.instanceId===d.instanceId);if(m)i=i.filter(g=>g.instanceId!==d.instanceId);else if(v)o=o.filter(g=>g.instanceId!==d.instanceId);else if(f)c=c.filter(g=>g.instanceId!==d.instanceId);else return;t==="deck"?l.push(d):t==="drop"?c.push(d):t==="hand"?i.push(d):o.push({...d,position:t}),h++}),h===0)return;h===1?r=`移動了 ${a[0].name} 到 ${t}`:r=`移動了 ${h} 張卡片 到 ${t}`;const p=this.calculateStats(o);this.store.setState({[this.playerType]:{...n,hand:i,field:o,deck:l,drop:c,currentStats:p},playingCard:null,selectedCards:[],logs:this.store.getNewLogs(`${this.playerType==="me"?"我方":"對手"} ${r}`)})}calculateStats(e){const t={serve:0,block:0,receive:0,toss:0,attack:0};return e.forEach(s=>{!s.stats||!s.position||(s.position==="serve"&&(t.serve+=s.stats.serve||0),s.position.startsWith("block")&&(t.block+=s.stats.block||0),s.position==="receive"&&(t.receive+=s.stats.receive||0),s.position==="toss"&&(t.toss+=s.stats.toss||0),s.position==="attack"&&(t.attack+=s.stats.attack||0))}),t}cleanup(){this.dragSelection.cleanup(),this.expandedOverlay.close()}getElement(){return this.element}}class W{constructor(e){u(this,"element");u(this,"store");this.store=e,this.element=document.createElement("div"),this.element.className="match-end-overlay",this.element.style.display="none",this.render(),this.setupSubscription()}setupSubscription(){this.store.subscribe(e=>{e.matchWinner?this.show(e.matchWinner):this.hide()})}show(e){const t=this.store.getState(),s=e==="me"?"opponent":"me",n=t[e].school,a=t[s].school,i=e==="me"?"我方":"對手",o=s==="me"?"我方":"對手",l=this.element.querySelector(".match-end-content");if(l){l.innerHTML=`
        <h1 class="match-end-title">MATCH END</h1>
        
        <div class="match-end-result">
          <div class="match-end-winner">
            🏆 ${i} [${n}] WINS 🏆
          </div>
          <div class="match-end-loser">
            ${o} [${a}] surrendered
          </div>
        </div>
        
        <div class="match-end-score">
          戰績: 我方 ${t.winCount.me} - ${t.winCount.opponent} 對手
        </div>
        
        <div class="match-end-buttons">
          <button class="btn match-end-btn back-to-setup-btn">Back to Setup</button>
          <button class="btn match-end-btn rematch-btn">Rematch</button>
        </div>
      `;const c=l.querySelector(".back-to-setup-btn"),r=l.querySelector(".rematch-btn");c==null||c.addEventListener("click",()=>this.handleBackToSetup()),r==null||r.addEventListener("click",()=>this.handleRematch())}this.element.style.display="flex"}hide(){this.element.style.display="none"}handleBackToSetup(){location.reload()}handleRematch(){const e=this.store.getState(),t=[...e.me.deck,...e.me.hand,...e.me.field,...e.me.drop,...e.me.set],s=[...e.opponent.deck,...e.opponent.hand,...e.opponent.field,...e.opponent.drop,...e.opponent.set],n=e.me.school,a=e.opponent.school,i=e.firstPlayer==="me"?"opponent":"me",o=this.shuffleArray(t),l=this.shuffleArray(s),c=o.splice(0,2).map(h=>({...h,position:"set"})),r=l.splice(0,2).map(h=>({...h,position:"set"}));this.store.setState({matchWinner:null,firstPlayer:i,turnPlayer:i,phase:"draw",me:{deck:o,hand:[],set:c,drop:[],field:[],school:n},opponent:{deck:l,hand:[],set:r,drop:[],field:[],school:a},selectedCard:null,selectedCards:[],playingCard:null,battleState:{isAttacking:!1,defenseChoice:"none",attacker:null}}),this.store.addLog(`新回合開始！先手：${i==="me"?"我方":"對手"}`)}shuffleArray(e){const t=[...e];for(let s=t.length-1;s>0;s--){const n=Math.floor(Math.random()*(s+1));[t[s],t[n]]=[t[n],t[s]]}return t}render(){this.element.innerHTML=`
      <div class="match-end-content">
        <!-- Content will be populated by show() method -->
      </div>
    `}getElement(){return this.element}}class F{constructor(e){u(this,"element");u(this,"store");u(this,"opponentZone");u(this,"meZone");u(this,"matchEndOverlay");this.store=e,this.element=document.createElement("div"),this.element.className="game-board",this.opponentZone=new _("opponent",this.store),this.meZone=new _("me",this.store),this.matchEndOverlay=new W(this.store),this.render(),this.setupSubscription()}setupSubscription(){this.store.subscribe(e=>{this.updatePerspective(e.viewPerspective)})}updatePerspective(e){e==="opponent"?this.element.classList.add("rotated"):this.element.classList.remove("rotated")}render(){this.element.appendChild(this.opponentZone.getElement());const e=document.createElement("div");e.className="net",this.element.appendChild(e),this.element.appendChild(this.meZone.getElement());const t=document.createElement("button");t.className="switch-view-btn",t.innerText="Switch View",t.onclick=()=>{const s=this.store.getState().viewPerspective;this.store.setState({viewPerspective:s==="me"?"opponent":"me"})},document.body.appendChild(t),document.body.appendChild(this.matchEndOverlay.getElement())}getElement(){return this.element}}const U="modulepreload",j=function(k){return"/tcg/"+k},B={},b=function(e,t,s){let n=Promise.resolve();if(t&&t.length>0){document.getElementsByTagName("link");const i=document.querySelector("meta[property=csp-nonce]"),o=(i==null?void 0:i.nonce)||(i==null?void 0:i.getAttribute("nonce"));n=Promise.allSettled(t.map(l=>{if(l=j(l),l in B)return;B[l]=!0;const c=l.endsWith(".css"),r=c?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${l}"]${r}`))return;const h=document.createElement("link");if(h.rel=c?"stylesheet":U,c||(h.as="script"),h.crossOrigin="",h.href=l,o&&h.setAttribute("nonce",o),document.head.appendChild(h),c)return new Promise((p,d)=>{h.addEventListener("load",p),h.addEventListener("error",()=>d(new Error(`Unable to preload CSS for ${l}`)))})}))}function a(i){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=i,window.dispatchEvent(o),!o.defaultPrevented)throw i}return n.then(i=>{for(const o of i||[])o.status==="rejected"&&a(o.reason);return e().catch(a)})},I=class I{constructor(){u(this,"cards",new Map);u(this,"loaded",!1)}static getInstance(){return I.instance||(I.instance=new I),I.instance}async loadAll(){if(!this.loaded)try{await this.loadConsolidatedPools(),this.loaded=!0,console.log(`CardDatabase loaded ${this.cards.size} cards.`)}catch(e){console.error("Failed to load card pools:",e)}}resolvePath(e){const t="/tcg/",s=e.startsWith("/")?e.slice(1):e;return`${t.endsWith("/")?t:`${t}/`}${s}`}async loadConsolidatedPools(){const e=this.resolvePath("pool/All_Characters.csv"),t=this.resolvePath("pool/All_Events.csv");try{const[s,n]=await Promise.all([fetch(e),fetch(t)]);if(s.ok){const a=await s.text();this.parsePoolCSV(a,"CHARACTER")}if(n.ok){const a=await n.text();this.parsePoolCSV(a,"EVENT")}console.log("Loaded consolidated pools")}catch(s){console.error("Failed to load consolidated pools:",s)}}parsePoolCSV(e,t){var n,a,i,o,l,c,r,h,p,d,m,v;const s=e.split(`
`);for(let f=1;f<s.length;f++){const g=s[f].trim();if(!g)continue;const y=this.parseCSVLine(g);if(y.length<4)continue;const S=(n=y[0])==null?void 0:n.trim(),C=(a=y[2])==null?void 0:a.trim(),w=(i=y[3])==null?void 0:i.trim();if(!C||!w)continue;const E=A=>{if(!A||A.trim()==="-"||A.trim()==="")return null;const P=parseInt(A.trim());return isNaN(P)?null:P};t==="CHARACTER"?this.cards.set(C,{id:C,name:w,type:"CHARACTER",school:S,timing:((o=y[4])==null?void 0:o.trim())||"-",rarity:((l=y[5])==null?void 0:l.trim())||"-",role:((c=y[6])==null?void 0:c.trim())||"-",stats:{serve:E(y[7]),block:E(y[8]),receive:E(y[9]),toss:E(y[10]),attack:E(y[11])},skill:((r=y[12])==null?void 0:r.trim())||"-",note:((h=y[13])==null?void 0:h.trim())||"-"}):this.cards.set(C,{id:C,name:w,type:"EVENT",school:S,rarity:((p=y[4])==null?void 0:p.trim())||"-",timing:((d=y[5])==null?void 0:d.trim())||"-",role:"-",stats:{serve:E(y[6]),block:E(y[7]),receive:E(y[8]),toss:E(y[9]),attack:E(y[10])},skill:((m=y[11])==null?void 0:m.trim())||"-",note:((v=y[12])==null?void 0:v.trim())||"-"})}}parseCSVLine(e){const t=[];let s="",n=!1;for(let a=0;a<e.length;a++){const i=e[a];i==='"'?n=!n:i===","&&!n?(t.push(s),s=""):s+=i}return t.push(s),t}getCard(e){return this.cards.get(e)}getAllCards(){return Array.from(this.cards.values())}getTotalCardCount(e){var n;const t=e.split(`
`);let s=0;for(let a=1;a<t.length;a++){const i=t[a].trim();if(!i)continue;const o=i.split(",");if(o.length<2)continue;let l=0;if(o.length>=3){const c=(n=o[2])==null?void 0:n.trim();if(c){const r=parseInt(c);isNaN(r)||(l=r)}}s+=l}return s}async getAvailableDecks(){const e=Object.assign({"/src/assets/decks/梟谷/template.csv":()=>b(()=>import("./template-YZRRei5E.js"),[]).then(s=>s.default),"/src/assets/decks/梟谷/爆發軸二.csv":()=>b(()=>import("./爆發軸二-DRygAH0m.js"),[]).then(s=>s.default),"/src/assets/decks/梟谷/高爆發軸.csv":()=>b(()=>import("./高爆發軸-OlfSSk9F.js"),[]).then(s=>s.default),"/src/assets/decks/混合學校/template.csv":()=>b(()=>import("./template-BL6p7JrW.js"),[]).then(s=>s.default),"/src/assets/decks/混合學校/垃圾場.csv":()=>b(()=>import("./垃圾場-DLQNSA_3.js"),[]).then(s=>s.default),"/src/assets/decks/烏野/template.csv":()=>b(()=>import("./template-Dl-KCfeZ.js"),[]).then(s=>s.default),"/src/assets/decks/烏野/山月攔網軸.csv":()=>b(()=>import("./山月攔網軸-C9q-UzZd.js"),[]).then(s=>s.default),"/src/assets/decks/烏野/日影攻擊軸.csv":()=>b(()=>import("./日影攻擊軸-B5nYVoJQ.js"),[]).then(s=>s.default),"/src/assets/decks/烏野/預組.csv":()=>b(()=>import("./預組-CkakcnPP.js"),[]).then(s=>s.default),"/src/assets/decks/青葉城西/template.csv":()=>b(()=>import("./template-BgW2zTP9.js"),[]).then(s=>s.default),"/src/assets/decks/青葉城西/中速軸.csv":()=>b(()=>import("./中速軸-Csfw3ekW.js"),[]).then(s=>s.default),"/src/assets/decks/青葉城西/快攻軸.csv":()=>b(()=>import("./快攻軸-BJnvWjYD.js"),[]).then(s=>s.default),"/src/assets/decks/音駒/template.csv":()=>b(()=>import("./template-CxhDpovY.js"),[]).then(s=>s.default),"/src/assets/decks/音駒/預組.csv":()=>b(()=>import("./預組-1IW_7lEd.js"),[]).then(s=>s.default)}),t=[];for(const s in e){const n=s.split("/"),a=n[n.length-1],i=n[n.length-2],o=a.replace(".csv","");try{const l=await e[s](),c=this.getTotalCardCount(l);c===40&&t.push({school:i,name:o,path:s,loader:e[s],cardCount:c})}catch(l){console.warn(`Failed to load deck at ${s}:`,l)}}return t}async loadDeck(e){try{const t=await e();return this.parseDeckCSV(t)}catch(t){return console.error("Failed to load deck:",t),[]}}parseDeckCSV(e){var n,a;const t=e.split(`
`),s=[];for(let i=1;i<t.length;i++){const o=t[i].trim();if(!o)continue;const l=o.split(",");if(l.length<2)continue;const c=(n=l[1])==null?void 0:n.trim();let r=0;if(l.length>=3){const p=(a=l[2])==null?void 0:a.trim();if(p){const d=parseInt(p);isNaN(d)||(r=d)}}if(!c||r===0)continue;const h=this.getCard(c);if(h)for(let p=0;p<r;p++)s.push({...h,instanceId:crypto.randomUUID()});else console.warn(`Card ID not found in pool: ${c}`)}return s}};u(I,"instance");let $=I;class G{constructor(e){u(this,"element");u(this,"store");u(this,"meDeckLoaded",!1);u(this,"opDeckLoaded",!1);u(this,"firstPlayerDecided",!1);u(this,"availableDecks",[]);this.store=e,this.element=document.createElement("div"),this.element.className="setup-overlay",this.loadDatabase(),this.render()}async loadDatabase(){const e=$.getInstance();await e.loadAll(),console.log("CardDatabase ready"),this.availableDecks=await e.getAvailableDecks(),this.render(),this.loadDefaultDecks()}render(){const e=this.availableDecks.map(t=>`<option value="${t.path}">${t.school} - ${t.name}</option>`).join("");this.element.innerHTML=`
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
    `,this.attachEvents()}attachEvents(){const e=this.element.querySelector("#me-deck-select"),t=this.element.querySelector("#op-deck-select"),s=this.element.querySelector("#coin-toss-btn"),n=this.element.querySelector("#start-game-btn");e==null||e.addEventListener("change",a=>this.handleDeckSelection(a,"me")),t==null||t.addEventListener("change",a=>this.handleDeckSelection(a,"opponent")),s==null||s.addEventListener("click",()=>{const a=Math.random()<.5?"me":"opponent";this.store.setState({firstPlayer:a});const i=this.element.querySelector("#toss-result");i&&(i.textContent=a==="me"?"Me":"Opponent",i.className="result decided"),this.firstPlayerDecided=!0,this.checkReady()}),n==null||n.addEventListener("click",()=>{this.startGame()})}async handleDeckSelection(e,t){const n=e.target.value;if(!n){t==="me"?this.meDeckLoaded=!1:this.opDeckLoaded=!1,this.updateStatus(t,"Not Selected"),this.checkReady();return}const a=this.availableDecks.find(i=>i.path===n);if(a)try{const o=await $.getInstance().loadDeck(a.loader);o.length>0&&(t==="me"?(this.store.setState({me:{...this.store.getState().me,deck:o,school:a.school}}),this.meDeckLoaded=!0):(this.store.setState({opponent:{...this.store.getState().opponent,deck:o,school:a.school}}),this.opDeckLoaded=!0),this.updateStatus(t,`已載入: ${a.name} (${o.length} 張卡片)`),this.checkReady())}catch(i){console.error(`Failed to load deck for ${t}:`,i),this.updateStatus(t,"載入失敗"),t==="me"?this.meDeckLoaded=!1:this.opDeckLoaded=!1,this.checkReady()}}async loadDefaultDecks(){const e=this.availableDecks.find(t=>t.school==="青葉城西"&&t.name.includes("快攻軸"));if(!e){console.warn("Default deck not found");return}try{const t=$.getInstance(),[s,n]=await Promise.all([t.loadDeck(e.loader),t.loadDeck(e.loader)]);if(s.length>0){this.store.setState({me:{...this.store.getState().me,deck:s,school:e.school}}),this.meDeckLoaded=!0,this.updateStatus("me",`Loaded: ${e.name} (${s.length} cards)`);const a=this.element.querySelector("#me-deck-select");a&&(a.value=e.path)}if(n.length>0){this.store.setState({opponent:{...this.store.getState().opponent,deck:n,school:e.school}}),this.opDeckLoaded=!0,this.updateStatus("opponent",`Loaded: ${e.name} (${n.length} cards)`);const a=this.element.querySelector("#op-deck-select");a&&(a.value=e.path)}this.checkReady()}catch(t){console.error("Failed to load default decks:",t)}}updateStatus(e,t){const s=e==="me"?"me-deck-status":"op-deck-status",n=this.element.querySelector(`#${s}`);n&&(n.textContent=t)}checkReady(){const e=this.element.querySelector("#start-game-btn");this.meDeckLoaded&&this.opDeckLoaded&&this.firstPlayerDecided&&(e.disabled=!1)}startGame(){const e=this.store.getState(),t=this.shuffle([...e.me.deck]),s=this.shuffle([...e.opponent.deck]),n=t.splice(0,6),a=s.splice(0,6),i=t.splice(0,2),o=s.splice(0,2);this.store.setState({gamePhase:"playing",me:{...e.me,deck:t,hand:n,set:i},opponent:{...e.opponent,deck:s,hand:a,set:o}}),this.element.style.display="none"}shuffle(e){for(let t=e.length-1;t>0;t--){const s=Math.floor(Math.random()*(t+1));[e[t],e[s]]=[e[s],e[t]]}return e}getElement(){return this.element}}class K{constructor(e){u(this,"element");u(this,"store");this.store=e,this.element=document.createElement("div"),this.element.className="card-detail-panel",this.render(),this.setupSubscription()}setupSubscription(){this.store.subscribe(e=>{e.viewingDeckInfo?this.renderDeckInfo(e):this.updateContent(e.selectedCard)})}updateContent(e){e?this.renderCardDetails(e):this.render()}renderDeckInfo(e){var r;const t=e.viewingDeckInfo;if(!t)return;const s=e[t.player],n=[...s.deck,...s.hand,...s.field,...s.drop,...s.set],a=new Map;n.forEach(h=>{const p=h.id;a.has(p)||a.set(p,{name:h.name,total:0,remaining:0,id:h.id,rarity:h.rarity||"",type:h.type});const d=a.get(p);d.total++}),s.deck.forEach(h=>{const p=h.id;a.has(p)&&a.get(p).remaining++});const i=Array.from(a.values()).sort((h,p)=>h.id.localeCompare(p.id)),o=i.filter(h=>h.type==="CHARACTER"),l=i.filter(h=>h.type==="EVENT"),c=h=>h.map(p=>`
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
                <h3>Deck List (${t.player==="me"?"My":"Opponent"})</h3>
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
                            ${c(o)}
                        </tbody>
                    </table>
                </div>
                `:""}
                ${l.length>0?`
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
                            ${c(l)}
                        </tbody>
                    </table>
                </div>
                `:""}
            </div>
        </div>
      `,(r=this.element.querySelector(".close-btn"))==null||r.addEventListener("click",()=>{this.store.setState({viewingDeckInfo:null})})}renderCardDetails(e){var n,a,i,o,l;const t=e.type==="EVENT",s=t?"":`
        <div class="detail-stats">
          <div class="detail-stat"><span>Serve</span><span>${L((n=e.stats)==null?void 0:n.serve,!0)}</span></div>
          <div class="detail-stat"><span>Block</span><span>${L((a=e.stats)==null?void 0:a.block,!0)}</span></div>
          <div class="detail-stat"><span>Receive</span><span>${L((i=e.stats)==null?void 0:i.receive,!0)}</span></div>
          <div class="detail-stat"><span>Toss</span><span>${L((o=e.stats)==null?void 0:o.toss,!0)}</span></div>
          <div class="detail-stat"><span>Attack</span><span>${L((l=e.stats)==null?void 0:l.attack,!0)}</span></div>
        </div>
      `;this.element.innerHTML=`
      <div class="detail-content ${t?"event":"character"}">
        <div class="detail-header">
          <h2>${e.name}</h2>
          <div class="detail-id">${e.id}</div>
          <div class="detail-meta">
              ${e.rarity?`<span class="rarity">稀有度: ${e.rarity}</span>`:""}
              ${e.role?`<span class="role">位置: ${e.role}</span>`:""}
          </div>
        </div>
        ${s}
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
    `}getElement(){return this.element}}class Z{constructor(e){u(this,"element");u(this,"store");u(this,"meBaseAttack",0);u(this,"meBaseDefense",0);u(this,"opBaseAttack",0);u(this,"opBaseDefense",0);u(this,"meManualAttack",0);u(this,"meManualDefense",0);u(this,"opManualAttack",0);u(this,"opManualDefense",0);this.store=e,this.element=document.createElement("div"),this.element.className="stats-panel",this.render(),this.attachEvents(),this.setupSubscription()}setupSubscription(){this.store.subscribe(e=>{const t=e.me.currentStats;t&&(this.meBaseAttack=(t.serve||0)+(t.attack||0)+(t.toss||0),this.meBaseDefense=(t.block||0)+(t.receive||0));const s=e.opponent.currentStats;s&&(this.opBaseAttack=(s.serve||0)+(s.attack||0)+(s.toss||0),this.opBaseDefense=(s.block||0)+(s.receive||0)),this.updateAllDisplays(),this.renderLogs(e.logs)})}render(){this.element.innerHTML=`
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
    `}renderLogs(e){const t=this.element.querySelector("#game-log-container");if(t){if(!e||e.length===0){t.innerHTML="<div class='log-entry empty'>No actions yet</div>";return}t.innerHTML=e.map(s=>`<div class="log-entry">${s}</div>`).join("")}}attachEvents(){this.element.addEventListener("click",e=>{const t=e.target;if(t.classList.contains("reset-stats-btn")){const s=t.getAttribute("data-target");s==="me"?(this.meManualAttack=-this.meBaseAttack,this.meManualDefense=-this.meBaseDefense,this.store.addLog("Me reset their stats.")):s==="op"&&(this.opManualAttack=-this.opBaseAttack,this.opManualDefense=-this.opBaseDefense,this.store.addLog("Opponent stats were reset.")),this.updateAllDisplays();return}if(t.classList.contains("stat-btn")){const s=t.getAttribute("data-target"),n=t.getAttribute("data-type"),a=t.getAttribute("data-op");s==="me"?n==="attack"?this.meManualAttack+=a==="plus"?1:-1:this.meManualDefense+=a==="plus"?1:-1:n==="attack"?this.opManualAttack+=a==="plus"?1:-1:this.opManualDefense+=a==="plus"?1:-1,this.updateAllDisplays()}})}updateAllDisplays(){this.updateDisplay("me","attack",this.meBaseAttack+this.meManualAttack),this.updateDisplay("me","defense",this.meBaseDefense+this.meManualDefense),this.updateDisplay("op","attack",this.opBaseAttack+this.opManualAttack),this.updateDisplay("op","defense",this.opBaseDefense+this.opManualDefense)}updateDisplay(e,t,s){const n=this.element.querySelector(`#${e}-${t}-val`);n&&(n.textContent=s.toString())}getElement(){return this.element}}const z={viewPerspective:"me",gamePhase:"setup",firstPlayer:null,selectedCard:null,playingCard:null,me:{deck:[],hand:[],set:[],drop:[],field:[],school:"seijoh"},opponent:{deck:[],hand:[],set:[],drop:[],field:[],school:"karasuno"},logs:[],turnPlayer:"me",phase:"draw",battleState:{isAttacking:!1,defenseChoice:"none",attacker:null},winCount:{me:0,opponent:0},selectedCards:[],matchWinner:null},x=new H(z),T=document.querySelector("#app");if(T){T.innerHTML="",T.className="app-container";const k=new Z(x),e=new F(x),t=new K(x),s=new G(x);T.appendChild(k.getElement()),T.appendChild(e.getElement()),T.appendChild(t.getElement()),document.body.appendChild(s.getElement())}
