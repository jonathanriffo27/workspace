const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/firebaseSync-trd3jO0R.js","assets/storage-BPwMTOLr.js","assets/firebase-B-Hb1UJx.js","assets/store-DAJlnE11.js"])))=>i.map(i=>d[i]);
import{i as e}from"./storage-BPwMTOLr.js";import{n as t}from"./store-DAJlnE11.js";import{a as n,f as r,h as i,o as a,r as o,t as s}from"./dataService-nYGYHlVC.js";import{_ as c,a as l,c as u,d,f,g as p,h as m,i as h,l as g,m as _,n as v,o as y,p as b,s as x,t as S,u as C}from"./preload-helper-Cl5is51P.js";var w=e({renderComprasSection:()=>k}),T={value:null},E=null,D=0,O=0;function k(){let e=document.getElementById(`compras-section`);if(!e)return;let{items:n,filters:i}=t.compras,a=c(i.length>0?n.filter(e=>i.includes(e.categoria)):n),o={supermercado:n.filter(e=>e.categoria===`supermercado`).length,internet:n.filter(e=>e.categoria===`internet`).length,farmacia:n.filter(e=>e.categoria===`farmacia`).length},s=[`supermercado`,`internet`,`farmacia`],l=a.length===0,u=i.length>0?`Sin resultados`:`Lista vacía`,d=i.length>0?`No hay productos en `+r(i[0]):`Añade productos a tu lista de compras`;if(e.innerHTML=`
    <div class="stats-bar">
      ${s.map(e=>`
        <div class="stat-item ${i.includes(e)?`active`:``}" data-filter="${e}">
          <span class="stat-value">${o[e]}</span>
          <span class="stat-label">${r(e)}</span>
        </div>
      `).join(``)}
    </div>

    <div class="input-wrapper">
      ${p(`compras-input`,`Escribe un nuevo producto...`)}
    </div>

    <div class="items-list" id="compras-list">
      ${t.compras.loading&&a.length===0?`
        <div class="item-card skeleton-card">
          <div class="skeleton-checkbox"></div>
          <div class="skeleton-content"><div class="skeleton-text"></div><div class="skeleton-badge"></div></div>
        </div>
        <div class="item-card skeleton-card">
          <div class="skeleton-checkbox"></div>
          <div class="skeleton-content"><div class="skeleton-text"></div><div class="skeleton-badge"></div></div>
        </div>
        <div class="item-card skeleton-card">
          <div class="skeleton-checkbox"></div>
          <div class="skeleton-content"><div class="skeleton-text"></div><div class="skeleton-badge"></div></div>
        </div>
      `:``}
      ${l&&!(t.compras.loading&&a.length===0)?`
        <div class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none"><path d="M3 3h18v18H3zM9 21V9h6v12M9 9h6M9 9v0M15 9v0" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <h3 class="empty-title">${u}</h3>
          <p class="empty-text">${d}</p>
        </div>
      `:``}
    </div>
  `,a.length>0){let n=e.querySelector(`#compras-list`);if(a.forEach(e=>{let i=document.createElement(`div`),a=t.compras.hasRendered?`no-animate`:``;i.className=`item-card ${e.completado?`completed`:``} ${a}`.trim(),i.dataset.id=e.id,i.innerHTML=`
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
            <div class="item-actions-group">
              <span class="badge badge-categoria" data-id="${e.id}" data-category="${e.categoria}" title="Mantén presionado para cambiar">${r(e.categoria)}</span>
              <button class="btn-icon priority-toggle-btn ${e.prioridad?`active`:``}" data-id="${e.id}" title="${e.prioridad?`Quitar prioridad`:`Destacar`}">
                <svg viewBox="0 0 24 24" fill="${e.prioridad?`currentColor`:`none`}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              </button>
              <button class="btn-icon delete-btn" data-id="${e.id}" title="Eliminar producto">
                <svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
          </div>
        </div>
      `,i.querySelector(`.item-text`).textContent=e.nombre||``,n.appendChild(i)}),t.compras.hasMore){let e=document.createElement(`div`);e.style.cssText=`display: flex; justify-content: center; padding: 16px 0 32px;`,e.innerHTML=`
        <button id="compras-load-more-btn" class="modal-btn secondary" style="width: 100%; max-width: 200px;">Cargar más</button>
      `,n.appendChild(e)}}t.compras.hasRendered||(t.compras.hasRendered=!0),v(`compras-list`,`compras`,()=>{let{items:e,filters:n}=t.compras;return c(n.length>0?e.filter(e=>n.includes(e.categoria)):e)}),A()}function A(){let e=document.getElementById(`compras-section`),r=document.getElementById(`compras-input`),c=document.getElementById(`compras-input-btn`),p=document.getElementById(`compras-list`),v=e.querySelector(`.stats-bar`),w=async()=>{let e=r.value.trim();e&&await s(`compras`,{nombre:e,categoria:t.compras.filters.length>0?t.compras.filters[0]:`supermercado`,prioridad:!1,completado:!1})&&(r.value=``,i(`Producto añadido`,`success`))};c.addEventListener(`click`,w),r.addEventListener(`keypress`,e=>{e.key===`Enter`&&w()});let D=document.getElementById(`compras-load-more-btn`);D&&D.addEventListener(`click`,async()=>{let{loadMoreItems:e}=await S(async()=>{let{loadMoreItems:e}=await import(`./firebaseSync-trd3jO0R.js`).then(e=>e.t);return{loadMoreItems:e}},__vite__mapDeps([0,1,2,3]));e(`compras`)}),p.addEventListener(`click`,async e=>{let r=e.target.closest(`.checkbox-hitbox`),s=e.target.closest(`.delete-btn`),c=e.target.closest(`.priority-toggle-btn`),l=e.target.closest(`.item-card`);if(t.compras.selectedItems.size>0&&l){let e=l.dataset.id;d(`compras`,e);return}if(c){let e=c.dataset.id,n=t.compras.items.find(t=>t.id===e);n&&await a(e,`compras`,`prioridad`,!n.prioridad)&&i(`Prioridad actualizada`,`success`)}if(r){let e=r.dataset.id,i=t.compras.items.find(t=>t.id===e);i&&n(e,`compras`,i.completado)}if(s){let e=s.dataset.id;m(`Eliminar producto`,`<p>¿Estás seguro de que quieres eliminar este producto?</p>`,[{label:`Cancelar`,action:`cancel`,primary:!1},{label:`Eliminar`,action:`delete`,primary:!0}],t=>{t===`delete`&&(o(e,`compras`),g(`compras`,e))})}}),document.addEventListener(`click`,e=>h(e,`compras`)),v.addEventListener(`click`,e=>{let n=e.target.closest(`.stat-item`);if(n){let e=n.dataset.filter,r=t.compras.filters;t.compras.filters=r.includes(e)?[]:[e],k()}}),p.addEventListener(`mousedown`,e=>_(e,`compras`,T)),p.addEventListener(`touchstart`,e=>_(e,`compras`,T),{passive:!0}),p.addEventListener(`mousemove`,e=>b(e,T)),p.addEventListener(`touchmove`,e=>b(e,T),{passive:!0}),p.addEventListener(`mouseup`,()=>f(T)),p.addEventListener(`mouseleave`,()=>f(T)),p.addEventListener(`touchend`,()=>f(T)),p.addEventListener(`mousedown`,e=>j(e)),p.addEventListener(`touchstart`,e=>j(e),{passive:!0}),p.addEventListener(`mousemove`,e=>M(e)),p.addEventListener(`touchmove`,e=>M(e),{passive:!0}),p.addEventListener(`mouseup`,()=>{clearTimeout(E),E=null}),p.addEventListener(`mouseleave`,()=>{clearTimeout(E),E=null}),p.addEventListener(`touchend`,()=>{clearTimeout(E),E=null}),p.addEventListener(`mousedown`,e=>x(e,`compras`)),p.addEventListener(`touchstart`,e=>x(e,`compras`),{passive:!0}),p.addEventListener(`mousemove`,e=>y(e)),p.addEventListener(`touchmove`,e=>y(e),{passive:!0}),p.addEventListener(`mouseup`,l),p.addEventListener(`mouseleave`,l),p.addEventListener(`touchend`,l),p.querySelectorAll(`.item-card`).forEach(e=>{t.compras.selectedItems.has(e.dataset.id)&&e.classList.add(`selected`)}),t.compras.selectionMode||t.compras.selectedItems.size>0?p.classList.add(`selection-mode-active`):p.classList.remove(`selection-mode-active`),u(`compras`)&&C(`compras`)}function j(e){if(t.compras.selectionMode||t.compras.selectedItems.size>0)return;let n=e.target.closest(`.badge-categoria`);if(!n)return;let r=e.touches?e.touches[0]:e;D=r.clientX,O=r.clientY,E=setTimeout(()=>{let e=n.dataset.id,t=n.dataset.category;N(e,t)},600)}function M(e){if(!E)return;let t=e.touches?e.touches[0]:e,n=Math.abs(t.clientX-D),r=Math.abs(t.clientY-O);(n>8||r>8)&&(clearTimeout(E),E=null)}async function N(e,t){m(`Cambiar categoría`,``,[{value:`supermercado`,label:`Supermercado`},{value:`internet`,label:`Internet`},{value:`farmacia`,label:`Farmacia`},{value:`otros`,label:`Otros`}].filter(e=>e.value!==t).map(e=>({label:e.label,action:e.value,primary:!1})),async t=>{t&&t!==`cancel`&&await a(e,`compras`,`categoria`,t)&&i(`Categoría actualizada`,`success`)})}export{k as n,w as t};