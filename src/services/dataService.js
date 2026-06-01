import { 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  writeBatch,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { db, collections } from "../firebase.js";
import { appState } from "../store.js";
import { showToast } from "../ui/components/toast.js";
import { capitalizeFirstLetter } from "../utils/formatting.js";

const MAX_TEXT_LENGTH = 1000;

function sanitizeAndValidate(text, maxLength = MAX_TEXT_LENGTH) {
  if (!text) return '';
  const trimmed = text.trim();
  return trimmed.substring(0, maxLength);
}

export async function updateTitle(id, type, newTitle) {
  try {
    const sanitizedTitle = sanitizeAndValidate(newTitle, 200);
    if (!sanitizedTitle) throw new Error('Title is required');

    const docRef = doc(db, type, id);
    const updateData = type === 'compras' ? { nombre: sanitizedTitle } : { titulo: sanitizedTitle };
    await updateDoc(docRef, updateData);
    showToast('Título actualizado', 'success');
  } catch (err) {
    console.error('Error updating title:', err);
    showToast('Error al actualizar título', 'error');
  }
}

export async function updateNotes(id, type, notes) {
  try {
    const sanitizedNotes = sanitizeAndValidate(notes, MAX_TEXT_LENGTH);
    const docRef = doc(db, type, id);
    await updateDoc(docRef, { notas: sanitizedNotes });
    return true;
  } catch (err) {
    console.error('Error updating notes:', err);
    showToast('Error al guardar notas', 'error');
    return false;
  }
}

export async function updateItemField(id, type, field, value) {
  try {
    const docRef = doc(db, type, id);
    await updateDoc(docRef, { [field]: value });
    return true;
  } catch (err) {
    console.error(`Error updating ${field}:`, err);
    showToast('Error al actualizar', 'error');
    return false;
  }
}

/**
 * Updates metadata for a task (e.g., priority, due date)
 * @param {string} id - Task ID
 * @param {Object} data - Metadata object
 */
export async function updateTaskMeta(id, data) {
  try {
    const docRef = doc(db, 'tareas', id);
    await updateDoc(docRef, data);
    return true;
  } catch (err) {
    console.error('Error updating task meta:', err);
    showToast('Error al actualizar', 'error');
    return false;
  }
}

export async function toggleCompleted(id, type, currentStatus) {
  const isCompleted = currentStatus === true || currentStatus === 'true';
  const nextVal = !isCompleted;

  // 1. Actualización Optimista en el DOM
  const card = document.querySelector(`.item-card[data-id="${id}"]`);
  const checkbox = card?.querySelector('.checkbox');
  if (card && checkbox) {
    if (type === 'ideas') {
      card.classList.toggle('completed', nextVal);
      checkbox.classList.toggle('checked', nextVal);
    } else if (type === 'tareas') {
      if (isCompleted) {
        // Al desmarcar tarea completada (volver a pendiente)
        card.classList.remove('completed');
        checkbox.classList.remove('checked');
      } else {
        // Al marcar tarea como completada
        card.classList.add('completed');
        checkbox.classList.add('checked');
      }
    } else if (type === 'compras') {
      card.classList.toggle('completed', nextVal);
      checkbox.classList.toggle('checked', nextVal);
    }
  }

  // 2. Actualización Optimista en el Store
  const itemIndex = appState[type].items.findIndex(i => i.id === id);
  let oldItem = null;
  if (itemIndex !== -1) {
    oldItem = { ...appState[type].items[itemIndex] };
    const field = type === 'ideas' ? 'archivada' : 'completado';
    appState[type].items[itemIndex][field] = nextVal;

    if (type === 'tareas' && isCompleted) {
      appState[type].items[itemIndex].archivada = false;
    }
    // Omitimos re-render completo para no perder focos o animaciones bruscas
    // pero notificamos cambios de contadores de la stats-bar
    appState[type].hasRendered = true; // Evitar animaciones de entrada repetidas
  }

  // Actualizar stats-bar locales inmediatamente sin re-renderizar la lista
  updateStatsBar(type);

  try {
    const docRef = doc(db, type, id);
    
    if (type === 'tareas' && isCompleted) {
      const pendingItems = appState.tareas.items.filter(i => !i.completado && !i.archivada);
      const minPos = pendingItems.reduce((min, i) => {
        const pos = Number(i.posicion);
        return (!isNaN(pos)) ? Math.min(min, pos) : min;
      }, 0);
      
      const updateData = { 
        completado: false, 
        archivada: false,
        posicion: minPos - 1
      };
      
      if (itemIndex !== -1) {
        appState[type].items[itemIndex].posicion = updateData.posicion;
      }
      
      await updateDoc(docRef, updateData);
    } else {
      const field = type === 'ideas' ? 'archivada' : 'completado';
      const updateData = { [field]: nextVal };
      
      if (type === 'compras' && nextVal === false) {
        const pendingItems = appState.compras.items.filter(i => !i.completado);
        const minPos = pendingItems.reduce((min, i) => {
          const pos = Number(i.posicion);
          return (!isNaN(pos)) ? Math.min(min, pos) : min;
        }, 0);
        updateData.posicion = minPos - 1;
        
        if (itemIndex !== -1) {
          appState[type].items[itemIndex].posicion = updateData.posicion;
        }
      }
      
      await updateDoc(docRef, updateData);
    }
    
    let message = '';
    if (type === 'ideas') message = !currentStatus ? 'Idea archivada' : 'Idea restaurada';
    else message = !currentStatus ? 'Marcado como completado' : 'Marcado como pendiente';
    
    showToast(message, !currentStatus ? 'success' : 'revert');
  } catch (err) {
    console.error('Error updating status:', err);
    showToast('Error al actualizar', 'error');

    // Revertir DOM si falla
    if (card && checkbox) {
      if (type === 'ideas' || type === 'compras') {
        card.classList.toggle('completed', isCompleted);
        checkbox.classList.toggle('checked', isCompleted);
      } else if (type === 'tareas') {
        card.classList.toggle('completed', isCompleted);
        checkbox.classList.toggle('checked', isCompleted);
      }
    }

    // Revertir Store si falla
    if (itemIndex !== -1 && oldItem) {
      appState[type].items[itemIndex] = oldItem;
      updateStatsBar(type);
    }
  }
}

// Función auxiliar para actualizar los contadores superiores de la stats-bar sin destruir la lista
function updateStatsBar(type) {
  const section = document.getElementById(`${type}-section`);
  if (!section) return;
  const statsBar = section.querySelector('.stats-bar');
  if (!statsBar) return;

  const items = appState[type].items;

  if (type === 'compras') {
    const counts = {
      supermercado: items.filter(i => i.categoria === 'supermercado').length,
      internet: items.filter(i => i.categoria === 'internet').length,
      farmacia: items.filter(i => i.categoria === 'farmacia').length
    };
    const CATEGORIES = ['supermercado', 'internet', 'farmacia'];
    CATEGORIES.forEach(cat => {
      const itemEl = statsBar.querySelector(`[data-filter="${cat}"] .stat-value`);
      if (itemEl) itemEl.textContent = counts[cat];
    });
  } else if (type === 'tareas') {
    const totalTareas = items.filter(i => !i.archivada).length;
    const archivedTareas = items.filter(i => i.archivada).length;
    const pendingTareas = items.filter(i => !i.completado && !i.archivada).length;

    const totalEl = statsBar.querySelector('[data-filter="todas"] .stat-value');
    const doneEl = statsBar.querySelector('[data-filter="archivadas"] .stat-value');
    const pendingEl = statsBar.querySelector('[data-filter="pendientes"] .stat-value');

    if (totalEl) totalEl.textContent = totalTareas;
    if (doneEl) doneEl.textContent = archivedTareas;
    if (pendingEl) pendingEl.textContent = pendingTareas;
  } else if (type === 'ideas') {
    const totalIdeas = items.length;
    const archivedIdeas = items.filter(i => i.archivada).length;

    const totalEl = statsBar.querySelector('.stat-item:nth-child(1) .stat-value');
    const doneEl = statsBar.querySelector('.stat-item:nth-child(2) .stat-value');
    const pendingEl = statsBar.querySelector('.stat-item:nth-child(3) .stat-value');

    if (totalEl) totalEl.textContent = totalIdeas;
    if (doneEl) doneEl.textContent = archivedIdeas;
    if (pendingEl) pendingEl.textContent = totalIdeas - archivedIdeas;
  }
}

export async function deleteItem(id, type) {
  try {
    await deleteDoc(doc(db, type, id));
    showToast('Eliminado correctamente', 'success');
  } catch (err) {
    console.error('Error deleting item:', err);
    showToast('Error al eliminar', 'error');
  }
}

export async function addItem(type, data) {
  try {
    const processedData = { ...data };
    
    if (processedData.nombre) {
      processedData.nombre = capitalizeFirstLetter(sanitizeAndValidate(processedData.nombre, 200));
      if (!processedData.nombre) return false;
    }
    if (processedData.titulo) {
      processedData.titulo = capitalizeFirstLetter(sanitizeAndValidate(processedData.titulo, 200));
      if (!processedData.titulo) return false;
    }
    if (processedData.notas) {
      processedData.notas = sanitizeAndValidate(processedData.notas, MAX_TEXT_LENGTH);
    }

    // Initialize position to be at the top
    const currentItems = appState[type].items;
    const minPos = currentItems.reduce((min, i) => {
      const pos = Number(i.posicion);
      return (!isNaN(pos)) ? Math.min(min, pos) : min;
    }, 0);
    processedData.posicion = minPos - 1;

    await addDoc(collections[type], {
      ...processedData,
      creadoEn: new Date(),
      userId: appState.userId
    });
    return true;
  } catch (err) {
    console.error('Error adding item:', err);
    showToast('Error al añadir', 'error');
    return false;
  }
}

export async function moveItem(id, fromType, toType) {
  try {
    const item = appState[fromType].items.find(i => i.id === id);
    if (!item) return false;

    const newItem = {
      creadoEn: item.creadoEn || new Date(),
      userId: appState.userId
    };

    // Title mapping
    const title = item.titulo || item.nombre || '';
    if (toType === 'compras') newItem.nombre = title;
    else newItem.titulo = title;

    // Status mapping
    const isDone = item.completado !== undefined ? item.completado : !!item.archivada;
    if (toType === 'ideas') newItem.archivada = isDone;
    else newItem.completado = isDone;

    // Notes mapping (if target supports it)
    if (toType !== 'compras') {
      newItem.notas = item.notas || '';
    }

    // Default values for specifics
    newItem.prioridad = toType === 'tareas' ? null : false;
    if (toType === 'compras') newItem.categoria = 'supermercado';
    if (toType === 'tareas') {
      newItem.fechaLimite = null;
    }

    // Set position to the top of the new list
    const currentItems = appState[toType].items;
    const minPos = currentItems.reduce((min, i) => {
      const pos = Number(i.posicion);
      return (!isNaN(pos)) ? Math.min(min, pos) : min;
    }, 0);
    newItem.posicion = minPos - 1;
    newItem.creadoEn = new Date();

    await addDoc(collections[toType], newItem);
    await deleteDoc(doc(db, fromType, id));
    return true;
  } catch (err) {
    console.error('Error moving item:', err);
    showToast('Error al mover elemento', 'error');
    return false;
  }
}

export async function reorderItem(id, type, direction, sortedItems) {
  try {
    const currentIndex = sortedItems.findIndex(i => i.id === id);
    if (currentIndex === -1) return false;

    const neighborIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (neighborIndex < 0 || neighborIndex >= sortedItems.length) return false;

    const currentItem = sortedItems[currentIndex];
    const neighborItem = sortedItems[neighborIndex];

    const currentDone = currentItem.completado !== undefined ? currentItem.completado : !!currentItem.archivada;
    const neighborDone = neighborItem.completado !== undefined ? neighborItem.completado : !!neighborItem.archivada;
    if (currentDone !== neighborDone) return false;

    const currentPos = (typeof currentItem.posicion === 'number' && !isNaN(currentItem.posicion)) ? currentItem.posicion : currentIndex;
    const neighborPos = (typeof neighborItem.posicion === 'number' && !isNaN(neighborItem.posicion)) ? neighborItem.posicion : neighborIndex;

    const docRef = doc(db, type, currentItem.id);
    const neighborRef = doc(db, type, neighborItem.id);

    let newCurrentPos = neighborPos;
    let newNeighborPos = currentPos;
    
    if (newCurrentPos === newNeighborPos) {
      newCurrentPos = direction === 'up' ? neighborPos - 1 : neighborPos + 1;
    }

    await updateDoc(docRef, { posicion: newCurrentPos });
    await updateDoc(neighborRef, { posicion: newNeighborPos });

    return true;
  } catch (err) {
    console.error('Error reordering item:', err);
    showToast('Error al reordenar', 'error');
    return false;
  }
}

export async function archiveCompletedTasks(userId) {
  if (!userId) return 0;
  try {
    // Consultamos directamente la base de datos de forma limpia
    const q = query(
      collections.tareas,
      where("userId", "==", userId),
      where("completado", "==", true),
      where("archivada", "!=", true)
    );

    const querySnapshot = await getDocs(q);
    // Procesamos el lote de forma directa y sencilla
    const batch = writeBatch(db);
    querySnapshot.docs.forEach(taskDoc => {
      const docRef = doc(db, 'tareas', taskDoc.id);
      batch.update(docRef, { archivada: true });
    });

    await batch.commit();
    console.log(`[TaskArchiver] ${querySnapshot.docs.length} tareas archivadas`);
    return querySnapshot.docs.length;
  } catch (err) {
    console.error('[TaskArchiver] Error al archivar:', err);
    return 0;
  }
}
