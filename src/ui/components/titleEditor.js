import { updateTitle } from '../../services/dataService.js';
import { appState } from '../../store.js';

export async function saveTitle(el, type) {
  el.contentEditable = false;
  el.classList.remove('is-editing');
  delete el.dataset.editing;
  const newTitle = el.textContent.trim();
  const card = el.closest('.item-card');
  const id = card.dataset.id;
  
  if (newTitle) {
    await updateTitle(id, type, newTitle);
  }
}

let startX = 0;
let startY = 0;

export function handlePressStart(e, type, timerRef) {
  // Prevent editing if selection mode is active
  if (appState[type]?.selectionMode || appState[type]?.selectedItems?.size > 0) return;

  const titleSpan = e.target.closest('.item-text');
  if (!titleSpan) return;
  
  const touch = e.touches ? e.touches[0] : e;
  startX = touch.clientX;
  startY = touch.clientY;

  timerRef.value = setTimeout(() => {
    // Blur any currently editing element
    document.querySelector('.item-text.is-editing')?.blur();

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

    // Global click listener to save when clicking outside
    const handleOutsideClick = (e) => {
      if (!titleSpan.contains(e.target)) {
        document.removeEventListener('click', handleOutsideClick);
        document.removeEventListener('pointerdown', handleOutsideClick);
        e.stopPropagation();
        titleSpan.blur();
      }
    };
    setTimeout(() => {
        document.addEventListener('click', handleOutsideClick);
        document.addEventListener('pointerdown', handleOutsideClick);
    }, 0);

    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(titleSpan);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }, 600);
}

export function handlePressMove(e, timerRef) {
  if (!timerRef.value) return;
  const touch = e.touches ? e.touches[0] : e;
  const deltaX = Math.abs(touch.clientX - startX);
  const deltaY = Math.abs(touch.clientY - startY);
  
  if (deltaX > 8 || deltaY > 8) {
    clearTimeout(timerRef.value);
    timerRef.value = null;
  }
}

export function handlePressEnd(timerRef) {
  clearTimeout(timerRef.value);
  timerRef.value = null;
}

