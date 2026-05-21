import { appState, notify } from '../../store.js';
import { getCategoryLabel } from '../../utils/formatting.js';
import { sortComprasItems } from '../../utils/sorting.js';
import { renderActionInput } from '../components/helpers.js';
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';
import { handlePressStart, handlePressEnd, handlePressMove } from '../components/titleEditor.js';
import { addItem, deleteItem, toggleCompleted, updateTitle, updateItemField, reorderItem } from '../../services/dataService.js';
import { handleSelectionStart, handleSelectionEnd, renderSelectionBar, clearSelection, isSelectionActive, removeFromSelection, toggleSelection, handleClickOutside, handleSelectionMove } from '../components/multiSelect.js';
import { initSortable } from '../components/sortable.js';

let pressTimer = { value: null };
let categoryPressTimer = null;
let categoryStartX = 0;
let categoryStartY = 0;


export function renderComprasSection() {
  const section = document.getElementById('compras-section');
  if (!section) return;

  const { items, filters } = appState.compras;
  
  // Filter logic
  const filtered = filters.length > 0 ? items.filter(item => filters.includes(item.categoria)) : items;
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
        <div class="checkbox ${item.completado ? 'checked' : ''}" data-id="${item.id}">
          <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <div class="item-content">
          <div class="item-row">
            <span class="item-text"></span>
            <div class="item-actions-group">
              <span class="badge badge-categoria" data-id="${item.id}" data-category="${item.categoria}" title="Mantén presionado para cambiar">${getCategoryLabel(item.categoria)}</span>
            </div>
          </div>
        </div>
        <button class="btn-icon delete-btn" data-id="${item.id}" title="Eliminar producto">
          <svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      `;

      // Safely set user-provided content
      card.querySelector('.item-text').textContent = item.nombre || '';

      list.appendChild(card);
    });
  }

  // Initialize gesture reordering
  initSortable('compras-list', 'compras', () => {
    const { items, filters } = appState.compras;
    const filtered = filters.length > 0 ? items.filter(item => filters.includes(item.categoria)) : items;
    return sortComprasItems(filtered);
  });

  attachComprasEvents();
}

function attachComprasEvents() {
  const section = document.getElementById('compras-section');
  const input = document.getElementById('compras-input');
  const addBtn = document.getElementById('compras-input-btn');
  const list = document.getElementById('compras-list');
  const statsBar = section.querySelector('.stats-bar');

  const handleAdd = async () => {
    const nombre = input.value.trim();
    if (!nombre) return;
    const categoria = appState.compras.filters.length > 0 ? appState.compras.filters[0] : 'supermercado';
    if (await addItem('compras', { nombre, categoria, completado: false })) {
        input.value = '';
        showToast('Producto añadido', 'success');
    }
  };

  addBtn.addEventListener('click', handleAdd);
  input.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleAdd(); });

  list.addEventListener('click', async (e) => {
    const checkbox = e.target.closest('.checkbox');
    const deleteBtn = e.target.closest('.delete-btn');
    const card = e.target.closest('.item-card');

    // Handle click selection when in selection mode
    if (appState.compras.selectedItems.size > 0 && card) {
      const id = card.dataset.id;
      toggleSelection('compras', id);
      return;
    }

    if (checkbox) {
      const id = checkbox.dataset.id;
      const item = appState.compras.items.find(i => i.id === id);
      if (item) toggleCompleted(id, 'compras', item.completado);
    }

    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      showModal('Eliminar producto', '<p>¿Estás seguro de que quieres eliminar este producto?</p>', [
        { label: 'Cancelar', action: 'cancel', primary: false },
        { label: 'Eliminar', action: 'delete', primary: true }
      ], (action) => {
        if (action === 'delete') {
          deleteItem(id, 'compras');
          removeFromSelection('compras', id);
        }
      });
    }
  });

  // Click outside to exit selection mode
  document.addEventListener('click', (e) => handleClickOutside(e, 'compras'));

  statsBar.addEventListener('click', (e) => {
    const statItem = e.target.closest('.stat-item');
    if (statItem) {
      const filter = statItem.dataset.filter;
      const currentFilters = appState.compras.filters;
      appState.compras.filters = currentFilters.includes(filter) ? [] : [filter];
      renderComprasSection();
    }
  });

  // Long press for editing title
  list.addEventListener('mousedown', (e) => handlePressStart(e, 'compras', pressTimer));
  list.addEventListener('touchstart', (e) => handlePressStart(e, 'compras', pressTimer), { passive: true });
  list.addEventListener('mousemove', (e) => handlePressMove(e, pressTimer));
  list.addEventListener('touchmove', (e) => handlePressMove(e, pressTimer), { passive: true });
  list.addEventListener('mouseup', () => handlePressEnd(pressTimer));
  list.addEventListener('mouseleave', () => handlePressEnd(pressTimer));
  list.addEventListener('touchend', () => handlePressEnd(pressTimer));

  // Category change logic
  list.addEventListener('mousedown', (e) => handleCategoryPressStart(e));
  list.addEventListener('touchstart', (e) => handleCategoryPressStart(e), { passive: true });
  list.addEventListener('mousemove', (e) => handleCategoryPressMove(e));
  list.addEventListener('touchmove', (e) => handleCategoryPressMove(e), { passive: true });
  list.addEventListener('mouseup', () => { clearTimeout(categoryPressTimer); categoryPressTimer = null; });
  list.addEventListener('mouseleave', () => { clearTimeout(categoryPressTimer); categoryPressTimer = null; });
  list.addEventListener('touchend', () => { clearTimeout(categoryPressTimer); categoryPressTimer = null; });

  // Selection mode (long-press)
  list.addEventListener('mousedown', (e) => handleSelectionStart(e, 'compras'));
  list.addEventListener('touchstart', (e) => handleSelectionStart(e, 'compras'), { passive: true });
  list.addEventListener('mousemove', (e) => handleSelectionMove(e));
  list.addEventListener('touchmove', (e) => handleSelectionMove(e), { passive: true });
  list.addEventListener('mouseup', handleSelectionEnd);
  list.addEventListener('mouseleave', handleSelectionEnd);
  list.addEventListener('touchend', handleSelectionEnd);

  // Restore selection state on items
  list.querySelectorAll('.item-card').forEach(card => {
    if (appState.compras.selectedItems.has(card.dataset.id)) {
      card.classList.add('selected');
    }
  });

  // Toggle selection mode class on list
  if (appState.compras.selectionMode || appState.compras.selectedItems.size > 0) {
    list.classList.add('selection-mode-active');
  } else {
    list.classList.remove('selection-mode-active');
  }

  // Render selection bar if active
  if (isSelectionActive('compras')) {
    renderSelectionBar('compras');
  }
}

function handleCategoryPressStart(e) {
  // Prevent category change if selection mode is active
  if (appState.compras.selectionMode || appState.compras.selectedItems.size > 0) return;

  const badge = e.target.closest('.badge-categoria');
  if (!badge) return;

  const touch = e.touches ? e.touches[0] : e;
  categoryStartX = touch.clientX;
  categoryStartY = touch.clientY;

  categoryPressTimer = setTimeout(() => {
    const id = badge.dataset.id;
    const currentCategory = badge.dataset.category;
    changeCategory(id, currentCategory);
  }, 600);
}

function handleCategoryPressMove(e) {
  if (!categoryPressTimer) return;
  const touch = e.touches ? e.touches[0] : e;
  const deltaX = Math.abs(touch.clientX - categoryStartX);
  const deltaY = Math.abs(touch.clientY - categoryStartY);
  
  if (deltaX > 8 || deltaY > 8) {
    clearTimeout(categoryPressTimer);
    categoryPressTimer = null;
  }
}


async function changeCategory(id, currentCategory) {
  const categories = [
    { value: 'supermercado', label: 'Supermercado' },
    { value: 'internet', label: 'Internet' },
    { value: 'farmacia', label: 'Farmacia' },
    { value: 'otros', label: 'Otros' }
  ];

  const availableCategories = categories.filter(cat => cat.value !== currentCategory);
  const buttons = availableCategories.map(cat => ({ label: cat.label, action: cat.value, primary: false }));

  showModal('Cambiar categoría', '', buttons, async (action) => {
    if (action && action !== 'cancel') {
      if (await updateItemField(id, 'compras', 'categoria', action)) {
        showToast('Categoría actualizada', 'success');
      }
    }
  });
}
