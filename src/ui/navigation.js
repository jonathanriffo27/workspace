import { appState, notify } from '../store.js';
import { renderComprasSection } from './sections/compras.js';
import { renderIdeasSection } from './sections/ideas.js';
import { renderTareasSection } from './sections/tareas.js';
import { clearSelection, isSelectionActive } from './components/multiSelect.js';
import { initComprasSync, initIdeasSync, initTareasSync } from '../services/firebaseSync.js';

const TABS = ['compras', 'ideas', 'tareas'];

export function switchTab(tab) {
  // Clear selection from current tab if active
  if (isSelectionActive(appState.activeTab)) {
    clearSelection(appState.activeTab);
  }

  // Blur any active edit before switching
  document.querySelector('.item-text.is-editing')?.blur();

  appState.activeTab = tab;
  window.location.hash = tab;

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tab);
  });

  document.querySelectorAll('.section').forEach(section => {
    section.classList.toggle('active', section.id === `${tab}-section`);
  });

  // Lazy initialize sync based on tab
  if (tab === 'compras') {
    initComprasSync();
    renderComprasSection();
  } else if (tab === 'ideas') {
    initIdeasSync();
    renderIdeasSection();
  } else if (tab === 'tareas') {
    initTareasSync();
    renderTareasSection();
  }

  requestAnimationFrame(() => {
    const section = document.getElementById(`${tab}-section`);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

export function initSwipeNavigation() {
  let touchStartX = 0;
  let touchStartY = 0;
  const THRESHOLD = 60; // minimum distance for a swipe

  const content = document.querySelector('.content');
  if (!content) return;

  content.addEventListener('touchstart', (e) => {
    // Ignore if modal is open or user is typing
    if (document.querySelector('.modal-overlay.active')) return;
    if (e.target.closest('input, textarea, .is-editing')) return;

    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  content.addEventListener('touchend', (e) => {
    if (document.querySelector('.modal-overlay.active')) return;
    if (e.target.closest('input, textarea, .is-editing')) return;

    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Check if it's horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > THRESHOLD) {
      const currentIndex = TABS.indexOf(appState.activeTab);
      
      if (deltaX < 0) {
        // Swipe Left -> Next Tab
        if (currentIndex < TABS.length - 1) {
          switchTab(TABS[currentIndex + 1]);
        }
      } else {
        // Swipe Right -> Previous Tab
        if (currentIndex > 0) {
          switchTab(TABS[currentIndex - 1]);
        }
      }
    }
  }, { passive: true });
}
