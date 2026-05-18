import { appState, notify, PRIORIDADES } from '../../store.js';
import { getPriorityLabel, formatDate } from '../../utils/formatting.js';
import { sortTareasItems } from '../../utils/sorting.js';
import { renderActionInput } from '../components/helpers.js';
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';
import { handlePressStart, handlePressEnd } from '../components/titleEditor.js';
import { addItem, deleteItem, toggleCompleted } from '../../services/dataService.js';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { handleSelectionStart, handleSelectionEnd, renderSelectionBar, clearSelection, isSelectionActive, removeFromSelection, toggleSelection, handleClickOutside } from '../components/multiSelect.js';

let pressTimer = { value: null };

export function renderTareasSection() {
  const section = document.getElementById('tareas-section');
  if (!section) return;

  const { items, filter } = appState.tareas;
  
  const filtered = filter === 'todas' ? items : 
                   filter === 'pendientes' ? items.filter(i => !i.completado) : 
                   items.filter(i => i.completado);
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
      ${renderActionInput('tarea-input', 'Nueva tarea...')}
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
              <div class="task-meta-inline" style="display: flex; align-items: center; gap: 16px; flex-shrink: 0;">
                ${tarea.fechaLimite ? `
                  <span class="badge-date">
                    <svg viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z"/></svg>
                    ${formatDate(tarea.fechaLimite)}
                  </span>
                ` : ''}
                <span class="badge badge-priority ${tarea.prioridad}">${getPriorityLabel(tarea.prioridad)}</span>
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
              <div class="task-notes-row">
                <textarea placeholder="Notas adicionales...">${tarea.notas || ''}</textarea>
                <button class="save-task-btn icon-only" data-id="${tarea.id}" title="Guardar cambios">
                  ${saveIcon}
                </button>
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

  const handleAdd = async () => {
    const titulo = input.value.trim();
    if (!titulo) return;
    if (await addItem('tareas', { titulo, prioridad: 'media', fechaLimite: null, notas: '', completado: false })) {
        input.value = '';
        showToast('Tarea añadida', 'success');
    }
  };

  addBtn.addEventListener('click', handleAdd);
  input.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleAdd(); });

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

    if (expandBtn && !e.target.closest('.checkbox') && !e.target.closest('.delete-btn') && !e.target.closest('.save-task-btn') && !e.target.closest('.item-text') && !e.target.closest('.priority-select') && !e.target.closest('.studio-date-input') && !e.target.closest('textarea')) {
      const cardEl = expandBtn.closest('.item-card');
      cardEl.classList.toggle('expanded');
    }

    if (saveBtn) {
      const id = saveBtn.dataset.id;
      const cardEl = saveBtn.closest('.item-card');
      const textarea = cardEl.querySelector('textarea');
      const sync = cardEl.querySelector('.sync-indicator');
      const notas = textarea.value;

      try {
        await updateDoc(doc(db, 'tareas', id), { notas: notas });
        sync.classList.add('visible');
        setTimeout(() => sync.classList.remove('visible'), 2000);
        showToast('Notas guardadas', 'success');
      } catch (err) {
        console.error('Error saving task notes:', err);
        showToast('Error al guardar notas', 'error');
      }
    }
  });

  // Click outside to exit selection mode
  document.addEventListener('click', (e) => handleClickOutside(e, 'tareas'));

  list.addEventListener('change', async (e) => {
    const prioritySelect = e.target.closest('.priority-select');
    const dateInput = e.target.closest('.studio-date-input');

    if (prioritySelect) {
      const id = prioritySelect.dataset.id;
      try {
        await updateDoc(doc(db, 'tareas', id), { prioridad: prioritySelect.value });
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
        await updateDoc(doc(db, 'tareas', id), { fechaLimite: newFechaLimite });
        showToast('Fecha actualizada', 'success');
      } catch (err) {
        console.error('Error updating date:', err);
        showToast('Error al actualizar fecha', 'error');
      }
    }
  });

  list.addEventListener('mousedown', (e) => handlePressStart(e, 'tareas', pressTimer));
  list.addEventListener('touchstart', (e) => handlePressStart(e, 'tareas', pressTimer), { passive: true });
  list.addEventListener('mouseup', () => handlePressEnd(pressTimer));
  list.addEventListener('mouseleave', () => handlePressEnd(pressTimer));
  list.addEventListener('touchend', () => handlePressEnd(pressTimer));

  // Selection mode (long-press)
  list.addEventListener('mousedown', (e) => handleSelectionStart(e, 'tareas'));
  list.addEventListener('touchstart', (e) => handleSelectionStart(e, 'tareas'), { passive: true });
  list.addEventListener('mouseup', handleSelectionEnd);
  list.addEventListener('mouseleave', handleSelectionEnd);
  list.addEventListener('touchend', handleSelectionEnd);

  // Restore selection state on items
  list.querySelectorAll('.item-card').forEach(card => {
    if (appState.tareas.selectedItems.has(card.dataset.id)) {
      card.classList.add('selected');
    }
  });

  // Render selection bar if active
  if (isSelectionActive('tareas')) {
    renderSelectionBar('tareas');
  }
}
