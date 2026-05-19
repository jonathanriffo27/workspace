import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
  collection,
  query,
  where,
  orderBy
} from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

/**
 * REEMPLAZA ESTA CONFIGURACIÓN CON TU PROPIA CONFIGURACIÓN DE FIREBASE
 * Puedes encontrarla en la consola de Firebase: 
 * Configuración del Proyecto > General > Tus aplicaciones > SDK setup and configuration
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
});
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const collections = {
  compras: collection(db, "compras"),
  ideas: collection(db, "ideas"),
  tareas: collection(db, "tareas")
};

export { db, auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged };
