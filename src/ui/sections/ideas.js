import { appState, notify } from '../../store.js';
import { sortIdeasItems } from '../../utils/sorting.js';
import { renderActionInput } from '../components/helpers.js';
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';
import { handlePressStart, handlePressEnd, handlePressMove } from '../components/titleEditor.js';
import { addItem, deleteItem, toggleCompleted, updateNotes, updateItemField, reorderItem } from '../../services/dataService.js';
import { handleSelectionStart, handleSelectionEnd, renderSelectionBar, clearSelection, isSelectionActive, removeFromSelection, toggleSelection, handleClickOutside, handleSelectionMove } from '../components/multiSelect.js';
import { initSortable } from '../components/sortable.js';

let pressTimer = { value: null };

export function renderIdeasSection() {
  const section = document.getElementById('ideas-section');
  if (!section) return;

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
      ${appState.ideas.loading && sorted.length === 0 ? `
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
      ` : ''}
      ${sorted.length === 0 && !(appState.ideas.loading && sorted.length === 0) ? `
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
      const noAnimateClass = appState.ideas.hasRendered ? 'no-animate' : '';
      card.className = `item-card idea ${idea.archivada ? 'completed' : ''} ${noAnimateClass}`.trim();
      card.dataset.id = idea.id;

      const expandIcon = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M6 9l6 6 6-6"/></svg>`;
      const saveIcon = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`;

      card.innerHTML = `
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
        <div class="checkbox-hitbox" data-id="${idea.id}">
          <div class="checkbox ${idea.archivada ? 'checked' : ''}">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
        </div>
        <div class="item-content">
          <div class="item-row">
            <span class="item-text"></span>
            <div class="item-actions-group">
              <button class="btn-icon priority-toggle-btn ${idea.prioridad ? 'active' : ''}" data-id="${idea.id}" title="${idea.prioridad ? 'Quitar prioridad' : 'Destacar'}">
                <svg viewBox="0 0 24 24" fill="${idea.prioridad ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              </button>
              <button class="btn-icon delete-btn" data-id="${idea.id}" title="Eliminar idea">
                <svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
              <button class="btn-icon expand-indicator-btn" title="Expandir/Contraer">
                ${expandIcon}
              </button>
            </div>
          </div>
          <div class="idea-notes-row">
            <textarea data-id="${idea.id}" placeholder="Desarrolla tu idea aquí..."></textarea>
            <button class="btn-icon btn-icon--primary save-idea-btn icon-only" data-id="${idea.id}" title="Guardar cambios">
              ${saveIcon}
            </button>
          </div>
        </div>
      `;

      // Safely set user-provided content
      card.querySelector('.item-text').textContent = idea.titulo || '';
      card.querySelector('textarea').value = idea.notes || idea.notas || '';
      
      list.appendChild(card);
    });

    if (appState.ideas.hasMore) {
      const loadMoreContainer = document.createElement('div');
      loadMoreContainer.style.cssText = 'display: flex; justify-content: center; padding: 16px 0 32px;';
      loadMoreContainer.innerHTML = `
        <button id="ideas-load-more-btn" class="modal-btn secondary" style="width: 100%; max-width: 200px;">Cargar más</button>
      `;
      list.appendChild(loadMoreContainer);
    }
  }

  // After rendering, mark section as rendered to skip animations on subsequent visits
  if (!appState.ideas.hasRendered) {
    appState.ideas.hasRendered = true;
  }

  // Initialize gesture reordering
  initSortable('ideas-list', 'ideas', () => {
    const { items, searchQuery } = appState.ideas;
    let filtered = items;
    if (searchQuery) {
      filtered = items.filter(idea => 
        (idea.titulo && idea.titulo.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (idea.notas && idea.notas.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    return sortIdeasItems(filtered);
  });

  attachIdeasEvents();
}

function attachIdeasEvents() {
  const titleInput = document.getElementById('idea-title-input');
  const addBtn = document.getElementById('idea-title-input-btn');
  const list = document.getElementById('ideas-list');

  const handleAdd = async () => {
    const titulo = titleInput.value.trim();
    if (!titulo) return;
    if (await addItem('ideas', { titulo, notas: '', prioridad: false, archivada: false })) {
        titleInput.value = '';
        showToast('Idea capturada', 'success');
    }
  };

  addBtn.addEventListener('click', handleAdd);
  titleInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleAdd(); });

  const loadMoreBtn = document.getElementById('ideas-load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', async () => {
      const { loadMoreItems } = await import('../../services/firebaseSync.js');
      loadMoreItems('ideas');
    });
  }

  list.addEventListener('click', async (e) => {
    const checkbox = e.target.closest('.checkbox-hitbox');
    const deleteBtn = e.target.closest('.delete-btn');
    const priorityToggleBtn = e.target.closest('.priority-toggle-btn');
    const expandBtn = e.target.closest('.expand-indicator-btn') || e.target.closest('.item-row') || e.target.closest('.item-text');
    const saveBtn = e.target.closest('.save-idea-btn');
    const card = e.target.closest('.item-card');

    // Handle click selection when in selection mode
    if (appState.ideas.selectedItems.size > 0 && card) {
      const id = card.dataset.id;
      toggleSelection('ideas', id);
      return;
    }

    if (priorityToggleBtn) {
      const id = priorityToggleBtn.dataset.id;
      const item = appState.ideas.items.find(i => i.id === id);
      if (item) {
        if (await updateItemField(id, 'ideas', 'prioridad', !item.prioridad)) {
          showToast('Prioridad actualizada', 'success');
        }
      }
    }
    
    if (checkbox) {
      const id = checkbox.dataset.id;
      const idea = appState.ideas.items.find(i => i.id === id);
      if (idea) toggleCompleted(id, 'ideas', idea.archivada);
    }

    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      showModal('Eliminar idea', '<p>¿Estás seguro de que quieres eliminar esta idea?</p>', [
        { label: 'Cancelar', action: 'cancel', primary: false },
        { label: 'Eliminar', action: 'delete', primary: true }
      ], (action) => {
        if (action === 'delete') {
          deleteItem(id, 'ideas');
          removeFromSelection('ideas', id);
        }
      });
    }

    if (saveBtn) {
      const id = saveBtn.dataset.id;
      const cardEl = saveBtn.closest('.item-card');
      const textarea = cardEl.querySelector('textarea');
      const sync = cardEl.querySelector('.sync-indicator');
      const notes = textarea.value;

      if (await updateNotes(id, 'ideas', notes)) {
        sync.classList.add('visible');
        setTimeout(() => sync.classList.remove('visible'), 2000);
        showToast('Notas guardadas', 'success');
      }
    }

    if (expandBtn && !e.target.closest('.checkbox-hitbox') && !e.target.closest('.delete-btn') && !e.target.closest('.save-idea-btn') && !e.target.closest('.priority-toggle-btn') && !e.target.closest('textarea') && !e.target.closest('.is-editing')) {
      const cardEl = expandBtn.closest('.item-card');
      list.querySelectorAll('.item-card.expanded').forEach(c => {
        if (c !== cardEl) c.classList.remove('expanded');
      });
      cardEl.classList.toggle('expanded');
    }
  });

  // Click outside to exit selection mode
  document.addEventListener('click', (e) => handleClickOutside(e, 'ideas'));

  list.addEventListener('mousedown', (e) => handlePressStart(e, 'ideas', pressTimer));
  list.addEventListener('touchstart', (e) => handlePressStart(e, 'ideas', pressTimer), { passive: true });
  list.addEventListener('mousemove', (e) => handlePressMove(e, pressTimer));
  list.addEventListener('touchmove', (e) => handlePressMove(e, pressTimer), { passive: true });
  list.addEventListener('mouseup', () => handlePressEnd(pressTimer));
  list.addEventListener('mouseleave', () => handlePressEnd(pressTimer));
  list.addEventListener('touchend', () => handlePressEnd(pressTimer));

  // Selection mode (long-press)
  list.addEventListener('mousedown', (e) => handleSelectionStart(e, 'ideas'));
  list.addEventListener('touchstart', (e) => handleSelectionStart(e, 'ideas'), { passive: true });
  list.addEventListener('mousemove', (e) => handleSelectionMove(e));
  list.addEventListener('touchmove', (e) => handleSelectionMove(e), { passive: true });
  list.addEventListener('mouseup', handleSelectionEnd);
  list.addEventListener('mouseleave', handleSelectionEnd);
  list.addEventListener('touchend', handleSelectionEnd);

  // Restore selection state on items
  list.querySelectorAll('.item-card').forEach(card => {
    if (appState.ideas.selectedItems.has(card.dataset.id)) {
      card.classList.add('selected');
    }
  });

  // Toggle selection mode class on list
  if (appState.ideas.selectionMode || appState.ideas.selectedItems.size > 0) {
    list.classList.add('selection-mode-active');
  } else {
    list.classList.remove('selection-mode-active');
  }

  // Render selection bar if active
  if (isSelectionActive('ideas')) {
    renderSelectionBar('ideas');
  }
}
