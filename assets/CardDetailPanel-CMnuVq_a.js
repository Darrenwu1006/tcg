var T=Object.defineProperty;var H=(g,e,t)=>e in g?T(g,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):g[e]=t;var u=(g,e,t)=>H(g,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const a of i.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&s(a)}).observe(document,{childList:!0,subtree:!0});function t(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(n){if(n.ep)return;n.ep=!0;const i=t(n);fetch(n.href,i)}})();const w=class w{constructor(e){u(this,"state");u(this,"listeners",[]);u(this,"history",[]);this.state={...e,logs:[],selectedCards:[],turnPlayer:"me",phase:"draw",battleState:{isAttacking:!1,defenseChoice:"none",attacker:null},winCount:{me:0,opponent:0},matchWinner:null}}getState(){return this.state}setState(e,t=!0){t&&(this.history.push({...this.state}),this.history.length>w.MAX_HISTORY&&this.history.shift()),this.state={...this.state,...e},this.notify()}undo(){if(this.history.length===0)return;const e=this.history.pop();e&&(this.state=e,this.notify())}addLog(e){const t=this.getNewLogs(e);this.setState({logs:t},!1)}getNewLogs(e){return[`[${new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"})}] ${e}`,...this.state.logs||[]].slice(0,50)}subscribe(e){return this.listeners.push(e),()=>{this.listeners=this.listeners.filter(t=>t!==e)}}notify(){this.listeners.forEach(e=>e(this.state))}shuffleDeck(e){const t=e==="me"?[...this.state.me.deck]:[...this.state.opponent.deck];for(let n=t.length-1;n>0;n--){const i=Math.floor(Math.random()*(n+1));[t[n],t[i]]=[t[i],t[n]]}const s={};e==="me"?s.me={...this.state.me,deck:t}:s.opponent={...this.state.opponent,deck:t},s.logs=this.getNewLogs(`${e==="me"?"我方":"對手"} 洗切了牌庫`),this.setState(s)}};u(w,"MAX_HISTORY",20);let x=w;const D={青葉城西:"seijoh",烏野:"karasuno",音駒:"nekoma",梟谷:"fukurodani",混合學校:"mixed",稲荷崎:"inarizaki",白鳥沢:"shiratorizawa",伊達工業:"datekou"},M="karasuno";function A(g){return D[g]||M}function C(g,e=!1){const t=g===null,s=t?0:g??0,n=6,i=Math.min(Math.max(s,0),n),a=n-i;let o='<div class="block-bar-container">';for(let l=0;l<i;l++)o+='<div class="block filled"></div>';for(let l=0;l<a;l++)o+='<div class="block empty"></div>';if(o+="</div>",e){const l=t?"-":s.toString();return`${o} <span class="block-value">${l}</span>`}return o}class S{static render(e,t=!1,s="烏野"){const n=t?s:e.school||s,i=A(n);if(t)return`
        <div class="card back ${i}">
          <div class="card-back-design">
          </div>
        </div>
      `;const a=e.type==="EVENT",o=e.stats||{serve:0,block:0,receive:0,toss:0,attack:0},l=a?"":`
        <div class="card-stats">
          <div class="stat">S: ${C(o.serve)}</div>
          <div class="stat">B: ${C(o.block)}</div>
          <div class="stat">R: ${C(o.receive)}</div>
          <div class="stat">T: ${C(o.toss)}</div>
          <div class="stat">A: ${C(o.attack)}</div>
        </div>
      `;return`
      <div class="card ${a?"event":"character"} ${i}" data-id="${e.id}">
        <div class="card-header">
          <div class="card-name">${e.name}</div>
        </div>
        ${l}
      </div>
    `}}class B{constructor(e,t){u(this,"store");u(this,"playerType");u(this,"isDragging",!1);u(this,"startX",0);u(this,"startY",0);u(this,"selectionBox",null);u(this,"initialShiftKey",!1);u(this,"mouseDownHandler");u(this,"mouseMoveHandler");u(this,"mouseUpHandler");u(this,"touchStartHandler");u(this,"touchMoveHandler");u(this,"touchEndHandler");this.store=e,this.playerType=t,this.mouseDownHandler=this.handleMouseDown.bind(this),this.mouseMoveHandler=this.handleMouseMove.bind(this),this.mouseUpHandler=this.handleMouseUp.bind(this),this.touchStartHandler=this.handleTouchStart.bind(this),this.touchMoveHandler=this.handleTouchMove.bind(this),this.touchEndHandler=this.handleTouchEnd.bind(this),this.setupGlobalDragSelection()}setupGlobalDragSelection(){document.addEventListener("mousedown",this.mouseDownHandler),document.addEventListener("mousemove",this.mouseMoveHandler),document.addEventListener("mouseup",this.mouseUpHandler),document.addEventListener("touchstart",this.touchStartHandler,{passive:!1}),document.addEventListener("touchmove",this.touchMoveHandler,{passive:!1}),document.addEventListener("touchend",this.touchEndHandler)}handleMouseDown(e){e.target.closest(".card, button, .slot")||this.store.getState().viewPerspective!==this.playerType||(this.isDragging=!0,this.startX=e.clientX,this.startY=e.clientY,this.initialShiftKey=e.shiftKey,this.selectionBox=document.createElement("div"),this.selectionBox.className="selection-box",this.selectionBox.style.left=`${this.startX}px`,this.selectionBox.style.top=`${this.startY}px`,document.body.appendChild(this.selectionBox),this.initialShiftKey||this.store.setState({selectedCards:[]}))}handleMouseMove(e){if(!this.isDragging||!this.selectionBox)return;const t=e.clientX,s=e.clientY,n=Math.abs(t-this.startX),i=Math.abs(s-this.startY),a=Math.min(t,this.startX),o=Math.min(s,this.startY);this.selectionBox.style.width=`${n}px`,this.selectionBox.style.height=`${i}px`,this.selectionBox.style.left=`${a}px`,this.selectionBox.style.top=`${o}px`}handleMouseUp(){this.finishDrag()}handleTouchStart(e){e.target.closest(".card, button, .slot")||this.store.getState().viewPerspective!==this.playerType||(this.isDragging=!0,this.startX=e.touches[0].clientX,this.startY=e.touches[0].clientY,this.initialShiftKey=!1,this.selectionBox=document.createElement("div"),this.selectionBox.className="selection-box",this.selectionBox.style.left=`${this.startX}px`,this.selectionBox.style.top=`${this.startY}px`,document.body.appendChild(this.selectionBox),this.store.setState({selectedCards:[]}))}handleTouchMove(e){if(!this.isDragging||!this.selectionBox)return;e.preventDefault();const t=e.touches[0].clientX,s=e.touches[0].clientY,n=Math.abs(t-this.startX),i=Math.abs(s-this.startY),a=Math.min(t,this.startX),o=Math.min(s,this.startY);this.selectionBox.style.width=`${n}px`,this.selectionBox.style.height=`${i}px`,this.selectionBox.style.left=`${a}px`,this.selectionBox.style.top=`${o}px`}handleTouchEnd(){this.finishDrag()}finishDrag(){if(this.isDragging&&(this.isDragging=!1,this.selectionBox)){const e=this.selectionBox.getBoundingClientRect();this.selectionBox.remove(),this.selectionBox=null;const t=document.querySelectorAll(".card"),s=this.store.getState(),n=s[this.playerType],i=[...n.hand,...n.field,...n.deck,...n.drop,...n.set];let a=this.initialShiftKey?[...s.selectedCards||[]]:[];t.forEach(o=>{const l=o.getBoundingClientRect(),c=o.dataset.instanceId;if(!c)return;const r=i.find(h=>h.instanceId===c);r&&l.left<e.right&&l.right>e.left&&l.top<e.bottom&&l.bottom>e.top&&(a.find(h=>h.instanceId===c)||a.push(r))}),this.store.setState({selectedCards:a,playingCard:a.length===1?a[0]:null})}}cleanup(){document.removeEventListener("mousedown",this.mouseDownHandler),document.removeEventListener("mousemove",this.mouseMoveHandler),document.removeEventListener("mouseup",this.mouseUpHandler),document.removeEventListener("touchstart",this.touchStartHandler),document.removeEventListener("touchmove",this.touchMoveHandler),document.removeEventListener("touchend",this.touchEndHandler),this.selectionBox&&(this.selectionBox.remove(),this.selectionBox=null)}}class q{constructor(e,t,s,n){u(this,"store");u(this,"playerType");u(this,"overlay",null);u(this,"attachCardEventsCallback");u(this,"moveCardCallback");this.store=e,this.playerType=t,this.attachCardEventsCallback=s,this.moveCardCallback=n}render(e){var p;if(this.overlay||(this.overlay=document.getElementById("global-expanded-overlay"),this.overlay||(this.overlay=document.createElement("div"),this.overlay.id="global-expanded-overlay",document.body.appendChild(this.overlay))),!e){this.overlay&&(this.overlay.style.display="none",this.overlay.innerHTML="");return}const t=this.store.getState(),s=t[this.playerType];let n=[];e==="drop"?n=s.drop:n=s.field.filter(d=>d.position===e);const i=this.playerType===t.viewPerspective;this.overlay.className="expanded-overlay",i?this.overlay.classList.add("overlay-top"):this.overlay.classList.add("overlay-bottom");let a=null,o=[];n.length>0&&(a=n[n.length-1],o=n.slice(0,n.length-1)),this.overlay.style.display="flex",this.overlay.innerHTML=`
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
      `;const l=this.overlay.querySelector(".active-card-container"),c=this.overlay.querySelector(".expanded-grid"),r=this.overlay.querySelector(".close-btn"),h=this.overlay.querySelector(".move-to-hand-btn");if(r==null||r.addEventListener("click",()=>{this.close()}),h==null||h.addEventListener("click",()=>{const d=this.store.getState();d.selectedCards&&d.selectedCards.length>0&&(this.moveCardCallback(d.selectedCards[0],"hand"),this.close())}),this.overlay.addEventListener("click",d=>{d.target===this.overlay&&this.close()}),i&&this.setupOverlayDragSelection(c,n),a&&l){const d=S.render(a,!1,s.school),v=document.createElement("div");v.innerHTML=d;const m=v.firstElementChild;m.dataset.instanceId=a.instanceId,this.attachCardEventsCallback(m,a,i),(p=t.selectedCards)!=null&&p.find(f=>f.instanceId===a.instanceId)&&(m.classList.add("selected"),m.style.border="2px solid #00ff88"),l.appendChild(m)}o.forEach(d=>{var y;const v=S.render(d,!1,s.school),m=document.createElement("div");m.innerHTML=v;const f=m.firstElementChild;f.dataset.instanceId=d.instanceId,this.attachCardEventsCallback(f,d,i),(y=t.selectedCards)!=null&&y.find(b=>b.instanceId===d.instanceId)&&(f.classList.add("selected"),f.style.border="2px solid #00ff88"),c==null||c.appendChild(f)})}setupOverlayDragSelection(e,t){var p,d;let s=!1,n=0,i=0,a=null,o=!1;const l=v=>{if(!s||!a)return;const m=v.clientX,f=v.clientY,y=Math.abs(m-n),b=Math.abs(f-i),k=Math.min(m,n),E=Math.min(f,i);a.style.width=`${y}px`,a.style.height=`${b}px`,a.style.left=`${k}px`,a.style.top=`${E}px`},c=()=>{if(s&&(s=!1,document.removeEventListener("mousemove",l),document.removeEventListener("mouseup",c),a)){const v=a.getBoundingClientRect();a.remove(),a=null;const m=e.querySelectorAll(".card");let f=o?[...this.store.getState().selectedCards||[]]:[];m.forEach(y=>{const b=y.getBoundingClientRect(),k=y.dataset.instanceId;if(!k)return;const E=t.find(L=>L.instanceId===k);E&&b.left<v.right&&b.right>v.left&&b.top<v.bottom&&b.bottom>v.top&&(f.find(L=>L.instanceId===k)||f.push(E))}),this.store.setState({selectedCards:f,playingCard:f.length===1?f[0]:null})}};e.addEventListener("mousedown",v=>{v.target.closest(".card")||(s=!0,n=v.clientX,i=v.clientY,o=v.shiftKey,a=document.createElement("div"),a.className="selection-box",a.style.left=`${n}px`,a.style.top=`${i}px`,document.body.appendChild(a),o||this.store.setState({selectedCards:[]}),document.addEventListener("mousemove",l),document.addEventListener("mouseup",c))});const r=()=>{document.removeEventListener("mousemove",l),document.removeEventListener("mouseup",c),a&&a.remove(),s=!1},h=(p=this.overlay)==null?void 0:p.querySelector(".close-btn");h==null||h.addEventListener("click",r),(d=this.overlay)==null||d.addEventListener("click",v=>{v.target===this.overlay&&r()})}close(){this.overlay&&(this.overlay.style.display="none",this.overlay.innerHTML="")}}class I{constructor(e,t){u(this,"element");u(this,"playerType");u(this,"store");u(this,"expandedZone",null);u(this,"lastPerspective",null);u(this,"dragSelection");u(this,"expandedOverlay");this.playerType=e,this.store=t,this.element=document.createElement("div"),this.element.className=`player-zone ${this.playerType}`,this.render(),this.setupSubscription(),this.dragSelection=new B(t,e),this.expandedOverlay=new q(t,e,this.attachCardEvents.bind(this),this.moveCard.bind(this))}setupSubscription(){this.store.subscribe(e=>{this.updateCounts(e),this.lastPerspective&&this.lastPerspective!==e.viewPerspective&&(this.expandedZone=null,this.expandedOverlay.render(null)),this.lastPerspective=e.viewPerspective,this.expandedZone&&this.expandedOverlay.render(this.expandedZone)})}updateCounts(e){const t=this.playerType==="me"?e.me:e.opponent,s=this.playerType==="me"?e.me.school:e.opponent.school;this.updateSetArea(t.set,s,e.viewPerspective),this.updateDeckArea(t.deck,s),this.updateDropArea(t.drop,s);const n=this.element.querySelector(".set-area .count"),i=this.element.querySelector(".deck-area .count");n&&(n.textContent=t.set.length.toString()),i&&(i.textContent=t.deck.length.toString()),this.updateHand(t.hand),this.updateField(t.field)}updateSetArea(e,t,s){const n=this.element.querySelector(".set-area");if(!n)return;const i=n.querySelector(".set-cards-container");if(!i)return;const a=Array.from(i.querySelectorAll(".set-card")),o=new Set(e.map(r=>r.instanceId));a.forEach(r=>{o.has(r.dataset.instanceId)||r.remove()}),e.forEach(r=>{const h=a.find(p=>p.dataset.instanceId===r.instanceId);if(h){const p=this.playerType===s,d=h.style.cursor==="pointer";if(p!==d){const v=S.render(r,!0,t),m=document.createElement("div");m.innerHTML=v;const f=m.firstElementChild;f.classList.add("set-card"),f.dataset.instanceId=r.instanceId,p&&(f.addEventListener("click",()=>{confirm("Add this card to your hand?")&&this.moveSetCardToHand(r)}),f.style.cursor="pointer"),h.replaceWith(f)}}else{const p=S.render(r,!0,t),d=document.createElement("div");d.innerHTML=p;const v=d.firstElementChild;v.classList.add("set-card"),v.dataset.instanceId=r.instanceId,this.playerType===s&&(v.addEventListener("click",()=>{confirm("Add this card to your hand?")&&this.moveSetCardToHand(r)}),v.style.cursor="pointer"),i.appendChild(v)}});const l=i.querySelector(".set-card-slot");if(e.length>0)l&&l.remove();else if(!l){const r=document.createElement("div");r.className="slot set-card-slot",r.setAttribute("data-pos","set"),r.textContent="Set",i.appendChild(r)}const c=i.querySelector(".surrender-btn");if(e.length===0&&this.playerType===s){if(!c){const r=document.createElement("button");r.className="btn surrender-btn",r.textContent="Surrender",r.addEventListener("click",()=>this.handleSurrender()),i.appendChild(r)}}else c&&c.remove()}updateDeckArea(e,t){const s=this.element.querySelector(".deck-slot");if(!s)return;const n=s.querySelector(".card-stack");if(e.length>0)if(n){n.dataset.count=e.length.toString();const i=n.querySelector(".card");if(i){const a={id:"deck-back",instanceId:"deck-back",name:"Deck",type:"CHARACTER"},o=S.render(a,!0,t),l=document.createElement("div");l.innerHTML=o;const c=l.firstElementChild;c&&i.replaceWith(c)}}else{s.innerHTML="";const i=document.createElement("div");i.className="card-stack",i.dataset.count=e.length.toString();const a={id:"deck-back",instanceId:"deck-back",name:"Deck",type:"CHARACTER"},o=S.render(a,!0,t),l=document.createElement("div");l.innerHTML=o;const c=l.firstElementChild;c&&i.appendChild(c),s.appendChild(i)}else n&&(s.innerHTML="Deck")}updateDropArea(e,t){const s=this.element.querySelector(".drop-slot");if(!s)return;const n=e.length>0?e[e.length-1]:null,i=s.querySelector(".card"),a=s.querySelector(".stack-count");if(n){if(!i||i.dataset.instanceId!==n.instanceId){i&&i.remove();const o=S.render(n,!1,t);if(o&&o.trim().length>0){const l=document.createElement("div");l.innerHTML=o;const c=l.firstElementChild;s.prepend(c)}}}else i&&(i.remove(),s.textContent="Drop");if(e.length>1)if(a)a.textContent=e.length.toString();else{const o=document.createElement("div");o.className="stack-count",o.textContent=e.length.toString(),s.appendChild(o)}else a&&a.remove()}moveSetCardToHand(e){const s=this.store.getState()[this.playerType],n=s.set.filter(a=>a.instanceId!==e.instanceId),i=[...s.hand,e];this.store.setState({[this.playerType]:{...s,set:n,hand:i}})}handleSurrender(){if(confirm("確定投降嗎？")){const t=this.store.getState(),s=this.playerType==="me"?"opponent":"me",n={...t.winCount};n[s]++,this.store.setState({matchWinner:s,winCount:n}),this.store.addLog(`${this.playerType==="me"?"我方":"對手"} 投降了！勝者：${s==="me"?"我方":"對手"}`)}}attachDrawEvent(){const e=this.element.querySelector(".draw-btn");e==null||e.addEventListener("click",()=>{const s=this.store.getState();if(this.playerType!==s.viewPerspective)return;const n=s[this.playerType],i=[...n.deck];if(i.length===0){alert("Deck is empty!");return}const a=i.shift();if(a){const o=[...n.hand,a];this.store.setState({[this.playerType]:{...n,deck:i,hand:o}}),this.store.addLog(`${this.playerType==="me"?"我方":"對手"} 抽了一張卡`)}});const t=this.element.querySelector(".shuffle-btn");t==null||t.addEventListener("click",()=>{this.store.getState().viewPerspective===this.playerType?this.store.shuffleDeck(this.playerType):alert("You can only shuffle your own deck.")})}updateHand(e){const t=this.element.querySelector(".hand-cards");if(!t)return;const s=this.store.getState(),n=this.playerType==="me"?s.me.school:s.opponent.school,i=this.playerType===s.viewPerspective,a=Array.from(t.querySelectorAll(".card[data-instance-id]")),o=new Set(a.map(c=>c.dataset.instanceId)),l=new Set(e.map(c=>c.instanceId));a.forEach(c=>{const r=c.dataset.instanceId;r&&!l.has(r)&&c.remove()}),e.forEach(c=>{var r,h,p;if(o.has(c.instanceId)){const d=t.querySelector(`.card[data-instance-id="${c.instanceId}"]`);if(d)if(!d.classList.contains("back")!==i){const m=S.render(c,!i,n),f=document.createElement("div");f.innerHTML=m;const y=f.firstElementChild;y&&(y.dataset.instanceId=c.instanceId,i&&this.attachCardInteractionEvents(y,c),(r=s.selectedCards)!=null&&r.find(k=>k.instanceId===c.instanceId)&&(y.classList.add("playing","selected"),y.style.border="2px solid #00ff88"),d.replaceWith(y))}else!!((h=s.selectedCards)!=null&&h.find(f=>f.instanceId===c.instanceId))?(d.classList.add("playing","selected"),d.style.border="2px solid #00ff88"):(d.classList.remove("playing","selected"),d.style.border="")}else{const d=S.render(c,!i,n),v=document.createElement("div");v.innerHTML=d;const m=v.firstElementChild;if(!m)return;m.dataset.instanceId=c.instanceId,i&&this.attachCardInteractionEvents(m,c),!!((p=s.selectedCards)!=null&&p.find(y=>y.instanceId===c.instanceId))&&(m.classList.add("playing","selected"),m.style.border="2px solid #00ff88"),t.appendChild(m)}})}attachCardInteractionEvents(e,t){e.addEventListener("contextmenu",s=>{s.preventDefault(),this.store.setState({selectedCard:t})}),e.addEventListener("click",s=>{s.stopPropagation();const n=this.store.getState();this.store.setState({selectedCard:t});let i=[...n.selectedCards||[]];s.shiftKey?i.find(a=>a.instanceId===t.instanceId)?i=i.filter(a=>a.instanceId!==t.instanceId):i.push(t):i=[t],this.store.setState({selectedCards:i,playingCard:i.length===1?i[0]:null})})}updateField(e){const t=this.store.getState(),s=this.playerType==="opponent"?t.opponent.school:t.me.school,n={};e.forEach(a=>{a.position&&(n[a.position]||(n[a.position]=[]),n[a.position].push(a))}),this.element.querySelectorAll(".slot[data-pos]").forEach(a=>{const o=a.dataset.pos;if(o&&["serve","event","receive","toss","attack","block-left","block-center","block-right"].includes(o)){const l=n[o]||[],c=l.length>0?l[l.length-1]:null,r=a.querySelector(".card[data-instance-id]"),h=r==null?void 0:r.dataset.instanceId,p=a.querySelector(".stack-count");if(c){if(!(r&&h===c.instanceId)){r&&r.remove();const d=S.render(c,!1,s),v=document.createElement("div");v.innerHTML=d;const m=v.firstElementChild;m&&(m.dataset.instanceId=c.instanceId,this.attachFieldCardEvents(m,c),a.appendChild(m))}}else r&&r.remove();if(l.length>1)if(p)p.textContent=l.length.toString();else{const d=document.createElement("div");d.className="stack-count",d.textContent=l.length.toString(),a.appendChild(d)}else p&&p.remove()}})}attachFieldCardEvents(e,t){e.addEventListener("contextmenu",s=>{s.preventDefault(),s.stopPropagation(),this.store.setState({selectedCard:t})}),e.addEventListener("click",s=>{s.preventDefault(),this.store.setState({selectedCard:t})}),e.style.cursor="pointer"}render(){this.element.innerHTML=`
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
    `,this.attachSlotEvents(),this.attachDrawEvent(),this.attachFunctionEvents(),this.attachHandEvents()}attachFunctionEvents(){const e=this.element.querySelector(".back-btn");e==null||e.addEventListener("click",()=>{const t=this.store.getState();this.playerType===t.viewPerspective&&this.store.undo()})}attachHandEvents(){const e=this.element.querySelector(".hand-area");e==null||e.addEventListener("click",t=>{if(t.target.closest(".card"))return;const s=this.store.getState();this.playerType===s.viewPerspective&&s.selectedCards&&s.selectedCards.length>0&&this.moveCard(s.selectedCards[0],"hand")})}attachSlotEvents(){this.element.querySelectorAll(".slot").forEach(s=>{s.addEventListener("click",()=>{const n=this.store.getState(),i=s.getAttribute("data-pos"),a=n.playingCard,o=n.selectedCards||[];if(this.playerType===n.viewPerspective){let c=!1;if(o.length>0){const r=n[this.playerType].field.filter(p=>p.position===i);o.every(p=>r.find(d=>d.instanceId===p.instanceId))||(c=!0)}if(c){if(s.classList.contains("deck-slot")){this.moveCard(o[0],"deck");return}if(s.classList.contains("drop-slot")){this.moveCard(o[0],"drop");return}if(i){this.moveCard(o[0],i);return}}}(!a||o.length>0&&o.every(c=>c.position===i))&&i&&["serve","event","receive","toss","attack","block-left","block-center","block-right","drop"].includes(i)&&(this.expandedZone=i,this.expandedOverlay.render(i))})});const t=this.element.querySelector('.slot[data-pos="deck"]');t==null||t.addEventListener("contextmenu",s=>{s.preventDefault(),this.store.setState({viewingDeckInfo:{player:this.playerType}})})}attachCardEvents(e,t,s){e.addEventListener("contextmenu",r=>{r.preventDefault(),r.stopPropagation(),this.store.setState({selectedCard:t})});let n;const i=500;let a=0,o=0;e.addEventListener("touchstart",r=>{a=r.touches[0].clientX,o=r.touches[0].clientY,n=setTimeout(()=>{this.store.setState({selectedCard:t}),navigator.vibrate&&navigator.vibrate(50)},i)},{passive:!0});let l=0;const c=300;e.addEventListener("touchend",()=>{clearTimeout(n);const r=new Date().getTime(),h=r-l;h<c&&h>0&&(this.store.setState({selectedCard:t}),navigator.vibrate&&navigator.vibrate(50)),l=r}),e.addEventListener("touchmove",r=>{const h=r.touches[0].clientX,p=r.touches[0].clientY,d=Math.abs(h-a),v=Math.abs(p-o);(d>10||v>10)&&clearTimeout(n)},{passive:!0}),s?e.addEventListener("click",r=>{const h=this.store.getState();this.store.setState({selectedCard:t});let p=[...h.selectedCards||[]];r.shiftKey?p.find(d=>d.instanceId===t.instanceId)?p=p.filter(d=>d.instanceId!==t.instanceId):p.push(t):p=[t],this.store.setState({selectedCards:p,playingCard:p.length===1?p[0]:null})}):(e.addEventListener("click",()=>{this.store.setState({selectedCard:t})}),e.style.cursor="pointer")}moveCard(e,t){const s=this.store.getState(),n=s[this.playerType];let i=[e];s.selectedCards&&s.selectedCards.length>0&&s.selectedCards.find(d=>d.instanceId===e.instanceId)&&(i=s.selectedCards);let a=[...n.hand],o=[...n.field],l=[...n.deck],c=[...n.drop],r="",h=0;if(i.forEach(d=>{const v=a.find(y=>y.instanceId===d.instanceId),m=o.find(y=>y.instanceId===d.instanceId),f=c.find(y=>y.instanceId===d.instanceId);if(v)a=a.filter(y=>y.instanceId!==d.instanceId);else if(m)o=o.filter(y=>y.instanceId!==d.instanceId);else if(f)c=c.filter(y=>y.instanceId!==d.instanceId);else return;t==="deck"?l.push(d):t==="drop"?c.push(d):t==="hand"?a.push(d):o.push({...d,position:t}),h++}),h===0)return;h===1?r=`移動了 ${i[0].name} 到 ${t}`:r=`移動了 ${h} 張卡片 到 ${t}`;const p=this.calculateStats(o);this.store.setState({[this.playerType]:{...n,hand:a,field:o,deck:l,drop:c,currentStats:p},playingCard:null,selectedCards:[],logs:this.store.getNewLogs(`${this.playerType==="me"?"我方":"對手"} ${r}`)})}calculateStats(e){const t={serve:0,block:0,receive:0,toss:0,attack:0};return e.forEach(s=>{!s.stats||!s.position||(s.position==="serve"&&(t.serve+=s.stats.serve||0),s.position.startsWith("block")&&(t.block+=s.stats.block||0),s.position==="receive"&&(t.receive+=s.stats.receive||0),s.position==="toss"&&(t.toss+=s.stats.toss||0),s.position==="attack"&&(t.attack+=s.stats.attack||0))}),t}cleanup(){this.dragSelection.cleanup(),this.expandedOverlay.close()}getElement(){return this.element}}class P{constructor(e){u(this,"element");u(this,"store");this.store=e,this.element=document.createElement("div"),this.element.className="match-end-overlay",this.element.style.display="none",this.render(),this.setupSubscription()}setupSubscription(){this.store.subscribe(e=>{e.matchWinner?this.show(e.matchWinner):this.hide()})}show(e){const t=this.store.getState(),s=e==="me"?"opponent":"me",n=t[e].school,i=t[s].school,a=e==="me"?"我方":"對手",o=s==="me"?"我方":"對手",l=this.element.querySelector(".match-end-content");if(l){l.innerHTML=`
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
          戰績: 我方 ${t.winCount.me} - ${t.winCount.opponent} 對手
        </div>
        
        <div class="match-end-buttons">
          <button class="btn match-end-btn back-to-setup-btn">Back to Setup</button>
          <button class="btn match-end-btn rematch-btn">Rematch</button>
        </div>
      `;const c=l.querySelector(".back-to-setup-btn"),r=l.querySelector(".rematch-btn");c==null||c.addEventListener("click",()=>this.handleBackToSetup()),r==null||r.addEventListener("click",()=>this.handleRematch())}this.element.style.display="flex"}hide(){this.element.style.display="none"}handleBackToSetup(){location.reload()}handleRematch(){const e=this.store.getState(),t=[...e.me.deck,...e.me.hand,...e.me.field,...e.me.drop,...e.me.set],s=[...e.opponent.deck,...e.opponent.hand,...e.opponent.field,...e.opponent.drop,...e.opponent.set],n=e.me.school,i=e.opponent.school,a=e.firstPlayer==="me"?"opponent":"me",o=this.shuffleArray(t),l=this.shuffleArray(s),c=o.splice(0,2).map(h=>({...h,position:"set"})),r=l.splice(0,2).map(h=>({...h,position:"set"}));this.store.setState({matchWinner:null,firstPlayer:a,turnPlayer:a,phase:"draw",me:{deck:o,hand:[],set:c,drop:[],field:[],school:n},opponent:{deck:l,hand:[],set:r,drop:[],field:[],school:i},selectedCard:null,selectedCards:[],playingCard:null,battleState:{isAttacking:!1,defenseChoice:"none",attacker:null}}),this.store.addLog(`新回合開始！先手：${a==="me"?"我方":"對手"}`)}shuffleArray(e){const t=[...e];for(let s=t.length-1;s>0;s--){const n=Math.floor(Math.random()*(s+1));[t[s],t[n]]=[t[n],t[s]]}return t}render(){this.element.innerHTML=`
      <div class="match-end-content">
        <!-- Content will be populated by show() method -->
      </div>
    `}getElement(){return this.element}}class X{constructor(e){u(this,"element");u(this,"store");u(this,"opponentZone");u(this,"meZone");u(this,"matchEndOverlay");this.store=e,this.element=document.createElement("div"),this.element.className="game-board",this.opponentZone=new I("opponent",this.store),this.meZone=new I("me",this.store),this.matchEndOverlay=new P(this.store),this.render(),this.setupSubscription()}setupSubscription(){this.store.subscribe(e=>{this.updatePerspective(e.viewPerspective)})}updatePerspective(e){e==="opponent"?this.element.classList.add("rotated"):this.element.classList.remove("rotated")}render(){this.element.appendChild(this.opponentZone.getElement());const e=document.createElement("div");e.className="net",this.element.appendChild(e),this.element.appendChild(this.meZone.getElement());const t=document.createElement("button");t.className="switch-view-btn",t.innerText="Switch View",t.onclick=()=>{const s=this.store.getState().viewPerspective;this.store.setState({viewPerspective:s==="me"?"opponent":"me"})},document.body.appendChild(t),document.body.appendChild(this.matchEndOverlay.getElement())}getElement(){return this.element}}const O="modulepreload",N=function(g){return"/tcg/"+g},$={},R=function(e,t,s){let n=Promise.resolve();if(t&&t.length>0){document.getElementsByTagName("link");const a=document.querySelector("meta[property=csp-nonce]"),o=(a==null?void 0:a.nonce)||(a==null?void 0:a.getAttribute("nonce"));n=Promise.allSettled(t.map(l=>{if(l=N(l),l in $)return;$[l]=!0;const c=l.endsWith(".css"),r=c?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${l}"]${r}`))return;const h=document.createElement("link");if(h.rel=c?"stylesheet":O,c||(h.as="script"),h.crossOrigin="",h.href=l,o&&h.setAttribute("nonce",o),document.head.appendChild(h),c)return new Promise((p,d)=>{h.addEventListener("load",p),h.addEventListener("error",()=>d(new Error(`Unable to preload CSS for ${l}`)))})}))}function i(a){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=a,window.dispatchEvent(o),!o.defaultPrevented)throw a}return n.then(a=>{for(const o of a||[])o.status==="rejected"&&i(o.reason);return e().catch(i)})};class W{constructor(e){u(this,"element");u(this,"store");this.store=e,this.element=document.createElement("div"),this.element.className="card-detail-panel",this.render(),this.setupSubscription()}setupSubscription(){this.store.subscribe(e=>{e.viewingDeckInfo?this.renderDeckInfo(e):this.updateContent(e.selectedCard)})}updateContent(e){e?this.renderCardDetails(e):this.render()}renderDeckInfo(e){var r;const t=e.viewingDeckInfo;if(!t)return;const s=e[t.player],n=[...s.deck,...s.hand,...s.field,...s.drop,...s.set],i=new Map;n.forEach(h=>{const p=h.id;i.has(p)||i.set(p,{name:h.name,total:0,remaining:0,id:h.id,rarity:h.rarity||"",type:h.type});const d=i.get(p);d.total++}),s.deck.forEach(h=>{const p=h.id;i.has(p)&&i.get(p).remaining++});const a=Array.from(i.values()).sort((h,p)=>h.id.localeCompare(p.id)),o=a.filter(h=>h.type==="CHARACTER"),l=a.filter(h=>h.type==="EVENT"),c=h=>h.map(p=>`
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
      `,(r=this.element.querySelector(".close-btn"))==null||r.addEventListener("click",()=>{this.store.setState({viewingDeckInfo:null})})}renderCardDetails(e){var n,i,a,o,l;const t=e.type==="EVENT",s=t?"":`
        <div class="detail-stats">
          <div class="detail-stat"><span>Serve</span><span>${C((n=e.stats)==null?void 0:n.serve,!0)}</span></div>
          <div class="detail-stat"><span>Block</span><span>${C((i=e.stats)==null?void 0:i.block,!0)}</span></div>
          <div class="detail-stat"><span>Receive</span><span>${C((a=e.stats)==null?void 0:a.receive,!0)}</span></div>
          <div class="detail-stat"><span>Toss</span><span>${C((o=e.stats)==null?void 0:o.toss,!0)}</span></div>
          <div class="detail-stat"><span>Attack</span><span>${C((l=e.stats)==null?void 0:l.attack,!0)}</span></div>
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
    `}getElement(){return this.element}}export{W as C,X as G,x as S,R as _};
