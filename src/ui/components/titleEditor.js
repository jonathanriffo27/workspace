import { updateTitle } from '../../services/dataService.js';

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

export function handlePressStart(e, type, timerRef) {
  const titleSpan = e.target.closest('.item-text');
  if (!titleSpan) return;
  
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

export function handlePressEnd(timerRef) {
  clearTimeout(timerRef.value);
}
