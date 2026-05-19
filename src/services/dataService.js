import { 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
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
    const field = type === 'ideas' ? 'archivada' : 'completado';
    await updateDoc(docRef, { [field]: !currentStatus });
    
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
