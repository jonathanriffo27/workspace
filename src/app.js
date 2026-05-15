import { 
  onSnapshot, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc, 
  serverTimestamp,
  query,
  orderBy,
  where,
  getDocs
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

  async function migrateDataIfNecessary(userId) {
    const collectionsToCheck = [
      { key: STORAGE_KEYS.compras, collection: collections.compras, type: 'compras' },
      { key: STORAGE_KEYS.ideas, collection: collections.ideas, type: 'ideas' },
      { key: STORAGE_KEYS.tareas, collection: collections.tareas, type: 'tareas' }
    ];

    for (const col of collectionsToCheck) {
      const localData = loadFromStorage(col.key);
      if (localData.length > 0) {
        try {
          // Check if remote is empty
          const q = query(col.collection, where("userId", "==", userId));
          const snapshot = await getDocs(q);
          
          if (snapshot.empty) {
            console.log(`Migrating ${col.type} to Firestore...`);
            for (const item of localData) {
              const { id, ...data } = item;
              await addDoc(col.collection, {
                ...data,
                userId: userId,
                creadoEn: item.creadoEn ? new Date(item.creadoEn) : serverTimestamp()
              });
            }
            localStorage.removeItem(col.key);
            console.log(`${col.type} migration complete.`);
          } else {
            localStorage.removeItem(col.key);
          }
        } catch (err) {
          console.error(`Error migrating ${col.type}:`, err);
        }
      }
    }
  }

  function initFirestoreSync() {
    if (!appState.userId) return;

    const userId = appState.userId;
    console.log('Initializing Firestore Sync for user:', userId);
    
    // Attempt migration before setting up listeners
    migrateDataIfNecessary(userId);

    const qCompras = query(collections.compras, where("userId", "==", userId), orderBy("creadoEn", "desc"));
    onSnapshot(qCompras, (snapshot) => {
      console.log('Compras snapshot received, docs:', snapshot.size);
      appState.compras.items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        creadoEn: doc.data().creadoEn?.toMillis() || Date.now()
      }));
      if (appState.activeTab === 'compras') renderComprasSection();
    }, (err) => {
      console.error('Error in Compras onSnapshot:', err);
      if (err.message.includes('index')) {
        showToast('Error de base de datos: Falta un índice en Firestore.', 'error');
      }
    });

    const qIdeas = query(collections.ideas, where("userId", "==", userId), orderBy("creadoEn", "desc"));
    onSnapshot(qIdeas, (snapshot) => {
      console.log('Ideas snapshot received, docs:', snapshot.size);
      appState.ideas.items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        creadoEn: doc.data().creadoEn?.toMillis() || Date.now()
      }));
      if (appState.activeTab === 'ideas') renderIdeasSection();
    }, (err) => {
      console.error('Error in Ideas onSnapshot:', err);
    });

    const qTareas = query(collections.tareas, where("userId", "==", userId), orderBy("creadoEn", "desc"));
    onSnapshot(qTareas, (snapshot) => {
      console.log('Tareas snapshot received, docs:', snapshot.size);
      appState.tareas.items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        creadoEn: doc.data().creadoEn?.toMillis() || Date.now(),
        fechaLimite: doc.data().fechaLimite
      }));
      if (appState.activeTab === 'tareas') renderTareasSection();
    }, (err) => {
      console.error('Error in Tareas onSnapshot:', err);
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


  function showModal(title, content, buttons, callback) {
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
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        const action = actionBtn.dataset.action;
        if (callback) callback(action);
        closeModal();
      } else if (e.target === overlay) {
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
    console.log('attachComprasEvents called');
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

      try {
        await addDoc(collections.compras, {
          nombre,
          categoria,
          completado: false,
          creadoEn: serverTimestamp(),
          userId: appState.userId
        });
        input.value = '';
        showToast('Producto añadido', 'success');
        switchTab('compras');
      } catch (err) {
        console.error('Error adding item:', err);
        showToast('Error al añadir producto', 'error');
      }
    };

    addBtn.addEventListener('click', addItem);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') addItem(); });

    list.addEventListener('click', async (e) => {
      try {
        console.log('Click event on list:', e.target);
        const checkbox = e.target.closest('.checkbox');
        const deleteBtn = e.target.closest('.delete-btn');
        console.log('deleteBtn found:', deleteBtn);

        if (checkbox) {
        const id = checkbox.dataset.id;
        const item = appState.compras.items.find(i => i.id === id);
        if (item) {
          try {
            await updateDoc(doc(db, 'compras', id), {
              completado: !item.completado
            });
            showToast(item.completado ? 'Marcado como pendiente' : 'Marcado como completado', 'success');
          } catch (err) {
            console.error('Error updating item:', err);
            showToast('Error al actualizar', 'error');
          }
        }
      }

      if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        showModal('Eliminar producto', '<p>¿Estás seguro de que quieres eliminar este producto?</p>', [
          { label: 'Cancelar', action: 'cancel', primary: false },
          { label: 'Eliminar', action: 'delete', primary: true }
        ], async (action) => {
          if (action === 'delete') {
            try {
              await deleteDoc(doc(db, 'compras', id));
              showToast('Producto eliminado', 'success');
            } catch (err) {
              console.error('Error deleting item:', err);
              showToast('Error al eliminar', 'error');
            }
          }
        });
      }
      } catch (err) {
        console.error('Error in Compras click handler:', err);
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

    async function saveTitle(el, type) {
      el.contentEditable = false;
      el.classList.remove('is-editing');
      delete el.dataset.editing;
      const newTitle = el.textContent.trim();
      const card = el.closest('.item-card');
      const id = card.dataset.id;

      try {
        if (type === 'compras') {
          await updateDoc(doc(db, 'compras', id), {
            nombre: newTitle
          });
          showToast('Título actualizado', 'success');
        } else if (type === 'ideas') {
          await updateDoc(doc(db, 'ideas', id), {
            titulo: newTitle
          });
          showToast('Título actualizado', 'success');
        }
      } catch (err) {
        console.error('Error updating title:', err);
        showToast('Error al actualizar título', 'error');
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
    console.log('attachIdeasEvents called');
    const titleInput = document.getElementById('idea-title-input');
    const addBtn = document.getElementById('idea-title-input-btn');
    const list = document.getElementById('ideas-list');

    const addIdea = async () => {
      const titulo = titleInput.value.trim();
      if (!titulo) return;

      try {
        await addDoc(collections.ideas, {
          titulo,
          notas: '',
          archivada: false,
          creadoEn: serverTimestamp(),
          userId: appState.userId
        });
        titleInput.value = '';
        showToast('Idea capturada', 'success');
        switchTab('ideas');
      } catch (err) {
        console.error('Error adding idea:', err);
        showToast('Error al capturar idea', 'error');
      }
    };

    addBtn.addEventListener('click', addIdea);
    titleInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addIdea(); });

    list.addEventListener('click', async (e) => {
      try {
        console.log('Ideas list click:', e.target);
        const checkbox = e.target.closest('.checkbox');
        const deleteBtn = e.target.closest('.delete-btn');
        console.log('Ideas deleteBtn:', deleteBtn);
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

        try {
          await updateDoc(doc(db, 'ideas', id), {
            notas: notes
          });
          sync.classList.add('visible');
          setTimeout(() => sync.classList.remove('visible'), 2000);
          showToast('Notas guardadas', 'success');
        } catch (err) {
          console.error('Error saving notes:', err);
          showToast('Error al guardar notas', 'error');
        }
      }

      if (expandBtn && !e.target.closest('.checkbox') && !e.target.closest('.delete-btn') && !e.target.closest('.save-idea-btn') && !e.target.closest('textarea') && !e.target.closest('.item-text')) {
        const card = expandBtn.closest('.item-card');
        card.classList.toggle('expanded');
      }
      } catch (err) {
        console.error('Error in Ideas click handler:', err);
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
            saveTitle(titleSpan, 'ideas');
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
        saveTitle(titleSpan, 'ideas');
      }
    }

    // saveTitle function is now shared and async, already updated in previous step
  }

  async function toggleArchiveIdea(id) {
    const idea = appState.ideas.items.find(i => i.id === id);
    if (idea) {
      try {
        await updateDoc(doc(db, 'ideas', id), {
          archivada: !idea.archivada
        });
        showToast(!idea.archivada ? 'Idea archivada' : 'Idea restaurada', !idea.archivada ? 'success' : 'revert');
      } catch (err) {
        console.error('Error toggling archive:', err);
        showToast('Error al archivar', 'error');
      }
    }
  }

  function deleteIdea(id) {
    showModal('Eliminar idea', '<p>¿Estás seguro de que quieres eliminar esta idea?</p>', [
      { label: 'Cancelar', action: 'cancel', primary: false },
      { label: 'Eliminar', action: 'delete', primary: true }
    ], async (action) => {
      if (action === 'delete') {
        try {
          await deleteDoc(doc(db, 'ideas', id));
          showToast('Idea eliminada', 'success');
        } catch (err) {
          console.error('Error deleting idea:', err);
          showToast('Error al eliminar', 'error');
        }
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
              <div class="task-content-col">
                <div class="task-row-edit">
                  <select class="priority-select" data-id="${tarea.id}">
                    ${PRIORIDADES.map(p => `<option value="${p}" ${tarea.prioridad === p ? 'selected' : ''}>${getPriorityLabel(p)}</option>`).join('')}
                  </select>
                  <div class="studio-date-wrapper">
                    <input type="date" class="studio-date-input" value="${fechaLimiteValue}">
                  </div>
                </div>
                <textarea placeholder="Notas adicionales...">${tarea.notas || ''}</textarea>
              </div>
              <div class="task-actions-col">
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
    console.log('attachTareasEvents called');
    const input = document.getElementById('tarea-input');
    const addBtn = document.getElementById('tarea-input-btn');
    const list = document.getElementById('tareas-list');
    const statsBar = document.querySelector('#tareas-section .stats-bar');

    const addTarea = async () => {
      const titulo = input.value.trim();
      if (!titulo) return;

      try {
        await addDoc(collections.tareas, {
          titulo,
          prioridad: 'media',
          fechaLimite: null,
          notas: '',
          completado: false,
          creadoEn: serverTimestamp(),
          userId: appState.userId
        });
        input.value = '';
        showToast('Tarea añadida', 'success');
        switchTab('tareas');
      } catch (err) {
        console.error('Error adding task:', err);
        showToast('Error al añadir tarea', 'error');
      }
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
      try {
        console.log('Tareas list click:', e.target);
        const checkbox = e.target.closest('.checkbox');
        const deleteBtn = e.target.closest('.delete-btn');
        console.log('Tareas deleteBtn:', deleteBtn);
        const expandBtn = e.target.closest('.expand-indicator-btn') || e.target.closest('.item-row');
        const saveBtn = e.target.closest('.save-task-btn');

        if (checkbox) {
          const id = checkbox.dataset.id;
          const tarea = appState.tareas.items.find(i => i.id === id);
          if (tarea) {
            try {
              await updateDoc(doc(db, 'tareas', id), {
                completado: !tarea.completado
              });
              showToast(!tarea.completado ? 'Tarea completada' : 'Tarea pendiente', !tarea.completado ? 'success' : 'revert');
            } catch (err) {
              console.error('Error updating task:', err);
              showToast('Error al actualizar', 'error');
            }
          }
        }

        if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        showModal('Eliminar tarea', '<p>¿Estás seguro de que quieres eliminar esta tarea?</p>', [
          { label: 'Cancelar', action: 'cancel', primary: false },
          { label: 'Eliminar', action: 'delete', primary: true }
        ], async (action) => {
          if (action === 'delete') {
            try {
              await deleteDoc(doc(db, 'tareas', id));
              showToast('Tarea eliminada', 'success');
            } catch (err) {
              console.error('Error deleting task:', err);
              showToast('Error al eliminar', 'error');
            }
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

        try {
          await updateDoc(doc(db, 'tareas', id), {
            notas: notas
          });
          sync.classList.add('visible');
          setTimeout(() => sync.classList.remove('visible'), 2000);
          showToast('Notas guardadas', 'success');
        } catch (err) {
          console.error('Error saving task notes:', err);
          showToast('Error al guardar notas', 'error');
        }
      }
      } catch (err) {
        console.error('Error in Tareas click handler:', err);
      }
    });

    list.addEventListener('mousedown', (e) => handlePressStart(e, 'tareas'));
    list.addEventListener('touchstart', (e) => handlePressStart(e, 'tareas'));
    list.addEventListener('mouseup', (e) => handlePressEnd(e));
    list.addEventListener('mouseleave', (e) => handlePressEnd(e));
    list.addEventListener('touchend', (e) => handlePressEnd(e));
    list.addEventListener('touchmove', (e) => handlePressEnd(e));

    list.addEventListener('change', async (e) => {
      const prioritySelect = e.target.closest('.priority-select');
      const dateInput = e.target.closest('.studio-date-input');

      if (prioritySelect) {
        const id = prioritySelect.dataset.id;
        const newPriority = prioritySelect.value;

        try {
          await updateDoc(doc(db, 'tareas', id), {
            prioridad: newPriority
          });
          showToast('Prioridad actualizada', 'success');
        } catch (err) {
          console.error('Error updating priority:', err);
          showToast('Error al actualizar prioridad', 'error');
        }
      }

      if (dateInput) {
        const card = dateInput.closest('.item-card');
        const id = card.dataset.id;
        const newFechaLimite = dateInput.value ? new Date(dateInput.value).getTime() : null;

        try {
          await updateDoc(doc(db, 'tareas', id), {
            fechaLimite: newFechaLimite
          });
          showToast('Fecha actualizada', 'success');
        } catch (err) {
          console.error('Error updating date:', err);
          showToast('Error al actualizar fecha', 'error');
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

    async function finishEditingTarea(titleSpan) {
      titleSpan.contentEditable = false;
      titleSpan.classList.remove('is-editing');
      delete titleSpan.dataset.editing;
      const newTitle = titleSpan.textContent.trim();
      const card = titleSpan.closest('.item-card');
      const id = card.dataset.id;

      try {
        await updateDoc(doc(db, 'tareas', id), {
          titulo: newTitle
        });
        showToast('Título actualizado', 'success');
      } catch (err) {
        console.error('Error updating task title:', err);
        showToast('Error al actualizar título', 'error');
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

    requestAnimationFrame(() => {
      const section = document.getElementById(`${tab}-section`);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // --- Voice Capture Logic ---

  let recognition = null;
  let voiceTimer = null;
  let isLongPress = false;
  const LONG_PRESS_DURATION = 600;

  function initVoiceCapture() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser.');
      return;
    }

    console.log('Voice capture initialized');

    recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      console.log('Speech Recognition: Started');
    };

    recognition.onerror = (event) => {
      console.error('Speech Recognition Error:', event.error, event.message);
      let errorMsg = 'Error de voz';
      if (event.error === 'not-allowed') errorMsg = 'Micrófono bloqueado por el navegador';
      if (event.error === 'no-speech') errorMsg = 'No se detectó voz';
      if (event.error === 'network') errorMsg = 'Error de red en el reconocimiento';
      
      showToast(`${errorMsg}: ${event.error}`, 'error');
    };

    recognition.onspeechstart = () => {
      console.log('Speech Recognition: Speech detected');
    };

    recognition.onspeechend = () => {
      console.log('Speech Recognition: Speech ended');
    };

    recognition.onaudiostart = () => {
      console.log('Speech Recognition: Audio capture started');
    };

    recognition.onaudioend = () => {
      console.log('Speech Recognition: Audio capture ended');
    };

    const overlay = document.getElementById('voice-overlay');
    const transcriptEl = document.getElementById('voice-transcript');
    const ideasNav = document.querySelector('.nav-item[data-tab="ideas"]');

    if (!ideasNav) return;

    const startRecording = () => {
      try {
        console.log('Attempting to start voice recording...');
        isLongPress = true;
        
        // Ensure recognition is stopped before starting
        try { recognition.stop(); } catch(e) {}
        
        recognition.start();
        overlay.classList.add('active');
        ideasNav.classList.add('recording');
        transcriptEl.textContent = 'Habla ahora...';
        
        // Vibrate if supported
        if ('vibrate' in navigator) navigator.vibrate(50);
      } catch (e) {
        console.error('Error starting recognition:', e);
        showToast('Error al iniciar micrófono. Verifica permisos.', 'error');
      }
    };

    const stopRecording = () => {
      console.log('Stopping voice recording...');
      try {
        recognition.stop();
      } catch(e) {
        console.warn('Recognition already stopped or error stopping:', e);
      }
      overlay.classList.remove('active');
      ideasNav.classList.remove('recording');
      setTimeout(() => { isLongPress = false; }, 150);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const resultText = finalTranscript || interimTranscript;
      if (resultText) {
        transcriptEl.textContent = resultText;
        transcriptEl.dataset.hasContent = 'true';
      }
    };

    recognition.onend = () => {
      const text = transcriptEl.dataset.hasContent === 'true' ? transcriptEl.textContent.trim() : '';
      console.log('Recognition ended. Final text processed:', text);
      
      if (text && text.length > 1) {
        processVoiceCapture(text);
      } else {
        console.log('No valid text detected, skipping capture.');
      }
      
      overlay.classList.remove('active');
      ideasNav.classList.remove('recording');
      delete transcriptEl.dataset.hasContent;
    };

    const handleStart = (e) => {
      console.log('Interaction start detected');
      
      // Some browsers need an immediate, non-delayed interaction to allow audio
      // We "warm up" the recognition if possible
      voiceTimer = setTimeout(startRecording, LONG_PRESS_DURATION);
    };

    const handleEnd = () => {
      console.log('Interaction end detected');
      clearTimeout(voiceTimer);
      if (ideasNav.classList.contains('recording')) {
        stopRecording();
      }
    };

    ideasNav.addEventListener('mousedown', handleStart);
    ideasNav.addEventListener('touchstart', handleStart, { passive: true });
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);
  }

  function hasMultipleItems(text) {
    const separators = [' y ', ' e ', ', ', ' más ', ' con ', ' además de '];
    const lower = text.toLowerCase();
    return separators.some(s => text.includes(s));
  }

  function splitIntoItems(text) {
    let items = [text];
    const separators = [
      { pattern: /\s+y\s+/g, split: true },
      { pattern: /\s+e\s+/g, split: true },
      { pattern: /,\s*/g, split: true },
      { pattern: /\s+más\s+/g, split: true },
      { pattern: /\s+con\s+/g, split: true },
      { pattern: /\s+además\s+de\s+/g, split: true }
    ];

    for (const sep of separators) {
      const newItems = [];
      for (const item of items) {
        const parts = item.split(sep.pattern);
        newItems.push(...parts);
      }
      items = newItems.filter(i => i.trim().length > 0);
    }

    return items.map(item => item.trim()).filter(i => i.length > 0);
  }

  function capitalizeFirstLetter(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  async function categorizeWithLLM(text) {
    const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

    if (hasMultipleItems(text)) {
      const items = splitIntoItems(text);
      if (items.length > 1) {
        const results = [];
        for (const item of items) {
          const result = await categorizeSingleItem(item, API_KEY);
          results.push(result);
        }
        return { items: results };
      }
    }

    return await categorizeSingleItem(text, API_KEY);
  }

  async function categorizeSingleItem(text, API_KEY) {
    if (!API_KEY) {
      console.warn('OpenRouter API Key missing. Falling back to heuristics.');
      return categorizeInputHeuristic(text);
    }

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "Workspace Personal"
        },
        body: JSON.stringify({
          model: "openrouter/free",
          messages: [
            {
              role: "system",
              content: `Eres un asistente de productividad experto. Clasifica la entrada en: 'compras', 'tareas' o 'ideas'. 
              
              REGLAS DE MÓDULO:
              1. 'compras': Adquisición de bienes. Elige subcategoría: 
                 - 'supermercado': Alimentos, limpieza hogar, artículos generales.
                 - 'farmacia': Salud, higiene personal, medicamentos.
                 - 'internet': Electrónica, tecnología, software, viajes, servicios digitales.
                 - 'otros': Vehículos, muebles, otros.
              2. 'tareas': Acciones, compromisos, recordatorios.
              3. 'ideas': Notas, reflexiones, proyectos futuros.
              
              LIMPIEZA DE TÍTULO:
              - Crea un título conciso y elegante.
              - NO incluyas frases de relleno como "con mis amigos", "por favor" o "un rato".
              - Para COMPRAS: Quita el verbo (ej: "Comprar leche" -> "Leche").
              - Para TAREAS: MANTÉN el verbo de acción principal pero quita el comando (ej: "Recordar jugar a la pelota con amigos" -> "Jugar a la pelota").
              - Corrige errores menores de plural/singular o concordancia.
              - IMPORTANTE: Poner la primera letra en mayúscula.
              
              RESPUESTA:
              - ÚNICAMENTE JSON: {"module": "compras|tareas|ideas", "subcat": "supermercado|farmacia|internet|otros", "title": "..."}`
            },
            { role: "user", content: text }
          ]
        })
      });

      const data = await response.json();
      const content = data.choices[0].message.content;
      const jsonMatch = content.match(/\{.*\}/s);
      const result = JSON.parse(jsonMatch ? jsonMatch[0] : content);
      result.title = capitalizeFirstLetter(result.title);
      return result;
    } catch (e) {
      console.error('LLM Categorization failed:', e);
      return categorizeInputHeuristic(text);
    }
  }

  function categorizeInputHeuristic(text) {
    const t = text.toLowerCase();
    const farmaciaKeywords = ['pasta de dientes', 'cepillo', 'remedio', 'aspirina', 'paracetamol', 'shampoo', 'jabón', 'crema', 'farmacia', 'medicamento'];
    const internetKeywords = ['cable', 'router', 'wifi', 'pila', 'batería', 'cargador', 'tinta', 'vuelo', 'pasaje', 'ticket', 'boleto', 'reserva', 'netflix', 'spotify', 'amazon', 'suscripción', 'mouse', 'teclado'];

    if (t.includes('comprar') || t.includes('traer') || t.includes('falta') || t.includes('necesito en') || t.includes('lista de')) {
      let subcat = 'otros'; // Default fallback
      if (farmaciaKeywords.some(k => t.includes(k))) subcat = 'farmacia';
      else if (internetKeywords.some(k => t.includes(k))) subcat = 'internet';
      else if (['comida', 'leche', 'pan', 'fruta'].some(k => t.includes(k))) subcat = 'supermercado';
      
      return { module: 'compras', subcat, title: cleanVoiceText(text) };
    }
    
    const actionVerbs = ['darle', 'alimentar', 'sacar', 'limpiar', 'arreglar', 'pagar', 'ir a', 'llamar', 'enviar', 'escribir a'];
    if (t.includes('tengo que') || t.includes('debo') || t.includes('recordar') || t.includes('pendiente') || 
        actionVerbs.some(v => t.startsWith(v) || t.includes(' ' + v))) {
      return { module: 'tareas', subcat: 'media', title: cleanVoiceText(text) };
    }
    
    return { module: 'ideas', subcat: null, title: cleanVoiceText(text) };
  }

  function cleanVoiceText(text) {
    const prefixes = [
      'comprar', 'traer', 'necesito', 'falta', 'lista de', 
      'tengo que', 'debo', 'recordar', 'poner', 'anotar',
      'un ', 'una ', 'unos ', 'unas ', 'el ', 'la '
    ];

    let cleaned = text;
    let changed = true;
    while (changed) {
      changed = false;
      const lowerCleaned = cleaned.toLowerCase().trim();
      for (const p of prefixes) {
        if (lowerCleaned.startsWith(p)) {
          cleaned = cleaned.trim().slice(p.length).trim();
          changed = true;
        }
      }
    }
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  async function processVoiceCapture(text) {
    const statusEl = document.querySelector('.voice-status');
    const overlay = document.getElementById('voice-overlay');
    
    if (statusEl) statusEl.textContent = 'Analizando con IA...';
    overlay.classList.add('analyzing');

    const result = await categorizeWithLLM(text);
    const items = result.items || [{ module: result.module, subcat: result.subcat, title: result.title }];
    let addedCount = 0;
    let mainModule = '';

    try {
      for (const { module, subcat, title } of items) {
        if (!title) continue;
        mainModule = module;
        
        if (module === 'compras') {
          await addDoc(collections.compras, {
            nombre: title,
            categoria: subcat || 'supermercado',
            completado: false,
            creadoEn: serverTimestamp(),
            userId: appState.userId
          });
        } else if (module === 'tareas') {
          await addDoc(collections.tareas, {
            titulo: title,
            prioridad: subcat || 'media',
            fechaLimite: null,
            notas: '',
            completado: false,
            creadoEn: serverTimestamp(),
            userId: appState.userId
          });
        } else {
          await addDoc(collections.ideas, {
            titulo: title,
            notas: '',
            archivada: false,
            creadoEn: serverTimestamp(),
            userId: appState.userId
          });
        }
        addedCount++;
      }

      let message = '';
      if (addedCount === 1) {
        if (mainModule === 'compras') message = `Añadido a Compras (${getCategoryLabel(items[0].subcat)})`;
        else if (mainModule === 'tareas') message = 'Añadido a Tareas';
        else message = 'Capturado como Idea';
      } else {
        message = `${addedCount} elementos añadidos`;
      }

      overlay.classList.remove('analyzing');
      overlay.classList.remove('active');
      showVoiceToast(message, text, mainModule, null);
      switchTab(mainModule);
    } catch (err) {
      console.error('Error processing voice capture:', err);
      showToast('Error al guardar captura de voz', 'error');
      overlay.classList.remove('analyzing');
      overlay.classList.remove('active');
    }
  }

  async function moveItem(itemId, fromCategory, toCategory) {
    let item = null;
    
    // Find item data from current state
    if (fromCategory === 'compras') {
      item = appState.compras.items.find(i => i.id === itemId);
    } else if (fromCategory === 'tareas') {
      item = appState.tareas.items.find(i => i.id === itemId);
    } else {
      item = appState.ideas.items.find(i => i.id === itemId);
    }

    if (!item) return;

    try {
      // 1. Delete from source collection
      await deleteDoc(doc(db, fromCategory, itemId));

      // 2. Add to destination collection
      const text = item.nombre || item.titulo;
      if (toCategory === 'compras') {
        await addDoc(collections.compras, {
          nombre: text,
          categoria: 'supermercado',
          completado: false,
          creadoEn: serverTimestamp(),
          userId: appState.userId
        });
      } else if (toCategory === 'tareas') {
        await addDoc(collections.tareas, {
          titulo: text,
          prioridad: 'media',
          fechaLimite: null,
          notas: '',
          completado: false,
          creadoEn: serverTimestamp(),
          userId: appState.userId
        });
      } else {
        await addDoc(collections.ideas, {
          titulo: text,
          notas: '',
          archivada: false,
          creadoEn: serverTimestamp(),
          userId: appState.userId
        });
      }
      showToast(`Movido a ${toCategory.charAt(0).toUpperCase() + toCategory.slice(1)}`, 'success');
    } catch (err) {
      console.error('Error moving item:', err);
      showToast('Error al mover el elemento', 'error');
    }
  }

  function showVoiceToast(message, originalText, category, itemId) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast voice-success';
    toast.style.flexDirection = 'column';
    toast.style.alignItems = 'flex-start';
    toast.style.gap = '4px';
    
    const otherCategories = ['compras', 'ideas', 'tareas'].filter(c => c !== category);
    
    toast.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; width:100%;">
        <span class="toast-icon"><svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none"><path d="M20 6L9 17l-5-5"/></svg></span>
        <span class="toast-message" style="font-weight:600;">${message}</span>
      </div>
      <div style="font-size:11px; color:var(--text-secondary); padding-left:26px; font-style:italic;">"${originalText}"</div>
      <div style="display:flex; gap:12px; padding-left:26px; margin-top:4px;">
        <button class="toast-action-btn" data-action="undo" style="background:none; border:none; color:var(--accent-primary); font-size:11px; font-weight:700; cursor:pointer; padding:0;">DESHACER</button>
        <button class="toast-action-btn" data-action="change" style="background:none; border:none; color:var(--text-secondary); font-size:11px; font-weight:700; cursor:pointer; padding:0;">CAMBIAR</button>
      </div>
      <div class="category-selector" style="display:none; gap:8px; padding-left:26px; margin-top:8px;">
        ${otherCategories.map(c => `<button class="cat-btn" data-cat="${c}" style="background:var(--bg-tertiary); border:1px solid var(--border-subtle); border-radius:4px; color:var(--text-primary); font-size:10px; padding:4px 8px; cursor:pointer;">${c.toUpperCase()}</button>`).join('')}
      </div>
    `;
    
    container.appendChild(toast);

    toast.querySelector('[data-action="undo"]').addEventListener('click', async () => {
      try {
        await deleteDoc(doc(db, category, itemId));
        toast.remove();
        showToast('Captura eliminada', 'success');
      } catch (err) {
        console.error('Error undoing capture:', err);
        showToast('Error al deshacer', 'error');
      }
    });

    const changeBtn = toast.querySelector('[data-action="change"]');
    const selector = toast.querySelector('.category-selector');
    
    changeBtn.addEventListener('click', () => {
      selector.style.display = selector.style.display === 'none' ? 'flex' : 'none';
    });

    selector.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const toCat = btn.dataset.cat;
        moveItem(itemId, category, toCat);
        toast.remove();
      });
    });

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'toastOut 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        setTimeout(() => toast.remove(), 400);
      }
    }, 8000); // Increased timeout to give time for manual change
  }

  function init() {
    onAuthStateChanged(auth, (user) => {
      appState.user = user;
      appState.userId = user ? user.uid : null;
      appState.authLoading = false;

      if (user) {
        hideLoginScreen();
        updateHeaderForUser(user);
        initFirestoreSync();
        initVoiceCapture();
        const hash = window.location.hash.substring(1);
        const initialTab = ['compras', 'ideas', 'tareas'].includes(hash) ? hash : 'compras';
        switchTab(initialTab);
      } else {
        showLoginScreen();
        updateHeaderForUser(null);
        appState.compras.items = [];
        appState.ideas.items = [];
        appState.tareas.items = [];
        const hash = window.location.hash.substring(1);
        const initialTab = ['compras', 'ideas', 'tareas'].includes(hash) ? hash : 'compras';
        switchTab(initialTab);
      }
    });

    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        if (item.dataset.tab === 'ideas' && isLongPress) {
          return;
        }
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
