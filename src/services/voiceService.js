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
  getCategoryLabel 
} from "../utils/formatting.js";

let recognition = null;
let voiceTimer = null;
let isLongPress = false;
const LONG_PRESS_DURATION = 600;

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
      processVoiceCapture(text);
    }
  };

  ideasNav.addEventListener('mousedown', () => { voiceTimer = setTimeout(startRecording, LONG_PRESS_DURATION); });
  ideasNav.addEventListener('touchstart', () => { voiceTimer = setTimeout(startRecording, LONG_PRESS_DURATION); }, { passive: true });
  window.addEventListener('mouseup', () => { clearTimeout(voiceTimer); if (ideasNav.classList.contains('recording')) stopRecording(); });
  window.addEventListener('touchend', () => { clearTimeout(voiceTimer); if (ideasNav.classList.contains('recording')) stopRecording(); });
}

async function processVoiceCapture(text) {
  const overlay = document.getElementById('voice-overlay');
  if (overlay) overlay.classList.add('analyzing');

  const result = await categorizeWithLLM(text);
  const items = result.items || [{ module: result.module, subcat: result.subcat, title: result.title }];
  let mainModule = items[0]?.module || 'ideas';

  try {
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
    
    if (overlay) {
      overlay.classList.remove('analyzing');
      overlay.classList.remove('active');
    }

    const message = items.length === 1 ? `Añadido a ${mainModule}` : `${items.length} elementos añadidos`;
    showVoiceToast(message, text, mainModule, null); // itemId passed as null for multi-items for now
    switchTab(mainModule);
  } catch (err) {
    showToast('Error al procesar voz', 'error');
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
        messages: [{ role: "system", content: "Categorize user input into: compras, tareas, ideas. Return JSON." }, { role: "user", content: text }]
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
  if (t.includes('comprar') || t.includes('traer')) return { module: 'compras', subcat: 'supermercado', title: cleanVoiceText(text) };
  if (t.includes('tengo que') || t.includes('debo')) return { module: 'tareas', subcat: 'media', title: cleanVoiceText(text) };
  return { module: 'ideas', subcat: null, title: cleanVoiceText(text) };
}

function showVoiceToast(message, originalText, category, itemId) {
  // Simplification: just a standard toast for now or basic version
  showToast(`${message}: "${originalText}"`, 'success');
}
