import { appState, notify } from '../store.js';
import { renderComprasSection } from './sections/compras.js';
import { renderIdeasSection } from './sections/ideas.js';
import { renderTareasSection } from './sections/tareas.js';
import { clearSelection, isSelectionActive } from './components/multiSelect.js';

export function switchTab(tab) {
  // Clear selection from current tab if active
  if (isSelectionActive(appState.activeTab)) {
    clearSelection(appState.activeTab);
  }

  // Blur any active edit before switching
  document.querySelector('.item-text.is-editing')?.blur();

  appState.activeTab = tab;

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tab);
  });

  document.querySelectorAll('.section').forEach(section => {
    section.classList.toggle('active', section.id === `${tab}-section`);
  });

  if (tab === 'compras') renderComprasSection();
  else if (tab === 'ideas') renderIdeasSection();
  else if (tab === 'tareas') renderTareasSection();

  requestAnimationFrame(() => {
    const section = document.getElementById(`${tab}-section`);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}
