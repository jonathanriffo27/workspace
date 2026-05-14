import { 
  onSnapshot, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc, 
  serverTimestamp,
  query,
  orderBy,
  where
} from "firebase/firestore";
import {
  auth,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  googleProvider
} from "./firebase.js";
import { collections, db } from "./firebase.js";

(function() {
  'use strict';

  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('message channel closed')) {
      event.preventDefault();
    }
  });

  const CATEGORIAS = ['supermercado', 'internet', 'farmacia', 'otros'];
  const PRIORIDADES = ['alta', 'media', 'baja'];
  const TAREA_FILTERS = ['todas', 'pendientes', 'completadas'];

  const STORAGE_KEYS = {
    compras: 'workspace_compras',
    ideas: 'workspace_ideas',
    tareas: 'workspace_tareas'
  };

  function loadFromStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading from localStorage:', e);
      return [];
    }
  }

  function saveToStorage(key, items) {
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }

  const appState = {
    activeTab: 'compras',
    user: null,
    userId: null,
    authLoading: true,
 compras: {
      items: [],
      filters: []
    },
    ideas: {
      items: [],
      filter: 'todas',
      searchQuery: ''
    },
    tareas: {
      items: [],
      filter: 'todas',
      newTaskPriority: 'media'
    },
    ui: {
      toast: null,
      modal: null
    }
  };

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
      success: '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none"><path d="M20 6L9 17l-5-5"/></svg>',
      error: '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>',
      info: '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>',
      revert: '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards';
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }

  function showLoginScreen() {
    const app = document.getElementById('app');
    const existingLogin = document.getElementById('login-screen');
    if (existingLogin) return;

    const loginHTML = `
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
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continuar con Google</span>
          </button>
        </div>
      </div>
    `;

    app.insertAdjacentHTML('beforeend', loginHTML);
    attachLoginEvents();
  }

  function attachLoginEvents() {
    const tabs = document.querySelectorAll('.login-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const googleBtn = document.getElementById('google-signin-btn');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const tabName = tab.dataset.tab;
        document.getElementById('login-form').classList.toggle('active', tabName === 'login');
        document.getElementById('register-form').classList.toggle('active', tabName === 'register');
        document.getElementById('login-error').textContent = '';
        document.getElementById('register-error').textContent = '';
      });
    });

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const errorEl = document.getElementById('login-error');
      errorEl.textContent = '';

      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (err) {
        errorEl.textContent = getAuthErrorMessage(err.code);
      }
    });

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      const errorEl = document.getElementById('register-error');
      errorEl.textContent = '';

      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (err) {
        errorEl.textContent = getAuthErrorMessage(err.code);
      }
    });

    googleBtn.addEventListener('click', async () => {
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (err) {
        showToast('Error al iniciar con Google', 'error');
      }
    });
  }

  function getAuthErrorMessage(code) {
    const messages = {
      'auth/user-not-found': 'No existe cuenta con este correo',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/email-already-in-use': 'Este correo ya está registrado',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
      'auth/invalid-email': 'Correo electrónico inválido',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
      'auth/popup-closed-by-user': 'Ventana cerrada antes de completar el inicio',
      'auth/network-request-failed': 'Error de conexión. Verifica tu internet'
    };
    return messages[code] || 'Error de autenticación';
  }

  function hideLoginScreen() {
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) loginScreen.remove();
  }

  function updateHeaderForUser(user) {
    const header = document.querySelector('.header');
    const existingUserInfo = header.querySelector('.user-info');
    if (existingUserInfo) existingUserInfo.remove();

    if (user) {
      const userInfo = document.createElement('div');
      userInfo.className = 'user-info';
      const displayName = user.displayName || user.email || 'Usuario';
      const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      userInfo.innerHTML = `
        <span class="user-name">${displayName}</span>
        <button class="logout-btn" title="Cerrar sesión">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
        </button>
      `;
      header.appendChild(userInfo);

      const logoutBtn = header.querySelector('.logout-btn');
      logoutBtn.addEventListener('click', async () => {
        try {
          await signOut(auth);
        } catch (err) {
          showToast('Error al cerrar sesión', 'error');
        }
      });
    }
  }

  // --- Firebase Real-time Sync ---

  function initFirestoreSync() {
    if (!appState.userId) return;

    const userId = appState.userId;

    const qCompras = query(collections.compras, where("userId", "==", userId), orderBy("creadoEn", "desc"));
    onSnapshot(qCompras, (snapshot) => {
      appState.compras.items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        creadoEn: doc.data().creadoEn?.toMillis() || Date.now()
      }));
      if (appState.activeTab === 'compras') renderComprasSection();
    });

    const qIdeas = query(collections.ideas, where("userId", "==", userId), orderBy("creadoEn", "desc"));
    onSnapshot(qIdeas, (snapshot) => {
      appState.ideas.items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        creadoEn: doc.data().creadoEn?.toMillis() || Date.now()
      }));
      if (appState.activeTab === 'ideas') renderIdeasSection();
    });

    const qTareas = query(collections.tareas, where("userId", "==", userId), orderBy("creadoEn", "desc"));
    onSnapshot(qTareas, (snapshot) => {
      appState.tareas.items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        creadoEn: doc.data().creadoEn?.toMillis() || Date.now(),
        fechaLimite: doc.data().fechaLimite
      }));
      if (appState.activeTab === 'tareas') renderTareasSection();
    });
  }

  function initLocalStorage() {
    appState.compras.items = loadFromStorage(STORAGE_KEYS.compras);
    appState.ideas.items = loadFromStorage(STORAGE_KEYS.ideas);
    appState.tareas.items = loadFromStorage(STORAGE_KEYS.tareas);
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  function saveAllData() {
    saveToStorage(STORAGE_KEYS.compras, appState.compras.items);
    saveToStorage(STORAGE_KEYS.ideas, appState.ideas.items);
    saveToStorage(STORAGE_KEYS.tareas, appState.tareas.items);
  }

  // --- Helper Functions ---


  function showModal(title, content, buttons) {
    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <h3 class="modal-title">${title}</h3>
        ${content}
        <div class="modal-actions">
          ${buttons.map(btn => `<button class="modal-btn ${btn.primary ? 'primary' : 'secondary'}" data-action="${btn.action}">${btn.label}</button>`).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('active'), 10);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });

    return overlay;
  }

  function closeModal() {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 200);
    }
  }

  function renderCheckbox(checked, onChange) {
    const checkbox = document.createElement('div');
    checkbox.className = `checkbox ${checked ? 'checked' : ''}`;
    checkbox.innerHTML = `
      <svg viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      onChange();
    });
    return checkbox;
  }

  function createDeleteButton(onClick) {
    const btn = document.createElement('button');
    btn.className = 'delete-btn';
    btn.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  function createIconButton(icon, onClick, title, activeClass = '') {
    const btn = document.createElement('button');
    btn.className = `idea-action-btn ${activeClass}`;
    btn.title = title;
    btn.innerHTML = icon;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  function renderEmptyState(icon, title, text) {
    const div = document.createElement('div');
    div.className = 'empty-state';
    div.innerHTML = `
      <div class="empty-icon">${icon}</div>
      <h3 class="empty-title">${title}</h3>
      <p class="empty-text">${text}</p>
    `;
    return div;
  }

  function getCategoryLabel(cat) {
    const labels = { supermercado: 'Supermercado', internet: 'Internet', farmacia: 'Farmacia', otros: 'Otros' };
    return labels[cat] || cat;
  }

  function getPriorityLabel(pri) {
    const labels = { alta: 'Alta', media: 'Media', baja: 'Baja' };
    return labels[pri] || pri;
  }

  function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Hoy';
    if (date.toDateString() === tomorrow.toDateString()) return 'Mañana';

    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  function sortComprasItems(items) {
    return [...items].sort((a, b) => {
      if (a.completado !== b.completado) return a.completado ? 1 : -1;
      return b.creadoEn - a.creadoEn;
    });
  }

  function sortIdeasItems(items) {
    return [...items].sort((a, b) => {
      if (a.archivada !== b.archivada) return a.archivada ? 1 : -1;
      return b.creadoEn - a.creadoEn;
    });
  }

  function sortTareasItems(items) {
    const priorityOrder = { alta: 0, media: 1, baja: 2 };
    return [...items].sort((a, b) => {
      if (a.completado !== b.completado) return a.completado ? 1 : -1;
      if (priorityOrder[a.prioridad] !== priorityOrder[b.prioridad]) {
        return priorityOrder[a.prioridad] - priorityOrder[b.prioridad];
      }
      if (a.fechaLimite && b.fechaLimite) return a.fechaLimite - b.fechaLimite;
      if (a.fechaLimite) return -1;
      if (b.fechaLimite) return 1;
      return b.creadoEn - a.creadoEn;
    });
  }

  function filterComprasItems(items, filters) {
    if (!filters || filters.length === 0) return items;
    return items.filter(item => filters.includes(item.categoria));
  }

  function renderActionInput(id, placeholder) {
    return `
      <div class="action-input">
        <input type="text" class="input-field" id="${id}" placeholder="${placeholder}" autocomplete="off">
        <button class="add-btn" id="${id}-btn">
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>
        </button>
      </div>
    `;
  }

  function filterTareasItems(items, filter) {
    if (filter === 'todas') return items;
    if (filter === 'pendientes') return items.filter(item => !item.completado);
    if (filter === 'completadas') return items.filter(item => item.completado);
    return items;
  }

  function renderComprasSection() {
    const section = document.getElementById('compras-section');
    const { items, filters } = appState.compras;

    const filtered = filterComprasItems(items, filters);
    const sorted = sortComprasItems(filtered);

    const counts = {
      supermercado: items.filter(i => i.categoria === 'supermercado').length,
      internet: items.filter(i => i.categoria === 'internet').length,
      farmacia: items.filter(i => i.categoria === 'farmacia').length
    };

    const CATEGORIES = ['supermercado', 'internet', 'farmacia'];

    const showEmpty = sorted.length === 0;
    const emptyTitle = filters.length > 0 ? 'Sin resultados' : 'Lista vacía';
    const emptyText = filters.length > 0 
      ? 'No hay productos en ' + getCategoryLabel(filters[0]) 
      : 'Añade productos a tu lista de compras';
    
    section.innerHTML = `
      <div class="stats-bar">
        ${CATEGORIES.map(cat => `
          <div class="stat-item ${filters.includes(cat) ? 'active' : ''}" data-filter="${cat}">
            <span class="stat-value">${counts[cat]}</span>
            <span class="stat-label">${getCategoryLabel(cat)}</span>
          </div>
        `).join('')}
      </div>

      <div class="input-wrapper">
        ${renderActionInput('compras-input', 'Añadir producto...')}
      </div>

      <div class="items-list" id="compras-list">
        ${showEmpty ? `
          <div class="empty-state">
            <div class="empty-icon">
              <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none"><path d="M3 3h18v18H3zM9 21V9h6v12M9 9h6M9 9v0M15 9v0" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <h3 class="empty-title">${emptyTitle}</h3>
            <p class="empty-text">${emptyText}</p>
          </div>
        ` : ''}
      </div>
    `;

    if (sorted.length > 0) {
      const list = section.querySelector('#compras-list');
      sorted.forEach(item => {
        const card = document.createElement('div');
        card.className = `item-card ${item.completado ? 'completed' : ''}`;
        card.dataset.id = item.id;
        card.innerHTML = `
          <div class="checkbox ${item.completado ? 'checked' : ''}" data-id="${item.id}">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <div class="item-content">
            <div class="item-row">
              <span class="item-text">${item.nombre}</span>
              <span class="badge badge-categoria">${getCategoryLabel(item.categoria)}</span>
            </div>
          </div>
          <button class="delete-btn" data-id="${item.id}">
            <svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        `;
        list.appendChild(card);
      });
    }

    attachComprasEvents();
  }

  function attachComprasEvents() {
    const section = document.getElementById('compras-section');
    const input = document.getElementById('compras-input');
    const addBtn = document.getElementById('compras-input-btn');
    const list = document.getElementById('compras-list');
    const statsBar = section.querySelector('.stats-bar');

    const addItem = async () => {
      const nombre = input.value.trim();
      if (!nombre) return;

      const filters = appState.compras.filters;
      const categoria = filters.length > 0 ? filters[0] : 'supermercado';

      const newItem = {
        id: generateId(),
        nombre,
        categoria,
        completado: false,
        creadoEn: Date.now()
      };
      appState.compras.items.unshift(newItem);
      saveToStorage(STORAGE_KEYS.compras, appState.compras.items);
      renderComprasSection();
      input.value = '';
      showToast('Producto añadido', 'success');
    };

    addBtn.addEventListener('click', addItem);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') addItem(); });

    list.addEventListener('click', async (e) => {
      const checkbox = e.target.closest('.checkbox');
      const deleteBtn = e.target.closest('.delete-btn');

      if (checkbox) {
        const id = checkbox.dataset.id;
        const item = appState.compras.items.find(i => i.id === id);
        if (item) {
          item.completado = !item.completado;
          saveToStorage(STORAGE_KEYS.compras, appState.compras.items);
          renderComprasSection();
          showToast(item.completado ? 'Marcado como completado' : 'Marcado como pendiente', 'success');
        }
      }

      if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        showModal('Eliminar producto', '<p>¿Estás seguro de que quieres eliminar este producto?</p>', [
          { label: 'Cancelar', action: 'cancel', primary: false },
          { label: 'Eliminar', action: 'delete', primary: true }
        ]).addEventListener('click', (e) => {
          const actionBtn = e.target.closest('[data-action]');
          if (actionBtn) {
            const action = actionBtn.dataset.action;
            if (action === 'delete') {
              appState.compras.items = appState.compras.items.filter(i => i.id !== id);
              saveToStorage(STORAGE_KEYS.compras, appState.compras.items);
              renderComprasSection();
              showToast('Producto eliminado', 'info');
            }
            closeModal();
          }
        });
      }
    });

    statsBar.addEventListener('click', (e) => {
      const statItem = e.target.closest('.stat-item');
      if (statItem) {
        const filter = statItem.dataset.filter;
        const currentFilters = appState.compras.filters;
        
        if (currentFilters.includes(filter)) {
          appState.compras.filters = [];
        } else {
          appState.compras.filters = [filter];
        }
        
        renderComprasSection();
      }
    });

      // ... rest of event listeners ...

    list.addEventListener('mousedown', (e) => handlePressStart(e, 'compras'));
    list.addEventListener('touchstart', (e) => handlePressStart(e, 'compras'));
    list.addEventListener('mouseup', (e) => handlePressEnd(e, 'compras'));
    list.addEventListener('mouseleave', (e) => handlePressEnd(e, 'compras'));
    list.addEventListener('touchend', (e) => handlePressEnd(e, 'compras'));
    list.addEventListener('touchmove', (e) => handlePressEnd(e, 'compras'));

    let pressTimer;
    function handlePressStart(e, type) {
      const titleSpan = e.target.closest('.item-text');
      if (!titleSpan) return;
      
      pressTimer = setTimeout(() => {
        titleSpan.contentEditable = true;
        titleSpan.classList.add('is-editing');
        titleSpan.dataset.editing = 'true';
        titleSpan.focus();
        
        titleSpan.onkeydown = (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            titleSpan.blur();
          }
        };

        titleSpan.onblur = () => {
          if (titleSpan.dataset.editing === 'true') {
            saveTitle(titleSpan, type);
          }
        };

        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(titleSpan);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }, 600);
    }

    function handlePressEnd(e, type) {
      clearTimeout(pressTimer);
      const titleSpan = e.target.closest('.item-text');
      if (titleSpan && titleSpan.dataset.editing === 'true') {
        saveTitle(titleSpan, type);
      }
    }

    function saveTitle(el, type) {
      el.contentEditable = false;
      el.classList.remove('is-editing');
      delete el.dataset.editing;
      const newTitle = el.textContent.trim();
      const card = el.closest('.item-card');
      const id = card.dataset.id;

      if (type === 'compras') {
        const item = appState.compras.items.find(i => i.id === id);
        if (item) {
          item.nombre = newTitle;
          saveToStorage(STORAGE_KEYS.compras, appState.compras.items);
          showToast('Título actualizado', 'success');
        }
      } else if (type === 'ideas') {
        const idea = appState.ideas.items.find(i => i.id === id);
        if (idea) {
          idea.titulo = newTitle;
          saveToStorage(STORAGE_KEYS.ideas, appState.ideas.items);
          showToast('Título actualizado', 'success');
        }
      }
    }
  }

  function renderIdeasSection() {
    const section = document.getElementById('ideas-section');
    const { items, searchQuery } = appState.ideas;

    let filtered = items;
    if (searchQuery) {
      filtered = items.filter(idea => 
        (idea.titulo && idea.titulo.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (idea.notas && idea.notas.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    const sorted = sortIdeasItems(filtered);
    const totalIdeas = items.length;
    const archivedIdeas = items.filter(i => i.archivada).length;

    section.innerHTML = `
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-value">${totalIdeas}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat-item completed">
          <span class="stat-value">${archivedIdeas}</span>
          <span class="stat-label">Hecho</span>
        </div>
        <div class="stat-item pending">
          <span class="stat-value">${totalIdeas - archivedIdeas}</span>
          <span class="stat-label">Pendiente</span>
        </div>
      </div>

      <div class="input-wrapper">
        ${renderActionInput('idea-title-input', 'Escribe una nueva idea...')}
      </div>

      <div class="items-list" id="ideas-list">
        ${sorted.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">
              <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <h3 class="empty-title">Sin ideas</h3>
            <p class="empty-text">Captura tus pensamientos aquí</p>
          </div>
        ` : ''}
      </div>
    `;

    if (sorted.length > 0) {
      const list = section.querySelector('#ideas-list');
      sorted.forEach((idea) => {
        const card = document.createElement('div');
        card.className = `item-card idea ${idea.archivada ? 'completed' : ''}`;
        card.dataset.id = idea.id;

        const expandIcon = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M6 9l6 6 6-6"/></svg>`;
        const saveIcon = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`;

        card.innerHTML = `
          <div class="checkbox ${idea.archivada ? 'checked' : ''}" data-id="${idea.id}">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <div class="item-content">
            <div class="item-row">
              <span class="item-text">${idea.titulo}</span>
              <button class="expand-indicator-btn" style="background:transparent; border:none; color:var(--text-tertiary); display:flex; padding:0;">
                ${expandIcon}
              </button>
            </div>
            <div class="idea-notes-wrapper">
              <textarea data-id="${idea.id}" placeholder="Desarrolla tu idea aquí...">${idea.notes || idea.notas || ''}</textarea>
            </div>
          </div>
          <div class="item-actions">
            <button class="delete-btn" data-id="${idea.id}">
              <svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button class="save-idea-btn icon-only" data-id="${idea.id}" title="Guardar cambios">
              ${saveIcon}
            </button>
            <div class="sync-indicator">
              <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
          </div>
        `;
        list.appendChild(card);
      });
    }

    attachIdeasEvents();
  }

  function attachIdeasEvents() {
    const titleInput = document.getElementById('idea-title-input');
    const addBtn = document.getElementById('idea-title-input-btn');
    const list = document.getElementById('ideas-list');

    const addIdea = () => {
      const titulo = titleInput.value.trim();
      if (!titulo) return;

      const newIdea = {
        id: generateId(),
        titulo,
        notas: '',
        archivada: false,
        creadoEn: Date.now()
      };
      appState.ideas.items.unshift(newIdea);
      saveToStorage(STORAGE_KEYS.ideas, appState.ideas.items);
      renderIdeasSection();
      titleInput.value = '';
      showToast('Idea capturada', 'success');
    };

    addBtn.addEventListener('click', addIdea);
    titleInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addIdea(); });

    list.addEventListener('click', async (e) => {
      const checkbox = e.target.closest('.checkbox');
      const deleteBtn = e.target.closest('.delete-btn');
      const expandBtn = e.target.closest('.expand-indicator-btn') || e.target.closest('.item-row');
      const saveBtn = e.target.closest('.save-idea-btn');
      
      if (checkbox) {
        const id = checkbox.dataset.id;
        toggleArchiveIdea(id);
      }

      if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        deleteIdea(id);
      }

      if (saveBtn) {
        const id = saveBtn.dataset.id;
        const card = saveBtn.closest('.item-card');
        const textarea = card.querySelector('textarea');
        const sync = card.querySelector('.sync-indicator');
        const notes = textarea.value;

        const idea = appState.ideas.items.find(i => i.id === id);
        if (idea) {
          idea.notas = notes;
          saveToStorage(STORAGE_KEYS.ideas, appState.ideas.items);
          sync.classList.add('visible');
          setTimeout(() => sync.classList.remove('visible'), 2000);
          showToast('Notas guardadas', 'success');
        }
      }

      if (expandBtn && !e.target.closest('.checkbox') && !e.target.closest('.delete-btn') && !e.target.closest('.save-idea-btn') && !e.target.closest('textarea') && !e.target.closest('.item-text')) {
        const card = expandBtn.closest('.item-card');
        card.classList.toggle('expanded');
      }
    });

    list.addEventListener('mousedown', (e) => handleLongPressStart(e));
    list.addEventListener('touchstart', (e) => handleLongPressStart(e));
    list.addEventListener('mouseup', (e) => handleLongPressEnd(e));
    list.addEventListener('mouseleave', (e) => handleLongPressEnd(e));
    list.addEventListener('touchend', (e) => handleLongPressEnd(e));
    list.addEventListener('touchmove', (e) => handleLongPressEnd(e));

    let pressTimer;
    function handleLongPressStart(e) {
      const titleSpan = e.target.closest('.item-text');
      if (!titleSpan) return;
      
      pressTimer = setTimeout(() => {
        titleSpan.contentEditable = true;
        titleSpan.classList.add('is-editing');
        titleSpan.dataset.editing = 'true';
        titleSpan.focus();
        
        // Prevent default behavior
        titleSpan.onkeydown = (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            titleSpan.blur();
          }
        };

        // Add blur listener to save on click-out
        titleSpan.onblur = () => {
          if (titleSpan.dataset.editing === 'true') {
            saveTitle(titleSpan);
          }
        };

        // Move cursor to end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(titleSpan);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }, 600);
    }

    function handleLongPressEnd(e) {
      clearTimeout(pressTimer);
      const titleSpan = e.target.closest('.item-text');
      if (titleSpan && titleSpan.dataset.editing === 'true') {
        saveTitle(titleSpan);
      }
    }

    async function saveTitle(el) {
      el.contentEditable = false;
      el.classList.remove('is-editing');
      delete el.dataset.editing;
      const newTitle = el.textContent.trim();
      const card = el.closest('.item-card');
      const id = card.dataset.id;

      const idea = appState.ideas.items.find(i => i.id === id);
      if (idea) {
        idea.titulo = newTitle;
        saveToStorage(STORAGE_KEYS.ideas, appState.ideas.items);
        showToast('Título actualizado', 'success');
      }
    }
  }

  function toggleArchiveIdea(id) {
    const idea = appState.ideas.items.find(i => i.id === id);
    if (idea) {
      idea.archivada = !idea.archivada;
      saveToStorage(STORAGE_KEYS.ideas, appState.ideas.items);
      renderIdeasSection();
      showToast(!idea.archivada ? 'Idea archivada' : 'Idea restaurada', !idea.archivada ? 'success' : 'revert');
    }
  }

  function deleteIdea(id) {
    showModal('Eliminar idea', '<p>¿Estás seguro de que quieres eliminar esta idea?</p>', [
      { label: 'Cancelar', action: 'cancel', primary: false },
      { label: 'Eliminar', action: 'delete', primary: true }
    ]).addEventListener('click', (e) => {
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        const action = actionBtn.dataset.action;
        if (action === 'delete') {
          appState.ideas.items = appState.ideas.items.filter(i => i.id !== id);
          saveToStorage(STORAGE_KEYS.ideas, appState.ideas.items);
          renderIdeasSection();
          showToast('Idea eliminada', 'info');
        }
        closeModal();
      }
    });
  }

  function renderTareasSection() {
    const section = document.getElementById('tareas-section');
    const { items, filter } = appState.tareas;

    const filtered = filterTareasItems(items, filter);
    const sorted = sortTareasItems(filtered);

    const totalTareas = items.length;
    const completedTareas = items.filter(i => i.completado).length;

    section.innerHTML = `
      <div class="stats-bar">
        <div class="stat-item ${filter === 'todas' ? 'active' : ''}" data-filter="todas">
          <span class="stat-value">${totalTareas}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat-item completed ${filter === 'completadas' ? 'active' : ''}" data-filter="completadas">
          <span class="stat-value">${completedTareas}</span>
          <span class="stat-label">Hecho</span>
        </div>
        <div class="stat-item pending ${filter === 'pendientes' ? 'active' : ''}" data-filter="pendientes">
          <span class="stat-value">${totalTareas - completedTareas}</span>
          <span class="stat-label">Pendiente</span>
        </div>
      </div>

      <div class="input-wrapper">
        <div class="action-input">
          <input type="text" class="input-field" id="tarea-input" placeholder="Nueva tarea..." autocomplete="off">
          <button class="add-btn" id="tarea-input-btn">
            <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>

      <div class="items-list" id="tareas-list">
        ${sorted.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">
              <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <h3 class="empty-title">Sin tareas</h3>
            <p class="empty-text">Añade tus tareas pendientes para empezar</p>
          </div>
        ` : ''}
      </div>
    `;

    if (sorted.length > 0) {
      const list = section.querySelector('#tareas-list');
      const expandIcon = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M6 9l6 6 6-6"/></svg>`;
      const saveIcon = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`;

      sorted.forEach(tarea => {
        const card = document.createElement('div');
        card.className = `item-card task ${tarea.completado ? 'completed' : ''}`;
        card.dataset.id = tarea.id;
        
        const fechaLimiteValue = tarea.fechaLimite ? new Date(tarea.fechaLimite).toISOString().split('T')[0] : '';
        
        card.innerHTML = `
          <div class="checkbox ${tarea.completado ? 'checked' : ''}" data-id="${tarea.id}">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <div class="item-content">
            <div class="item-row">
              <span class="item-text">${tarea.titulo}</span>
              <div class="task-meta-expand-wrapper">
                <div class="task-meta-inline" style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                  <span class="badge badge-priority ${tarea.prioridad}">${getPriorityLabel(tarea.prioridad)}</span>
                  ${tarea.fechaLimite ? `
                    <span class="badge-date">
                      <svg viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      ${formatDate(tarea.fechaLimite)}
                    </span>
                  ` : ''}
                </div>
                <button class="delete-btn" data-id="${tarea.id}">
                  <svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
                <button class="expand-indicator-btn" style="background:transparent; border:none; color:var(--text-tertiary); display:flex; padding:0;">
                  ${expandIcon}
                </button>
              </div>
            </div>
            <div class="task-edit-fields">
              <div class="task-row-edit">
                <select class="priority-select" data-id="${tarea.id}">
                  ${PRIORIDADES.map(p => `<option value="${p}" ${tarea.prioridad === p ? 'selected' : ''}>${getPriorityLabel(p)}</option>`).join('')}
                </select>
                <div class="studio-date-wrapper">
                  <input type="date" class="studio-date-input" value="${fechaLimiteValue}">
                </div>
              </div>
              <div class="task-notes-wrapper">
                <textarea placeholder="Notas adicionales...">${tarea.notas || ''}</textarea>
              </div>
              <div class="task-actions-row">
                <button class="save-task-btn icon-only" data-id="${tarea.id}" title="Guardar cambios">
                  ${saveIcon}
                </button>
                <div class="sync-indicator">
                  <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
              </div>
            </div>
          </div>
        `;
        list.appendChild(card);
      });
    }

    attachTareasEvents();
  }

  function attachTareasEvents() {
    const input = document.getElementById('tarea-input');
    const addBtn = document.getElementById('tarea-input-btn');
    const list = document.getElementById('tareas-list');
    const statsBar = document.querySelector('#tareas-section .stats-bar');

    const addTarea = () => {
      const titulo = input.value.trim();
      if (!titulo) return;

      const newTarea = {
        id: generateId(),
        titulo,
        prioridad: 'media',
        fechaLimite: null,
        notas: '',
        completado: false,
        creadoEn: Date.now()
      };
      appState.tareas.items.unshift(newTarea);
      saveToStorage(STORAGE_KEYS.tareas, appState.tareas.items);
      renderTareasSection();
      input.value = '';
      showToast('Tarea añadida', 'success');
    };

    addBtn.addEventListener('click', addTarea);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTarea(); });

    statsBar.addEventListener('click', (e) => {
      const statItem = e.target.closest('.stat-item');
      if (statItem) {
        appState.tareas.filter = statItem.dataset.filter;
        renderTareasSection();
      }
    });

    list.addEventListener('click', async (e) => {
      const checkbox = e.target.closest('.checkbox');
      const deleteBtn = e.target.closest('.delete-btn');
      const expandBtn = e.target.closest('.expand-indicator-btn') || e.target.closest('.item-row');
      const saveBtn = e.target.closest('.save-task-btn');

      if (checkbox) {
        const id = checkbox.dataset.id;
        const tarea = appState.tareas.items.find(i => i.id === id);
        if (tarea) {
          tarea.completado = !tarea.completado;
          saveToStorage(STORAGE_KEYS.tareas, appState.tareas.items);
          renderTareasSection();
          showToast(!tarea.completado ? 'Tarea completada' : 'Tarea pendiente', !tarea.completado ? 'success' : 'revert');
        }
      }

      if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        showModal('Eliminar tarea', '<p>¿Estás seguro de que quieres eliminar esta tarea?</p>', [
          { label: 'Cancelar', action: 'cancel', primary: false },
          { label: 'Eliminar', action: 'delete', primary: true }
        ]).addEventListener('click', (e) => {
          const actionBtn = e.target.closest('[data-action]');
          if (actionBtn) {
            const action = actionBtn.dataset.action;
            if (action === 'delete') {
              appState.tareas.items = appState.tareas.items.filter(i => i.id !== id);
              saveToStorage(STORAGE_KEYS.tareas, appState.tareas.items);
              renderTareasSection();
              showToast('Tarea eliminada', 'info');
            }
            closeModal();
          }
        });
      }

      if (expandBtn && !e.target.closest('.checkbox') && !e.target.closest('.delete-btn') && !e.target.closest('.save-task-btn') && !e.target.closest('.item-text') && !e.target.closest('.priority-select') && !e.target.closest('.studio-date-input') && !e.target.closest('textarea')) {
        const card = expandBtn.closest('.item-card');
        card.classList.toggle('expanded');
      }

      if (saveBtn) {
        const id = saveBtn.dataset.id;
        const card = saveBtn.closest('.item-card');
        const textarea = card.querySelector('.task-notes-wrapper textarea');
        const sync = card.querySelector('.sync-indicator');
        const notas = textarea.value;

        const tarea = appState.tareas.items.find(i => i.id === id);
        if (tarea) {
          tarea.notas = notas;
          saveToStorage(STORAGE_KEYS.tareas, appState.tareas.items);
          sync.classList.add('visible');
          setTimeout(() => sync.classList.remove('visible'), 2000);
          showToast('Notas guardadas', 'success');
        }
      }
    });

    list.addEventListener('change', async (e) => {
      const prioritySelect = e.target.closest('.priority-select');
      const dateInput = e.target.closest('.studio-date-input');

      if (prioritySelect) {
        const id = prioritySelect.dataset.id;
        const newPriority = prioritySelect.value;

        const tarea = appState.tareas.items.find(i => i.id === id);
        if (tarea) {
          tarea.prioridad = newPriority;
          saveToStorage(STORAGE_KEYS.tareas, appState.tareas.items);
          renderTareasSection();
          showToast('Prioridad actualizada', 'success');
        }
      }

      if (dateInput) {
        const card = dateInput.closest('.item-card');
        const id = card.dataset.id;
        const newFechaLimite = dateInput.value ? new Date(dateInput.value).getTime() : null;

        const tarea = appState.tareas.items.find(i => i.id === id);
        if (tarea) {
          tarea.fechaLimite = newFechaLimite;
          saveToStorage(STORAGE_KEYS.tareas, appState.tareas.items);
          renderTareasSection();
          showToast('Fecha actualizada', 'success');
        }
      }
    });

    list.addEventListener('mousedown', (e) => {
      const titleSpan = e.target.closest('.item-text');
      if (!titleSpan) return;
      
      const timer = setTimeout(() => {
        startEditingTarea(titleSpan);
      }, 600);
      
      const cancel = () => clearTimeout(timer);
      list.addEventListener('mouseup', cancel, { once: true });
      list.addEventListener('mouseleave', cancel, { once: true });
    });

    list.addEventListener('touchstart', (e) => {
      const titleSpan = e.target.closest('.item-text');
      if (!titleSpan) return;
      
      const timer = setTimeout(() => {
        startEditingTarea(titleSpan);
      }, 600);
      
      const cancel = () => clearTimeout(timer);
      list.addEventListener('touchend', cancel, { once: true });
      list.addEventListener('touchmove', cancel, { once: true });
    });

    function startEditingTarea(titleSpan) {
      titleSpan.contentEditable = true;
      titleSpan.classList.add('is-editing');
      titleSpan.dataset.editing = 'true';
      titleSpan.focus();
      
      titleSpan.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          titleSpan.blur();
        }
      };

      titleSpan.onblur = () => {
        if (titleSpan.dataset.editing === 'true') {
          finishEditingTarea(titleSpan);
        }
      };

      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(titleSpan);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }

    function finishEditingTarea(titleSpan) {
      titleSpan.contentEditable = false;
      titleSpan.classList.remove('is-editing');
      delete titleSpan.dataset.editing;
      const newTitle = titleSpan.textContent.trim();
      const card = titleSpan.closest('.item-card');
      const id = card.dataset.id;

      const tarea = appState.tareas.items.find(i => i.id === id);
      if (tarea) {
        tarea.titulo = newTitle;
        saveToStorage(STORAGE_KEYS.tareas, appState.tareas.items);
        showToast('Título actualizado', 'success');
      }
    }
  }

  function switchTab(tab) {
    appState.activeTab = tab;

    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tab);
    });

    document.querySelectorAll('.section').forEach(section => {
      section.classList.toggle('active', section.id === `${tab}-section`);
    });

    if (tab === 'compras') renderComprasSection();
    else if (tab === 'ideas') renderIdeasSection();
    else if (tab === 'tareas') renderTareasSection();
  }

  function init() {
    onAuthStateChanged(auth, (user) => {
      appState.user = user;
      appState.userId = user ? user.uid : null;
      appState.authLoading = false;

      initLocalStorage();

      if (user) {
        hideLoginScreen();
        updateHeaderForUser(user);
        initFirestoreSync();
        const hash = window.location.hash.substring(1);
        const initialTab = ['compras', 'ideas', 'tareas'].includes(hash) ? hash : 'compras';
        switchTab(initialTab);
      } else {
        showLoginScreen();
        updateHeaderForUser(null);
        const hash = window.location.hash.substring(1);
        const initialTab = ['compras', 'ideas', 'tareas'].includes(hash) ? hash : 'compras';
        switchTab(initialTab);
      }
    });

    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        switchTab(item.dataset.tab);
        window.location.hash = item.dataset.tab;
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
