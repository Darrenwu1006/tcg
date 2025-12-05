var N=Object.defineProperty;var V=(k,e,t)=>e in k?N(k,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):k[e]=t;var f=(k,e,t)=>V(k,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const a of n)if(a.type==="childList")for(const i of a.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&s(i)}).observe(document,{childList:!0,subtree:!0});function t(n){const a={};return n.integrity&&(a.integrity=n.integrity),n.referrerPolicy&&(a.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?a.credentials="include":n.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function s(n){if(n.ep)return;n.ep=!0;const a=t(n);fetch(n.href,a)}})();const B=class B{constructor(e){f(this,"state");f(this,"listeners",[]);f(this,"history",[]);this.state={...e,logs:[],selectedCards:[],turnPlayer:"me",phase:"draw",battleState:{isAttacking:!1,defenseChoice:"none",attacker:null},winCount:{me:0,opponent:0},matchWinner:null}}getState(){return this.state}setState(e,t=!0){t&&(this.history.push({...this.state}),this.history.length>B.MAX_HISTORY&&this.history.shift()),this.state={...this.state,...e},this.notify()}undo(){if(this.history.length===0)return;const e=this.history.pop();e&&(this.state=e,this.notify())}addLog(e){const t=this.getNewLogs(e);this.setState({logs:t},!1)}getNewLogs(e){return[`[${new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"})}] ${e}`,...this.state.logs||[]].slice(0,50)}subscribe(e){return this.listeners.push(e),()=>{this.listeners=this.listeners.filter(t=>t!==e)}}notify(){this.listeners.forEach(e=>e(this.state))}shuffleDeck(e){const t=e==="me"?[...this.state.me.deck]:[...this.state.opponent.deck];for(let n=t.length-1;n>0;n--){const a=Math.floor(Math.random()*(n+1));[t[n],t[a]]=[t[a],t[n]]}const s={};e==="me"?s.me={...this.state.me,deck:t}:s.opponent={...this.state.opponent,deck:t},s.logs=this.getNewLogs(`${e==="me"?"我方":"對手"} 洗切了牌庫`),this.setState(s)}};f(B,"MAX_HISTORY",20);let O=B;class w{static render(e,t=!1,s="烏野"){const a=(c=>{switch(c){case"青葉城西":return"seijoh";case"烏野":return"karasuno";case"音駒":return"nekoma";case"梟谷":return"fukurodani";default:return"karasuno"}})(s);if(t)return`
        <div class="card back ${a}">
          <div class="card-back-design">
             <div class="school-name">${s}</div>
          </div>
        </div>
      `;const i=e.type==="EVENT",o=e.stats||{serve:0,block:0,receive:0,toss:0,attack:0},d=c=>{const p=c===null?0:c??0,h=6,r=Math.min(Math.max(p,0),h),v=h-r;let m='<div class="block-bar-container">';for(let u=0;u<r;u++)m+='<div class="block filled"></div>';for(let u=0;u<v;u++)m+='<div class="block empty"></div>';return m+="</div>",m},l=i?"":`
        <div class="card-stats">
          <div class="stat">S: ${d(o.serve)}</div>
          <div class="stat">B: ${d(o.block)}</div>
          <div class="stat">R: ${d(o.receive)}</div>
          <div class="stat">T: ${d(o.toss)}</div>
          <div class="stat">A: ${d(o.attack)}</div>
        </div>
      `;return`
      <div class="card ${i?"event":"character"} ${a}" data-id="${e.id}">
        <div class="card-header">
          <div class="card-name">${e.name}</div>
        </div>
        ${l}
      </div>
    `}}class _{constructor(e,t){f(this,"element");f(this,"playerType");f(this,"store");f(this,"expandedZone",null);f(this,"lastPerspective",null);this.playerType=e,this.store=t,this.element=document.createElement("div"),this.element.className=`player-zone ${this.playerType}`,this.render(),this.setupSubscription(),this.setupGlobalDragSelection()}setupGlobalDragSelection(){let e=!1,t=0,s=0,n=null,a=!1;document.addEventListener("mousedown",o=>{o.target.closest(".card, button, .slot")||this.store.getState().viewPerspective!==this.playerType||(e=!0,t=o.clientX,s=o.clientY,a=o.shiftKey,n=document.createElement("div"),n.className="selection-box",n.style.left=`${t}px`,n.style.top=`${s}px`,document.body.appendChild(n),a||this.store.setState({selectedCards:[]}))}),document.addEventListener("mousemove",o=>{if(!e||!n)return;const d=o.clientX,l=o.clientY,c=Math.abs(d-t),p=Math.abs(l-s),h=Math.min(d,t),r=Math.min(l,s);n.style.width=`${c}px`,n.style.height=`${p}px`,n.style.left=`${h}px`,n.style.top=`${r}px`}),document.addEventListener("mouseup",()=>{i()}),document.addEventListener("touchstart",o=>{o.target.closest(".card, button, .slot")||this.store.getState().viewPerspective!==this.playerType||(e=!0,t=o.touches[0].clientX,s=o.touches[0].clientY,a=!1,n=document.createElement("div"),n.className="selection-box",n.style.left=`${t}px`,n.style.top=`${s}px`,document.body.appendChild(n),this.store.setState({selectedCards:[]}))},{passive:!1}),document.addEventListener("touchmove",o=>{if(!e||!n)return;o.preventDefault();const d=o.touches[0].clientX,l=o.touches[0].clientY,c=Math.abs(d-t),p=Math.abs(l-s),h=Math.min(d,t),r=Math.min(l,s);n.style.width=`${c}px`,n.style.height=`${p}px`,n.style.left=`${h}px`,n.style.top=`${r}px`},{passive:!1}),document.addEventListener("touchend",()=>{i()});const i=()=>{if(e&&(e=!1,n)){const o=n.getBoundingClientRect();n.remove(),n=null;const d=document.querySelectorAll(".card"),l=this.store.getState(),c=l[this.playerType],p=[...c.hand,...c.field,...c.deck,...c.drop,...c.set];let h=a?[...l.selectedCards||[]]:[];d.forEach(r=>{const v=r.getBoundingClientRect(),m=r.dataset.instanceId;if(!m)return;const u=p.find(y=>y.instanceId===m);u&&v.left<o.right&&v.right>o.left&&v.top<o.bottom&&v.bottom>o.top&&(h.find(y=>y.instanceId===m)||h.push(u))}),this.store.setState({selectedCards:h,playingCard:h.length===1?h[0]:null})}}}setupSubscription(){this.store.subscribe(e=>{this.updateCounts(e),this.lastPerspective&&this.lastPerspective!==e.viewPerspective&&(this.expandedZone=null,this.renderExpandedOverlay()),this.lastPerspective=e.viewPerspective,this.expandedZone&&this.renderExpandedOverlay()})}updateCounts(e){const t=this.playerType==="me"?e.me:e.opponent,s=this.playerType==="me"?e.me.school:e.opponent.school;this.updateSetArea(t.set,s,e.viewPerspective),this.updateDeckArea(t.deck,s),this.updateDropArea(t.drop,s);const n=this.element.querySelector(".set-area .count"),a=this.element.querySelector(".deck-area .count");n&&(n.textContent=t.set.length.toString()),a&&(a.textContent=t.deck.length.toString()),this.updateHand(t.hand),this.updateField(t.field)}updateSetArea(e,t,s){const n=this.element.querySelector(".set-area");if(!n)return;const a=n.querySelector(".set-cards-container");if(!a)return;const i=Array.from(a.querySelectorAll(".set-card")),o=new Set(e.map(c=>c.instanceId));i.forEach(c=>{o.has(c.dataset.instanceId)||c.remove()}),e.forEach(c=>{const p=i.find(h=>h.dataset.instanceId===c.instanceId);if(p){const h=this.playerType===s,r=p.style.cursor==="pointer";if(h!==r){const v=w.render(c,!0,t),m=document.createElement("div");m.innerHTML=v;const u=m.firstElementChild;u.classList.add("set-card"),u.dataset.instanceId=c.instanceId,h&&(u.addEventListener("click",()=>{confirm("Add this card to your hand?")&&this.moveSetCardToHand(c)}),u.style.cursor="pointer"),p.replaceWith(u)}}else{const h=w.render(c,!0,t),r=document.createElement("div");r.innerHTML=h;const v=r.firstElementChild;v.classList.add("set-card"),v.dataset.instanceId=c.instanceId,this.playerType===s&&(v.addEventListener("click",()=>{confirm("Add this card to your hand?")&&this.moveSetCardToHand(c)}),v.style.cursor="pointer"),a.appendChild(v)}});const d=a.querySelector(".set-card-slot");if(e.length>0)d&&d.remove();else if(!d){const c=document.createElement("div");c.className="slot set-card-slot",c.setAttribute("data-pos","set"),c.textContent="Set",a.appendChild(c)}const l=a.querySelector(".surrender-btn");if(e.length===0&&this.playerType===s){if(!l){const c=document.createElement("button");c.className="btn surrender-btn",c.textContent="Surrender",c.addEventListener("click",()=>this.handleSurrender()),a.appendChild(c)}}else l&&l.remove()}updateDeckArea(e,t){const s=this.element.querySelector(".deck-slot");if(!s)return;const n=s.querySelector(".card-stack");if(e.length>0){const a=t==="青葉城西"?"seijoh":t==="音駒"?"nekoma":t==="梟谷"?"fukurodani":"karasuno";if(n){n.dataset.count=e.length.toString();const i=n.querySelector(".card");if(i){i.className=`card back ${a}`;const o=i.querySelector(".school-name");o?o.textContent=t:i.innerHTML=`<div class="card-back-design"><div class="school-name">${t}</div></div>`}}else{s.innerHTML="";const i=document.createElement("div");i.className="card-stack",i.dataset.count=e.length.toString();const o=document.createElement("div");o.className=`card back ${a}`,o.innerHTML=`<div class="card-back-design"><div class="school-name">${t}</div></div>`,i.appendChild(o),s.appendChild(i)}}else n&&(s.innerHTML="Deck")}updateDropArea(e,t){const s=this.element.querySelector(".drop-slot");if(!s)return;const n=e.length>0?e[e.length-1]:null,a=s.querySelector(".card"),i=s.querySelector(".stack-count");if(n){if(!a||a.dataset.instanceId!==n.instanceId){a&&a.remove();const o=w.render(n,!1,t);if(o&&o.trim().length>0){const d=document.createElement("div");d.innerHTML=o;const l=d.firstElementChild;s.prepend(l)}}}else a&&(a.remove(),s.textContent="Drop");if(e.length>1)if(i)i.textContent=e.length.toString();else{const o=document.createElement("div");o.className="stack-count",o.textContent=e.length.toString(),s.appendChild(o)}else i&&i.remove()}moveSetCardToHand(e){const s=this.store.getState()[this.playerType],n=s.set.filter(i=>i.instanceId!==e.instanceId),a=[...s.hand,e];this.store.setState({[this.playerType]:{...s,set:n,hand:a}})}handleSurrender(){if(confirm("確定投降嗎？")){const t=this.store.getState(),s=this.playerType==="me"?"opponent":"me",n={...t.winCount};n[s]++,this.store.setState({matchWinner:s,winCount:n}),this.store.addLog(`${this.playerType==="me"?"我方":"對手"} 投降了！勝者：${s==="me"?"我方":"對手"}`)}}attachDrawEvent(){const e=this.element.querySelector(".draw-btn");e==null||e.addEventListener("click",()=>{const s=this.store.getState();if(this.playerType!==s.viewPerspective)return;const n=s[this.playerType],a=[...n.deck];if(a.length===0){alert("Deck is empty!");return}const i=a.shift();if(i){const o=[...n.hand,i];this.store.setState({[this.playerType]:{...n,deck:a,hand:o}}),this.store.addLog(`${this.playerType==="me"?"我方":"對手"} 抽了一張卡`)}});const t=this.element.querySelector(".shuffle-btn");t==null||t.addEventListener("click",()=>{this.store.getState().viewPerspective===this.playerType?this.store.shuffleDeck(this.playerType):alert("You can only shuffle your own deck.")})}updateHand(e){const t=this.element.querySelector(".hand-cards");if(!t)return;const s=this.store.getState(),n=this.playerType==="me"?s.me.school:s.opponent.school,a=this.playerType===s.viewPerspective,i=Array.from(t.querySelectorAll(".card[data-instance-id]")),o=new Set(i.map(l=>l.dataset.instanceId)),d=new Set(e.map(l=>l.instanceId));i.forEach(l=>{const c=l.dataset.instanceId;c&&!d.has(c)&&l.remove()}),e.forEach(l=>{var c,p,h;if(o.has(l.instanceId)){const r=t.querySelector(`.card[data-instance-id="${l.instanceId}"]`);if(r)if(!r.classList.contains("back")!==a){const m=w.render(l,!a,n),u=document.createElement("div");u.innerHTML=m;const y=u.firstElementChild;y&&(y.dataset.instanceId=l.instanceId,a&&this.attachCardInteractionEvents(y,l),(c=s.selectedCards)!=null&&c.find(D=>D.instanceId===l.instanceId)&&(y.classList.add("playing","selected"),y.style.border="2px solid #00ff88"),r.replaceWith(y))}else!!((p=s.selectedCards)!=null&&p.find(u=>u.instanceId===l.instanceId))?(r.classList.add("playing","selected"),r.style.border="2px solid #00ff88"):(r.classList.remove("playing","selected"),r.style.border="")}else{const r=w.render(l,!a,n),v=document.createElement("div");v.innerHTML=r;const m=v.firstElementChild;if(!m)return;m.dataset.instanceId=l.instanceId,a&&this.attachCardInteractionEvents(m,l),!!((h=s.selectedCards)!=null&&h.find(y=>y.instanceId===l.instanceId))&&(m.classList.add("playing","selected"),m.style.border="2px solid #00ff88"),t.appendChild(m)}})}attachCardInteractionEvents(e,t){e.addEventListener("contextmenu",s=>{s.preventDefault(),this.store.setState({selectedCard:t})}),e.addEventListener("click",s=>{s.stopPropagation();const n=this.store.getState();this.store.setState({selectedCard:t});let a=[...n.selectedCards||[]];s.shiftKey?a.find(i=>i.instanceId===t.instanceId)?a=a.filter(i=>i.instanceId!==t.instanceId):a.push(t):a=[t],this.store.setState({selectedCards:a,playingCard:a.length===1?a[0]:null})})}updateField(e){const t=this.store.getState(),s=this.playerType==="opponent"?t.opponent.school:t.me.school,n={};e.forEach(i=>{i.position&&(n[i.position]||(n[i.position]=[]),n[i.position].push(i))}),this.element.querySelectorAll(".slot[data-pos]").forEach(i=>{const o=i.dataset.pos;if(o&&["serve","event","receive","toss","attack","block-left","block-center","block-right"].includes(o)){const d=n[o]||[],l=d.length>0?d[d.length-1]:null,c=i.querySelector(".card[data-instance-id]"),p=c==null?void 0:c.dataset.instanceId,h=i.querySelector(".stack-count");if(l){if(!(c&&p===l.instanceId)){c&&c.remove();const r=w.render(l,!1,s),v=document.createElement("div");v.innerHTML=r;const m=v.firstElementChild;m&&(m.dataset.instanceId=l.instanceId,this.attachFieldCardEvents(m,l),i.appendChild(m))}}else c&&c.remove();if(d.length>1)if(h)h.textContent=d.length.toString();else{const r=document.createElement("div");r.className="stack-count",r.textContent=d.length.toString(),i.appendChild(r)}else h&&h.remove()}})}attachFieldCardEvents(e,t){e.addEventListener("contextmenu",s=>{s.preventDefault(),s.stopPropagation(),this.store.setState({selectedCard:t})}),e.addEventListener("click",s=>{s.preventDefault(),this.store.setState({selectedCard:t})}),e.style.cursor="pointer"}render(){this.element.innerHTML=`
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
    `,this.attachSlotEvents(),this.attachDrawEvent(),this.attachFunctionEvents(),this.attachHandEvents()}attachFunctionEvents(){const e=this.element.querySelector(".back-btn");e==null||e.addEventListener("click",()=>{const t=this.store.getState();this.playerType===t.viewPerspective&&this.store.undo()})}attachHandEvents(){const e=this.element.querySelector(".hand-area");e==null||e.addEventListener("click",t=>{if(t.target.closest(".card"))return;const s=this.store.getState();this.playerType===s.viewPerspective&&s.selectedCards&&s.selectedCards.length>0&&this.moveCard(s.selectedCards[0],"hand")})}attachSlotEvents(){this.element.querySelectorAll(".slot").forEach(s=>{s.addEventListener("click",()=>{const n=this.store.getState(),a=s.getAttribute("data-pos"),i=n.playingCard,o=n.selectedCards||[];if(this.playerType===n.viewPerspective){let l=!1;if(o.length>0){const c=n[this.playerType].field.filter(h=>h.position===a);o.every(h=>c.find(r=>r.instanceId===h.instanceId))||(l=!0)}if(l){if(s.classList.contains("deck-slot")){this.moveCard(o[0],"deck");return}if(s.classList.contains("drop-slot")){this.moveCard(o[0],"drop");return}if(a){this.moveCard(o[0],a);return}}}(!i||o.length>0&&o.every(l=>l.position===a))&&a&&["serve","event","receive","toss","attack","block-left","block-center","block-right","drop"].includes(a)&&(this.expandedZone=a,this.renderExpandedOverlay())})});const t=this.element.querySelector('.slot[data-pos="deck"]');t==null||t.addEventListener("contextmenu",s=>{s.preventDefault(),this.store.setState({viewingDeckInfo:{player:this.playerType}})})}renderExpandedOverlay(){var h;let e=document.getElementById("global-expanded-overlay");if(!this.expandedZone){e&&(e.style.display="none",e.innerHTML="");return}e||(e=document.createElement("div"),e.id="global-expanded-overlay",document.body.appendChild(e));const t=this.store.getState(),s=t[this.playerType];let n=[];this.expandedZone==="drop"?n=s.drop:n=s.field.filter(r=>r.position===this.expandedZone);const a=this.playerType===t.viewPerspective;e.className="expanded-overlay",a?e.classList.add("overlay-top"):e.classList.add("overlay-bottom");let i=null,o=[];n.length>0&&(i=n[n.length-1],o=n.slice(0,n.length-1)),e.style.display="flex",e.innerHTML=`
        <div class="expanded-content">
            <div class="expanded-header">
                <h3>${this.expandedZone.toUpperCase()} Stack ${a?"":"(Read Only)"}</h3>
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
      `;const d=e.querySelector(".active-card-container"),l=e.querySelector(".expanded-grid"),c=e.querySelector(".close-btn"),p=e.querySelector(".move-to-hand-btn");if(c==null||c.addEventListener("click",()=>{this.expandedZone=null,this.renderExpandedOverlay()}),p==null||p.addEventListener("click",()=>{const r=this.store.getState();r.selectedCards&&r.selectedCards.length>0&&(this.moveCard(r.selectedCards[0],"hand"),this.expandedZone=null,this.renderExpandedOverlay())}),e.addEventListener("click",r=>{r.target===e&&(this.expandedZone=null,this.renderExpandedOverlay())}),a){let r=!1,v=0,m=0,u=null,y=!1;const g=b=>{if(!r||!u)return;const S=b.clientX,C=b.clientY,$=Math.abs(S-v),A=Math.abs(C-m),x=Math.min(S,v),P=Math.min(C,m);u.style.width=`${$}px`,u.style.height=`${A}px`,u.style.left=`${x}px`,u.style.top=`${P}px`},D=()=>{if(r&&(r=!1,document.removeEventListener("mousemove",g),document.removeEventListener("mouseup",D),u)){const b=u.getBoundingClientRect();u.remove(),u=null;const S=l.querySelectorAll(".card");let C=y?[...this.store.getState().selectedCards||[]]:[];S.forEach($=>{const A=$.getBoundingClientRect(),x=$.dataset.instanceId;if(!x)return;const P=n.find(q=>q.instanceId===x);P&&A.left<b.right&&A.right>b.left&&A.top<b.bottom&&A.bottom>b.top&&(C.find(q=>q.instanceId===x)||C.push(P))}),this.store.setState({selectedCards:C,playingCard:C.length===1?C[0]:null})}};l.addEventListener("mousedown",b=>{b.target.closest(".card")||(r=!0,v=b.clientX,m=b.clientY,y=b.shiftKey,u=document.createElement("div"),u.className="selection-box",u.style.left=`${v}px`,u.style.top=`${m}px`,document.body.appendChild(u),y||this.store.setState({selectedCards:[]}),document.addEventListener("mousemove",g),document.addEventListener("mouseup",D))});const L=()=>{document.removeEventListener("mousemove",g),document.removeEventListener("mouseup",D),u&&u.remove(),r=!1};c==null||c.addEventListener("click",L),e.addEventListener("click",b=>{b.target===e&&L()})}if(i&&d){const r=w.render(i,!1,s.school),v=document.createElement("div");v.innerHTML=r;const m=v.firstElementChild;m.dataset.instanceId=i.instanceId,this.attachCardEvents(m,i,a),(h=t.selectedCards)!=null&&h.find(u=>u.instanceId===i.instanceId)&&(m.classList.add("selected"),m.style.border="2px solid #00ff88"),d.appendChild(m)}o.forEach(r=>{var y;const v=w.render(r,!1,s.school),m=document.createElement("div");m.innerHTML=v;const u=m.firstElementChild;u.dataset.instanceId=r.instanceId,this.attachCardEvents(u,r,a),(y=t.selectedCards)!=null&&y.find(g=>g.instanceId===r.instanceId)&&(u.classList.add("selected"),u.style.border="2px solid #00ff88"),l==null||l.appendChild(u)})}attachCardEvents(e,t,s){e.addEventListener("contextmenu",c=>{c.preventDefault(),c.stopPropagation(),this.store.setState({selectedCard:t})});let n;const a=500;let i=0,o=0;e.addEventListener("touchstart",c=>{i=c.touches[0].clientX,o=c.touches[0].clientY,n=setTimeout(()=>{this.store.setState({selectedCard:t}),navigator.vibrate&&navigator.vibrate(50)},a)},{passive:!0});let d=0;const l=300;e.addEventListener("touchend",()=>{clearTimeout(n);const c=new Date().getTime(),p=c-d;p<l&&p>0&&(this.store.setState({selectedCard:t}),navigator.vibrate&&navigator.vibrate(50)),d=c}),e.addEventListener("touchmove",c=>{const p=c.touches[0].clientX,h=c.touches[0].clientY,r=Math.abs(p-i),v=Math.abs(h-o);(r>10||v>10)&&clearTimeout(n)},{passive:!0}),s?e.addEventListener("click",c=>{const p=this.store.getState();this.store.setState({selectedCard:t});let h=[...p.selectedCards||[]];c.shiftKey?h.find(r=>r.instanceId===t.instanceId)?h=h.filter(r=>r.instanceId!==t.instanceId):h.push(t):h=[t],this.store.setState({selectedCards:h,playingCard:h.length===1?h[0]:null})}):(e.addEventListener("click",()=>{this.store.setState({selectedCard:t})}),e.style.cursor="pointer")}moveCard(e,t){const s=this.store.getState(),n=s[this.playerType];let a=[e];s.selectedCards&&s.selectedCards.length>0&&s.selectedCards.find(r=>r.instanceId===e.instanceId)&&(a=s.selectedCards);let i=[...n.hand],o=[...n.field],d=[...n.deck],l=[...n.drop],c="",p=0;if(a.forEach(r=>{const v=i.find(y=>y.instanceId===r.instanceId),m=o.find(y=>y.instanceId===r.instanceId),u=l.find(y=>y.instanceId===r.instanceId);if(v)i=i.filter(y=>y.instanceId!==r.instanceId);else if(m)o=o.filter(y=>y.instanceId!==r.instanceId);else if(u)l=l.filter(y=>y.instanceId!==r.instanceId);else return;t==="deck"?d.push(r):t==="drop"?l.push(r):t==="hand"?i.push(r):o.push({...r,position:t}),p++}),p===0)return;p===1?c=`移動了 ${a[0].name} 到 ${t}`:c=`移動了 ${p} 張卡片 到 ${t}`;const h=this.calculateStats(o);this.store.setState({[this.playerType]:{...n,hand:i,field:o,deck:d,drop:l,currentStats:h},playingCard:null,selectedCards:[],logs:this.store.getNewLogs(`${this.playerType==="me"?"我方":"對手"} ${c}`)})}calculateStats(e){const t={serve:0,block:0,receive:0,toss:0,attack:0};return e.forEach(s=>{!s.stats||!s.position||(s.position==="serve"&&(t.serve+=s.stats.serve||0),s.position.startsWith("block")&&(t.block+=s.stats.block||0),s.position==="receive"&&(t.receive+=s.stats.receive||0),s.position==="toss"&&(t.toss+=s.stats.toss||0),s.position==="attack"&&(t.attack+=s.stats.attack||0))}),t}getElement(){return this.element}}class W{constructor(e){f(this,"element");f(this,"store");this.store=e,this.element=document.createElement("div"),this.element.className="match-end-overlay",this.element.style.display="none",this.render(),this.setupSubscription()}setupSubscription(){this.store.subscribe(e=>{e.matchWinner?this.show(e.matchWinner):this.hide()})}show(e){const t=this.store.getState(),s=e==="me"?"opponent":"me",n=t[e].school,a=t[s].school,i=e==="me"?"我方":"對手",o=s==="me"?"我方":"對手",d=this.element.querySelector(".match-end-content");if(d){d.innerHTML=`
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
      `;const l=d.querySelector(".back-to-setup-btn"),c=d.querySelector(".rematch-btn");l==null||l.addEventListener("click",()=>this.handleBackToSetup()),c==null||c.addEventListener("click",()=>this.handleRematch())}this.element.style.display="flex"}hide(){this.element.style.display="none"}handleBackToSetup(){location.reload()}handleRematch(){const e=this.store.getState(),t=[...e.me.deck,...e.me.hand,...e.me.field,...e.me.drop,...e.me.set],s=[...e.opponent.deck,...e.opponent.hand,...e.opponent.field,...e.opponent.drop,...e.opponent.set],n=e.me.school,a=e.opponent.school,i=e.firstPlayer==="me"?"opponent":"me",o=this.shuffleArray(t),d=this.shuffleArray(s),l=o.splice(0,2).map(p=>({...p,position:"set"})),c=d.splice(0,2).map(p=>({...p,position:"set"}));this.store.setState({matchWinner:null,firstPlayer:i,turnPlayer:i,phase:"draw",me:{deck:o,hand:[],set:l,drop:[],field:[],school:n},opponent:{deck:d,hand:[],set:c,drop:[],field:[],school:a},selectedCard:null,selectedCards:[],playingCard:null,battleState:{isAttacking:!1,defenseChoice:"none",attacker:null}}),this.store.addLog(`新回合開始！先手：${i==="me"?"我方":"對手"}`)}shuffleArray(e){const t=[...e];for(let s=t.length-1;s>0;s--){const n=Math.floor(Math.random()*(s+1));[t[s],t[n]]=[t[n],t[s]]}return t}render(){this.element.innerHTML=`
      <div class="match-end-content">
        <!-- Content will be populated by show() method -->
      </div>
    `}getElement(){return this.element}}class Y{constructor(e){f(this,"element");f(this,"store");f(this,"opponentZone");f(this,"meZone");f(this,"matchEndOverlay");this.store=e,this.element=document.createElement("div"),this.element.className="game-board",this.opponentZone=new _("opponent",this.store),this.meZone=new _("me",this.store),this.matchEndOverlay=new W(this.store),this.render(),this.setupSubscription()}setupSubscription(){this.store.subscribe(e=>{this.updatePerspective(e.viewPerspective)})}updatePerspective(e){e==="opponent"?this.element.classList.add("rotated"):this.element.classList.remove("rotated")}render(){this.element.appendChild(this.opponentZone.getElement());const e=document.createElement("div");e.className="net",this.element.appendChild(e),this.element.appendChild(this.meZone.getElement());const t=document.createElement("button");t.className="switch-view-btn",t.innerText="Switch View",t.onclick=()=>{const s=this.store.getState().viewPerspective;this.store.setState({viewPerspective:s==="me"?"opponent":"me"})},document.body.appendChild(t),document.body.appendChild(this.matchEndOverlay.getElement())}getElement(){return this.element}}const F="modulepreload",X=function(k){return"/tcg/"+k},R={},E=function(e,t,s){let n=Promise.resolve();if(t&&t.length>0){document.getElementsByTagName("link");const i=document.querySelector("meta[property=csp-nonce]"),o=(i==null?void 0:i.nonce)||(i==null?void 0:i.getAttribute("nonce"));n=Promise.allSettled(t.map(d=>{if(d=X(d),d in R)return;R[d]=!0;const l=d.endsWith(".css"),c=l?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${d}"]${c}`))return;const p=document.createElement("link");if(p.rel=l?"stylesheet":F,l||(p.as="script"),p.crossOrigin="",p.href=d,o&&p.setAttribute("nonce",o),document.head.appendChild(p),l)return new Promise((h,r)=>{p.addEventListener("load",h),p.addEventListener("error",()=>r(new Error(`Unable to preload CSS for ${d}`)))})}))}function a(i){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=i,window.dispatchEvent(o),!o.defaultPrevented)throw i}return n.then(i=>{for(const o of i||[])o.status==="rejected"&&a(o.reason);return e().catch(a)})},I=class I{constructor(){f(this,"cards",new Map);f(this,"loaded",!1)}static getInstance(){return I.instance||(I.instance=new I),I.instance}async loadAll(){if(!this.loaded)try{await this.loadConsolidatedPools(),this.loaded=!0,console.log(`CardDatabase loaded ${this.cards.size} cards.`)}catch(e){console.error("Failed to load card pools:",e)}}resolvePath(e){const t="/tcg/",s=e.startsWith("/")?e.slice(1):e;return`${t.endsWith("/")?t:`${t}/`}${s}`}async loadConsolidatedPools(){const e=this.resolvePath("pool/All_Characters.csv"),t=this.resolvePath("pool/All_Events.csv");try{const[s,n]=await Promise.all([fetch(e),fetch(t)]);if(s.ok){const a=await s.text();this.parsePoolCSV(a,"CHARACTER")}if(n.ok){const a=await n.text();this.parsePoolCSV(a,"EVENT")}console.log("Loaded consolidated pools")}catch(s){console.error("Failed to load consolidated pools:",s)}}parsePoolCSV(e,t){var n,a,i,o,d,l,c,p,h,r,v,m;const s=e.split(`
`);for(let u=1;u<s.length;u++){const y=s[u].trim();if(!y)continue;const g=this.parseCSVLine(y);if(g.length<4)continue;const D=(n=g[0])==null?void 0:n.trim(),L=(a=g[2])==null?void 0:a.trim(),b=(i=g[3])==null?void 0:i.trim();if(!L||!b)continue;const S=C=>{if(!C||C.trim()==="-"||C.trim()==="")return null;const $=parseInt(C.trim());return isNaN($)?null:$};t==="CHARACTER"?this.cards.set(L,{id:L,name:b,type:"CHARACTER",school:D,timing:((o=g[4])==null?void 0:o.trim())||"-",rarity:((d=g[5])==null?void 0:d.trim())||"-",role:((l=g[6])==null?void 0:l.trim())||"-",stats:{serve:S(g[7]),block:S(g[8]),receive:S(g[9]),toss:S(g[10]),attack:S(g[11])},skill:((c=g[12])==null?void 0:c.trim())||"-",note:((p=g[13])==null?void 0:p.trim())||"-"}):this.cards.set(L,{id:L,name:b,type:"EVENT",school:D,rarity:((h=g[4])==null?void 0:h.trim())||"-",timing:((r=g[5])==null?void 0:r.trim())||"-",role:"-",stats:{serve:S(g[6]),block:S(g[7]),receive:S(g[8]),toss:S(g[9]),attack:S(g[10])},skill:((v=g[11])==null?void 0:v.trim())||"-",note:((m=g[12])==null?void 0:m.trim())||"-"})}}parseCSVLine(e){const t=[];let s="",n=!1;for(let a=0;a<e.length;a++){const i=e[a];i==='"'?n=!n:i===","&&!n?(t.push(s),s=""):s+=i}return t.push(s),t}getCard(e){return this.cards.get(e)}getAllCards(){return Array.from(this.cards.values())}getTotalCardCount(e){var n;const t=e.split(`
`);let s=0;for(let a=1;a<t.length;a++){const i=t[a].trim();if(!i)continue;const o=i.split(",");if(o.length<2)continue;let d=0;if(o.length>=3){const l=(n=o[2])==null?void 0:n.trim();if(l){const c=parseInt(l);isNaN(c)||(d=c)}}s+=d}return s}async getAvailableDecks(){const e=Object.assign({"/src/assets/decks/梟谷/template.csv":()=>E(()=>import("./template-YZRRei5E.js"),[]).then(s=>s.default),"/src/assets/decks/梟谷/高爆發軸.csv":()=>E(()=>import("./高爆發軸-OlfSSk9F.js"),[]).then(s=>s.default),"/src/assets/decks/烏野/template.csv":()=>E(()=>import("./template-Dl-KCfeZ.js"),[]).then(s=>s.default),"/src/assets/decks/烏野/山月攔網軸.csv":()=>E(()=>import("./山月攔網軸-C9q-UzZd.js"),[]).then(s=>s.default),"/src/assets/decks/烏野/日影攻擊軸.csv":()=>E(()=>import("./日影攻擊軸-B5nYVoJQ.js"),[]).then(s=>s.default),"/src/assets/decks/烏野/預組.csv":()=>E(()=>import("./預組-CkakcnPP.js"),[]).then(s=>s.default),"/src/assets/decks/青葉城西/template.csv":()=>E(()=>import("./template-BgW2zTP9.js"),[]).then(s=>s.default),"/src/assets/decks/青葉城西/快攻軸.csv":()=>E(()=>import("./快攻軸-0aQbEkUk.js"),[]).then(s=>s.default),"/src/assets/decks/音駒/template.csv":()=>E(()=>import("./template-CxhDpovY.js"),[]).then(s=>s.default),"/src/assets/decks/音駒/預組.csv":()=>E(()=>import("./預組-1IW_7lEd.js"),[]).then(s=>s.default)}),t=[];for(const s in e){const n=s.split("/"),a=n[n.length-1],i=n[n.length-2],o=a.replace(".csv","");try{const d=await e[s](),l=this.getTotalCardCount(d);l===40&&t.push({school:i,name:o,path:s,loader:e[s],cardCount:l})}catch(d){console.warn(`Failed to load deck at ${s}:`,d)}}return t}async loadDeck(e){try{const t=await e();return this.parseDeckCSV(t)}catch(t){return console.error("Failed to load deck:",t),[]}}parseDeckCSV(e){var n,a;const t=e.split(`
`),s=[];for(let i=1;i<t.length;i++){const o=t[i].trim();if(!o)continue;const d=o.split(",");if(d.length<2)continue;const l=(n=d[1])==null?void 0:n.trim();let c=0;if(d.length>=3){const h=(a=d[2])==null?void 0:a.trim();if(h){const r=parseInt(h);isNaN(r)||(c=r)}}if(!l||c===0)continue;const p=this.getCard(l);if(p)for(let h=0;h<c;h++)s.push({...p,instanceId:crypto.randomUUID()});else console.warn(`Card ID not found in pool: ${l}`)}return s}};f(I,"instance");let M=I;class Z{constructor(e){f(this,"element");f(this,"store");f(this,"meDeckLoaded",!1);f(this,"opDeckLoaded",!1);f(this,"firstPlayerDecided",!1);f(this,"availableDecks",[]);this.store=e,this.element=document.createElement("div"),this.element.className="setup-overlay",this.loadDatabase(),this.render()}async loadDatabase(){const e=M.getInstance();await e.loadAll(),console.log("CardDatabase ready"),this.availableDecks=await e.getAvailableDecks(),this.render(),this.loadDefaultDecks()}render(){const e=this.availableDecks.map(t=>`<option value="${t.path}">${t.school} - ${t.name}</option>`).join("");this.element.innerHTML=`
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
    `,this.attachEvents()}attachEvents(){const e=this.element.querySelector("#me-deck-select"),t=this.element.querySelector("#op-deck-select"),s=this.element.querySelector("#coin-toss-btn"),n=this.element.querySelector("#start-game-btn");e==null||e.addEventListener("change",a=>this.handleDeckSelection(a,"me")),t==null||t.addEventListener("change",a=>this.handleDeckSelection(a,"opponent")),s==null||s.addEventListener("click",()=>{const a=Math.random()<.5?"me":"opponent";this.store.setState({firstPlayer:a});const i=this.element.querySelector("#toss-result");i&&(i.textContent=a==="me"?"Me":"Opponent",i.className="result decided"),this.firstPlayerDecided=!0,this.checkReady()}),n==null||n.addEventListener("click",()=>{this.startGame()})}async handleDeckSelection(e,t){const n=e.target.value;if(!n){t==="me"?this.meDeckLoaded=!1:this.opDeckLoaded=!1,this.updateStatus(t,"Not Selected"),this.checkReady();return}const a=this.availableDecks.find(i=>i.path===n);if(a)try{const o=await M.getInstance().loadDeck(a.loader);o.length>0&&(t==="me"?(this.store.setState({me:{...this.store.getState().me,deck:o,school:a.school}}),this.meDeckLoaded=!0):(this.store.setState({opponent:{...this.store.getState().opponent,deck:o,school:a.school}}),this.opDeckLoaded=!0),this.updateStatus(t,`已載入: ${a.name} (${o.length} 張卡片)`),this.checkReady())}catch(i){console.error(`Failed to load deck for ${t}:`,i),this.updateStatus(t,"載入失敗"),t==="me"?this.meDeckLoaded=!1:this.opDeckLoaded=!1,this.checkReady()}}async loadDefaultDecks(){const e=this.availableDecks.find(t=>t.school==="青葉城西"&&t.name.includes("快攻軸"));if(!e){console.warn("Default deck not found");return}try{const t=M.getInstance(),[s,n]=await Promise.all([t.loadDeck(e.loader),t.loadDeck(e.loader)]);if(s.length>0){this.store.setState({me:{...this.store.getState().me,deck:s,school:e.school}}),this.meDeckLoaded=!0,this.updateStatus("me",`Loaded: ${e.name} (${s.length} cards)`);const a=this.element.querySelector("#me-deck-select");a&&(a.value=e.path)}if(n.length>0){this.store.setState({opponent:{...this.store.getState().opponent,deck:n,school:e.school}}),this.opDeckLoaded=!0,this.updateStatus("opponent",`Loaded: ${e.name} (${n.length} cards)`);const a=this.element.querySelector("#op-deck-select");a&&(a.value=e.path)}this.checkReady()}catch(t){console.error("Failed to load default decks:",t)}}updateStatus(e,t){const s=e==="me"?"me-deck-status":"op-deck-status",n=this.element.querySelector(`#${s}`);n&&(n.textContent=t)}checkReady(){const e=this.element.querySelector("#start-game-btn");this.meDeckLoaded&&this.opDeckLoaded&&this.firstPlayerDecided&&(e.disabled=!1)}startGame(){const e=this.store.getState(),t=this.shuffle([...e.me.deck]),s=this.shuffle([...e.opponent.deck]),n=t.splice(0,6),a=s.splice(0,6),i=t.splice(0,2),o=s.splice(0,2);this.store.setState({gamePhase:"playing",me:{...e.me,deck:t,hand:n,set:i},opponent:{...e.opponent,deck:s,hand:a,set:o}}),this.element.style.display="none"}shuffle(e){for(let t=e.length-1;t>0;t--){const s=Math.floor(Math.random()*(t+1));[e[t],e[s]]=[e[s],e[t]]}return e}getElement(){return this.element}}class j{constructor(e){f(this,"element");f(this,"store");this.store=e,this.element=document.createElement("div"),this.element.className="card-detail-panel",this.render(),this.setupSubscription()}setupSubscription(){this.store.subscribe(e=>{e.viewingDeckInfo?this.renderDeckInfo(e):this.updateContent(e.selectedCard)})}updateContent(e){e?this.renderCardDetails(e):this.render()}renderDeckInfo(e){var c;const t=e.viewingDeckInfo;if(!t)return;const s=e[t.player],n=[...s.deck,...s.hand,...s.field,...s.drop,...s.set],a=new Map;n.forEach(p=>{const h=p.id;a.has(h)||a.set(h,{name:p.name,total:0,remaining:0,id:p.id,rarity:p.rarity||"",type:p.type});const r=a.get(h);r.total++}),s.deck.forEach(p=>{const h=p.id;a.has(h)&&a.get(h).remaining++});const i=Array.from(a.values()).sort((p,h)=>p.id.localeCompare(h.id)),o=i.filter(p=>p.type==="CHARACTER"),d=i.filter(p=>p.type==="EVENT"),l=p=>p.map(h=>`
            <tr class="${h.remaining===0?"empty":""}">
                <td class="card-info-cell">
                    <div class="card-name-row">
                        <span class="card-name">${h.name}</span>
                        ${h.rarity?`<span class="card-rarity">(${h.rarity})</span>`:""}
                    </div>
                    <div class="card-id">${h.id}</div>
                </td>
                <td class="card-count">${h.remaining}/${h.total}</td>
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
                            ${l(o)}
                        </tbody>
                    </table>
                </div>
                `:""}
                ${d.length>0?`
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
                            ${l(d)}
                        </tbody>
                    </table>
                </div>
                `:""}
            </div>
        </div>
      `,(c=this.element.querySelector(".close-btn"))==null||c.addEventListener("click",()=>{this.store.setState({viewingDeckInfo:null})})}renderBlockBar(e){const t=e===null?0:e??0,s=6,n=Math.min(Math.max(t,0),s),a=s-n;let i='<div class="block-bar-container">';for(let o=0;o<n;o++)i+='<div class="block filled"></div>';for(let o=0;o<a;o++)i+='<div class="block empty"></div>';return i+="</div>",`${i} <span class="block-value">${t}</span>`}renderCardDetails(e){var n,a,i,o,d;const t=e.type==="EVENT",s=t?"":`
        <div class="detail-stats">
          <div class="detail-stat"><span>Serve</span><span>${this.renderBlockBar((n=e.stats)==null?void 0:n.serve)}</span></div>
          <div class="detail-stat"><span>Block</span><span>${this.renderBlockBar((a=e.stats)==null?void 0:a.block)}</span></div>
          <div class="detail-stat"><span>Receive</span><span>${this.renderBlockBar((i=e.stats)==null?void 0:i.receive)}</span></div>
          <div class="detail-stat"><span>Toss</span><span>${this.renderBlockBar((o=e.stats)==null?void 0:o.toss)}</span></div>
          <div class="detail-stat"><span>Attack</span><span>${this.renderBlockBar((d=e.stats)==null?void 0:d.attack)}</span></div>
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
    `}getElement(){return this.element}}class U{constructor(e){f(this,"element");f(this,"store");f(this,"meBaseAttack",0);f(this,"meBaseDefense",0);f(this,"opBaseAttack",0);f(this,"opBaseDefense",0);f(this,"meManualAttack",0);f(this,"meManualDefense",0);f(this,"opManualAttack",0);f(this,"opManualDefense",0);this.store=e,this.element=document.createElement("div"),this.element.className="stats-panel",this.render(),this.attachEvents(),this.setupSubscription()}setupSubscription(){this.store.subscribe(e=>{const t=e.me.currentStats;t&&(this.meBaseAttack=(t.serve||0)+(t.attack||0)+(t.toss||0),this.meBaseDefense=(t.block||0)+(t.receive||0));const s=e.opponent.currentStats;s&&(this.opBaseAttack=(s.serve||0)+(s.attack||0)+(s.toss||0),this.opBaseDefense=(s.block||0)+(s.receive||0)),this.updateAllDisplays(),this.renderLogs(e.logs)})}render(){this.element.innerHTML=`
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
    `}renderLogs(e){const t=this.element.querySelector("#game-log-container");if(t){if(!e||e.length===0){t.innerHTML="<div class='log-entry empty'>No actions yet</div>";return}t.innerHTML=e.map(s=>`<div class="log-entry">${s}</div>`).join("")}}attachEvents(){this.element.addEventListener("click",e=>{const t=e.target;if(t.classList.contains("reset-stats-btn")){const s=t.getAttribute("data-target");s==="me"?(this.meManualAttack=-this.meBaseAttack,this.meManualDefense=-this.meBaseDefense,this.store.addLog("Me reset their stats.")):s==="op"&&(this.opManualAttack=-this.opBaseAttack,this.opManualDefense=-this.opBaseDefense,this.store.addLog("Opponent stats were reset.")),this.updateAllDisplays();return}if(t.classList.contains("stat-btn")){const s=t.getAttribute("data-target"),n=t.getAttribute("data-type"),a=t.getAttribute("data-op");s==="me"?n==="attack"?this.meManualAttack+=a==="plus"?1:-1:this.meManualDefense+=a==="plus"?1:-1:n==="attack"?this.opManualAttack+=a==="plus"?1:-1:this.opManualDefense+=a==="plus"?1:-1,this.updateAllDisplays()}})}updateAllDisplays(){this.updateDisplay("me","attack",this.meBaseAttack+this.meManualAttack),this.updateDisplay("me","defense",this.meBaseDefense+this.meManualDefense),this.updateDisplay("op","attack",this.opBaseAttack+this.opManualAttack),this.updateDisplay("op","defense",this.opBaseDefense+this.opManualDefense)}updateDisplay(e,t,s){const n=this.element.querySelector(`#${e}-${t}-val`);n&&(n.textContent=Math.max(0,s).toString())}getElement(){return this.element}}const G={count:0,viewPerspective:"me",gamePhase:"setup",firstPlayer:null,selectedCard:null,playingCard:null,me:{deck:[],hand:[],set:[],drop:[],field:[],school:"seijoh"},opponent:{deck:[],hand:[],set:[],drop:[],field:[],school:"karasuno"},logs:[],turnPlayer:"me",phase:"draw",battleState:{isAttacking:!1,defenseChoice:"none",attacker:null},winCount:{me:0,opponent:0},selectedCards:[],matchWinner:null},H=new O(G),T=document.querySelector("#app");if(T){T.innerHTML="",T.className="app-container";const k=new U(H),e=new Y(H),t=new j(H),s=new Z(H);T.appendChild(k.getElement()),T.appendChild(e.getElement()),T.appendChild(t.getElement()),document.body.appendChild(s.getElement())}
