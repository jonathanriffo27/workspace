const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/firebaseSync-z7ssE4S6.js","assets/storage-BPwMTOLr.js","assets/firebase-CpRCSNy3.js","assets/definitions-DFJLKa6n.js","assets/store-DsijVbw0.js"])))=>i.map(i=>d[i]);
import{i as e}from"./storage-BPwMTOLr.js";import{a as t}from"./firebase-CpRCSNy3.js";import{n}from"./store-DsijVbw0.js";import{a as r,c as i,d as a,h as o,o as s,r as c,s as l,t as u}from"./dataService-Dg8tCN3C.js";import{a as d,c as f,d as p,f as m,h,i as g,l as _,m as v,o as y,p as b,r as x,s as S,t as C,u as w,v as T}from"./sortable-DtRaFfbB.js";var E=e({renderTareasSection:()=>O}),D={value:null};function O(){let e=document.getElementById(`tareas-section`);if(!e)return;let{items:t,filter:r}=n.tareas,i=T(r===`todas`?t.filter(e=>!e.archivada):r===`pendientes`?t.filter(e=>!e.completado&&!e.archivada):t.filter(e=>e.archivada)),o=t.filter(e=>!e.archivada).length,s=t.filter(e=>e.archivada).length,c=t.filter(e=>!e.completado&&!e.archivada).length;if(e.innerHTML=`
    <div class="stats-bar">
      <div class="stat-item ${r===`todas`?`active`:``}" data-filter="todas">
        <span class="stat-value">${o}</span>
        <span class="stat-label">Total</span>
      </div>
      <div class="stat-item completed ${r===`archivadas`?`active`:``}" data-filter="archivadas">
        <span class="stat-value">${s}</span>
        <span class="stat-label">Hecho</span>
      </div>
      <div class="stat-item pending ${r===`pendientes`?`active`:``}" data-filter="pendientes">
        <span class="stat-value">${c}</span>
        <span class="stat-label">Pendiente</span>
      </div>
    </div>

    <div class="input-wrapper">
      ${h(`tarea-input`,`Escribe una nueva tarea...`)}
    </div>

    <div class="items-list" id="tareas-list">
      ${n.tareas.loading&&i.length===0?`
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
      ${i.length===0&&!(n.tareas.loading&&i.length===0)?`
        <div class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <h3 class="empty-title">${r===`archivadas`?`Sin tareas archivadas`:`Sin tareas`}</h3>
          <p class="empty-text">${r===`archivadas`?`Las tareas completadas se archivarán automáticamente`:`Añade tus tareas pendientes para empezar`}</p>
        </div>
      `:``}
    </div>
  `,i.length>0){let t=e.querySelector(`#tareas-list`);if(i.forEach(e=>{let r=document.createElement(`div`),i=n.tareas.hasRendered?`no-animate`:``;r.className=`item-card task ${e.completado?`completed`:``} ${i}`.trim(),r.dataset.id=e.id;let o=e.fechaLimite?new Date(e.fechaLimite).toISOString().split(`T`)[0]:``;r.innerHTML=`
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
          <div class="checkbox ${e.completado?`checked`:``}">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
        </div>
        <div class="item-content">
          <div class="item-row">
            <span class="item-text"></span>
            <div class="task-meta-expand-wrapper">
              <div class="item-actions-group">
                ${e.fechaLimite?`
                  <span class="badge-date">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    ${a(e.fechaLimite)}
                  </span>
                `:``}
                <button class="btn-icon priority-toggle-btn ${e.prioridad?`active`:``}" data-id="${e.id}" title="${e.prioridad?`Quitar prioridad`:`Destacar tarea`}">
                  <svg viewBox="0 0 24 24" fill="${e.prioridad?`currentColor`:`none`}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                </button>
              </div>
              <div class="item-actions-group">
                <button class="btn-icon expand-indicator-btn" title="Expandir/Contraer">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M6 9l6 6 6-6"/></svg>
                </button>
              </div>
            </div>
          </div>
 
          <div class="task-edit-fields">
            <div class="task-content-col">
              <div class="task-notes-row">
                <textarea placeholder="Notas adicionales..."></textarea>
                <div class="actions-column">
                  <div class="btn-icon date-btn-wrapper" title="Establecer fecha límite">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <input type="date" class="studio-date-input" value="${o}">
                  </div>
                  <button class="btn-icon delete-btn" data-id="${e.id}" title="Eliminar tarea">
                    <svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                  <button class="btn-icon btn-icon--primary save-task-btn icon-only" data-id="${e.id}" title="Guardar cambios">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `,r.querySelector(`.item-text`).textContent=e.titulo||``,r.querySelector(`textarea`).value=e.notas||``,t.appendChild(r)}),n.tareas.hasMore){let e=document.createElement(`div`);e.style.cssText=`display: flex; justify-content: center; padding: 16px 0 32px;`,e.innerHTML=`
        <button id="tareas-load-more-btn" class="modal-btn secondary" style="width: 100%; max-width: 200px;">Cargar más</button>
      `,t.appendChild(e)}}n.tareas.hasRendered||(n.tareas.hasRendered=!0),C(`tareas-list`,`tareas`,()=>{let{items:e,filter:t}=n.tareas;return T(t===`todas`?e:t===`pendientes`?e.filter(e=>!e.completado):e.filter(e=>e.completado))}),k()}function k(){let e=document.getElementById(`tarea-input`),a=document.getElementById(`tarea-input-btn`),h=document.getElementById(`tareas-list`),C=document.querySelector(`#tareas-section .stats-bar`),T=async()=>{let t=e.value.trim();t&&await u(`tareas`,{titulo:t,prioridad:null,fechaLimite:null,notas:``,completado:!1})&&(e.value=``,o(`Tarea añadida`,`success`))};a.addEventListener(`click`,T),e.addEventListener(`keypress`,e=>{e.key===`Enter`&&T()});let E=document.getElementById(`tareas-load-more-btn`);E&&E.addEventListener(`click`,async()=>{let{loadMoreItems:e}=await t(async()=>{let{loadMoreItems:e}=await import(`./firebaseSync-z7ssE4S6.js`).then(e=>e.t);return{loadMoreItems:e}},__vite__mapDeps([0,1,2,3,4]));e(`tareas`)}),C.addEventListener(`click`,e=>{let t=e.target.closest(`.stat-item`);t&&(n.tareas.filter=t.dataset.filter,O())}),h.addEventListener(`click`,async e=>{let t=e.target.closest(`.checkbox-hitbox`),a=e.target.closest(`.delete-btn`),s=e.target.closest(`.expand-indicator-btn`)||e.target.closest(`.item-row`)||e.target.closest(`.item-text`),u=e.target.closest(`.save-task-btn`),d=e.target.closest(`.priority-toggle-btn`),p=e.target.closest(`.item-card`);if(n.tareas.selectedItems.size>0&&p){let e=p.dataset.id;w(`tareas`,e);return}if(t){let e=t.dataset.id,i=n.tareas.items.find(t=>t.id===e);i&&r(e,`tareas`,i.completado)}if(d){let e=d.dataset.id,t=n.tareas.items.find(t=>t.id===e);t&&await i(e,{prioridad:!t.prioridad})&&o(`Prioridad actualizada`,`success`)}if(a){let e=a.dataset.id;v(`Eliminar tarea`,`<p>¿Estás seguro de que quieres eliminar esta tarea?</p>`,[{label:`Cancelar`,action:`cancel`,primary:!1},{label:`Eliminar`,action:`delete`,primary:!0}],t=>{t===`delete`&&(c(e,`tareas`),f(`tareas`,e))})}if(s&&!e.target.closest(`.checkbox-hitbox`)&&!e.target.closest(`.delete-btn`)&&!e.target.closest(`.save-task-btn`)&&!e.target.closest(`.priority-toggle-btn`)&&!e.target.closest(`.studio-date-input`)&&!e.target.closest(`textarea`)&&!e.target.closest(`.is-editing`)){let e=s.closest(`.item-card`);h.querySelectorAll(`.item-card.expanded`).forEach(t=>{t!==e&&t.classList.remove(`expanded`)}),e.classList.toggle(`expanded`)}if(u){let e=u.dataset.id,t=u.closest(`.item-card`),n=t.querySelector(`textarea`),r=t.querySelector(`.sync-indicator`),i=n.value;await l(e,`tareas`,i)&&(r.classList.add(`visible`),setTimeout(()=>r.classList.remove(`visible`),2e3),o(`Notas guardadas`,`success`))}}),document.addEventListener(`click`,e=>x(e,`tareas`)),h.addEventListener(`change`,async e=>{let t=e.target.closest(`.studio-date-input`);if(t){let e=t.closest(`.item-card`).dataset.id;await s(e,`tareas`,`fechaLimite`,t.value?new Date(t.value).getTime():null)&&o(`Fecha actualizada`,`success`)}}),h.addEventListener(`mousedown`,e=>b(e,`tareas`,D)),h.addEventListener(`touchstart`,e=>b(e,`tareas`,D),{passive:!0}),h.addEventListener(`mousemove`,e=>m(e,D)),h.addEventListener(`touchmove`,e=>m(e,D),{passive:!0}),h.addEventListener(`mouseup`,()=>p(D)),h.addEventListener(`mouseleave`,()=>p(D)),h.addEventListener(`touchend`,()=>p(D)),h.addEventListener(`mousedown`,e=>y(e,`tareas`)),h.addEventListener(`touchstart`,e=>y(e,`tareas`),{passive:!0}),h.addEventListener(`mousemove`,e=>d(e)),h.addEventListener(`touchmove`,e=>d(e),{passive:!0}),h.addEventListener(`mouseup`,g),h.addEventListener(`mouseleave`,g),h.addEventListener(`touchend`,g),h.querySelectorAll(`.item-card`).forEach(e=>{n.tareas.selectedItems.has(e.dataset.id)&&e.classList.add(`selected`)}),n.tareas.selectionMode||n.tareas.selectedItems.size>0?h.classList.add(`selection-mode-active`):h.classList.remove(`selection-mode-active`),S(`tareas`)&&_(`tareas`)}export{E as n,O as t};