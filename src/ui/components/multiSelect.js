import { appState, notify } from '../../store.js';
import { deleteItem, moveItem } from '../../services/dataService.js';
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';

let selectionTimer = null;
let currentSection = null;
let startX = 0;
let startY = 0;

export function handleSelectionStart(e, section) {
  const card = e.target.closest('.item-card');
  if (!card) return;
  
  const isInput = e.target.closest('input, textarea, select, .is-editing');
  if (isInput) return;

  // If clicking on title, category badge, or drag handle and NOT in selection mode, let specific elements handle it
  const isInteractive = e.target.closest('.item-text, .badge-categoria, .drag-handle');
  if (isInteractive && !appState[section].selectionMode && appState[section].selectedItems.size === 0) return;

  currentSection = section;
  const touch = e.touches ? e.touches[0] : e;
  startX = touch.clientX;
  startY = touch.clientY;

  selectionTimer = setTimeout(() => {
    const id = card.dataset.id;
    enterSelectionMode(section);
    toggleSelection(section, id);
  }, 600);
}

export function handleSelectionMove(e) {
  if (!selectionTimer) return;
  const touch = e.touches ? e.touches[0] : e;
  const deltaX = Math.abs(touch.clientX - startX);
  const deltaY = Math.abs(touch.clientY - startY);
  
  if (deltaX > 8 || deltaY > 8) {
    clearTimeout(selectionTimer);
    selectionTimer = null;
  }
}

export function enterSelectionMode(section) {
  appState[section].selectionMode = true;
}

export function exitSelectionMode(section) {
  appState[section].selectionMode = false;
}

export function handleSelectionEnd() {
  clearTimeout(selectionTimer);
  selectionTimer = null;
}


export function toggleSelection(section, id) {
  const selected = appState[section].selectedItems;
  const list = document.querySelector(`#${section}-section .items-list`);
  
  if (selected.has(id)) {
    selected.delete(id);
    document.querySelector(`.item-card[data-id="${id}"]`)?.classList.remove('selected');
  } else {
    selected.add(id);
    document.querySelector(`.item-card[data-id="${id}"]`)?.classList.add('selected');
  }

  // Actualizar clase de modo selección y estado manualmente para evitar re-render completo
  if (list) {
    if (selected.size > 0) {
      list.classList.add('selection-mode-active');
      appState[section].selectionMode = true;
    } else {
      list.classList.remove('selection-mode-active');
      appState[section].selectionMode = false;
    }
  }
  
  renderSelectionBar(section);
}

export function clearSelection(section) {
  const selected = appState[section].selectedItems;
  const list = document.querySelector(`#${section}-section .items-list`);

  selected.forEach(id => {
    document.querySelector(`.item-card[data-id="${id}"]`)?.classList.remove('selected');
  });
  selected.clear();
  appState[section].selectionMode = false;

  if (list) {
    list.classList.remove('selection-mode-active');
  }

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
        <button class="selection-move-btn">
          <svg viewBox="0 0 24 24"><path d="M15 10l5 5-5 5M4 4v7a4 4 0 004 4h12" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Mover
        </button>
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

    bar.querySelector('.selection-move-btn').addEventListener('click', () => {
      moveSelectedItems(section);
    });
    
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

export async function moveSelectedItems(section) {
  const selected = Array.from(appState[section].selectedItems);
  const count = selected.length;
  
  const modules = [
    { label: 'Compras', action: 'compras', primary: false },
    { label: 'Ideas', action: 'ideas', primary: false },
    { label: 'Tareas', action: 'tareas', primary: false }
  ].filter(m => m.action !== section);

  showModal(
    `Mover ${count} elemento${count > 1 ? 's' : ''}`,
    `<p>Selecciona el módulo de destino para ${count > 1 ? 'estos elementos' : 'este elemento'}:</p>`,
    [...modules, { label: 'Cancelar', action: 'cancel', primary: false }],
    async (targetModule) => {
      if (targetModule && targetModule !== 'cancel') {
        for (const id of selected) {
          await moveItem(id, section, targetModule);
        }
        clearSelection(section);
        showToast(`${count} elemento${count > 1 ? 's' : ''} movid${count > 1 ? 'os' : 'o'} a ${targetModule}`, 'success');
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
    
    const list = document.querySelector(`#${section}-section .items-list`);
    if (list && appState[section].selectedItems.size === 0) {
      list.classList.remove('selection-mode-active');
      appState[section].selectionMode = false;
    }
    
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