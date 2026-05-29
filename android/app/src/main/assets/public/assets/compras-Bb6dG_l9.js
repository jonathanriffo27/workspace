const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/firebaseSync-DZyLNSdz.js","assets/storage-BPwMTOLr.js","assets/firebase-BoNg7kT-.js","assets/definitions-DFJLKa6n.js","assets/store-DsijVbw0.js"])))=>i.map(i=>d[i]);
import{i as e}from"./storage-BPwMTOLr.js";import{a as t}from"./firebase-BoNg7kT-.js";import{n}from"./store-DsijVbw0.js";import{a as r,f as i,h as a,o,r as s,t as c}from"./dataService-Cb2c-yMe.js";import{a as l,c as u,d,f,g as p,h as m,i as h,l as g,m as _,o as v,p as y,r as b,s as x,t as S,u as C}from"./sortable-DlJ4UnOI.js";var w=e({renderComprasSection:()=>k}),T={value:null},E=null,D=0,O=0;function k(){let e=document.getElementById(`compras-section`);if(!e)return;let{items:t,filters:r}=n.compras,a=p(r.length>0?t.filter(e=>r.includes(e.categoria)):t),o={supermercado:t.filter(e=>e.categoria===`supermercado`).length,internet:t.filter(e=>e.categoria===`internet`).length,farmacia:t.filter(e=>e.categoria===`farmacia`).length},s=[`supermercado`,`internet`,`farmacia`],c=a.length===0,l=r.length>0?`Sin resultados`:`Lista vacía`,u=r.length>0?`No hay productos en `+i(r[0]):`Añade productos a tu lista de compras`;if(e.innerHTML=`
    <div class="stats-bar">
      ${s.map(e=>`
        <div class="stat-item ${r.includes(e)?`active`:``}" data-filter="${e}">
          <span class="stat-value">${o[e]}</span>
          <span class="stat-label">${i(e)}</span>
        </div>
      `).join(``)}
    </div>

    <div class="input-wrapper">
      ${m(`compras-input`,`Escribe un nuevo producto...`)}
    </div>

    <div class="items-list" id="compras-list">
      ${n.compras.loading&&a.length===0?`
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
      ${c&&!(n.compras.loading&&a.length===0)?`
        <div class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none"><path d="M3 3h18v18H3zM9 21V9h6v12M9 9h6M9 9v0M15 9v0" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <h3 class="empty-title">${l}</h3>
          <p class="empty-text">${u}</p>
        </div>
      `:``}
    </div>
  `,a.length>0){let t=e.querySelector(`#compras-list`);if(a.forEach(e=>{let r=document.createElement(`div`),a=n.compras.hasRendered?`no-animate`:``;r.className=`item-card ${e.completado?`completed`:``} ${a}`.trim(),r.dataset.id=e.id,r.innerHTML=`
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
              <span class="badge badge-categoria" data-id="${e.id}" data-category="${e.categoria}" title="Mantén presionado para cambiar">${i(e.categoria)}</span>
              <button class="btn-icon priority-toggle-btn ${e.prioridad?`active`:``}" data-id="${e.id}" title="${e.prioridad?`Quitar prioridad`:`Destacar`}">
                <svg viewBox="0 0 24 24" fill="${e.prioridad?`currentColor`:`none`}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              </button>
              <button class="btn-icon delete-btn" data-id="${e.id}" title="Eliminar producto">
                <svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
          </div>
        </div>
      `,r.querySelector(`.item-text`).textContent=e.nombre||``,t.appendChild(r)}),n.compras.hasMore){let e=document.createElement(`div`);e.style.cssText=`display: flex; justify-content: center; padding: 16px 0 32px;`,e.innerHTML=`
        <button id="compras-load-more-btn" class="modal-btn secondary" style="width: 100%; max-width: 200px;">Cargar más</button>
      `,t.appendChild(e)}}n.compras.hasRendered||(n.compras.hasRendered=!0),S(`compras-list`,`compras`,()=>{let{items:e,filters:t}=n.compras;return p(t.length>0?e.filter(e=>t.includes(e.categoria)):e)}),A()}function A(){let e=document.getElementById(`compras-section`),i=document.getElementById(`compras-input`),p=document.getElementById(`compras-input-btn`),m=document.getElementById(`compras-list`),S=e.querySelector(`.stats-bar`),w=async()=>{let e=i.value.trim();e&&await c(`compras`,{nombre:e,categoria:n.compras.filters.length>0?n.compras.filters[0]:`supermercado`,prioridad:!1,completado:!1})&&(i.value=``,a(`Producto añadido`,`success`))};p.addEventListener(`click`,w),i.addEventListener(`keypress`,e=>{e.key===`Enter`&&w()});let D=document.getElementById(`compras-load-more-btn`);D&&D.addEventListener(`click`,async()=>{let{loadMoreItems:e}=await t(async()=>{let{loadMoreItems:e}=await import(`./firebaseSync-DZyLNSdz.js`).then(e=>e.t);return{loadMoreItems:e}},__vite__mapDeps([0,1,2,3,4]));e(`compras`)}),m.addEventListener(`click`,async e=>{let t=e.target.closest(`.checkbox-hitbox`),i=e.target.closest(`.delete-btn`),c=e.target.closest(`.priority-toggle-btn`),l=e.target.closest(`.item-card`);if(n.compras.selectedItems.size>0&&l){let e=l.dataset.id;C(`compras`,e);return}if(c){let e=c.dataset.id,t=n.compras.items.find(t=>t.id===e);t&&await o(e,`compras`,`prioridad`,!t.prioridad)&&a(`Prioridad actualizada`,`success`)}if(t){let e=t.dataset.id,i=n.compras.items.find(t=>t.id===e);i&&r(e,`compras`,i.completado)}if(i){let e=i.dataset.id;_(`Eliminar producto`,`<p>¿Estás seguro de que quieres eliminar este producto?</p>`,[{label:`Cancelar`,action:`cancel`,primary:!1},{label:`Eliminar`,action:`delete`,primary:!0}],t=>{t===`delete`&&(s(e,`compras`),u(`compras`,e))})}}),document.addEventListener(`click`,e=>b(e,`compras`)),S.addEventListener(`click`,e=>{let t=e.target.closest(`.stat-item`);if(t){let e=t.dataset.filter,r=n.compras.filters;n.compras.filters=r.includes(e)?[]:[e],k()}}),m.addEventListener(`mousedown`,e=>y(e,`compras`,T)),m.addEventListener(`touchstart`,e=>y(e,`compras`,T),{passive:!0}),m.addEventListener(`mousemove`,e=>f(e,T)),m.addEventListener(`touchmove`,e=>f(e,T),{passive:!0}),m.addEventListener(`mouseup`,()=>d(T)),m.addEventListener(`mouseleave`,()=>d(T)),m.addEventListener(`touchend`,()=>d(T)),m.addEventListener(`mousedown`,e=>j(e)),m.addEventListener(`touchstart`,e=>j(e),{passive:!0}),m.addEventListener(`mousemove`,e=>M(e)),m.addEventListener(`touchmove`,e=>M(e),{passive:!0}),m.addEventListener(`mouseup`,()=>{clearTimeout(E),E=null}),m.addEventListener(`mouseleave`,()=>{clearTimeout(E),E=null}),m.addEventListener(`touchend`,()=>{clearTimeout(E),E=null}),m.addEventListener(`mousedown`,e=>v(e,`compras`)),m.addEventListener(`touchstart`,e=>v(e,`compras`),{passive:!0}),m.addEventListener(`mousemove`,e=>l(e)),m.addEventListener(`touchmove`,e=>l(e),{passive:!0}),m.addEventListener(`mouseup`,h),m.addEventListener(`mouseleave`,h),m.addEventListener(`touchend`,h),m.querySelectorAll(`.item-card`).forEach(e=>{n.compras.selectedItems.has(e.dataset.id)&&e.classList.add(`selected`)}),n.compras.selectionMode||n.compras.selectedItems.size>0?m.classList.add(`selection-mode-active`):m.classList.remove(`selection-mode-active`),x(`compras`)&&g(`compras`)}function j(e){if(n.compras.selectionMode||n.compras.selectedItems.size>0)return;let t=e.target.closest(`.badge-categoria`);if(!t)return;let r=e.touches?e.touches[0]:e;D=r.clientX,O=r.clientY,E=setTimeout(()=>{let e=t.dataset.id,n=t.dataset.category;N(e,n)},600)}function M(e){if(!E)return;let t=e.touches?e.touches[0]:e,n=Math.abs(t.clientX-D),r=Math.abs(t.clientY-O);(n>8||r>8)&&(clearTimeout(E),E=null)}async function N(e,t){_(`Cambiar categoría`,``,[{value:`supermercado`,label:`Supermercado`},{value:`internet`,label:`Internet`},{value:`farmacia`,label:`Farmacia`},{value:`otros`,label:`Otros`}].filter(e=>e.value!==t).map(e=>({label:e.label,action:e.value,primary:!1})),async t=>{t&&t!==`cancel`&&await o(e,`compras`,`categoria`,t)&&a(`Categoría actualizada`,`success`)})}export{k as n,w as t};