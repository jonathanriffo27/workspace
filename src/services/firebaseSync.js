import { 
  onSnapshot, 
  addDoc, 
  query,
  orderBy,
  where,
  getDocs,
  serverTimestamp
} from "firebase/firestore";
import { collections } from "../firebase.js";
import { appState, STORAGE_KEYS, notify } from "../store.js";
import { loadFromStorage, saveToStorage } from "../utils/storage.js";

async function migrateDataIfNecessary(userId) {
  const collectionsToCheck = [
    { key: STORAGE_KEYS.compras, collection: collections.compras, type: 'compras' },
    { key: STORAGE_KEYS.ideas, collection: collections.ideas, type: 'ideas' },
    { key: STORAGE_KEYS.tareas, collection: collections.tareas, type: 'tareas' }
  ];

  for (const col of collectionsToCheck) {
    const localData = loadFromStorage(col.key);
    if (localData.length > 0) {
      try {
        const q = query(col.collection, where("userId", "==", userId));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          console.log(`Migrating ${col.type} to Firestore...`);
          for (const item of localData) {
            const { id, ...data } = item;
            await addDoc(col.collection, {
              ...data,
              userId: userId,
              creadoEn: item.creadoEn ? new Date(item.creadoEn) : serverTimestamp()
            });
          }
          localStorage.removeItem(col.key);
          console.log(`${col.type} migration complete.`);
        } else {
          localStorage.removeItem(col.key);
        }
      } catch (err) {
        console.error(`Error migrating ${col.type}:`, err);
      }
    }
  }
}

function safeToMillis(val) {
  if (!val) return Date.now();
  if (typeof val.toMillis === 'function') return val.toMillis();
  if (val instanceof Date) return val.getTime();
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    return isNaN(parsed) ? Date.now() : parsed;
  }
  if (typeof val.seconds === 'number') return val.seconds * 1000;
  return Date.now();
}

export function initFirestoreSync() {
  if (!appState.userId) return;

  if (appState.firestoreInitialized) return;
  appState.firestoreInitialized = true;

  const userId = appState.userId;
  appState.unsubscribes.forEach(fn => fn());
  appState.unsubscribes = [];

  migrateDataIfNecessary(userId);

  const qCompras = query(collections.compras, where("userId", "==", userId), orderBy("creadoEn", "desc"));
  appState.unsubscribes.push(onSnapshot(qCompras, (snapshot) => {
    appState.compras.items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      creadoEn: safeToMillis(doc.data().creadoEn)
    }));
    saveToStorage(STORAGE_KEYS.compras, appState.compras.items);
    notify();
  }));

  const qIdeas = query(collections.ideas, where("userId", "==", userId), orderBy("creadoEn", "desc"));
  appState.unsubscribes.push(onSnapshot(qIdeas, (snapshot) => {
    appState.ideas.items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      creadoEn: safeToMillis(doc.data().creadoEn)
    }));
    saveToStorage(STORAGE_KEYS.ideas, appState.ideas.items);
    notify();
  }));

  const qTareas = query(collections.tareas, where("userId", "==", userId), orderBy("creadoEn", "desc"));
  appState.unsubscribes.push(onSnapshot(qTareas, (snapshot) => {
    appState.tareas.items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      creadoEn: safeToMillis(doc.data().creadoEn),
      fechaLimite: doc.data().fechaLimite
    }));
    saveToStorage(STORAGE_KEYS.tareas, appState.tareas.items);
    notify();
  }));
}
