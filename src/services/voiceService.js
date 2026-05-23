import { 
  addDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { collections } from "../firebase.js";
import { appState } from "../store.js";
import { showToast } from "../ui/components/toast.js";
import { switchTab } from "../ui/navigation.js";
import { 
  cleanVoiceText, 
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
      itemsRaw = splitIntoItems(text, module);
    } else if (itemsRaw.length === 1 && typeof itemsRaw[0] === 'string' && hasMultipleItems(itemsRaw[0], module)) {
      itemsRaw = splitIntoItems(itemsRaw[0], module);
    }

    const getDefaultSubcat = (mod) => {
      if (mod === 'compras') return 'supermercado';
      if (mod === 'tareas') return null;
      return null;
    };

    const items = itemsRaw.map(item => {
      const title = typeof item === 'string' ? item : (item.title || item.name || item.product || '');
      let notes = typeof item === 'object' ? (item.notes || item.detail || item.description || '') : '';
      if (!title) return null;

      // Para ideas: usar el resumen de la IA como título y guardar texto original en notas
      if (module === 'ideas') {
        const finalTitle = typeof item === 'object' && item.title ? item.title : title;
        return { 
          module, 
          subcat: null, 
          title: cleanVoiceText(finalTitle),
          notes: text.trim() // Siempre guardamos el original completo
        };
      }

      return { 
        module, 
        subcat: result.subcat || getDefaultSubcat(module), 
        title: cleanVoiceText(title),
        notes: notes.trim() || ''
      };
    }).filter(Boolean);

    let mainModule = items[0]?.module || 'ideas';

    let currentMinPos = {
      compras: appState.compras?.items?.reduce((min, i) => {
        const pos = Number(i.posicion);
        return (!isNaN(pos)) ? Math.min(min, pos) : min;
      }, 0) || 0,
      tareas: appState.tareas?.items?.reduce((min, i) => {
        const pos = Number(i.posicion);
        return (!isNaN(pos)) ? Math.min(min, pos) : min;
      }, 0) || 0,
      ideas: appState.ideas?.items?.reduce((min, i) => {
        const pos = Number(i.posicion);
        return (!isNaN(pos)) ? Math.min(min, pos) : min;
      }, 0) || 0,
    };

    const writePromises = items.filter(i => i.title).map(({ module, subcat, title, notes }) => {
      if (module === 'compras') {
        currentMinPos.compras -= 1;
        return addDoc(collections.compras, { nombre: title, categoria: subcat || 'supermercado', prioridad: false, posicion: currentMinPos.compras, completado: false, creadoEn: serverTimestamp(), userId: appState.userId });
      } else if (module === 'tareas') {
        currentMinPos.tareas -= 1;
        return addDoc(collections.tareas, { titulo: title, prioridad: subcat || null, posicion: currentMinPos.tareas, fechaLimite: null, notas: notes || '', completado: false, creadoEn: serverTimestamp(), userId: appState.userId });
      } else {
        currentMinPos.ideas -= 1;
        return addDoc(collections.ideas, { titulo: title, notas: notes || '', prioridad: false, posicion: currentMinPos.ideas, archivada: false, creadoEn: serverTimestamp(), userId: appState.userId });
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
        messages: [{ 
          role: "system", 
          content: "You are a smart task organizer. For compras (shopping lists): return {category: 'compras', items: ['Item 1', 'Item 2', ...]}. If the user lists many items even without commas or 'and', split them (e.g., 'pan huevo leche' -> ['Pan', 'Huevo', 'Leche']). For tareas: return {category: 'tareas', items: [{title: 'Action', notes: 'Detail'}]}. For ideas: return {category: 'ideas', items: [{title: 'Summary', notes: 'Full original text'}]}. ONLY return the JSON object." 
        }, { 
          role: "user", 
          content: `Analyze this text and categorize it: "${text}". Examples: 'comprar pan huevo leche' -> {"category": "compras", "items": ["Pan", "Huevo", "Leche"]}. 'recordar llamar a juan mañana' -> {"category": "tareas", "items": [{"title": "Llamar a Juan", "notes": "Mañana"}]}.` 
        }]
      })
    });
    const data = await response.json();
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    const result = JSON.parse(jsonMatch[0]);
    return result;
  } catch (e) {
    return categorizeInputHeuristic(text);
  }
}

function containsWholeWord(text, wordsList) {
  return wordsList.some(word => {
    const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ])${escapedWord}(?:$|[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ])`, 'i');
    return regex.test(text);
  });
}

function categorizeInputHeuristic(text) {
  const t = text.toLowerCase().trim();

  const ideaIndicators = [
    'idea de', 'idea para', 'idea sobre', 'mi idea', 
    'ocurrio', 'ocurrió', 'pensamiento', 'reflexion', 'reflexión', 
    'notas de', 'nota de', 'anotación', 'anotacion', 
    'recordar que', 'pensar en'
  ];

  const shoppingKeywords = [
    'comprar', 'compra', 'compras', 'traer', 'supermercado', 'despensa', 
    'tienda', 'almacen', 'almacén', 'fruteria', 'frutería', 'verduleria', 
    'verdulería', 'carniceria', 'carnicería', 'panaderia', 'panadería', 
    'botica', 'farmacia'
  ];

  const taskKeywords = [
    'mejorar', 'crear', 'diseñar', 'desarrollar', 'hacer', 'llamar', 'revisar', 'enviar', 
    'programar', 'preparar', 'escribir', 'terminar', 'actualizar', 'arreglar', 'corregir', 
    'agregar', 'añadir', 'configurar', 'implementar', 'maquetar', 'buscar', 'estudiar', 
    'aprender', 'investigar', 'limpiar', 'ordenar', 'organizar', 'probar', 'verificar', 
    'validar', 'analizar', 'completar', 'instalar', 'subir', 'publicar', 'cambiar', 
    'eliminar', 'borrar', 'resolver', 'reparar', 'optimizar', 'integrar', 'desplegar', 
    'testear',
    'mejora', 'crea', 'diseña', 'desarrolla', 'haz', 'llama', 'revisa', 'envía', 'envia',
    'programa', 'prepara', 'escribe', 'termina', 'actualiza', 'arregla', 'corrige', 
    'agrega', 'añade', 'configura', 'implementa', 'maqueta', 'busca', 'estudia', 
    'aprende', 'investiga', 'limpia', 'ordena', 'organiza', 'verifica', 
    'valida', 'analiza', 'completa', 'instala', 'sube', 'publica', 'cambia', 
    'elimina', 'borra', 'resuelve', 'repara', 'optimiza', 'integra', 'despliega',
    'tengo que', 'debo', 'hay que', 'toca', 'pendiente',
    'dejar', 'deja', 'poner', 'pon', 'llevar', 'lleva', 'guardar', 'guarda', 'sacar', 'saca'
  ];

  let module = 'ideas';
  let subcat = null;

  if (ideaIndicators.some(ind => t.includes(ind))) {
    module = 'ideas';
    subcat = null;
  } else if (containsWholeWord(t, shoppingKeywords)) {
    module = 'compras';
    subcat = 'supermercado';
  } else if (containsWholeWord(t, taskKeywords)) {
    module = 'tareas';
    subcat = false;
  } else if (containsWholeWord(t, ['necesito', 'falta', 'faltan'])) {
    module = 'compras';
    subcat = 'supermercado';
  }

  const cleanedText = cleanVoiceText(text);
  const separatedItems = splitIntoItems(cleanedText, module);
  if (separatedItems.length > 1) {
    return { module, subcat, items: separatedItems.map(item => ({ title: cleanVoiceText(item), notes: '' })) };
  }

  // Para ideas: guardar texto completo en notes y crear resumen de 4 palabras
  if (module === 'ideas') {
    const words = text.split(' ').slice(0, 4).join(' ');
    const summary = words.charAt(0).toUpperCase() + words.slice(1);
    return { 
      module, 
      subcat: null, 
      items: [{ 
        title: summary || 'Nueva idea', 
        notes: text
      }] 
    };
  }

  if (module !== 'compras') {
    const separators = [
      { char: ',', maxPos: 40 },
      { char: '.', maxPos: 50 },
      { char: '-', maxPos: 40 },
      { char: 'porque', maxPos: 45, isWord: true },
      { char: 'para', maxPos: 35, isWord: true },
      { char: 'sobre', maxPos: 35, isWord: true },
      { char: 'ya que', maxPos: 40, isWord: true },
      { char: 'pues', maxPos: 35, isWord: true }
    ];
    
    let splitPos = -1;
    let separator = '';
    
    for (const sep of separators) {
      let pos;
      if (sep.isWord) {
        pos = text.toLowerCase().indexOf(' ' + sep.char + ' ');
      } else {
        pos = text.indexOf(sep.char);
      }
      
      if (pos > 5 && pos < sep.maxPos) {
        splitPos = pos;
        separator = sep.char;
        break;
      }
    }

    if (splitPos > 0) {
      const title = text.substring(0, splitPos).trim();
      const notes = text.substring(splitPos + (separator.length > 1 ? separator.length + 2 : 1)).trim();
      return { 
        module, 
        subcat, 
        items: [{ title: cleanVoiceText(title), notes: cleanVoiceText(notes) }] 
      };
    }
  }

  return { module, subcat, items: [{ title: cleanVoiceText(text), notes: '' }] };
}

function showVoiceToast(message, originalText, category, itemId) {
  // Simplification: just a standard toast for now or basic version
  showToast(`${message}: "${originalText}"`, 'success');
}
