import { 
  onSnapshot, 
  addDoc, 
  query,
  orderBy,
  where,
  getDocs,
  serverTimestamp,
  limit
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

  const promises = collectionsToCheck.map(async (col) => {
    const localData = loadFromStorage(col.key);
    if (localData.length > 0) {
      try {
        const q = query(col.collection, where("userId", "==", userId), limit(1));
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
  });

  await Promise.all(promises);
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

let unsubCompras = null;
let unsubIdeas = null;
let unsubTareas = null;

export function initComprasSync() {
  const userId = appState.userId;
  if (!userId || unsubCompras) return; // Ya existe o no hay usuario

  const qCompras = query(collections.compras, where("userId", "==", userId), orderBy("creadoEn", "desc"), limit(appState.compras.limit));
  unsubCompras = onSnapshot(qCompras, (snapshot) => {
    appState.compras.items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      creadoEn: safeToMillis(doc.data().creadoEn)
    }));
    appState.compras.hasMore = snapshot.docs.length === appState.compras.limit;
    appState.compras.loading = false;
    appState.compras.hasRendered = false;
    saveToStorage(`${STORAGE_KEYS.compras}_${userId}`, appState.compras.items);
    notify();
  });
  appState.unsubscribes.push(unsubCompras);
}

export function initIdeasSync() {
  const userId = appState.userId;
  if (!userId || unsubIdeas) return;

  const qIdeas = query(collections.ideas, where("userId", "==", userId), orderBy("creadoEn", "desc"), limit(appState.ideas.limit));
  unsubIdeas = onSnapshot(qIdeas, (snapshot) => {
    appState.ideas.items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      creadoEn: safeToMillis(doc.data().creadoEn)
    }));
    appState.ideas.hasMore = snapshot.docs.length === appState.ideas.limit;
    appState.ideas.loading = false;
    appState.ideas.hasRendered = false;
    saveToStorage(`${STORAGE_KEYS.ideas}_${userId}`, appState.ideas.items);
    notify();
  });
  appState.unsubscribes.push(unsubIdeas);
}

export function initTareasSync() {
  const userId = appState.userId;
  if (!userId || unsubTareas) return;

  const qTareas = query(collections.tareas, where("userId", "==", userId), orderBy("creadoEn", "desc"), limit(appState.tareas.limit));
  unsubTareas = onSnapshot(qTareas, (snapshot) => {
    appState.tareas.items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      creadoEn: safeToMillis(doc.data().creadoEn),
      fechaLimite: doc.data().fechaLimite
    }));
    appState.tareas.hasMore = snapshot.docs.length === appState.tareas.limit;
    appState.tareas.loading = false;
    appState.tareas.hasRendered = false;
    saveToStorage(`${STORAGE_KEYS.tareas}_${userId}`, appState.tareas.items);
    notify();
  });
  appState.unsubscribes.push(unsubTareas);
}

export function loadMoreItems(type) {
  if (appState[type].hasMore) {
    appState[type].limit += 50;
    appState[type].loading = true;
    notify();
    
    // Forzamos reinicio de la suscripción con el nuevo límite
    if (type === 'compras' && unsubCompras) { unsubCompras(); unsubCompras = null; initComprasSync(); }
    else if (type === 'ideas' && unsubIdeas) { unsubIdeas(); unsubIdeas = null; initIdeasSync(); }
    else if (type === 'tareas' && unsubTareas) { unsubTareas(); unsubTareas = null; initTareasSync(); }
  }
}

export async function initFirestoreSync() {
  if (!appState.userId) return;

  if (appState.firestoreInitialized) return;
  appState.firestoreInitialized = true;

  const userId = appState.userId;
  appState.unsubscribes.forEach(fn => fn());
  appState.unsubscribes = [];
  unsubCompras = null;
  unsubIdeas = null;
  unsubTareas = null;

  await migrateDataIfNecessary(userId);

  // Inicializar solo la pestaña activa (Lazy loading)
  if (appState.activeTab === 'compras') initComprasSync();
  else if (appState.activeTab === 'ideas') initIdeasSync();
  else if (appState.activeTab === 'tareas') initTareasSync();
}
