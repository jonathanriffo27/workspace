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
  firestoreInitialized: false,
  unsubscribes: [],
  compras: {
    items: [],
    filters: []
  },
  ideas: {
    items: [],
    filter: 'todas',
    searchQuery: ''
  },
  tareas: {
    items: [],
    filter: 'todas',
    newTaskPriority: 'media'
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
  appState.compras.items = loadFromStorage(STORAGE_KEYS.compras);
  appState.ideas.items = loadFromStorage(STORAGE_KEYS.ideas);
  appState.tareas.items = loadFromStorage(STORAGE_KEYS.tareas);
  notify();
}

export const CATEGORIAS = ['supermercado', 'internet', 'farmacia', 'otros'];
export const PRIORIDADES = ['alta', 'media', 'baja'];
export const TAREA_FILTERS = ['todas', 'pendientes', 'completadas'];
export { STORAGE_KEYS };
