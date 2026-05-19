import { appState, notify } from '../../store.js';
import { sortIdeasItems } from '../../utils/sorting.js';
import { renderActionInput } from '../components/helpers.js';
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';
import { handlePressStart, handlePressEnd } from '../components/titleEditor.js';
import { addItem, deleteItem, toggleCompleted, updateNotes } from '../../services/dataService.js';
import { handleSelectionStart, handleSelectionEnd, renderSelectionBar, clearSelection, isSelectionActive, removeFromSelection, toggleSelection, handleClickOutside } from '../components/multiSelect.js';

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

      // Use innerHTML for static structure only
      card.innerHTML = `
        <div class="checkbox ${idea.archivada ? 'checked' : ''}" data-id="${idea.id}">
          <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <div class="item-content">
          <div class="item-row">
            <span class="item-text"></span>
            <div class="item-actions-group">
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
  }

  attachIdeasEvents();
}

function attachIdeasEvents() {
  const titleInput = document.getElementById('idea-title-input');
  const addBtn = document.getElementById('idea-title-input-btn');
  const list = document.getElementById('ideas-list');

  const handleAdd = async () => {
    const titulo = titleInput.value.trim();
    if (!titulo) return;
    if (await addItem('ideas', { titulo, notas: '', archivada: false })) {
        titleInput.value = '';
        showToast('Idea capturada', 'success');
    }
  };

  addBtn.addEventListener('click', handleAdd);
  titleInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleAdd(); });

  list.addEventListener('click', async (e) => {
    const checkbox = e.target.closest('.checkbox');
    const deleteBtn = e.target.closest('.delete-btn');
    const expandBtn = e.target.closest('.expand-indicator-btn') || e.target.closest('.item-row');
    const saveBtn = e.target.closest('.save-idea-btn');
    const card = e.target.closest('.item-card');

    // Handle click selection when in selection mode
    if (appState.ideas.selectedItems.size > 0 && card) {
      const id = card.dataset.id;
      toggleSelection('ideas', id);
      return;
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

    if (expandBtn && !e.target.closest('.checkbox') && !e.target.closest('.delete-btn') && !e.target.closest('.save-idea-btn') && !e.target.closest('textarea') && !e.target.closest('.item-text')) {
      const cardEl = expandBtn.closest('.item-card');
      cardEl.classList.toggle('expanded');
    }
  });

  // Click outside to exit selection mode
  document.addEventListener('click', (e) => handleClickOutside(e, 'ideas'));

  list.addEventListener('mousedown', (e) => handlePressStart(e, 'ideas', pressTimer));
  list.addEventListener('touchstart', (e) => handlePressStart(e, 'ideas', pressTimer), { passive: true });
  list.addEventListener('mouseup', () => handlePressEnd(pressTimer));
  list.addEventListener('mouseleave', () => handlePressEnd(pressTimer));
  list.addEventListener('touchend', () => handlePressEnd(pressTimer));

  // Selection mode (long-press)
  list.addEventListener('mousedown', (e) => handleSelectionStart(e, 'ideas'));
  list.addEventListener('touchstart', (e) => handleSelectionStart(e, 'ideas'), { passive: true });
  list.addEventListener('mouseup', handleSelectionEnd);
  list.addEventListener('mouseleave', handleSelectionEnd);
  list.addEventListener('touchend', handleSelectionEnd);

  // Restore selection state on items
  list.querySelectorAll('.item-card').forEach(card => {
    if (appState.ideas.selectedItems.has(card.dataset.id)) {
      card.classList.add('selected');
    }
  });

  // Render selection bar if active
  if (isSelectionActive('ideas')) {
    renderSelectionBar('ideas');
  }
}
