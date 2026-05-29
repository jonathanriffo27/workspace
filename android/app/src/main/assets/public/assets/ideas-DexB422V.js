const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/firebaseSync-DZyLNSdz.js","assets/storage-BPwMTOLr.js","assets/firebase-BoNg7kT-.js","assets/definitions-DFJLKa6n.js","assets/store-DsijVbw0.js"])))=>i.map(i=>d[i]);
import{i as e}from"./storage-BPwMTOLr.js";import{a as t}from"./firebase-BoNg7kT-.js";import{n}from"./store-DsijVbw0.js";import{a as r,h as i,o as a,r as o,s,t as c}from"./dataService-Cb2c-yMe.js";import{_ as l,a as u,c as d,d as f,f as p,h as m,i as h,l as g,m as _,o as v,p as y,r as b,s as x,t as S,u as C}from"./sortable-DlJ4UnOI.js";var w=e({renderIdeasSection:()=>E}),T={value:null};function E(){let e=document.getElementById(`ideas-section`);if(!e)return;let{items:t,searchQuery:r}=n.ideas,i=t;r&&(i=t.filter(e=>e.titulo&&e.titulo.toLowerCase().includes(r.toLowerCase())||e.notas&&e.notas.toLowerCase().includes(r.toLowerCase())));let a=l(i),o=t.length,s=t.filter(e=>e.archivada).length;if(e.innerHTML=`
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-value">${o}</span>
        <span class="stat-label">Total</span>
      </div>
      <div class="stat-item completed">
        <span class="stat-value">${s}</span>
        <span class="stat-label">Hecho</span>
      </div>
      <div class="stat-item pending">
        <span class="stat-value">${o-s}</span>
        <span class="stat-label">Pendiente</span>
      </div>
    </div>

    <div class="input-wrapper">
      ${m(`idea-title-input`,`Escribe una nueva idea...`)}
    </div>

    <div class="items-list" id="ideas-list">
      ${n.ideas.loading&&a.length===0?`
        <div class="item-card skeleton-card">
          <div class="skeleton-checkbox"></div>
          <div class="skeleton-content"><div class="skeleton-text"></div></div>
        </div>
        <div class="item-card skeleton-card">
          <div class="skeleton-checkbox"></div>
          <div class="skeleton-content"><div class="skeleton-text"></div></div>
        </div>
        <div class="item-card skeleton-card">
          <div class="skeleton-checkbox"></div>
          <div class="skeleton-content"><div class="skeleton-text"></div></div>
        </div>
      `:``}
      ${a.length===0&&!(n.ideas.loading&&a.length===0)?`
        <div class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <h3 class="empty-title">Sin ideas</h3>
          <p class="empty-text">Captura tus pensamientos aquí</p>
        </div>
      `:``}
    </div>
  `,a.length>0){let t=e.querySelector(`#ideas-list`);if(a.forEach(e=>{let r=document.createElement(`div`),i=n.ideas.hasRendered?`no-animate`:``;r.className=`item-card idea ${e.archivada?`completed`:``} ${i}`.trim(),r.dataset.id=e.id,r.innerHTML=`
        <div class="drag-handle" title="Arrastrar para ordenar">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <circle cx="9" cy="5" r="1.5" fill="currentColor"/>
            <circle cx="9" cy="12" r="1.5" fill="currentColor"/>
            <circle cx="9" cy="19" r="1.5" fill="currentColor"/>
            <circle cx="15" cy="5" r="1.5" fill="currentColor"/>
            <circle cx="15" cy="12" r="1.5" fill="currentColor"/>
            <circle cx="15" cy="19" r="1.5" fill="currentColor"/>
          </svg>
        </div>
        <div class="checkbox-hitbox" data-id="${e.id}">
          <div class="checkbox ${e.archivada?`checked`:``}">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
        </div>
        <div class="item-content">
          <div class="item-row">
            <span class="item-text"></span>
            <div class="item-actions-group">
              <button class="btn-icon priority-toggle-btn ${e.prioridad?`active`:``}" data-id="${e.id}" title="${e.prioridad?`Quitar prioridad`:`Destacar`}">
                <svg viewBox="0 0 24 24" fill="${e.prioridad?`currentColor`:`none`}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              </button>
              <button class="btn-icon expand-indicator-btn" title="Expandir/Contraer">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M6 9l6 6 6-6"/></svg>
              </button>
            </div>
          </div>
          <div class="idea-notes-row">
            <textarea data-id="${e.id}" placeholder="Desarrolla tu idea aquí..."></textarea>
            <div class="actions-column">
              <button class="btn-icon delete-btn" data-id="${e.id}" title="Eliminar idea">
                <svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
              <button class="btn-icon btn-icon--primary save-idea-btn icon-only" data-id="${e.id}" title="Guardar cambios">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              </button>
            </div>
          </div>
        </div>
      `,r.querySelector(`.item-text`).textContent=e.titulo||``,r.querySelector(`textarea`).value=e.notes||e.notas||``,t.appendChild(r)}),n.ideas.hasMore){let e=document.createElement(`div`);e.style.cssText=`display: flex; justify-content: center; padding: 16px 0 32px;`,e.innerHTML=`
        <button id="ideas-load-more-btn" class="modal-btn secondary" style="width: 100%; max-width: 200px;">Cargar más</button>
      `,t.appendChild(e)}}n.ideas.hasRendered||(n.ideas.hasRendered=!0),S(`ideas-list`,`ideas`,()=>{let{items:e,searchQuery:t}=n.ideas,r=e;return t&&(r=e.filter(e=>e.titulo&&e.titulo.toLowerCase().includes(t.toLowerCase())||e.notas&&e.notas.toLowerCase().includes(t.toLowerCase()))),l(r)}),D()}function D(){let e=document.getElementById(`idea-title-input`),l=document.getElementById(`idea-title-input-btn`),m=document.getElementById(`ideas-list`),S=async()=>{let t=e.value.trim();t&&await c(`ideas`,{titulo:t,notas:``,prioridad:!1,archivada:!1})&&(e.value=``,i(`Idea capturada`,`success`))};l.addEventListener(`click`,S),e.addEventListener(`keypress`,e=>{e.key===`Enter`&&S()});let w=document.getElementById(`ideas-load-more-btn`);w&&w.addEventListener(`click`,async()=>{let{loadMoreItems:e}=await t(async()=>{let{loadMoreItems:e}=await import(`./firebaseSync-DZyLNSdz.js`).then(e=>e.t);return{loadMoreItems:e}},__vite__mapDeps([0,1,2,3,4]));e(`ideas`)}),m.addEventListener(`click`,async e=>{let t=e.target.closest(`.checkbox-hitbox`),c=e.target.closest(`.delete-btn`),l=e.target.closest(`.priority-toggle-btn`),u=e.target.closest(`.expand-indicator-btn`)||e.target.closest(`.item-row`)||e.target.closest(`.item-text`),f=e.target.closest(`.save-idea-btn`),p=e.target.closest(`.item-card`);if(n.ideas.selectedItems.size>0&&p){let e=p.dataset.id;C(`ideas`,e);return}if(l){let e=l.dataset.id,t=n.ideas.items.find(t=>t.id===e);t&&await a(e,`ideas`,`prioridad`,!t.prioridad)&&i(`Prioridad actualizada`,`success`)}if(t){let e=t.dataset.id,i=n.ideas.items.find(t=>t.id===e);i&&r(e,`ideas`,i.archivada)}if(c){let e=c.dataset.id;_(`Eliminar idea`,`<p>¿Estás seguro de que quieres eliminar esta idea?</p>`,[{label:`Cancelar`,action:`cancel`,primary:!1},{label:`Eliminar`,action:`delete`,primary:!0}],t=>{t===`delete`&&(o(e,`ideas`),d(`ideas`,e))})}if(f){let e=f.dataset.id,t=f.closest(`.item-card`),n=t.querySelector(`textarea`),r=t.querySelector(`.sync-indicator`),a=n.value;await s(e,`ideas`,a)&&(r.classList.add(`visible`),setTimeout(()=>r.classList.remove(`visible`),2e3),i(`Notas guardadas`,`success`))}if(u&&!e.target.closest(`.checkbox-hitbox`)&&!e.target.closest(`.delete-btn`)&&!e.target.closest(`.save-idea-btn`)&&!e.target.closest(`.priority-toggle-btn`)&&!e.target.closest(`textarea`)&&!e.target.closest(`.is-editing`)){let e=u.closest(`.item-card`);m.querySelectorAll(`.item-card.expanded`).forEach(t=>{t!==e&&t.classList.remove(`expanded`)}),e.classList.toggle(`expanded`)}}),document.addEventListener(`click`,e=>b(e,`ideas`)),m.addEventListener(`mousedown`,e=>y(e,`ideas`,T)),m.addEventListener(`touchstart`,e=>y(e,`ideas`,T),{passive:!0}),m.addEventListener(`mousemove`,e=>p(e,T)),m.addEventListener(`touchmove`,e=>p(e,T),{passive:!0}),m.addEventListener(`mouseup`,()=>f(T)),m.addEventListener(`mouseleave`,()=>f(T)),m.addEventListener(`touchend`,()=>f(T)),m.addEventListener(`mousedown`,e=>v(e,`ideas`)),m.addEventListener(`touchstart`,e=>v(e,`ideas`),{passive:!0}),m.addEventListener(`mousemove`,e=>u(e)),m.addEventListener(`touchmove`,e=>u(e),{passive:!0}),m.addEventListener(`mouseup`,h),m.addEventListener(`mouseleave`,h),m.addEventListener(`touchend`,h),m.querySelectorAll(`.item-card`).forEach(e=>{n.ideas.selectedItems.has(e.dataset.id)&&e.classList.add(`selected`)}),n.ideas.selectionMode||n.ideas.selectedItems.size>0?m.classList.add(`selection-mode-active`):m.classList.remove(`selection-mode-active`),x(`ideas`)&&g(`ideas`)}export{E as n,w as t};