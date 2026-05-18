import { 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";
import { collections, db } from "../firebase.js";
import { appState } from "../store.js";
import { showToast } from "../ui/components/toast.js";
import { switchTab } from "../ui/navigation.js";
import { 
  capitalizeFirstLetter, 
  cleanVoiceText, 
  getCategoryLabel,
  splitIntoItems,
  hasMultipleItems
} from "../utils/formatting.js";

let recognition = null;
let voiceTimer = null;
let isLongPress = false;
let processingToast = null;
const LONG_PRESS_DURATION = 600;
const TIMEOUT_MS = 25000;

export function initVoiceCapture() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;

  recognition = new SpeechRecognition();
  recognition.lang = 'es-ES';
  recognition.continuous = true;
  recognition.interimResults = true;

  const overlay = document.getElementById('voice-overlay');
  const transcriptEl = document.getElementById('voice-transcript');
  const ideasNav = document.querySelector('.nav-item[data-tab="ideas"]');

  if (!ideasNav) return;

  const startRecording = () => {
    try {
      isLongPress = true;
      try { recognition.stop(); } catch(e) {}
      recognition.start();
      overlay.classList.add('active');
      ideasNav.classList.add('recording');
      transcriptEl.textContent = 'Habla ahora...';
      if ('vibrate' in navigator) navigator.vibrate(50);
    } catch (e) {
      showToast('Error al iniciar micrófono', 'error');
    }
  };

  const stopRecording = () => {
    try { recognition.stop(); } catch(e) {}
    overlay.classList.remove('active');
    ideasNav.classList.remove('recording');
    setTimeout(() => { isLongPress = false; }, 150);
  };

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
      else interimTranscript += event.results[i][0].transcript;
    }
    const resultText = finalTranscript || interimTranscript;
    if (resultText) {
      transcriptEl.textContent = resultText;
      transcriptEl.dataset.hasContent = 'true';
    }
  };

  recognition.onend = () => {
    const text = transcriptEl.dataset.hasContent === 'true' ? transcriptEl.textContent.trim() : '';
    overlay.classList.remove('active');
    ideasNav.classList.remove('recording');
    delete transcriptEl.dataset.hasContent;

    if (text && text.length > 1) {
      const container = document.getElementById('toast-container');
      if (container) {
        processingToast = document.createElement('div');
        processingToast.className = 'toast info processing';
        processingToast.innerHTML = `
          <span class="toast-icon">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--accent-primary)" stroke-width="2.5" stroke-linecap="round">
              <circle cx="12" cy="12" r="9" stroke-opacity="0.25"/>
              <path d="M12 3a9 9 0 0 1 9 9" stroke-dasharray="40 100"/>
            </svg>
          </span>
          <span class="toast-message">Procesando audio...</span>
        `;
        container.appendChild(processingToast);
      }
      processVoiceCapture(text);
    }
  };

  ideasNav.addEventListener('mousedown', () => { voiceTimer = setTimeout(startRecording, LONG_PRESS_DURATION); });
  ideasNav.addEventListener('touchstart', () => { voiceTimer = setTimeout(startRecording, LONG_PRESS_DURATION); }, { passive: true });
  window.addEventListener('mouseup', () => { clearTimeout(voiceTimer); if (ideasNav.classList.contains('recording')) stopRecording(); });
  window.addEventListener('touchend', () => { clearTimeout(voiceTimer); if (ideasNav.classList.contains('recording')) stopRecording(); });
}

async function processVoiceCapture(text) {
  const timeoutId = setTimeout(() => {
    if (processingToast) {
      processingToast.remove();
      processingToast = null;
    }
    showToast('Tiempo de procesamiento agotado. Intenta de nuevo.', 'error');
  }, TIMEOUT_MS);

  const statusEl = document.querySelector('.voice-status');
  const overlay = document.getElementById('voice-overlay');

  if (statusEl) statusEl.textContent = 'Analizando con IA...';
  if (overlay) overlay.classList.add('analyzing');

  try {
    const result = await categorizeWithLLM(text);

    const module = result.category || result.module || 'ideas';

    let itemsRaw = result.items || result.titles || result.products || result.elements;

    if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
      const separatedItems = splitIntoItems(text);
      itemsRaw = separatedItems;
    } else if (itemsRaw.length === 1 && typeof itemsRaw[0] === 'string' && hasMultipleItems(itemsRaw[0])) {
      const separatedItems = splitIntoItems(itemsRaw[0]);
      itemsRaw = separatedItems;
    }

    const items = itemsRaw.map(item => {
      const title = typeof item === 'string' ? item : (item.title || item.name || item.product || '');
      if (!title) return null;
      return { module, subcat: result.subcat || 'supermercado', title: cleanVoiceText(title) };
    }).filter(Boolean);

    let mainModule = items[0]?.module || 'ideas';

    const writePromises = items.filter(i => i.title).map(({ module, subcat, title }) => {
      if (module === 'compras') {
        return addDoc(collections.compras, { nombre: title, categoria: subcat || 'supermercado', completado: false, creadoEn: serverTimestamp(), userId: appState.userId });
      } else if (module === 'tareas') {
        return addDoc(collections.tareas, { titulo: title, prioridad: subcat || 'media', fechaLimite: null, notas: '', completado: false, creadoEn: serverTimestamp(), userId: appState.userId });
      } else {
        return addDoc(collections.ideas, { titulo: title, notas: '', archivada: false, creadoEn: serverTimestamp(), userId: appState.userId });
      }
    });

    await Promise.all(writePromises);

    clearTimeout(timeoutId);
    if (processingToast) {
      processingToast.remove();
      processingToast = null;
    }

    if (overlay) {
      overlay.classList.remove('analyzing');
      overlay.classList.remove('active');
    }
    if (statusEl) statusEl.textContent = 'Escuchando...';

    const message = items.length === 1 ? `Añadido a ${mainModule}` : `${items.length} elementos añadidos`;
    showVoiceToast(message, text, mainModule, null);
    switchTab(mainModule);
  } catch (err) {
    clearTimeout(timeoutId);
    if (processingToast) {
      processingToast.remove();
      processingToast = null;
    }
    showToast('Error al procesar voz', 'error');
    if (overlay) {
      overlay.classList.remove('analyzing');
      overlay.classList.remove('active');
    }
    if (statusEl) statusEl.textContent = 'Escuchando...';
  }
}

async function categorizeWithLLM(text) {
  const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!API_KEY) return categorizeInputHeuristic(text);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [{ role: "system", content: "You are a smart organizer. When user says multiple things (like 'lechuga, tomate y zanahoria' or 'comprar pan y leche'), split them into separate items. Return JSON with 'category' (compras/tareas/ideas) and 'items' (array of strings). Example: 'comprar leche pan y queso' -> {category: 'compras', items: ['Leche', 'Pan', 'Queso']}. Example: 'tengo que llamar a juan y terminar informe' -> {category: 'tareas', items: ['Llamar a Juan', 'Terminar informe']}" }, { role: "user", content: text }]
      })
    });
    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content.match(/\{.*\}/s)[0]);
    return result;
  } catch (e) {
    return categorizeInputHeuristic(text);
  }
}

function categorizeInputHeuristic(text) {
  const t = text.toLowerCase();
  let module = 'ideas';
  let subcat = null;

  if (t.includes('comprar') || t.includes('traer') || t.includes('necesito') || t.includes('falta')) {
    module = 'compras';
    subcat = 'supermercado';
  } else if (t.includes('tengo que') || t.includes('debo')) {
    module = 'tareas';
    subcat = 'media';
  }

  // Usar splitIntoItems para separar múltiples items
  const items = splitIntoItems(text);
  if (items.length > 1) {
    return { module, subcat, items };
  }
  return { module, subcat, items: [cleanVoiceText(text)] };
}

function showVoiceToast(message, originalText, category, itemId) {
  // Simplification: just a standard toast for now or basic version
  showToast(`${message}: "${originalText}"`, 'success');
}
