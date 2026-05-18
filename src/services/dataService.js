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

export async function updateTitle(id, type, newTitle) {
  try {
    const docRef = doc(db, type, id);
    const updateData = type === 'compras' ? { nombre: newTitle } : { titulo: newTitle };
    await updateDoc(docRef, updateData);
    showToast('Título actualizado', 'success');
  } catch (err) {
    console.error('Error updating title:', err);
    showToast('Error al actualizar título', 'error');
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
      processedData.nombre = capitalizeFirstLetter(processedData.nombre);
    }
    if (processedData.titulo) {
      processedData.titulo = capitalizeFirstLetter(processedData.titulo);
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
