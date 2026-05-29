const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/compras-BpxJNT1G.js","assets/storage-BPwMTOLr.js","assets/firebase-CpRCSNy3.js","assets/definitions-DFJLKa6n.js","assets/dataService-Dg8tCN3C.js","assets/store-DsijVbw0.js","assets/sortable-DtRaFfbB.js","assets/ideas-Bjtic8AZ.js","assets/tareas-MdKFyNhl.js","assets/voiceService-C6WffPJe.js","assets/taskArchiver-AoRvkviI.js"])))=>i.map(i=>d[i]);
import{H as e,M as t,q as n,y as r}from"./definitions-DFJLKa6n.js";import{a as i,i as a,t as o}from"./firebase-CpRCSNy3.js";import{n as s,o as c,r as l}from"./store-DsijVbw0.js";import{a as u,i as d,n as f,r as p}from"./firebaseSync-z7ssE4S6.js";import{h as m}from"./dataService-Dg8tCN3C.js";import{n as h,s as g}from"./sortable-DtRaFfbB.js";import{n as _}from"./compras-BpxJNT1G.js";import{n as v}from"./ideas-Bjtic8AZ.js";import{t as y}from"./tareas-MdKFyNhl.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var b=null;function x(){let e=document.getElementById(`app`);document.getElementById(`login-screen`)||(e.insertAdjacentHTML(`beforeend`,`
    <div id="login-screen">
      <div class="login-container">
        <div class="login-header">
          <h1 class="login-title">Workspace</h1>
          <span class="login-subtitle">Personal</span>
        </div>

        <div class="login-tabs">
          <button class="login-tab active" data-tab="login">Iniciar Sesión</button>
          <button class="login-tab" data-tab="register">Registrarse</button>
        </div>

        <div class="login-forms">
          <form id="login-form" class="login-form active">
            <div class="form-group">
              <input type="email" id="login-email" class="input-field" placeholder="Correo electrónico" autocomplete="email" required>
            </div>
            <div class="form-group">
              <input type="password" id="login-password" class="input-field" placeholder="Contraseña" autocomplete="current-password" required>
            </div>
            <div class="form-error" id="login-error"></div>
            <button type="submit" class="btn-primary">Iniciar Sesión</button>
          </form>

          <form id="register-form" class="login-form">
            <div class="form-group">
              <input type="email" id="register-email" class="input-field" placeholder="Correo electrónico" autocomplete="email" required>
            </div>
            <div class="form-group">
              <input type="password" id="register-password" class="input-field" placeholder="Contraseña (mín. 6 caracteres)" autocomplete="new-password" required>
            </div>
            <div class="form-error" id="register-error"></div>
            <button type="submit" class="btn-primary">Crear Cuenta</button>
          </form>
        </div>

        <div class="login-divider">
          <span>o</span>
        </div>

        <button id="google-signin-btn" class="btn-google">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Continuar con Google</span>
        </button>
      </div>
    </div>
  `),S())}function S(){let t=document.querySelectorAll(`.login-tab`),n=document.getElementById(`login-form`),i=document.getElementById(`register-form`),s=document.getElementById(`google-signin-btn`);t.forEach(e=>{e.addEventListener(`click`,()=>{t.forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`);let n=e.dataset.tab;document.getElementById(`login-form`).classList.toggle(`active`,n===`login`),document.getElementById(`register-form`).classList.toggle(`active`,n===`register`),document.getElementById(`login-error`).textContent=``,document.getElementById(`register-error`).textContent=``})}),n.addEventListener(`submit`,async t=>{t.preventDefault();let n=document.getElementById(`login-email`).value,r=document.getElementById(`login-password`).value;try{await e(o,n,r)}catch(e){document.getElementById(`login-error`).textContent=C(e.code)}}),i.addEventListener(`submit`,async e=>{e.preventDefault();let t=document.getElementById(`register-email`).value,n=document.getElementById(`register-password`).value;try{await r(o,t,n)}catch(e){document.getElementById(`register-error`).textContent=C(e.code)}}),s.addEventListener(`click`,async()=>{try{await a()}catch(e){console.error(`Google sign-in error:`,e),m(e.message||`Error al iniciar con Google`,`error`)}})}function C(e){return{"auth/user-not-found":`No existe cuenta con este correo`,"auth/wrong-password":`Contraseña incorrecta`,"auth/email-already-in-use":`Este correo ya está registrado`,"auth/weak-password":`La contraseña debe tener al menos 6 caracteres`,"auth/invalid-email":`Correo electrónico inválido`}[e]||`Error de autenticación`}function w(e){return e.displayName||e.email||`Usuario`}function T(e){return e.trim().split(/\s+/).slice(0,2).map(e=>e.charAt(0).toUpperCase()).join(``)||`U`}function E(e,t){e.setAttribute(`aria-expanded`,`false`),t.hidden=!0}function D(e,t){e.setAttribute(`aria-expanded`,`true`),t.hidden=!1}async function O(){try{s.unsubscribes.forEach(e=>e()),s.unsubscribes=[],s.firestoreInitialized=!1,await n(o)}catch{m(`Error al cerrar sesión`,`error`)}}function k(){let e=document.getElementById(`login-screen`);e&&e.remove()}function A(e,t={}){let n=document.querySelector(`.header-actions`);if(!n||(b?.(),b=null,n.replaceChildren(),!e))return;let r=w(e),i=e.email&&e.email!==r?e.email:`Cuenta personal`,a=T(r),o=t.getTheme?.()===`light`,s=document.createElement(`div`);s.className=`user-info`,s.innerHTML=`
    <button
      class="account-trigger"
      type="button"
      aria-label="Abrir menú de cuenta de "
      aria-haspopup="menu"
      aria-expanded="false"
    >
      <span class="account-avatar" aria-hidden="true"></span>
      <svg class="account-trigger-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <div class="account-menu" role="menu" hidden>
      <div class="account-menu-header">
        <div class="account-menu-profile">
          <span class="user-name"></span>
          <span class="account-menu-meta"></span>
        </div>
      </div>
      <button
        class="account-menu-button account-theme-button"
        type="button"
        role="menuitem"
        aria-label="Cambiar a tema ${o?`oscuro`:`claro`}"
        title="Cambiar a tema ${o?`oscuro`:`claro`}"
      >
        <span class="account-menu-copy">
          <span class="account-menu-label">Tema:</span>
          <span class="account-menu-value account-theme-value">${o?`Claro`:`Oscuro`}</span>
        </span>
        <span class="account-menu-icon" aria-hidden="true">
          <svg class="account-menu-theme-icon account-menu-theme-icon--sun" viewBox="0 0 24 24">
            <path d="M12 3v2.25M12 18.75V21M5.636 5.636l1.591 1.591M16.773 16.773l1.591 1.591M3 12h2.25M18.75 12H21M5.636 18.364l1.591-1.591M16.773 7.227l1.591-1.591M15.75 12A3.75 3.75 0 1112 8.25 3.75 3.75 0 0115.75 12z" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg class="account-menu-theme-icon account-menu-theme-icon--moon" viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1111.21 3c-.02.25-.04.5-.04.75A7.5 7.5 0 0018.67 11.25c.78 0 1.53-.12 2.25-.34.04.62.08 1.25.08 1.88z" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </button>
      <button class="account-menu-button account-menu-button--danger" type="button" role="menuitem" aria-label="Cerrar sesión">
        <span class="account-menu-copy">
          <span class="account-menu-label">Cerrar sesión</span>
        </span>
        <span class="account-menu-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </button>
    </div>
  `,n.append(s);let c=s.querySelector(`.account-trigger`),l=s.querySelector(`.account-menu`),u=s.querySelector(`.account-theme-button`),d=s.querySelector(`.account-menu-button--danger`),f=s.querySelector(`.account-trigger .account-avatar`),p=s.querySelector(`.account-menu-profile .user-name`),m=s.querySelector(`.account-menu-meta`);c.setAttribute(`aria-label`,`Abrir menú de cuenta de ${r}`),f&&(f.textContent=a),p&&(p.textContent=r),m&&(m.textContent=i);let h=e=>{l.hidden||s.contains(e.target)||E(c,l)},g=e=>{e.key!==`Escape`||l.hidden||(E(c,l),c.focus())},_=e=>{let n=e.detail?.theme||t.getTheme?.()||`dark`,r=n===`light`?`oscuro`:`claro`,i=s.querySelector(`.account-theme-value`);i&&(i.textContent=n===`light`?`Claro`:`Oscuro`),u.setAttribute(`aria-label`,`Cambiar a tema ${r}`),u.setAttribute(`title`,`Cambiar a tema ${r}`)};c.addEventListener(`click`,()=>{if(l.hidden){D(c,l);return}E(c,l)}),u.addEventListener(`click`,()=>{t.onToggleTheme?.(),E(c,l)}),d.addEventListener(`click`,async()=>{E(c,l),await O()}),document.addEventListener(`pointerdown`,h),document.addEventListener(`keydown`,g),window.addEventListener(`workspace-themechange`,_),b=()=>{document.removeEventListener(`pointerdown`,h),document.removeEventListener(`keydown`,g),window.removeEventListener(`workspace-themechange`,_)}}var j=[`compras`,`ideas`,`tareas`];function M(e){g(s.activeTab)&&h(s.activeTab),document.querySelector(`.item-text.is-editing`)?.blur(),s.activeTab=e,window.location.hash=e,document.querySelectorAll(`.nav-item`).forEach(t=>{t.classList.toggle(`active`,t.dataset.tab===e)}),document.querySelectorAll(`.section`).forEach(t=>{t.classList.toggle(`active`,t.id===`${e}-section`)}),e===`compras`?(f(),_()):e===`ideas`?(d(),v()):e===`tareas`&&(u(),y()),requestAnimationFrame(()=>{let t=document.getElementById(`${e}-section`);t&&t.scrollIntoView({behavior:`smooth`,block:`start`})})}function N(){let e=0,t=0,n=document.querySelector(`.content`);n&&(n.addEventListener(`touchstart`,n=>{document.querySelector(`.modal-overlay.active`)||n.target.closest(`input, textarea, .is-editing`)||(e=n.changedTouches[0].screenX,t=n.changedTouches[0].screenY)},{passive:!0}),n.addEventListener(`touchend`,n=>{if(document.querySelector(`.modal-overlay.active`)||n.target.closest(`input, textarea, .is-editing`))return;let r=n.changedTouches[0].screenX,i=n.changedTouches[0].screenY,a=r-e,o=i-t;if(Math.abs(a)>Math.abs(o)&&Math.abs(a)>60){let e=j.indexOf(s.activeTab);a<0?e<j.length-1&&M(j[e+1]):e>0&&M(j[e-1])}},{passive:!0}))}(function(){let e=`workspace_theme`,n={dark:`#0F0F0F`,light:`#F6F2EA`};function r(){try{let t=localStorage.getItem(e);return t===`light`||t===`dark`?t:null}catch{return null}}function a(){return window.matchMedia(`(prefers-color-scheme: light)`).matches?`light`:`dark`}function u(){return document.documentElement.dataset.theme===`light`?`light`:`dark`}function d(e){let t=document.querySelector(`meta[name="theme-color"]`);t&&t.setAttribute(`content`,n[e])}function f(e){let t=document.querySelector(`.account-theme-button`),n=document.querySelector(`.account-theme-value`);if(!t||!n)return;let r=(e===`dark`?`light`:`dark`)==`light`?`claro`:`oscuro`,i=e===`light`?`Claro`:`Oscuro`;t.setAttribute(`aria-label`,`Cambiar a tema ${r}`),t.setAttribute(`title`,`Cambiar a tema ${r}`),n.textContent=i}function m(t,{persist:n=!1}={}){if(document.documentElement.dataset.theme=t,d(t),f(t),window.dispatchEvent(new CustomEvent(`workspace-themechange`,{detail:{theme:t}})),n)try{localStorage.setItem(e,t)}catch{}}function h(){return r()||a()}function g(){m(u()===`dark`?`light`:`dark`,{persist:!0})}function _(){m(h());let e=window.matchMedia(`(prefers-color-scheme: light)`),t=e=>{r()||m(e.matches?`light`:`dark`)};typeof e.addEventListener==`function`?e.addEventListener(`change`,t):typeof e.addListener==`function`&&e.addListener(t)}async function v(){if(screen.orientation&&screen.orientation.lock)try{await screen.orientation.lock(`portrait`)}catch{}}c(e=>{if(e.authLoading)return;let t=e.activeTab;t===`compras`?i(async()=>{let{renderComprasSection:e}=await import(`./compras-BpxJNT1G.js`).then(e=>e.t);return{renderComprasSection:e}},__vite__mapDeps([0,1,2,3,4,5,6])).then(({renderComprasSection:e})=>e()):t===`ideas`?i(async()=>{let{renderIdeasSection:e}=await import(`./ideas-Bjtic8AZ.js`).then(e=>e.t);return{renderIdeasSection:e}},__vite__mapDeps([7,1,2,3,4,5,6])).then(({renderIdeasSection:e})=>e()):t===`tareas`&&i(async()=>{let{renderTareasSection:e}=await import(`./tareas-MdKFyNhl.js`).then(e=>e.n);return{renderTareasSection:e}},__vite__mapDeps([8,1,2,3,4,5,6])).then(({renderTareasSection:e})=>e())});function y(){_(),v(),l(),N(),`serviceWorker`in navigator&&navigator.serviceWorker.addEventListener(`message`,e=>{!e.data||e.data.type}),t(o,async e=>{let t=new URLSearchParams(window.location.search).has(`debug`),n=e||(t?{uid:`test-user`,displayName:`Test User`,email:`test@example.com`}:null);if(s.user=n,s.userId=n?n.uid:null,s.authLoading=!1,n){localStorage.setItem(`workspace_last_user_id`,n.uid);let{loadFromStorage:e}=await i(async()=>{let{loadFromStorage:e}=await import(`./storage-BPwMTOLr.js`).then(e=>e.r);return{loadFromStorage:e}},[]),{STORAGE_KEYS:r}=await i(async()=>{let{STORAGE_KEYS:e}=await import(`./store-DsijVbw0.js`).then(e=>e.a);return{STORAGE_KEYS:e}},__vite__mapDeps([5,1]));s.compras.items=e(`${r.compras}_${n.uid}`),s.ideas.items=e(`${r.ideas}_${n.uid}`),s.tareas.items=e(`${r.tareas}_${n.uid}`),k(),A(n,{getTheme:u,onToggleTheme:g});let a=window.location.hash.substring(1);M([`compras`,`ideas`,`tareas`].includes(a)?a:`ideas`),t?s.firestoreInitialized=!0:p(),i(async()=>{let{initVoiceCapture:e}=await import(`./voiceService-C6WffPJe.js`);return{initVoiceCapture:e}},__vite__mapDeps([9,2,3,4,5,1])).then(({initVoiceCapture:e})=>e()),i(async()=>{let{initTaskArchiver:e}=await import(`./taskArchiver-AoRvkviI.js`);return{initTaskArchiver:e}},__vite__mapDeps([10,4,2,3,5,1])).then(({initTaskArchiver:e})=>e(n.uid))}else{x(),A(null),s.compras.items=[],s.ideas.items=[],s.tareas.items=[],s.firestoreInitialized=!1,s.unsubscribes.forEach(e=>e()),s.unsubscribes=[];let e=window.location.hash.substring(1);M([`compras`,`ideas`,`tareas`].includes(e)?e:`ideas`)}}),document.querySelectorAll(`.nav-item`).forEach(e=>{e.addEventListener(`click`,()=>{e.classList.contains(`recording`)||M(e.dataset.tab)})})}window.addEventListener(`unhandledrejection`,e=>{let t=e.reason?.message||``;(t.includes(`message channel closed`)||t.includes(`Channel closed`))&&e.preventDefault()}),window.addEventListener(`error`,e=>{let t=e.message||``;(t.includes(`message channel closed`)||t.includes(`Channel closed`))&&e.preventDefault()}),document.readyState===`loading`?document.addEventListener(`DOMContentLoaded`,y):y()})();export{M as t};