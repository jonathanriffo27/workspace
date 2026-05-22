import { 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  writeBatch
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
  try {
    const docRef = doc(db, type, id);
    const isCompleted = currentStatus === true || currentStatus === 'true';
    
    if (type === 'tareas' && isCompleted) {
      const pendingItems = appState.tareas.items.filter(i => !i.completado && !i.archivada);
      const minPos = pendingItems.reduce((min, i) => {
        const pos = Number(i.posicion);
        return (!isNaN(pos)) ? Math.min(min, pos) : min;
      }, 0);
      await updateDoc(docRef, { 
        completado: false, 
        archivada: false,
        posicion: minPos - 1
      });
    } else {
      const field = type === 'ideas' ? 'archivada' : 'completado';
      const nextVal = !isCompleted;
      const updateData = { [field]: nextVal };
      
      if (type === 'compras' && nextVal === false) {
        const pendingItems = appState.compras.items.filter(i => !i.completado);
        const minPos = pendingItems.reduce((min, i) => {
          const pos = Number(i.posicion);
          return (!isNaN(pos)) ? Math.min(min, pos) : min;
        }, 0);
        updateData.posicion = minPos - 1;
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

export async function archiveCompletedTasks() {
  try {
    const completedTasks = appState.tareas.items.filter(
      t => t.completado === true && t.archivada !== true
    );

    if (completedTasks.length === 0) return 0;

    const batch = writeBatch(db);
    completedTasks.forEach(task => {
      const docRef = doc(db, 'tareas', task.id);
      batch.update(docRef, { archivada: true });
    });

    await batch.commit();
    console.log(`[TaskArchiver] ${completedTasks.length} tareas archivadas`);
    return completedTasks.length;
  } catch (err) {
    console.error('[TaskArchiver] Error archiving tasks:', err);
    showToast('Error al archivar tareas', 'error');
    return 0;
  }
}
