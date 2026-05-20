import { updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase.js";
import { appState } from "../../store.js";

export function initSortable(listId, type, getSortedItems) {
  const list = document.getElementById(listId);
  if (!list) return;

  let dragEl = null;
  let nextEl = null;
  let pressTimer = null;
  let startY = 0;
  let initialOffsetTop = 0;
  let isDragging = false;
  const LONG_PRESS_DELAY = 400;

  const onTouchStart = (e) => {
    const card = e.target.closest('.item-card');
    if (!card || e.target.closest('button, input, textarea, .is-editing')) return;

    startY = e.touches[0].clientY;
    
    pressTimer = setTimeout(() => {
      isDragging = true;
      dragEl = card;
      initialOffsetTop = dragEl.offsetTop;
      
      dragEl.classList.add('dragging');
      if ('vibrate' in navigator) navigator.vibrate(50);
      
      // Disable scrolling
      document.body.style.overflow = 'hidden';
      document.body.style.userSelect = 'none';
    }, LONG_PRESS_DELAY);
  };

  const onTouchMove = (e) => {
    if (!isDragging || !dragEl) {
      if (pressTimer) {
          const deltaY = Math.abs(e.touches[0].clientY - startY);
          if (deltaY > 10) clearTimeout(pressTimer);
      }
      return;
    }

    e.preventDefault();
    const touch = e.touches[0];
    const currentY = touch.clientY;
    const deltaY = currentY - startY;

    dragEl.style.transform = `translateY(${deltaY}px)`;
    dragEl.style.zIndex = '1000';

    // Find the element currently under the touch
    const overEl = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.item-card');
    
    if (overEl && overEl !== dragEl && overEl.parentNode === list) {
        const rect = overEl.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        
        if (currentY < midpoint) {
            list.insertBefore(dragEl, overEl);
        } else {
            list.insertBefore(dragEl, overEl.nextSibling);
        }
    }
  };

  const onTouchEnd = async () => {
    clearTimeout(pressTimer);
    if (!isDragging || !dragEl) {
      reset();
      return;
    }

    const items = getSortedItems();
    const newElements = Array.from(list.querySelectorAll('.item-card'));
    const newOrderIds = newElements.map(el => el.dataset.id);

    // Re-enable scrolling
    document.body.style.overflow = '';
    document.body.style.userSelect = '';
    
    dragEl.classList.remove('dragging');
    dragEl.style.transform = '';
    dragEl.style.zIndex = '';

    // Calculate new positions
    const updates = [];
    newOrderIds.forEach((id, index) => {
        const item = items.find(i => i.id === id);
        if (item && item.posicion !== index) {
            const docRef = doc(db, type, id);
            updates.push(updateDoc(docRef, { posicion: index }));
        }
    });

    if (updates.length > 0) {
        await Promise.all(updates);
    }

    reset();
  };

  const reset = () => {
    isDragging = false;
    dragEl = null;
    document.body.style.overflow = '';
    document.body.style.userSelect = '';
  };

  list.addEventListener('touchstart', onTouchStart, { passive: false });
  list.addEventListener('touchmove', onTouchMove, { passive: false });
  list.addEventListener('touchend', onTouchEnd);
  list.addEventListener('touchcancel', onTouchEnd);
}
