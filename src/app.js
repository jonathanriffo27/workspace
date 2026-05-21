import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase.js";
import { appState, initStore, subscribe } from "./store.js";
import { initFirestoreSync } from "./services/firebaseSync.js";
import { 
  showLoginScreen, 
  hideLoginScreen, 
  updateHeaderForUser 
} from "./ui/auth.js";
import { switchTab, initSwipeNavigation } from "./ui/navigation.js";

(function() {
  'use strict';

  // State Change Listener (Re-render logic)
  subscribe((state) => {
    if (state.authLoading) return;
    
    const currentTab = state.activeTab;
    if (currentTab === 'compras') {
      import("./ui/sections/compras.js").then(({ renderComprasSection }) => renderComprasSection());
    } else if (currentTab === 'ideas') {
      import("./ui/sections/ideas.js").then(({ renderIdeasSection }) => renderIdeasSection());
    } else if (currentTab === 'tareas') {
      import("./ui/sections/tareas.js").then(({ renderTareasSection }) => renderTareasSection());
    }
  });

  function init() {
    initStore();
    initSwipeNavigation();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (!event.data || !event.data.type) return;
      });
    }

    onAuthStateChanged(auth, async (user) => {
      appState.user = user;
      appState.userId = user ? user.uid : null;
      appState.authLoading = false;

      if (user) {
        localStorage.setItem('workspace_last_user_id', user.uid);
        
        // Reload storage items with user isolation key
        const { loadFromStorage } = await import("./utils/storage.js");
        const { STORAGE_KEYS } = await import("./store.js");
        appState.compras.items = loadFromStorage(`${STORAGE_KEYS.compras}_${user.uid}`);
        appState.ideas.items = loadFromStorage(`${STORAGE_KEYS.ideas}_${user.uid}`);
        appState.tareas.items = loadFromStorage(`${STORAGE_KEYS.tareas}_${user.uid}`);

        hideLoginScreen();
        updateHeaderForUser(user);
        
        const hash = window.location.hash.substring(1);
        const initialTab = ['compras', 'ideas', 'tareas'].includes(hash) ? hash : 'compras';
        switchTab(initialTab);
        
        initFirestoreSync();
        import("./services/voiceService.js").then(({ initVoiceCapture }) => initVoiceCapture());
        import("./services/taskArchiver.js").then(({ initTaskArchiver }) => initTaskArchiver());
      } else {
        showLoginScreen();
        updateHeaderForUser(null);
        appState.compras.items = [];
        appState.ideas.items = [];
        appState.tareas.items = [];
        appState.firestoreInitialized = false;
        appState.unsubscribes.forEach(fn => fn());
        appState.unsubscribes = [];
        
        const hash = window.location.hash.substring(1);
        const initialTab = ['compras', 'ideas', 'tareas'].includes(hash) ? hash : 'compras';
        switchTab(initialTab);
      }
    });

    // Navigation events
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        // Special case for voice capture long press (handled in voiceService)
        if (item.classList.contains('recording')) return;
        
        switchTab(item.dataset.tab);
      });
    });
  }

  // Suppress message channel errors from Firebase SDK and browser extensions
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || '';
    if (msg.includes('message channel closed') || msg.includes('Channel closed')) {
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (msg.includes('message channel closed') || msg.includes('Channel closed')) {
      event.preventDefault();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
