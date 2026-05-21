import { loadFromStorage } from './utils/storage.js';

const STORAGE_KEYS = {
  compras: 'workspace_compras',
  ideas: 'workspace_ideas',
  tareas: 'workspace_tareas'
};

export const appState = {
  activeTab: 'compras',
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
    newTaskPriority: 'media',
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
  notify();
}

export const CATEGORIAS = ['supermercado', 'internet', 'farmacia', 'otros'];
export const PRIORIDADES = ['alta', 'media', 'baja'];
export const TAREA_FILTERS = ['todas', 'pendientes', 'archivadas'];
export { STORAGE_KEYS };
