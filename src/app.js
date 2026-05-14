import { 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  query,
  orderBy
} from "firebase/firestore";
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
  const COMPRAS_FILTERS = ['todas', 'supermercado', 'internet', 'farmacia', 'otros'];
  const TAREA_FILTERS = ['todas', 'pendientes', 'completadas'];

  const appState = {
    activeTab: 'compras',
    compras: {
      items: [],
      filter: 'todas',
      newItemCategory: 'todas'
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

  // --- Firebase Real-time Sync ---

  function initFirestoreSync() {
    // Sync Compras
    const qCompras = query(collections.compras, orderBy("creadoEn", "desc"));
    onSnapshot(qCompras, (snapshot) => {
      appState.compras.items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        creadoEn: doc.data().creadoEn?.toMillis() || Date.now()
      }));
      if (appState.activeTab === 'compras') renderComprasSection();
    });

    // Sync Ideas
    const qIdeas = query(collections.ideas, orderBy("creadoEn", "desc"));
    onSnapshot(qIdeas, (snapshot) => {
      appState.ideas.items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        creadoEn: doc.data().creadoEn?.toMillis() || Date.now()
      }));
      if (appState.activeTab === 'ideas') renderIdeasSection();
    });

    // Sync Tareas
    const qTareas = query(collections.tareas, orderBy("creadoEn", "desc"));
    onSnapshot(qTareas, (snapshot) => {
      appState.tareas.items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        creadoEn: doc.data().creadoEn?.toMillis() || Date.now(),
        fechaLimite: doc.data().fechaLimite // Already a number or null
      }));
      if (appState.activeTab === 'tareas') renderTareasSection();
    });
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

  function filterComprasItems(items, filter) {
    if (filter === 'todas') return items;
    return items.filter(item => item.categoria === filter);
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
    const { items, filter } = appState.compras;

    const filtered = filterComprasItems(items, filter);
    const sorted = sortComprasItems(filtered);

    const totalItems = items.length;
    const completedItems = items.filter(i => i.completado).length;

    section.innerHTML = `
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-value">${totalItems}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat-item completed">
          <span class="stat-value">${completedItems}</span>
          <span class="stat-label">Hecho</span>
        </div>
        <div class="stat-item pending">
          <span class="stat-value">${totalItems - completedItems}</span>
          <span class="stat-label">Pendiente</span>
        </div>
      </div>

      <div class="input-wrapper">
        ${renderActionInput('compras-input', 'Añadir producto...')}
      </div>

      <div class="filter-wrapper">
        <div class="filter-chips compras">
          ${COMPRAS_FILTERS.map(f => `<button class="chip ${filter === f ? 'active' : ''}" data-filter="${f}">${f === 'todas' ? 'Todas' : getCategoryLabel(f)}</button>`).join('')}
        </div>
      </div>

      <div class="items-list" id="compras-list">
        ${sorted.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">
              <svg viewBox="0 0 24 24"><path d="M3 3h18v18H3zM9 21V9h6v12M9 9h6M9 9v0M15 9v0" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <h3 class="empty-title">Lista vacía</h3>
            <p class="empty-text">Añade productos a tu lista de compras</p>
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
    const input = document.getElementById('compras-input');
    const addBtn = document.getElementById('compras-input-btn');
    const list = document.getElementById('compras-list');
    const filterChips = document.querySelectorAll('.filter-chips.compras .chip');

    const addItem = async () => {
      const nombre = input.value.trim();
      if (!nombre) return;

      const categoria = appState.compras.filter === 'todas' ? 'supermercado' : appState.compras.filter;

      try {
        await addDoc(collections.compras, {
          nombre,
          categoria,
          completado: false,
          creadoEn: serverTimestamp()
        });
        input.value = '';
        showToast('Producto añadido', 'success');
      } catch (err) {
        showToast('Error al añadir producto', 'error');
      }
    };

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
        await updateDoc(doc(db, type, id), { nombre: newTitle });
        showToast('Título actualizado', 'success');
      } catch (err) {
        showToast('Error al actualizar', 'error');
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
              <svg viewBox="0 0 24 24"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke-linecap="round" stroke-linejoin="round"/></svg>
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

    const addIdea = async () => {
      const titulo = titleInput.value.trim();
      if (!titulo) return;

      try {
        await addDoc(collections.ideas, {
          titulo,
          notas: '',
          archivada: false,
          creadoEn: serverTimestamp()
        });
        titleInput.value = '';
        showToast('Idea capturada', 'success');
      } catch (err) {
        showToast('Error al guardar idea', 'error');
      }
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

        saveBtn.disabled = true;
        const originalIcon = saveBtn.innerHTML;
        saveBtn.innerHTML = '<svg class="spinner" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" style="animation: spin 1s linear infinite;"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>';

        try {
          await updateDoc(doc(db, "ideas", id), { notas: notes });
          saveBtn.innerHTML = originalIcon;
          saveBtn.disabled = false;
          
          sync.classList.add('visible');
          setTimeout(() => sync.classList.remove('visible'), 2000);
        } catch (err) {
          showToast('Error al guardar', 'error');
          saveBtn.innerHTML = originalIcon;
          saveBtn.disabled = false;
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
      
      try {
        await updateDoc(doc(db, "ideas", id), { titulo: newTitle });
        showToast('Título actualizado', 'success');
      } catch (err) {
        showToast('Error al actualizar', 'error');
      }
    }
  }

  async function toggleArchiveIdea(id) {
    const idea = appState.ideas.items.find(i => i.id === id);
    if (idea) {
      try {
        await updateDoc(doc(db, "ideas", id), {
          archivada: !idea.archivada
        });
        showToast(!idea.archivada ? 'Idea archivada' : 'Idea restaurada', !idea.archivada ? 'success' : 'revert');
      } catch (err) {
        showToast('Error al archivar', 'error');
      }
    }
  }

  function deleteIdea(id) {
    showModal('Eliminar idea', '<p>¿Estás seguro de que quieres eliminar esta idea?</p>', [
      { label: 'Cancelar', action: 'cancel', primary: false },
      { label: 'Eliminar', action: 'delete', primary: true }
    ]).addEventListener('click', async (e) => {
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        const action = actionBtn.dataset.action;
        if (action === 'delete') {
          try {
            await deleteDoc(doc(db, "ideas", id));
            showToast('Idea eliminada', 'info');
          } catch (err) {
            showToast('Error al eliminar', 'error');
          }
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
              <div class="task-meta-inline" style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                <span class="badge badge-priority ${tarea.prioridad}">${getPriorityLabel(tarea.prioridad)}</span>
                ${tarea.fechaLimite ? `
                  <span class="badge-date">
                    <svg viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    ${formatDate(tarea.fechaLimite)}
                  </span>
                ` : ''}
              </div>
              <button class="expand-indicator-btn" style="background:transparent; border:none; color:var(--text-tertiary); display:flex; padding:0;">
                ${expandIcon}
              </button>
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
            </div>
          </div>
          <div class="item-actions">
            <button class="delete-btn" data-id="${tarea.id}">
              <svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button class="save-task-btn icon-only" data-id="${tarea.id}" title="Guardar cambios">
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

    attachTareasEvents();
  }

  function attachTareasEvents() {
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
          creadoEn: serverTimestamp()
        });
        input.value = '';
        showToast('Tarea añadida', 'success');
      } catch (err) {
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
      const checkbox = e.target.closest('.checkbox');
      const deleteBtn = e.target.closest('.delete-btn');
      const expandBtn = e.target.closest('.expand-indicator-btn') || e.target.closest('.item-row');
      const saveBtn = e.target.closest('.save-task-btn');

      if (checkbox) {
        const id = checkbox.dataset.id;
        const tarea = appState.tareas.items.find(i => i.id === id);
        if (tarea) {
          try {
            await updateDoc(doc(db, "tareas", id), {
              completado: !tarea.completado
            });
            showToast(!tarea.completado ? 'Tarea completada' : 'Tarea pendiente', !tarea.completado ? 'success' : 'revert');
          } catch (err) {
            showToast('Error al actualizar', 'error');
          }
        }
      }

      if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        showModal('Eliminar tarea', '<p>¿Estás seguro de que quieres eliminar esta tarea?</p>', [
          { label: 'Cancelar', action: 'cancel', primary: false },
          { label: 'Eliminar', action: 'delete', primary: true }
        ]).addEventListener('click', async (e) => {
          const actionBtn = e.target.closest('[data-action]');
          if (actionBtn) {
            const action = actionBtn.dataset.action;
            if (action === 'delete') {
              try {
                await deleteDoc(doc(db, "tareas", id));
                showToast('Tarea eliminada', 'info');
              } catch (err) {
                showToast('Error al eliminar', 'error');
              }
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

        saveBtn.disabled = true;
        const originalIcon = saveBtn.innerHTML;
        saveBtn.innerHTML = '<svg class="spinner" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" style="animation: spin 1s linear infinite;"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>';

        try {
          await updateDoc(doc(db, "tareas", id), { notas: notas });
          saveBtn.innerHTML = originalIcon;
          saveBtn.disabled = false;
          
          sync.classList.add('visible');
          setTimeout(() => sync.classList.remove('visible'), 2000);
        } catch (err) {
          showToast('Error al guardar', 'error');
          saveBtn.innerHTML = originalIcon;
          saveBtn.disabled = false;
        }
      }
    });

    list.addEventListener('change', async (e) => {
      const prioritySelect = e.target.closest('.priority-select');
      const dateInput = e.target.closest('.studio-date-input');

      if (prioritySelect) {
        const id = prioritySelect.dataset.id;
        const newPriority = prioritySelect.value;

        try {
          await updateDoc(doc(db, "tareas", id), { prioridad: newPriority });
          showToast('Prioridad actualizada', 'success');
        } catch (err) {
          showToast('Error al actualizar prioridad', 'error');
        }
      }

      if (dateInput) {
        const card = dateInput.closest('.item-card');
        const id = card.dataset.id;
        const newFechaLimite = dateInput.value ? new Date(dateInput.value).getTime() : null;

        try {
          await updateDoc(doc(db, "tareas", id), { fechaLimite: newFechaLimite });
          showToast('Fecha actualizada', 'success');
        } catch (err) {
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
        await updateDoc(doc(collections.tareas, id), { titulo: newTitle });
        showToast('Título actualizado', 'success');
      } catch (err) {
        showToast('Error al actualizar', 'error');
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
    initFirestoreSync();

    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        switchTab(item.dataset.tab);
        window.location.hash = item.dataset.tab;
      });
    });

    const hash = window.location.hash.substring(1);
    const initialTab = ['compras', 'ideas', 'tareas'].includes(hash) ? hash : 'compras';
    switchTab(initialTab);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
