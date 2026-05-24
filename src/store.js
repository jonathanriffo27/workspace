import { loadFromStorage } from './utils/storage.js';

const STORAGE_KEYS = {
  compras: 'workspace_compras',
  ideas: 'workspace_ideas',
  tareas: 'workspace_tareas'
};

export const appState = {
  activeTab: 'ideas',
  user: null,
  userId: null,
  authLoading: true,
  isDragging: false,
  firestoreInitialized: false,
  unsubscribes: [],
  compras: {
    items: [],
    filters: [],
    selectedItems: new Set(),
    selectionMode: false,
    loading: true,
    hasRendered: false,
    limit: 50,
    hasMore: false
  },
  ideas: {
    items: [],
    filter: 'todas',
    searchQuery: '',
    selectedItems: new Set(),
    selectionMode: false,
    loading: true,
    hasRendered: false,
    limit: 50,
    hasMore: false
  },
  tareas: {
    items: [],
    filter: 'todas',

    selectedItems: new Set(),
    selectionMode: false,
    loading: true,
    hasRendered: false,
    limit: 50,
    hasMore: false
  },
  ui: {
    toast: null,
    modal: null
  }
};

const subscribers = new Set();

export function subscribe(callback) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

export function notify() {
  subscribers.forEach(callback => callback(appState));
}

// Expose for debugging and screenshots
window.notify = notify;

export function initStore() {
  const lastUserId = localStorage.getItem('workspace_last_user_id');
  if (lastUserId) {
    appState.compras.items = loadFromStorage(`${STORAGE_KEYS.compras}_${lastUserId}`);
    appState.ideas.items = loadFromStorage(`${STORAGE_KEYS.ideas}_${lastUserId}`);
    appState.tareas.items = loadFromStorage(`${STORAGE_KEYS.tareas}_${lastUserId}`);
  } else {
    appState.compras.items = loadFromStorage(STORAGE_KEYS.compras);
    appState.ideas.items = loadFromStorage(STORAGE_KEYS.ideas);
    appState.tareas.items = loadFromStorage(STORAGE_KEYS.tareas);
  }
  
  // Expose for debugging and screenshots
  window.appState = appState;
  
  notify();
}

export const CATEGORIAS = ['supermercado', 'internet', 'farmacia', 'otros'];
export const TAREA_FILTERS = ['todas', 'pendientes', 'archivadas'];
export { STORAGE_KEYS };
