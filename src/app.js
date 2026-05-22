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

  const THEME_STORAGE_KEY = 'workspace_theme';
  const THEME_COLORS = {
    dark: '#0F0F0F',
    light: '#F6F2EA'
  };

  function getStoredTheme() {
    try {
      const value = localStorage.getItem(THEME_STORAGE_KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch (error) {
      return null;
    }
  }

  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function getCurrentTheme() {
    return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  }

  function updateThemeMeta(theme) {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', THEME_COLORS[theme]);
    }
  }

  function updateThemeUI(theme) {
    const themeButton = document.querySelector('.account-theme-button');
    const themeValue = document.querySelector('.account-theme-value');
    if (!themeButton || !themeValue) return;

    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const nextThemeLabel = nextTheme === 'light' ? 'claro' : 'oscuro';
    const currentThemeLabel = theme === 'light' ? 'Claro' : 'Oscuro';
    themeButton.setAttribute('aria-label', `Cambiar a tema ${nextThemeLabel}`);
    themeButton.setAttribute('title', `Cambiar a tema ${nextThemeLabel}`);
    themeValue.textContent = currentThemeLabel;
  }

  function applyTheme(theme, { persist = false } = {}) {
    document.documentElement.dataset.theme = theme;
    updateThemeMeta(theme);
    updateThemeUI(theme);
    window.dispatchEvent(new CustomEvent('workspace-themechange', { detail: { theme } }));

    if (persist) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch (error) {
        // Ignore storage errors and keep the theme applied for the session.
      }
    }
  }

  function resolveInitialTheme() {
    return getStoredTheme() || getSystemTheme();
  }

  function toggleTheme() {
    const nextTheme = getCurrentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme, { persist: true });
  }

  function initTheme() {
    applyTheme(resolveInitialTheme());

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleSystemThemeChange = (event) => {
      if (getStoredTheme()) return;
      applyTheme(event.matches ? 'light' : 'dark');
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleSystemThemeChange);
    }
  }

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
    initTheme();
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

        const { loadFromStorage } = await import("./utils/storage.js");
        const { STORAGE_KEYS } = await import("./store.js");
        appState.compras.items = loadFromStorage(`${STORAGE_KEYS.compras}_${user.uid}`);
        appState.ideas.items = loadFromStorage(`${STORAGE_KEYS.ideas}_${user.uid}`);
        appState.tareas.items = loadFromStorage(`${STORAGE_KEYS.tareas}_${user.uid}`);

        hideLoginScreen();
        updateHeaderForUser(user, {
          getTheme: getCurrentTheme,
          onToggleTheme: toggleTheme
        });

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

    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        if (item.classList.contains('recording')) return;
        switchTab(item.dataset.tab);
      });
    });
  }

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
