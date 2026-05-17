import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { auth, googleProvider } from "../firebase.js";
import { appState } from "../store.js";
import { showToast } from "./components/toast.js";

export function showLoginScreen() {
  const app = document.getElementById('app');
  if (document.getElementById('login-screen')) return;

  const loginHTML = `
    <div id="login-screen">
      <div class="login-container">
        <div class="login-header">
          <h1 class="login-title">Workspace</h1>
          <span class="login-subtitle">Personal</span>
        </div>
        
        <div class="login-tabs">
          <button class="login-tab active" data-tab="login">Iniciar Sesión</button>
          <button class="login-tab" data-tab="register">Registrarse</button>
        </div>

        <div class="login-forms">
          <form id="login-form" class="login-form active">
            <div class="form-group">
              <input type="email" id="login-email" class="input-field" placeholder="Correo electrónico" autocomplete="email" required>
            </div>
            <div class="form-group">
              <input type="password" id="login-password" class="input-field" placeholder="Contraseña" autocomplete="current-password" required>
            </div>
            <div class="form-error" id="login-error"></div>
            <button type="submit" class="btn-primary">Iniciar Sesión</button>
          </form>

          <form id="register-form" class="login-form">
            <div class="form-group">
              <input type="email" id="register-email" class="input-field" placeholder="Correo electrónico" autocomplete="email" required>
            </div>
            <div class="form-group">
              <input type="password" id="register-password" class="input-field" placeholder="Contraseña (mín. 6 caracteres)" autocomplete="new-password" required>
            </div>
            <div class="form-error" id="register-error"></div>
            <button type="submit" class="btn-primary">Crear Cuenta</button>
          </form>
        </div>

        <div class="login-divider">
          <span>o</span>
        </div>

        <button id="google-signin-btn" class="btn-google">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Continuar con Google</span>
        </button>
      </div>
    </div>
  `;

  app.insertAdjacentHTML('beforeend', loginHTML);
  attachLoginEvents();
}

function attachLoginEvents() {
  const tabs = document.querySelectorAll('.login-tab');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const googleBtn = document.getElementById('google-signin-btn');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      document.getElementById('login-form').classList.toggle('active', tabName === 'login');
      document.getElementById('register-form').classList.toggle('active', tabName === 'register');
      document.getElementById('login-error').textContent = '';
      document.getElementById('register-error').textContent = '';
    });
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      document.getElementById('login-error').textContent = getAuthErrorMessage(err.code);
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      document.getElementById('register-error').textContent = getAuthErrorMessage(err.code);
    }
  });

  googleBtn.addEventListener('click', async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      showToast('Error al iniciar con Google', 'error');
    }
  });
}

function getAuthErrorMessage(code) {
  const messages = {
    'auth/user-not-found': 'No existe cuenta con este correo',
    'auth/wrong-password': 'Contraseña incorrecta',
    'auth/email-already-in-use': 'Este correo ya está registrado',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
    'auth/invalid-email': 'Correo electrónico inválido'
  };
  return messages[code] || 'Error de autenticación';
}

export function hideLoginScreen() {
  const loginScreen = document.getElementById('login-screen');
  if (loginScreen) loginScreen.remove();
}

export function updateHeaderForUser(user) {
  const header = document.querySelector('.header');
  const existingUserInfo = header.querySelector('.user-info');
  if (existingUserInfo) existingUserInfo.remove();

  if (user) {
    const userInfo = document.createElement('div');
    userInfo.className = 'user-info';
    const displayName = user.displayName || user.email || 'Usuario';
    userInfo.innerHTML = `
      <span class="user-name">${displayName}</span>
      <button class="logout-btn" title="Cerrar sesión">
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
        </svg>
      </button>
    `;
    header.appendChild(userInfo);

    header.querySelector('.logout-btn').addEventListener('click', async () => {
      try {
        appState.unsubscribes.forEach(fn => fn());
        appState.unsubscribes = [];
        appState.firestoreInitialized = false;
        await signOut(auth);
      } catch (err) {
        showToast('Error al cerrar sesión', 'error');
      }
    });
  }
}
