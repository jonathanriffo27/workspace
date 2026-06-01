import { appState, notify } from '../../store.js';
import { formatDate } from '../../utils/formatting.js';
import { sortTareasItems } from '../../utils/sorting.js';
import { renderActionInput } from '../components/helpers.js';
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';
import { handlePressStart, handlePressEnd, handlePressMove } from '../components/titleEditor.js';
import { addItem, deleteItem, toggleCompleted, updateNotes, updateTaskMeta, updateItemField, reorderItem } from '../../services/dataService.js';
import { handleSelectionStart, handleSelectionEnd, renderSelectionBar, clearSelection, isSelectionActive, removeFromSelection, toggleSelection, handleClickOutside, handleSelectionMove } from '../components/multiSelect.js';
import { initSortable } from '../components/sortable.js';

let pressTimer = { value: null };

export function renderTareasSection() {
  const section = document.getElementById('tareas-section');
  if (!section) return;

  const { items, filter } = appState.tareas;
  
  const filtered = filter === 'todas' ? items.filter(i => !i.archivada) : 
                   filter === 'pendientes' ? items.filter(i => !i.completado && !i.archivada) : 
                   items.filter(i => i.archivada);
  const sorted = sortTareasItems(filtered);

  const totalTareas = items.filter(i => !i.archivada).length;
  const archivedTareas = items.filter(i => i.archivada).length;
  const pendingTareas = items.filter(i => !i.completado && !i.archivada).length;

  section.innerHTML = `
    <div class="stats-bar">
      <div class="stat-item ${filter === 'todas' ? 'active' : ''}" data-filter="todas">
        <span class="stat-value">${totalTareas}</span>
        <span class="stat-label">Total</span>
      </div>
      <div class="stat-item completed ${filter === 'archivadas' ? 'active' : ''}" data-filter="archivadas">
        <span class="stat-value">${archivedTareas}</span>
        <span class="stat-label">Hecho</span>
      </div>
      <div class="stat-item pending ${filter === 'pendientes' ? 'active' : ''}" data-filter="pendientes">
        <span class="stat-value">${pendingTareas}</span>
        <span class="stat-label">Pendiente</span>
      </div>
    </div>

    <div class="input-wrapper">
      ${renderActionInput('tarea-input', 'Escribe una nueva tarea...')}
    </div>

    <div class="items-list" id="tareas-list">
      ${appState.tareas.loading && sorted.length === 0 ? `
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
      ${sorted.length === 0 && !(appState.tareas.loading && sorted.length === 0) ? `
        <div class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <h3 class="empty-title">${filter === 'archivadas' ? 'Sin tareas archivadas' : 'Sin tareas'}</h3>
          <p class="empty-text">${filter === 'archivadas' ? 'Las tareas completadas se archivarán automáticamente' : 'Añade tus tareas pendientes para empezar'}</p>
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
      const noAnimateClass = appState.tareas.hasRendered ? 'no-animate' : '';
      card.className = `item-card task ${tarea.completado ? 'completed' : ''} ${noAnimateClass}`.trim();
      card.dataset.id = tarea.id;
      
      const fechaLimiteValue = tarea.fechaLimite ? new Date(tarea.fechaLimite).toISOString().split('T')[0] : '';
      
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
        <div class="checkbox-hitbox" data-id="${tarea.id}">
          <div class="checkbox ${tarea.completado ? 'checked' : ''}">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
        </div>
        <div class="item-content">
          <div class="item-row">
            <span class="item-text"></span>
            <div class="task-meta-expand-wrapper">
              <div class="item-actions-group">
                ${tarea.fechaLimite ? `
                  <span class="badge-date">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    ${formatDate(tarea.fechaLimite)}
                  </span>
                ` : ''}
                <button class="btn-icon priority-toggle-btn ${tarea.prioridad ? 'active' : ''}" data-id="${tarea.id}" title="${tarea.prioridad ? 'Quitar prioridad' : 'Destacar tarea'}">
                  <svg viewBox="0 0 24 24" fill="${tarea.prioridad ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                </button>
              </div>
              <div class="item-actions-group">
                <button class="btn-icon expand-indicator-btn" title="Expandir/Contraer">
                  ${expandIcon}
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
                    <input type="date" class="studio-date-input" value="${fechaLimiteValue}">
                  </div>
                  <button class="btn-icon delete-btn" data-id="${tarea.id}" title="Eliminar tarea">
                    <svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                  <button class="btn-icon btn-icon--primary save-task-btn icon-only" data-id="${tarea.id}" title="Guardar cambios">
                    ${saveIcon}
                  </button>
                  <div class="sync-indicator" title="Sincronizado">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Safely set user-provided content
      card.querySelector('.item-text').textContent = tarea.titulo || '';
      card.querySelector('textarea').value = tarea.notas || '';
 
      list.appendChild(card);
    });

    if (appState.tareas.hasMore) {
      const loadMoreContainer = document.createElement('div');
      loadMoreContainer.style.cssText = 'display: flex; justify-content: center; padding: 16px 0 32px;';
      loadMoreContainer.innerHTML = `
        <button id="tareas-load-more-btn" class="modal-btn secondary" style="width: 100%; max-width: 200px;">Cargar más</button>
      `;
      list.appendChild(loadMoreContainer);
    }
  }

  // After rendering, mark section as rendered to skip animations on subsequent visits
  if (!appState.tareas.hasRendered) {
    appState.tareas.hasRendered = true;
  }

  initSortable('tareas-list', 'tareas', () => {
    const { items, filter } = appState.tareas;
    const filtered = filter === 'todas' ? items : 
                     filter === 'pendientes' ? items.filter(i => !i.completado) : 
                     items.filter(i => i.completado);
    return sortTareasItems(filtered);
  });

  attachTareasEvents();
}

function attachTareasEvents() {
  const input = document.getElementById('tarea-input');
  const addBtn = document.getElementById('tarea-input-btn');
  const list = document.getElementById('tareas-list');
  const statsBar = document.querySelector('#tareas-section .stats-bar');

  const handleAdd = async () => {
    const titulo = input.value.trim();
    if (!titulo) return;
    if (await addItem('tareas', { titulo, prioridad: null, fechaLimite: null, notas: '', completado: false })) {
        input.value = '';
        showToast('Tarea añadida', 'success');
    }
  };

  addBtn.addEventListener('click', handleAdd);
  input.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleAdd(); });

  const loadMoreBtn = document.getElementById('tareas-load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', async () => {
      const { loadMoreItems } = await import('../../services/firebaseSync.js');
      loadMoreItems('tareas');
    });
  }

  statsBar.addEventListener('click', (e) => {
    const statItem = e.target.closest('.stat-item');
    if (statItem) {
      appState.tareas.filter = statItem.dataset.filter;
      renderTareasSection();
    }
  });

  list.addEventListener('click', async (e) => {
    const checkbox = e.target.closest('.checkbox-hitbox');
    const deleteBtn = e.target.closest('.delete-btn');
    const expandBtn = e.target.closest('.expand-indicator-btn') || e.target.closest('.item-row') || e.target.closest('.item-text');
    const saveBtn = e.target.closest('.save-task-btn');
    const priorityToggleBtn = e.target.closest('.priority-toggle-btn');
    const card = e.target.closest('.item-card');

    // Handle click selection when in selection mode
    if (appState.tareas.selectedItems.size > 0 && card) {
      const id = card.dataset.id;
      toggleSelection('tareas', id);
      return;
    }

    if (checkbox) {
      const id = checkbox.dataset.id;
      const tarea = appState.tareas.items.find(i => i.id === id);
      if (tarea) toggleCompleted(id, 'tareas', tarea.completado);
    }

    if (priorityToggleBtn) {
      const id = priorityToggleBtn.dataset.id;
      const tarea = appState.tareas.items.find(i => i.id === id);
      if (tarea) {
        if (await updateTaskMeta(id, { prioridad: !tarea.prioridad })) {
          showToast('Prioridad actualizada', 'success');
        }
      }
    }

    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      showModal('Eliminar tarea', '<p>¿Estás seguro de que quieres eliminar esta tarea?</p>', [
        { label: 'Cancelar', action: 'cancel', primary: false },
        { label: 'Eliminar', action: 'delete', primary: true }
      ], (action) => {
        if (action === 'delete') {
          deleteItem(id, 'tareas');
          removeFromSelection('tareas', id);
        }
      });
    }

    if (expandBtn && !e.target.closest('.checkbox-hitbox') && !e.target.closest('.delete-btn') && !e.target.closest('.save-task-btn') && !e.target.closest('.priority-toggle-btn') && !e.target.closest('.studio-date-input') && !e.target.closest('textarea') && !e.target.closest('.is-editing')) {
      const cardEl = expandBtn.closest('.item-card');
      list.querySelectorAll('.item-card.expanded').forEach(c => {
        if (c !== cardEl) c.classList.remove('expanded');
      });
      cardEl.classList.toggle('expanded');
    }

    if (saveBtn) {
      const id = saveBtn.dataset.id;
      const cardEl = saveBtn.closest('.item-card');
      const textarea = cardEl.querySelector('textarea');
      const sync = cardEl?.querySelector('.sync-indicator');
      const notas = textarea.value;

      if (await updateNotes(id, 'tareas', notas)) {
        if (sync) {
          sync.classList.add('visible');
          setTimeout(() => sync.classList.remove('visible'), 2000);
        }
        showToast('Notas guardadas', 'success');
      }
    }
  });

  // Click outside to exit selection mode
  document.addEventListener('click', (e) => handleClickOutside(e, 'tareas'));

  list.addEventListener('change', async (e) => {
    const dateInput = e.target.closest('.studio-date-input');

    if (dateInput) {
      const card = dateInput.closest('.item-card');
      const id = card.dataset.id;
      const newFechaLimite = dateInput.value ? new Date(dateInput.value).getTime() : null;
      if (await updateItemField(id, 'tareas', 'fechaLimite', newFechaLimite)) {
        showToast('Fecha actualizada', 'success');
      }
    }
  });

  list.addEventListener('mousedown', (e) => handlePressStart(e, 'tareas', pressTimer));
  list.addEventListener('touchstart', (e) => handlePressStart(e, 'tareas', pressTimer), { passive: true });
  list.addEventListener('mousemove', (e) => handlePressMove(e, pressTimer));
  list.addEventListener('touchmove', (e) => handlePressMove(e, pressTimer), { passive: true });
  list.addEventListener('mouseup', () => handlePressEnd(pressTimer));
  list.addEventListener('mouseleave', () => handlePressEnd(pressTimer));
  list.addEventListener('touchend', () => handlePressEnd(pressTimer));

  // Selection mode (long-press)
  list.addEventListener('mousedown', (e) => handleSelectionStart(e, 'tareas'));
  list.addEventListener('touchstart', (e) => handleSelectionStart(e, 'tareas'), { passive: true });
  list.addEventListener('mousemove', (e) => handleSelectionMove(e));
  list.addEventListener('touchmove', (e) => handleSelectionMove(e), { passive: true });
  list.addEventListener('mouseup', handleSelectionEnd);
  list.addEventListener('mouseleave', handleSelectionEnd);
  list.addEventListener('touchend', handleSelectionEnd);

  // Restore selection state on items
  list.querySelectorAll('.item-card').forEach(card => {
    if (appState.tareas.selectedItems.has(card.dataset.id)) {
      card.classList.add('selected');
    }
  });

  // Toggle selection mode class on list
  if (appState.tareas.selectionMode || appState.tareas.selectedItems.size > 0) {
    list.classList.add('selection-mode-active');
  } else {
    list.classList.remove('selection-mode-active');
  }

  // Render selection bar if active
  if (isSelectionActive('tareas')) {
    renderSelectionBar('tareas');
  }
}
