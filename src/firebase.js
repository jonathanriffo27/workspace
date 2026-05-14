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
  apiKey: "AIzaSyCfrIEqQl9Kyb3y-deevvmHIAU9ibyemhk",
  authDomain: "opencode-36f43.firebaseapp.com",
  projectId: "opencode-36f43",
  storageBucket: "opencode-36f43.firebasestorage.app",
  messagingSenderId: "398357215786",
  appId: "1:398357215786:web:fc1fe1a6afeb6727106153",
  measurementId: "G-V8YX1W4TW1"
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
