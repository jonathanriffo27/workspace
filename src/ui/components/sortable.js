import { updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase.js";
import { appState } from "../../store.js";

export function initSortable(listId, type, getSortedItems) {
  const list = document.getElementById(listId);
  if (!list) return;

  let dragEl = null;
  let startY = 0;
  let isDragging = false;

  const getCoordinates = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  const onStart = (e) => {
    const dragHandle = e.target.closest('.drag-handle');
    if (!dragHandle) return;

    // Prevent sorting if selection mode is active
    if (appState[type]?.selectionMode || appState[type]?.selectedItems?.size > 0) return;

    const card = e.target.closest('.item-card');
    if (!card) return;

    // Prevent default to avoid scrolling/selection during drag
    if (e.cancelable) e.preventDefault();

    const coords = getCoordinates(e);
    startY = coords.clientY;

    isDragging = true;
    dragEl = card;

    // Apply dragging class and immediately force transform to none
    // so there's no flash from the CSS transform: scale(1.02)
    dragEl.classList.add('dragging');
    dragEl.style.transform = 'translateY(0px)';

    if ('vibrate' in navigator) navigator.vibrate(50);

    // Disable scrolling and user selection
    document.body.style.overflow = 'hidden';
    document.body.style.userSelect = 'none';

    // Register global mouse tracking events dynamically on drag start
    if (e.type === 'mousedown') {
      window.addEventListener('mousemove', onMove, { passive: false });
      window.addEventListener('mouseup', onEnd);
    }
  };

  const onMove = (e) => {
    if (!isDragging || !dragEl) return;

    if (e.cancelable) e.preventDefault();
    const coords = getCoordinates(e);
    const currentY = coords.clientY;
    const deltaY = currentY - startY;

    dragEl.style.transform = `translateY(${deltaY}px)`;
    dragEl.style.zIndex = '1000';

    // Since .item-card.dragging has pointer-events: none,
    // document.elementFromPoint sees through it to the card underneath.
    const overEl = document.elementFromPoint(coords.clientX, coords.clientY)?.closest('.item-card');

    if (overEl && overEl !== dragEl && overEl.parentNode === list) {
      const overRect = overEl.getBoundingClientRect();
      const midpoint = overRect.top + overRect.height / 2;

      // Measure position before DOM move
      const rectBefore = dragEl.getBoundingClientRect();

      if (currentY < midpoint) {
        list.insertBefore(dragEl, overEl);
      } else {
        list.insertBefore(dragEl, overEl.nextSibling);
      }

      // Measure position after DOM move
      const rectAfter = dragEl.getBoundingClientRect();

      // Compensate startY so the visual position stays locked to the cursor
      startY += rectAfter.top - rectBefore.top;

      // Re-apply transform with corrected startY in the same frame
      const newDeltaY = currentY - startY;
      dragEl.style.transform = `translateY(${newDeltaY}px)`;
    }
  };

  const onEnd = async (e) => {
    // Unsubscribe global mouse event listeners
    if (e && (e.type === 'mouseup' || e.type === 'mouseleave')) {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
    }

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

    // Calculate new positions and sync to Firestore
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

  // Touch events for mobile
  list.addEventListener('touchstart', onStart, { passive: false });
  list.addEventListener('touchmove', onMove, { passive: false });
  list.addEventListener('touchend', onEnd);
  list.addEventListener('touchcancel', onEnd);

  // Mouse events for desktop (mousedown begins drag, mousemove/mouseup are tracked globally)
  list.addEventListener('mousedown', onStart);
}
