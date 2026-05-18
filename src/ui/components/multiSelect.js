import { appState, notify } from '../../store.js';
import { deleteItem } from '../../services/dataService.js';
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';

let selectionTimer = null;
let currentSection = null;

export function handleSelectionStart(e, section) {
  const card = e.target.closest('.item-card');
  if (!card) return;
  
  const isInput = e.target.closest('input, textarea, select, .is-editing');
  if (isInput) return;

  currentSection = section;
  selectionTimer = setTimeout(() => {
    const id = card.dataset.id;
    enterSelectionMode(section);
    toggleSelection(section, id);
  }, 600);
}

export function enterSelectionMode(section) {
  appState[section].selectionMode = true;
}

export function exitSelectionMode(section) {
  appState[section].selectionMode = false;
}

export function handleSelectionEnd() {
  clearTimeout(selectionTimer);
}

export function toggleSelection(section, id) {
  const selected = appState[section].selectedItems;
  
  if (selected.has(id)) {
    selected.delete(id);
    document.querySelector(`.item-card[data-id="${id}"]`)?.classList.remove('selected');
  } else {
    selected.add(id);
    document.querySelector(`.item-card[data-id="${id}"]`)?.classList.add('selected');
  }
  
  notify();
  renderSelectionBar(section);
}

export function clearSelection(section) {
  const selected = appState[section].selectedItems;
  selected.forEach(id => {
    document.querySelector(`.item-card[data-id="${id}"]`)?.classList.remove('selected');
  });
  selected.clear();
  appState[section].selectionMode = false;
  notify();
  hideSelectionBar(section);
}

export function renderSelectionBar(section) {
  const sectionEl = document.getElementById(`${section}-section`);
  if (!sectionEl) return;
  
  let bar = sectionEl.querySelector('.selection-bar');
  const count = appState[section].selectedItems.size;
  
  if (count === 0) {
    if (bar) bar.remove();
    return;
  }
  
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'selection-bar';
    bar.innerHTML = `
      <span class="selection-count">${count} seleccionado${count > 1 ? 's' : ''}</span>
      <div class="selection-actions">
        <button class="selection-delete-btn">
          <svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Eliminar
        </button>
        <button class="selection-cancel-btn">
          <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    `;
    sectionEl.appendChild(bar);
    
    bar.querySelector('.selection-delete-btn').addEventListener('click', () => {
      deleteSelectedItems(section);
    });
    
    bar.querySelector('.selection-cancel-btn').addEventListener('click', () => {
      clearSelection(section);
    });
  }
  
  bar.querySelector('.selection-count').textContent = `${count} seleccionado${count > 1 ? 's' : ''}`;
}

function hideSelectionBar(section) {
  const sectionEl = document.getElementById(`${section}-section`);
  sectionEl?.querySelector('.selection-bar')?.remove();
}

export async function deleteSelectedItems(section) {
  const selected = Array.from(appState[section].selectedItems);
  const count = selected.length;
  
  showModal(
    `Eliminar ${count} elemento${count > 1 ? 's' : ''}`, 
    `<p>¿Estás seguro de que quieres eliminar ${count} elemento${count > 1 ? 's' : ''}?</p>`,
    [
      { label: 'Cancelar', action: 'cancel', primary: false },
      { label: 'Eliminar', action: 'delete', primary: true }
    ],
    async (action) => {
      if (action === 'delete') {
        for (const id of selected) {
          await deleteItem(id, section);
        }
        clearSelection(section);
        showToast(`${count} elemento${count > 1 ? 's' : ''} eliminad${count > 1 ? 'os' : 'o'}`, 'success');
      }
    }
  );
}

export function isSelectionActive(section) {
  return appState[section].selectedItems.size > 0;
}

export function removeFromSelection(section, id) {
  if (appState[section].selectedItems.has(id)) {
    appState[section].selectedItems.delete(id);
    document.querySelector(`.item-card[data-id="${id}"]`)?.classList.remove('selected');
    renderSelectionBar(section);
  }
}

export function clearAllSelections() {
  ['compras', 'tareas', 'ideas'].forEach(section => {
    if (appState[section].selectedItems.size > 0) {
      clearSelection(section);
    }
  });
}

export function handleClickOutside(e, activeSection) {
  if (!activeSection) return;
  
  const isClickOnItem = e.target.closest('.item-card');
  const isClickOnSelectionBar = e.target.closest('.selection-bar');
  const isClickOnInput = e.target.closest('input, textarea, select');
  
  if (!isClickOnItem && !isClickOnSelectionBar && !isClickOnInput) {
    if (appState[activeSection].selectedItems.size > 0) {
      clearSelection(activeSection);
    }
  }
}