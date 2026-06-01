import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase.js";
import { appState, initStore, subscribe } from "./store.js";
import { initFirestoreSync } from "./services/firebaseSync.js";
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import {
  showLoginScreen,
  hideLoginScreen,
  updateHeaderForUser
} from "./ui/auth.js";
import { initTabs, initSwipeNavigation } from "./ui/navigation.js";
import { initVoiceCapture } from "./services/voiceService.js";
import { renderComprasSection } from "./ui/sections/compras.js";
import { renderIdeasSection } from "./ui/sections/ideas.js";
import { renderTareasSection } from "./ui/sections/tareas.js";

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

  async function applyTheme(theme, { persist = false } = {}) {
    document.documentElement.dataset.theme = theme;
    updateThemeMeta(theme);
    updateThemeUI(theme);
    window.dispatchEvent(new CustomEvent('workspace-themechange', { detail: { theme } }));

    if (Capacitor.isNativePlatform()) {
      try {
        await StatusBar.setStyle({
          style: theme === 'light' ? Style.Light : Style.Dark
        });
      } catch (error) {
        console.error('Error setting status bar style:', error);
      }
    }

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

  async function initOrientationLock() {
    if (screen.orientation && screen.orientation.lock) {
      try {
        await screen.orientation.lock('portrait');
      } catch (err) {
        // Silently fail as the CSS overlay handles fallback
      }
    }
  }

  function initKeyboard() {
    if (Capacitor.isNativePlatform()) {
      Keyboard.setAccessoryBarVisible({ isVisible: true });
    }
  }

  function initializeApp() {
    initTheme();
    initOrientationLock();
    initKeyboard();
    initVoiceCapture();
    initStore();
    initTabs();
    initSwipeNavigation();

    // Suscripción al store para re-renderizado automático controlado
    subscribe((state) => {
      const activeTab = state.activeTab;
      if (!state.userId) return;

      // 1. Evitar re-render si el usuario está interactuando activamente con campos
      const activeElement = document.activeElement;
      const isTyping = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        activeElement.closest('.is-editing')
      );
      if (isTyping) return;

      // 2. Evitar re-render si la selección múltiple o el modo de arrastre están activos
      const sectionState = state[activeTab];
      if (sectionState) {
        if (sectionState.selectionMode || (sectionState.selectedItems && sectionState.selectedItems.size > 0)) {
          return;
        }
      }

      // 3. Evitar re-render si se está arrastrando algún item
      if (state.isDragging || document.querySelector('.dragging')) return;

      // 4. Evitar re-render si hay un modal abierto
      if (document.querySelector('.modal-overlay.active')) return;

      // Render seguro según el tab activo
      if (activeTab === 'compras') {
        renderComprasSection();
      } else if (activeTab === 'ideas') {
        renderIdeasSection();
      } else if (activeTab === 'tareas') {
        renderTareasSection();
      }
    });

    onAuthStateChanged(auth, (user) => {
      if (user) {
        appState.user = user;
        appState.userId = user.uid;
        if (!appState.firestoreInitialized) {
          initFirestoreSync();
          appState.firestoreInitialized = true;
        }
        hideLoginScreen();
        updateHeaderForUser(user, { getTheme: getCurrentTheme, onToggleTheme: toggleTheme });
      } else {
        appState.user = null;
        appState.userId = null;
        appState.firestoreInitialized = false;
        showLoginScreen();
        updateHeaderForUser(null);
      }
    });

    window.addEventListener('toggle-theme', toggleTheme);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }
})();
