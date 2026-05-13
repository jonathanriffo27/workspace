import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  collection 
} from "firebase/firestore";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Enable offline persistence for a mobile-first premium experience
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time.
    console.warn('Firebase Persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    // The current browser does not support all of the features required to enable persistence
    console.warn('Firebase Persistence failed: Browser not supported');
  }
});

// Collections references
export const collections = {
  compras: collection(db, "compras"),
  ideas: collection(db, "ideas"),
  tareas: collection(db, "tareas")
};

export { db };
