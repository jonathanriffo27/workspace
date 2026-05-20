import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase.js";
import { appState, initStore, subscribe } from "./store.js";
import { initFirestoreSync } from "./services/firebaseSync.js";
import { initVoiceCapture } from "./services/voiceService.js";
import { 
  showLoginScreen, 
  hideLoginScreen, 
  updateHeaderForUser 
} from "./ui/auth.js";
import { switchTab, initSwipeNavigation } from "./ui/navigation.js";
import { renderComprasSection } from "./ui/sections/compras.js";
import { renderIdeasSection } from "./ui/sections/ideas.js";
import { renderTareasSection } from "./ui/sections/tareas.js";

(function() {
  'use strict';

  // State Change Listener (Re-render logic)
  subscribe((state) => {
    if (state.authLoading) return;
    
    // Only re-render the active tab if necessary
    // In a more complex app, we'd have finer grained updates
    const currentTab = state.activeTab;
    if (currentTab === 'compras') renderComprasSection();
    else if (currentTab === 'ideas') renderIdeasSection();
    else if (currentTab === 'tareas') renderTareasSection();
  });

  function init() {
    initStore();
    initSwipeNavigation();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (!event.data || !event.data.type) return;
      });
    }

    onAuthStateChanged(auth, (user) => {
      appState.user = user;
      appState.userId = user ? user.uid : null;
      appState.authLoading = false;

      if (user) {
        hideLoginScreen();
        updateHeaderForUser(user);
        
        const hash = window.location.hash.substring(1);
        const initialTab = ['compras', 'ideas', 'tareas'].includes(hash) ? hash : 'compras';
        switchTab(initialTab);
        
        initFirestoreSync();
        initVoiceCapture();
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
