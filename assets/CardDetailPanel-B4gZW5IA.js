var M=Object.defineProperty;var O=(g,e,s)=>e in g?M(g,e,{enumerable:!0,configurable:!0,writable:!0,value:s}):g[e]=s;var m=(g,e,s)=>O(g,typeof e!="symbol"?e+"":e,s);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))t(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const a of i.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&t(a)}).observe(document,{childList:!0,subtree:!0});function s(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function t(n){if(n.ep)return;n.ep=!0;const i=s(n);fetch(n.href,i)}})();const _=class _{constructor(e){m(this,"state");m(this,"listeners",[]);m(this,"history",[]);this.state={...e,logs:[],selectedCards:[],turnPlayer:"me",phase:"draw",battleState:{isAttacking:!1,defenseChoice:"none",attacker:null},winCount:{me:0,opponent:0},matchWinner:null}}getState(){return this.state}setState(e,s=!0){s&&(this.history.push({...this.state}),this.history.length>_.MAX_HISTORY&&this.history.shift()),this.state={...this.state,...e},this.notify()}undo(){if(this.history.length===0)return;const e=this.history.pop();e&&(this.state=e,this.notify())}addLog(e){const s=this.getNewLogs(e);this.setState({logs:s},!1)}getNewLogs(e){return[`[${new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"})}] ${e}`,...this.state.logs||[]].slice(0,50)}subscribe(e){return this.listeners.push(e),()=>{this.listeners=this.listeners.filter(s=>s!==e)}}notify(){this.listeners.forEach(e=>e(this.state))}shuffleDeck(e){const s=e==="me"?[...this.state.me.deck]:[...this.state.opponent.deck];for(let n=s.length-1;n>0;n--){const i=Math.floor(Math.random()*(n+1));[s[n],s[i]]=[s[i],s[n]]}const t={};e==="me"?t.me={...this.state.me,deck:s}:t.opponent={...this.state.opponent,deck:s},t.logs=this.getNewLogs(`${e==="me"?"我方":"對手"} 洗切了牌庫`),this.setState(t)}};m(_,"MAX_HISTORY",20);let $=_;const R={青葉城西:"seijoh",烏野:"karasuno",音駒:"nekoma",梟谷:"fukurodani",混合學校:"mixed",稲荷崎:"inarizaki",白鳥沢:"shiratorizawa",伊達工業:"datekou"},B="karasuno";function q(g){return R[g]||B}function I(g,e=!1){const s=g===null,t=s?0:g??0,n=6,i=Math.min(Math.max(t,0),n),a=n-i;let o='<div class="block-bar-container">';for(let r=0;r<i;r++)o+='<div class="block filled"></div>';for(let r=0;r<a;r++)o+='<div class="block empty"></div>';if(o+="</div>",e){const r=s?"-":t.toString();return`${o} <span class="block-value">${r}</span>`}return o}class L{static render(e,s=!1,t="烏野"){const n=s?t:e.school||t,i=q(n);if(s)return`
        <div class="card back ${i}">
          <div class="card-back-design">
          </div>
        </div>
      `;const a=e.type==="EVENT",o=e.stats||{serve:0,block:0,receive:0,toss:0,attack:0},r=a?"":`
        <div class="card-stats">
          <div class="stat">S: ${I(o.serve)}</div>
          <div class="stat">B: ${I(o.block)}</div>
          <div class="stat">R: ${I(o.receive)}</div>
          <div class="stat">T: ${I(o.toss)}</div>
          <div class="stat">A: ${I(o.attack)}</div>
        </div>
      `;return`
      <div class="card ${a?"event":"character"} ${i}" data-id="${e.id}">
        <div class="card-header">
          <div class="card-name">${e.name}</div>
        </div>
        ${r}
      </div>
    `}}class V{constructor(e,s){m(this,"store");m(this,"playerType");m(this,"isDragging",!1);m(this,"startX",0);m(this,"startY",0);m(this,"selectionBox",null);m(this,"initialShiftKey",!1);m(this,"mouseDownHandler");m(this,"mouseMoveHandler");m(this,"mouseUpHandler");m(this,"touchStartHandler");m(this,"touchMoveHandler");m(this,"touchEndHandler");this.store=e,this.playerType=s,this.mouseDownHandler=this.handleMouseDown.bind(this),this.mouseMoveHandler=this.handleMouseMove.bind(this),this.mouseUpHandler=this.handleMouseUp.bind(this),this.touchStartHandler=this.handleTouchStart.bind(this),this.touchMoveHandler=this.handleTouchMove.bind(this),this.touchEndHandler=this.handleTouchEnd.bind(this),this.setupGlobalDragSelection()}setupGlobalDragSelection(){document.addEventListener("mousedown",this.mouseDownHandler),document.addEventListener("mousemove",this.mouseMoveHandler),document.addEventListener("mouseup",this.mouseUpHandler),document.addEventListener("touchstart",this.touchStartHandler,{passive:!1}),document.addEventListener("touchmove",this.touchMoveHandler,{passive:!1}),document.addEventListener("touchend",this.touchEndHandler)}handleMouseDown(e){e.target.closest(".card, button, .slot")||this.store.getState().viewPerspective!==this.playerType||(this.isDragging=!0,this.startX=e.clientX,this.startY=e.clientY,this.initialShiftKey=e.shiftKey,this.selectionBox=document.createElement("div"),this.selectionBox.className="selection-box",this.selectionBox.style.left=`${this.startX}px`,this.selectionBox.style.top=`${this.startY}px`,document.body.appendChild(this.selectionBox),this.initialShiftKey||this.store.setState({selectedCards:[]}))}handleMouseMove(e){if(!this.isDragging||!this.selectionBox)return;const s=e.clientX,t=e.clientY,n=Math.abs(s-this.startX),i=Math.abs(t-this.startY),a=Math.min(s,this.startX),o=Math.min(t,this.startY);this.selectionBox.style.width=`${n}px`,this.selectionBox.style.height=`${i}px`,this.selectionBox.style.left=`${a}px`,this.selectionBox.style.top=`${o}px`}handleMouseUp(){this.finishDrag()}handleTouchStart(e){e.target.closest(".card, button, .slot")||this.store.getState().viewPerspective!==this.playerType||(this.isDragging=!0,this.startX=e.touches[0].clientX,this.startY=e.touches[0].clientY,this.initialShiftKey=!1,this.selectionBox=document.createElement("div"),this.selectionBox.className="selection-box",this.selectionBox.style.left=`${this.startX}px`,this.selectionBox.style.top=`${this.startY}px`,document.body.appendChild(this.selectionBox),this.store.setState({selectedCards:[]}))}handleTouchMove(e){if(!this.isDragging||!this.selectionBox)return;e.preventDefault();const s=e.touches[0].clientX,t=e.touches[0].clientY,n=Math.abs(s-this.startX),i=Math.abs(t-this.startY),a=Math.min(s,this.startX),o=Math.min(t,this.startY);this.selectionBox.style.width=`${n}px`,this.selectionBox.style.height=`${i}px`,this.selectionBox.style.left=`${a}px`,this.selectionBox.style.top=`${o}px`}handleTouchEnd(){this.finishDrag()}finishDrag(){if(this.isDragging&&(this.isDragging=!1,this.selectionBox)){const e=this.selectionBox.getBoundingClientRect();this.selectionBox.remove(),this.selectionBox=null;const s=document.querySelectorAll(".card"),t=this.store.getState(),n=t[this.playerType],i=[...n.hand,...n.field,...n.deck,...n.drop,...n.set];let a=this.initialShiftKey?[...t.selectedCards||[]]:[];s.forEach(o=>{const r=o.getBoundingClientRect(),l=o.dataset.instanceId;if(!l)return;const c=i.find(h=>h.instanceId===l);c&&r.left<e.right&&r.right>e.left&&r.top<e.bottom&&r.bottom>e.top&&(a.find(h=>h.instanceId===l)||a.push(c))}),this.store.setState({selectedCards:a,playingCard:a.length===1?a[0]:null})}}cleanup(){document.removeEventListener("mousedown",this.mouseDownHandler),document.removeEventListener("mousemove",this.mouseMoveHandler),document.removeEventListener("mouseup",this.mouseUpHandler),document.removeEventListener("touchstart",this.touchStartHandler),document.removeEventListener("touchmove",this.touchMoveHandler),document.removeEventListener("touchend",this.touchEndHandler),this.selectionBox&&(this.selectionBox.remove(),this.selectionBox=null)}}class N{constructor(e,s,t,n,i){m(this,"store");m(this,"playerType");m(this,"overlay",null);m(this,"attachCardEventsCallback");m(this,"moveCardCallback");m(this,"onCloseCallback");this.store=e,this.playerType=s,this.attachCardEventsCallback=t,this.moveCardCallback=n,this.onCloseCallback=i}render(e){var d;if(this.overlay||(this.overlay=document.getElementById("global-expanded-overlay"),this.overlay||(this.overlay=document.createElement("div"),this.overlay.id="global-expanded-overlay",document.body.appendChild(this.overlay))),!e){this.overlay&&(this.overlay.style.display="none",this.overlay.innerHTML="");return}const s=this.store.getState(),t=s[this.playerType];let n=[];e==="drop"?n=t.drop:n=t.field.filter(p=>p.position===e);const i=this.playerType===s.viewPerspective;this.overlay.className="expanded-overlay",i?this.overlay.classList.add("overlay-top"):this.overlay.classList.add("overlay-bottom");let a=null,o=[];n.length>0&&(a=n[n.length-1],o=n.slice(0,n.length-1)),this.overlay.style.display="flex",this.overlay.innerHTML=`
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
      `;const r=this.overlay.querySelector(".active-card-container"),l=this.overlay.querySelector(".expanded-grid"),c=this.overlay.querySelector(".close-btn"),h=this.overlay.querySelector(".move-to-hand-btn");if(c==null||c.addEventListener("click",()=>{this.close()}),h==null||h.addEventListener("click",()=>{const p=this.store.getState();p.selectedCards&&p.selectedCards.length>0&&(this.moveCardCallback(p.selectedCards[0],"hand"),this.close())}),this.overlay.addEventListener("click",p=>{p.target===this.overlay&&this.close()}),i&&this.setupOverlayDragSelection(l,n),a&&r){const p=L.render(a,!1,t.school),u=document.createElement("div");u.innerHTML=p;const f=u.firstElementChild;f.dataset.instanceId=a.instanceId,this.attachCardEventsCallback(f,a,i),(d=s.selectedCards)!=null&&d.find(v=>v.instanceId===a.instanceId)&&(f.classList.add("selected"),f.style.border="2px solid #00ff88"),r.appendChild(f)}o.forEach(p=>{var E;const u=L.render(p,!1,t.school),f=document.createElement("div");f.innerHTML=u;const v=f.firstElementChild;v.dataset.instanceId=p.instanceId,this.attachCardEventsCallback(v,p,i),(E=s.selectedCards)!=null&&E.find(y=>y.instanceId===p.instanceId)&&(v.classList.add("selected"),v.style.border="2px solid #00ff88"),l==null||l.appendChild(v)})}setupOverlayDragSelection(e,s){var d,p;let t=!1,n=0,i=0,a=null,o=!1;const r=u=>{if(!t||!a)return;const f=u.clientX,v=u.clientY,E=Math.abs(f-n),y=Math.abs(v-i),S=Math.min(f,n),k=Math.min(v,i);a.style.width=`${E}px`,a.style.height=`${y}px`,a.style.left=`${S}px`,a.style.top=`${k}px`},l=()=>{if(t&&(t=!1,document.removeEventListener("mousemove",r),document.removeEventListener("mouseup",l),a)){const u=a.getBoundingClientRect();a.remove(),a=null;const f=e.querySelectorAll(".card");let v=o?[...this.store.getState().selectedCards||[]]:[];f.forEach(E=>{const y=E.getBoundingClientRect(),S=E.dataset.instanceId;if(!S)return;const k=s.find(w=>w.instanceId===S);k&&y.left<u.right&&y.right>u.left&&y.top<u.bottom&&y.bottom>u.top&&(v.find(w=>w.instanceId===S)||v.push(k))}),this.store.setState({selectedCards:v,playingCard:v.length===1?v[0]:null})}};e.addEventListener("mousedown",u=>{u.target.closest(".card")||(t=!0,n=u.clientX,i=u.clientY,o=u.shiftKey,a=document.createElement("div"),a.className="selection-box",a.style.left=`${n}px`,a.style.top=`${i}px`,document.body.appendChild(a),o||this.store.setState({selectedCards:[]}),document.addEventListener("mousemove",r),document.addEventListener("mouseup",l))});const c=()=>{document.removeEventListener("mousemove",r),document.removeEventListener("mouseup",l),a&&a.remove(),t=!1},h=(d=this.overlay)==null?void 0:d.querySelector(".close-btn");h==null||h.addEventListener("click",c),(p=this.overlay)==null||p.addEventListener("click",u=>{u.target===this.overlay&&c()})}close(){this.overlay&&(this.overlay.style.display="none",this.overlay.innerHTML=""),this.onCloseCallback&&this.onCloseCallback()}}class A{constructor(e,s){m(this,"element");m(this,"playerType");m(this,"store");m(this,"expandedZone",null);m(this,"lastPerspective",null);m(this,"dragSelection");m(this,"expandedOverlay");this.playerType=e,this.store=s,this.element=document.createElement("div"),this.element.className=`player-zone ${this.playerType}`,this.render(),this.setupSubscription(),this.dragSelection=new V(s,e),this.expandedOverlay=new N(s,e,this.attachCardEvents.bind(this),this.moveCard.bind(this),()=>{this.expandedZone=null})}setupSubscription(){this.store.subscribe(e=>{this.updateCounts(e),this.lastPerspective&&this.lastPerspective!==e.viewPerspective&&(this.expandedZone=null,this.expandedOverlay.render(null)),this.lastPerspective=e.viewPerspective,this.expandedZone&&this.expandedOverlay.render(this.expandedZone)})}updateCounts(e){const s=this.playerType==="me"?e.me:e.opponent,t=this.playerType==="me"?e.me.school:e.opponent.school;this.updateSetArea(s.set,t,e.viewPerspective),this.updateDeckArea(s.deck,t),this.updateDropArea(s.drop,t);const n=this.element.querySelector(".set-area .count"),i=this.element.querySelector(".deck-area .count");n&&(n.textContent=s.set.length.toString()),i&&(i.textContent=s.deck.length.toString()),this.updateHand(s.hand),this.updateField(s.field)}updateSetArea(e,s,t){const n=this.element.querySelector(".set-area");if(!n)return;const i=n.querySelector(".set-cards-container");if(!i)return;const a=Array.from(i.querySelectorAll(".set-card")),o=new Set(e.map(c=>c.instanceId));a.forEach(c=>{o.has(c.dataset.instanceId)||c.remove()}),e.forEach(c=>{const h=a.find(d=>d.dataset.instanceId===c.instanceId);if(h){const d=this.playerType===t,p=h.style.cursor==="pointer";if(d!==p){const u=L.render(c,!0,s),f=document.createElement("div");f.innerHTML=u;const v=f.firstElementChild;v.classList.add("set-card"),v.dataset.instanceId=c.instanceId,d&&(v.addEventListener("click",()=>{confirm("Add this card to your hand?")&&this.moveSetCardToHand(c)}),v.style.cursor="pointer"),h.replaceWith(v)}}else{const d=L.render(c,!0,s),p=document.createElement("div");p.innerHTML=d;const u=p.firstElementChild;u.classList.add("set-card"),u.dataset.instanceId=c.instanceId,this.playerType===t&&(u.addEventListener("click",()=>{confirm("Add this card to your hand?")&&this.moveSetCardToHand(c)}),u.style.cursor="pointer"),i.appendChild(u)}});const r=i.querySelector(".set-card-slot");if(e.length>0)r&&r.remove();else if(!r){const c=document.createElement("div");c.className="slot set-card-slot",c.setAttribute("data-pos","set"),c.textContent="Set",i.appendChild(c)}const l=i.querySelector(".surrender-btn");if(e.length===0&&this.playerType===t){if(!l){const c=document.createElement("button");c.className="btn surrender-btn",c.textContent="Surrender",c.addEventListener("click",()=>this.handleSurrender()),i.appendChild(c)}}else l&&l.remove()}updateDeckArea(e,s){const t=this.element.querySelector(".deck-slot");if(!t)return;const n=t.querySelector(".card-stack");if(e.length>0)if(n){n.dataset.count=e.length.toString();const i=n.querySelector(".card");if(i){const a={id:"deck-back",instanceId:"deck-back",name:"Deck",type:"CHARACTER"},o=L.render(a,!0,s),r=document.createElement("div");r.innerHTML=o;const l=r.firstElementChild;l&&i.replaceWith(l)}}else{t.innerHTML="";const i=document.createElement("div");i.className="card-stack",i.dataset.count=e.length.toString();const a={id:"deck-back",instanceId:"deck-back",name:"Deck",type:"CHARACTER"},o=L.render(a,!0,s),r=document.createElement("div");r.innerHTML=o;const l=r.firstElementChild;l&&i.appendChild(l),t.appendChild(i)}else n&&(t.innerHTML="Deck")}updateDropArea(e,s){const t=this.element.querySelector(".drop-slot");if(!t)return;const n=e.length>0?e[e.length-1]:null,i=t.querySelector(".card"),a=t.querySelector(".stack-count");if(n){if(!i||i.dataset.instanceId!==n.instanceId){i&&i.remove();const o=L.render(n,!1,s);if(o&&o.trim().length>0){const r=document.createElement("div");r.innerHTML=o;const l=r.firstElementChild;t.prepend(l)}}}else i&&(i.remove(),t.textContent="Drop");if(e.length>1)if(a)a.textContent=e.length.toString();else{const o=document.createElement("div");o.className="stack-count",o.textContent=e.length.toString(),o.style.cursor="pointer",o.addEventListener("click",r=>{r.stopPropagation(),r.preventDefault(),this.expandedZone="drop",this.expandedOverlay.render("drop")}),t.appendChild(o)}else a&&a.remove()}moveSetCardToHand(e){const t=this.store.getState()[this.playerType],n=t.set.filter(a=>a.instanceId!==e.instanceId),i=[...t.hand,e];this.store.setState({[this.playerType]:{...t,set:n,hand:i}})}handleSurrender(){if(confirm("確定投降嗎？")){const s=this.store.getState(),t=this.playerType==="me"?"opponent":"me",n={...s.winCount};n[t]++,this.store.setState({matchWinner:t,winCount:n}),this.store.addLog(`${this.playerType==="me"?"我方":"對手"} 投降了！勝者：${t==="me"?"我方":"對手"}`)}}attachDrawEvent(){const e=this.element.querySelector(".draw-btn");e==null||e.addEventListener("click",()=>{const t=this.store.getState();if(this.playerType!==t.viewPerspective)return;const n=t[this.playerType],i=[...n.deck];if(i.length===0){alert("Deck is empty!");return}const a=i.shift();if(a){const o=[...n.hand,a];this.store.setState({[this.playerType]:{...n,deck:i,hand:o}}),this.store.addLog(`${this.playerType==="me"?"我方":"對手"} 抽了一張卡`)}});const s=this.element.querySelector(".shuffle-btn");s==null||s.addEventListener("click",()=>{this.store.getState().viewPerspective===this.playerType?this.store.shuffleDeck(this.playerType):alert("You can only shuffle your own deck.")})}updateHand(e){const s=this.element.querySelector(".hand-cards");if(!s)return;const t=this.store.getState(),n=this.playerType==="me"?t.me.school:t.opponent.school,i=this.playerType===t.viewPerspective,a=Array.from(s.querySelectorAll(".card[data-instance-id]")),o=new Set(a.map(l=>l.dataset.instanceId)),r=new Set(e.map(l=>l.instanceId));a.forEach(l=>{const c=l.dataset.instanceId;c&&!r.has(c)&&l.remove()}),e.forEach(l=>{var c,h,d;if(o.has(l.instanceId)){const p=s.querySelector(`.card[data-instance-id="${l.instanceId}"]`);if(p)if(!p.classList.contains("back")!==i){const f=L.render(l,!i,n),v=document.createElement("div");v.innerHTML=f;const E=v.firstElementChild;E&&(E.dataset.instanceId=l.instanceId,i&&this.attachCardInteractionEvents(E,l),(c=t.selectedCards)!=null&&c.find(S=>S.instanceId===l.instanceId)&&(E.classList.add("playing","selected"),E.style.border="2px solid #00ff88"),p.replaceWith(E))}else!!((h=t.selectedCards)!=null&&h.find(v=>v.instanceId===l.instanceId))?(p.classList.add("playing","selected"),p.style.border="2px solid #00ff88"):(p.classList.remove("playing","selected"),p.style.border="")}else{const p=L.render(l,!i,n),u=document.createElement("div");u.innerHTML=p;const f=u.firstElementChild;if(!f)return;f.dataset.instanceId=l.instanceId,i&&this.attachCardInteractionEvents(f,l),!!((d=t.selectedCards)!=null&&d.find(E=>E.instanceId===l.instanceId))&&(f.classList.add("playing","selected"),f.style.border="2px solid #00ff88"),s.appendChild(f)}})}attachCardInteractionEvents(e,s){e.addEventListener("contextmenu",t=>{t.preventDefault(),this.store.setState({selectedCard:s})}),e.addEventListener("click",t=>{t.stopPropagation();const n=this.store.getState();this.store.setState({selectedCard:s});let i=[...n.selectedCards||[]];t.shiftKey?i.find(a=>a.instanceId===s.instanceId)?i=i.filter(a=>a.instanceId!==s.instanceId):i.push(s):i=[s],this.store.setState({selectedCards:i,playingCard:i.length===1?i[0]:null})})}updateField(e){const s=this.store.getState(),t=this.playerType==="opponent"?s.opponent.school:s.me.school,n={};e.forEach(a=>{a.position&&(n[a.position]||(n[a.position]=[]),n[a.position].push(a))}),this.element.querySelectorAll(".slot[data-pos]").forEach(a=>{const o=a.dataset.pos;if(o&&["serve","event","receive","toss","attack","block-left","block-center","block-right"].includes(o)){const r=n[o]||[],l=r.length>0?r[r.length-1]:null,c=a.querySelector(".card[data-instance-id]"),h=c==null?void 0:c.dataset.instanceId,d=a.querySelector(".stack-count");if(l){if(!(c&&h===l.instanceId)){c&&c.remove();const p=L.render(l,!1,t),u=document.createElement("div");u.innerHTML=p;const f=u.firstElementChild;f&&(f.dataset.instanceId=l.instanceId,this.attachFieldCardEvents(f,l),a.appendChild(f))}}else c&&c.remove();if(r.length>1)if(d)d.textContent=r.length.toString();else{const p=document.createElement("div");p.className="stack-count",p.textContent=r.length.toString(),p.style.cursor="pointer",p.addEventListener("click",u=>{u.stopPropagation(),u.preventDefault(),this.expandedZone=o,this.expandedOverlay.render(o)}),a.appendChild(p)}else d&&d.remove()}})}attachFieldCardEvents(e,s){e.addEventListener("contextmenu",t=>{t.preventDefault(),t.stopPropagation(),this.store.setState({selectedCard:s})}),e.addEventListener("click",t=>{t.preventDefault(),this.store.setState({selectedCard:s})}),e.style.cursor="pointer"}render(){this.element.innerHTML=`
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
    `,this.attachSlotEvents(),this.attachDrawEvent(),this.attachFunctionEvents(),this.attachHandEvents()}attachFunctionEvents(){const e=this.element.querySelector(".back-btn");e==null||e.addEventListener("click",()=>{const s=this.store.getState();this.playerType===s.viewPerspective&&this.store.undo()})}attachHandEvents(){const e=this.element.querySelector(".hand-area");e==null||e.addEventListener("click",s=>{if(s.target.closest(".card"))return;const t=this.store.getState();this.playerType===t.viewPerspective&&t.selectedCards&&t.selectedCards.length>0&&this.moveCard(t.selectedCards[0],"hand")})}attachSlotEvents(){this.element.querySelectorAll(".slot").forEach(t=>{t.addEventListener("click",()=>{const n=this.store.getState(),i=t.getAttribute("data-pos");n.playingCard;const a=n.selectedCards||[];if(this.playerType===n.viewPerspective){let o=!1;if(a.length>0){const r=n[this.playerType].field.filter(c=>c.position===i);a.every(c=>r.find(h=>h.instanceId===c.instanceId))||(o=!0)}if(o){if(t.classList.contains("deck-slot")){this.moveCard(a[0],"deck");return}if(t.classList.contains("drop-slot")){this.moveCard(a[0],"drop");return}if(i){this.moveCard(a[0],i);return}}}})});const s=this.element.querySelector('.slot[data-pos="deck"]');s==null||s.addEventListener("contextmenu",t=>{t.preventDefault(),this.store.setState({viewingDeckInfo:{player:this.playerType}})})}attachCardEvents(e,s,t){e.addEventListener("contextmenu",c=>{c.preventDefault(),c.stopPropagation(),this.store.setState({selectedCard:s})});let n;const i=500;let a=0,o=0;e.addEventListener("touchstart",c=>{a=c.touches[0].clientX,o=c.touches[0].clientY,n=setTimeout(()=>{this.store.setState({selectedCard:s}),navigator.vibrate&&navigator.vibrate(50)},i)},{passive:!0});let r=0;const l=300;e.addEventListener("touchend",()=>{clearTimeout(n);const c=new Date().getTime(),h=c-r;h<l&&h>0&&(this.store.setState({selectedCard:s}),navigator.vibrate&&navigator.vibrate(50)),r=c}),e.addEventListener("touchmove",c=>{const h=c.touches[0].clientX,d=c.touches[0].clientY,p=Math.abs(h-a),u=Math.abs(d-o);(p>10||u>10)&&clearTimeout(n)},{passive:!0}),t?e.addEventListener("click",c=>{const h=this.store.getState();this.store.setState({selectedCard:s});let d=[...h.selectedCards||[]];c.shiftKey?d.find(p=>p.instanceId===s.instanceId)?d=d.filter(p=>p.instanceId!==s.instanceId):d.push(s):d=[s],this.store.setState({selectedCards:d,playingCard:d.length===1?d[0]:null})}):(e.addEventListener("click",()=>{this.store.setState({selectedCard:s})}),e.style.cursor="pointer")}moveCard(e,s){const t=this.store.getState(),n=t[this.playerType];let i=[e];t.selectedCards&&t.selectedCards.length>0&&t.selectedCards.find(d=>d.instanceId===e.instanceId)&&(i=t.selectedCards);let a=[...n.hand],o=[...n.field],r=[...n.deck],l=[...n.drop],c="",h=0;i.forEach(d=>{const p=a.find(v=>v.instanceId===d.instanceId),u=o.find(v=>v.instanceId===d.instanceId),f=l.find(v=>v.instanceId===d.instanceId);if(p)a=a.filter(v=>v.instanceId!==d.instanceId);else if(u)o=o.filter(v=>v.instanceId!==d.instanceId);else if(f)l=l.filter(v=>v.instanceId!==d.instanceId);else return;s==="deck"?r.push(d):s==="drop"?l.push(d):s==="hand"?a.push(d):o.push({...d,position:s}),h++}),h!==0&&(h===1?c=`移動了 ${i[0].name} 到 ${s}`:c=`移動了 ${h} 張卡片 到 ${s}`,this.store.setState({[this.playerType]:{...n,hand:a,field:o,deck:r,drop:l},playingCard:null,selectedCards:[],logs:this.store.getNewLogs(`${this.playerType==="me"?"我方":"對手"} ${c}`)}))}cleanup(){this.dragSelection.cleanup(),this.expandedOverlay.close()}getElement(){return this.element}}class Y{constructor(e){m(this,"element");m(this,"store");this.store=e,this.element=document.createElement("div"),this.element.className="match-end-overlay",this.element.style.display="none",this.render(),this.setupSubscription()}setupSubscription(){this.store.subscribe(e=>{e.matchWinner?this.show(e.matchWinner):this.hide()})}show(e){const s=this.store.getState(),t=e==="me"?"opponent":"me",n=s[e].school,i=s[t].school,a=e==="me"?"我方":"對手",o=t==="me"?"我方":"對手",r=this.element.querySelector(".match-end-content");if(r){r.innerHTML=`
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
      `;const l=r.querySelector(".back-to-setup-btn"),c=r.querySelector(".rematch-btn");l==null||l.addEventListener("click",()=>this.handleBackToSetup()),c==null||c.addEventListener("click",()=>this.handleRematch())}this.element.style.display="flex"}hide(){this.element.style.display="none"}handleBackToSetup(){location.reload()}handleRematch(){const e=this.store.getState(),s=[...e.me.deck,...e.me.hand,...e.me.field,...e.me.drop,...e.me.set],t=[...e.opponent.deck,...e.opponent.hand,...e.opponent.field,...e.opponent.drop,...e.opponent.set],n=e.me.school,i=e.opponent.school,a=e.firstPlayer==="me"?"opponent":"me",o=this.shuffleArray(s),r=this.shuffleArray(t),l=o.splice(0,2).map(h=>({...h,position:"set"})),c=r.splice(0,2).map(h=>({...h,position:"set"}));this.store.setState({matchWinner:null,firstPlayer:a,turnPlayer:a,phase:"draw",me:{deck:o,hand:[],set:l,drop:[],field:[],school:n},opponent:{deck:r,hand:[],set:c,drop:[],field:[],school:i},selectedCard:null,selectedCards:[],playingCard:null,battleState:{isAttacking:!1,defenseChoice:"none",attacker:null}}),this.store.addLog(`新回合開始！先手：${a==="me"?"我方":"對手"}`)}shuffleArray(e){const s=[...e];for(let t=s.length-1;t>0;t--){const n=Math.floor(Math.random()*(t+1));[s[t],s[n]]=[s[n],s[t]]}return s}render(){this.element.innerHTML=`
      <div class="match-end-content">
        <!-- Content will be populated by show() method -->
      </div>
    `}getElement(){return this.element}}class F{constructor(e){m(this,"element");m(this,"store");m(this,"opponentZone");m(this,"meZone");m(this,"matchEndOverlay");this.store=e,this.element=document.createElement("div"),this.element.className="game-board",this.opponentZone=new A("opponent",this.store),this.meZone=new A("me",this.store),this.matchEndOverlay=new Y(this.store),this.render(),this.setupSubscription()}setupSubscription(){this.store.subscribe(e=>{this.updatePerspective(e.viewPerspective)})}updatePerspective(e){e==="opponent"?this.element.classList.add("rotated"):this.element.classList.remove("rotated")}render(){this.element.appendChild(this.opponentZone.getElement());const e=document.createElement("div");e.className="net",this.element.appendChild(e),this.element.appendChild(this.meZone.getElement());const s=document.createElement("button");s.className="switch-view-btn",s.innerText="Switch View",s.onclick=()=>{const t=this.store.getState().viewPerspective;this.store.setState({viewPerspective:t==="me"?"opponent":"me"})},document.body.appendChild(s),document.body.appendChild(this.matchEndOverlay.getElement())}getElement(){return this.element}}const X="modulepreload",W=function(g){return"/tcg/"+g},H={},C=function(e,s,t){let n=Promise.resolve();if(s&&s.length>0){document.getElementsByTagName("link");const a=document.querySelector("meta[property=csp-nonce]"),o=(a==null?void 0:a.nonce)||(a==null?void 0:a.getAttribute("nonce"));n=Promise.allSettled(s.map(r=>{if(r=W(r),r in H)return;H[r]=!0;const l=r.endsWith(".css"),c=l?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${r}"]${c}`))return;const h=document.createElement("link");if(h.rel=l?"stylesheet":X,l||(h.as="script"),h.crossOrigin="",h.href=r,o&&h.setAttribute("nonce",o),document.head.appendChild(h),l)return new Promise((d,p)=>{h.addEventListener("load",d),h.addEventListener("error",()=>p(new Error(`Unable to preload CSS for ${r}`)))})}))}function i(a){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=a,window.dispatchEvent(o),!o.defaultPrevented)throw a}return n.then(a=>{for(const o of a||[])o.status==="rejected"&&i(o.reason);return e().catch(i)})},T=class T{constructor(){m(this,"cards",new Map);m(this,"loaded",!1)}static getInstance(){return T.instance||(T.instance=new T),T.instance}async loadAll(){if(!this.loaded)try{await this.loadConsolidatedPools(),this.loaded=!0,console.log(`CardDatabase loaded ${this.cards.size} cards.`)}catch(e){console.error("Failed to load card pools:",e)}}resolvePath(e){const s="/tcg/",t=e.startsWith("/")?e.slice(1):e;return`${s.endsWith("/")?s:`${s}/`}${t}`}async loadConsolidatedPools(){const e=this.resolvePath("pool/All_Characters.csv"),s=this.resolvePath("pool/All_Events.csv");try{const[t,n]=await Promise.all([fetch(e),fetch(s)]);if(t.ok){const i=await t.text();this.parsePoolCSV(i,"CHARACTER")}if(n.ok){const i=await n.text();this.parsePoolCSV(i,"EVENT")}console.log("Loaded consolidated pools")}catch(t){console.error("Failed to load consolidated pools:",t)}}parsePoolCSV(e,s){var n,i,a,o,r,l,c,h,d,p,u,f;const t=e.split(`
`);for(let v=1;v<t.length;v++){const E=t[v].trim();if(!E)continue;const y=this.parseCSVLine(E);if(y.length<4)continue;const S=(n=y[0])==null?void 0:n.trim(),k=(i=y[2])==null?void 0:i.trim(),w=(a=y[3])==null?void 0:a.trim();if(!k||!w)continue;const b=x=>{if(!x||x.trim()==="-"||x.trim()==="")return null;const D=parseInt(x.trim());return isNaN(D)?null:D};s==="CHARACTER"?this.cards.set(k,{id:k,name:w,type:"CHARACTER",school:S,timing:((o=y[4])==null?void 0:o.trim())||"-",rarity:((r=y[5])==null?void 0:r.trim())||"-",role:((l=y[6])==null?void 0:l.trim())||"-",stats:{serve:b(y[7]),block:b(y[8]),receive:b(y[9]),toss:b(y[10]),attack:b(y[11])},skill:((c=y[12])==null?void 0:c.trim())||"-",note:((h=y[13])==null?void 0:h.trim())||"-"}):this.cards.set(k,{id:k,name:w,type:"EVENT",school:S,rarity:((d=y[4])==null?void 0:d.trim())||"-",timing:((p=y[5])==null?void 0:p.trim())||"-",role:"-",stats:{serve:b(y[6]),block:b(y[7]),receive:b(y[8]),toss:b(y[9]),attack:b(y[10])},skill:((u=y[11])==null?void 0:u.trim())||"-",note:((f=y[12])==null?void 0:f.trim())||"-"})}}parseCSVLine(e){const s=[];let t="",n=!1;for(let i=0;i<e.length;i++){const a=e[i];a==='"'?n=!n:a===","&&!n?(s.push(t),t=""):t+=a}return s.push(t),s}getCard(e){return this.cards.get(e)}getAllCards(){return Array.from(this.cards.values())}getTotalCardCount(e){var n;const s=e.split(`
`);let t=0;for(let i=1;i<s.length;i++){const a=s[i].trim();if(!a)continue;const o=a.split(",");if(o.length<2)continue;let r=0;if(o.length>=3){const l=(n=o[2])==null?void 0:n.trim();if(l){const c=parseInt(l);isNaN(c)||(r=c)}}t+=r}return t}async getAvailableDecks(){const e=Object.assign({"/src/assets/decks/伊達工業/攔網軸.csv":()=>C(()=>import("./攔網軸-CzapYabB.js"),[]).then(t=>t.default),"/src/assets/decks/伊達工業/攔網軸改.csv":()=>C(()=>import("./攔網軸改-B2q9Q7rh.js"),[]).then(t=>t.default),"/src/assets/decks/梟谷/template.csv":()=>C(()=>import("./template-YZRRei5E.js"),[]).then(t=>t.default),"/src/assets/decks/梟谷/爆發軸二.csv":()=>C(()=>import("./爆發軸二-DRygAH0m.js"),[]).then(t=>t.default),"/src/assets/decks/梟谷/高爆發軸.csv":()=>C(()=>import("./高爆發軸-OlfSSk9F.js"),[]).then(t=>t.default),"/src/assets/decks/混合學校/template.csv":()=>C(()=>import("./template-BL6p7JrW.js"),[]).then(t=>t.default),"/src/assets/decks/混合學校/垃圾場.csv":()=>C(()=>import("./垃圾場-DLQNSA_3.js"),[]).then(t=>t.default),"/src/assets/decks/烏野/template.csv":()=>C(()=>import("./template-Dl-KCfeZ.js"),[]).then(t=>t.default),"/src/assets/decks/烏野/山月攔網軸.csv":()=>C(()=>import("./山月攔網軸-C9q-UzZd.js"),[]).then(t=>t.default),"/src/assets/decks/烏野/日影攻擊軸.csv":()=>C(()=>import("./日影攻擊軸-B5nYVoJQ.js"),[]).then(t=>t.default),"/src/assets/decks/烏野/預組.csv":()=>C(()=>import("./預組-CkakcnPP.js"),[]).then(t=>t.default),"/src/assets/decks/白鳥沢/白板軸.csv":()=>C(()=>import("./白板軸-p2O_xymA.js"),[]).then(t=>t.default),"/src/assets/decks/白鳥沢/白鳥沢 - All Cards.csv":()=>C(()=>import("./白鳥沢 - All Cards-fWYDIa0f.js"),[]).then(t=>t.default),"/src/assets/decks/稲荷崎/六名軸.csv":()=>C(()=>import("./六名軸-CPVycsk-.js"),[]).then(t=>t.default),"/src/assets/decks/稲荷崎/稲荷崎 - All Cards.csv":()=>C(()=>import("./稲荷崎 - All Cards-DeyQNAiw.js"),[]).then(t=>t.default),"/src/assets/decks/稲荷崎/預組.csv":()=>C(()=>import("./預組-9_WvEq6E.js"),[]).then(t=>t.default),"/src/assets/decks/青葉城西/template.csv":()=>C(()=>import("./template-BgW2zTP9.js"),[]).then(t=>t.default),"/src/assets/decks/青葉城西/二彈改.csv":()=>C(()=>import("./二彈改-CHQjeMGG.js"),[]).then(t=>t.default),"/src/assets/decks/青葉城西/快攻軸.csv":()=>C(()=>import("./快攻軸-BS8Dq3Be.js"),[]).then(t=>t.default),"/src/assets/decks/音駒/template.csv":()=>C(()=>import("./template-CxhDpovY.js"),[]).then(t=>t.default),"/src/assets/decks/音駒/預組.csv":()=>C(()=>import("./預組-1IW_7lEd.js"),[]).then(t=>t.default)}),s=[];for(const t in e){const n=t.split("/"),i=n[n.length-1],a=n[n.length-2],o=i.replace(".csv","");try{const r=await e[t](),l=this.getTotalCardCount(r);l===40&&s.push({school:a,name:o,path:t,loader:e[t],cardCount:l})}catch(r){console.warn(`Failed to load deck at ${t}:`,r)}}return s}async loadDeck(e){try{const s=await e();return this.parseDeckCSV(s)}catch(s){return console.error("Failed to load deck:",s),[]}}parseDeckCSV(e){var n,i;const s=e.split(`
`),t=[];for(let a=1;a<s.length;a++){const o=s[a].trim();if(!o)continue;const r=o.split(",");if(r.length<2)continue;const l=(n=r[1])==null?void 0:n.trim();let c=0;if(r.length>=3){const d=(i=r[2])==null?void 0:i.trim();if(d){const p=parseInt(d);isNaN(p)||(c=p)}}if(!l||c===0)continue;const h=this.getCard(l);if(h)for(let d=0;d<c;d++)t.push({...h,instanceId:crypto.randomUUID()});else console.warn(`Card ID not found in pool: ${l}`)}return t}};m(T,"instance");let P=T;class K{constructor(e){m(this,"element");m(this,"store");this.store=e,this.element=document.createElement("div"),this.element.className="card-detail-panel",this.render(),this.setupSubscription()}setupSubscription(){this.store.subscribe(e=>{e.viewingDeckInfo?this.renderDeckInfo(e):this.updateContent(e.selectedCard)})}updateContent(e){e?this.renderCardDetails(e):this.render()}renderDeckInfo(e){var c;const s=e.viewingDeckInfo;if(!s)return;const t=e[s.player],n=[...t.deck,...t.hand,...t.field,...t.drop,...t.set],i=new Map;n.forEach(h=>{const d=h.id;i.has(d)||i.set(d,{name:h.name,total:0,remaining:0,id:h.id,rarity:h.rarity||"",type:h.type});const p=i.get(d);p.total++}),t.deck.forEach(h=>{const d=h.id;i.has(d)&&i.get(d).remaining++});const a=Array.from(i.values()).sort((h,d)=>h.id.localeCompare(d.id)),o=a.filter(h=>h.type==="CHARACTER"),r=a.filter(h=>h.type==="EVENT"),l=h=>h.map(d=>`
            <tr class="${d.remaining===0?"empty":""}">
                <td class="card-info-cell">
                    <div class="card-name-row">
                        <span class="card-name">${d.name}</span>
                        ${d.rarity?`<span class="card-rarity">(${d.rarity})</span>`:""}
                    </div>
                    <div class="card-id">${d.id}</div>
                </td>
                <td class="card-count">${d.remaining}/${d.total}</td>
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
                            ${l(o)}
                        </tbody>
                    </table>
                </div>
                `:""}
                ${r.length>0?`
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
                            ${l(r)}
                        </tbody>
                    </table>
                </div>
                `:""}
            </div>
        </div>
      `,(c=this.element.querySelector(".close-btn"))==null||c.addEventListener("click",()=>{this.store.setState({viewingDeckInfo:null})})}renderCardDetails(e){var n,i,a,o,r;const s=e.type==="EVENT",t=s?"":`
        <div class="detail-stats">
          <div class="detail-stat"><span>Serve</span><span>${I((n=e.stats)==null?void 0:n.serve,!0)}</span></div>
          <div class="detail-stat"><span>Block</span><span>${I((i=e.stats)==null?void 0:i.block,!0)}</span></div>
          <div class="detail-stat"><span>Receive</span><span>${I((a=e.stats)==null?void 0:a.receive,!0)}</span></div>
          <div class="detail-stat"><span>Toss</span><span>${I((o=e.stats)==null?void 0:o.toss,!0)}</span></div>
          <div class="detail-stat"><span>Attack</span><span>${I((r=e.stats)==null?void 0:r.attack,!0)}</span></div>
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
    `}getElement(){return this.element}}export{P as C,F as G,$ as S,C as _,K as a};
