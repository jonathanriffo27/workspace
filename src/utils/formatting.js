export function getCategoryLabel(cat) {
  const labels = { supermercado: 'Supermercado', internet: 'Internet', farmacia: 'Farmacia', otros: 'Otros' };
  return labels[cat] || cat;
}

export function getPriorityLabel(pri) {
  const labels = { alta: 'Alta', media: 'Media', baja: 'Baja' };
  return labels[pri] || pri;
}

export function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'Hoy';
  if (date.toDateString() === tomorrow.toDateString()) return 'Mañana';

  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function capitalizeFirstLetter(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const TASK_ACTION_WORDS = [
  'mejorar', 'crear', 'diseñar', 'desarrollar', 'hacer', 'llamar', 'revisar', 'enviar',
  'programar', 'preparar', 'escribir', 'terminar', 'actualizar', 'arreglar', 'corregir',
  'agregar', 'añadir', 'configurar', 'implementar', 'maquetar', 'buscar', 'estudiar',
  'aprender', 'investigar', 'limpiar', 'ordenar', 'organizar', 'probar', 'verificar',
  'validar', 'analizar', 'completar', 'instalar', 'subir', 'publicar', 'cambiar',
  'eliminar', 'borrar', 'resolver', 'reparar', 'optimizar', 'integrar', 'desplegar',
  'testear', 'dejar', 'poner', 'llevar', 'guardar', 'sacar', 'comprar'
];

function normalizeVoiceItem(item) {
  return item.trim().replace(/\s+/g, ' ');
}

function isTaskLikeSegment(segment) {
  const normalized = normalizeVoiceItem(segment).toLowerCase();
  if (!normalized) return false;

  return TASK_ACTION_WORDS.some(word =>
    normalized === word || normalized.startsWith(word + ' ')
  );
}

function splitByPattern(items, pattern) {
  return items.flatMap(item => item.split(pattern).map(normalizeVoiceItem).filter(Boolean));
}

function splitTaskConjunctions(items) {
  const result = [];

  items.forEach(item => {
    const normalized = normalizeVoiceItem(item);
    const parts = normalized.split(/\s+(y|e)\s+/i);

    if (parts.length < 3) {
      result.push(normalized);
      return;
    }

    let current = normalizeVoiceItem(parts[0]);

    for (let i = 1; i < parts.length; i += 2) {
      const conjunction = parts[i];
      const next = normalizeVoiceItem(parts[i + 1] || '');

      if (current && next && isTaskLikeSegment(current) && isTaskLikeSegment(next)) {
        result.push(current);
        current = next;
      } else {
        current = normalizeVoiceItem(current + ' ' + conjunction + ' ' + next);
      }
    }

    if (current) result.push(current);
  });

  return result;
}

export function hasMultipleItems(text, module = 'generic') {
  return splitIntoItems(text, module).length > 1;
}

export function splitIntoItems(text, module = 'generic') {
  let items = [normalizeVoiceItem(text)];

  if (module === 'compras') {
    const mainSeparators = [
      /\s+y\s+/gi,
      /\s+e\s+/gi,
      /,\s*/g,
      /\s+más\s+/gi,
      /\s+además\s+de\s+/gi
    ];

    mainSeparators.forEach(pattern => {
      items = splitByPattern(items, pattern);
    });

    // Smart space-based splitting for remaining segments
    const connectors = ['de', 'del', 'con', 'en', 'para', 'a', 'al'];
    const articles = ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'mi', 'mis'];
    const quantifiers = ['kilo', 'kilos', 'gramos', 'gr', 'litro', 'litros', 'paquete', 'paquetes', 'bote', 'botes', 'lata', 'latas', 'docena', 'docenas', 'media', 'medio'];

    return items.flatMap(segment => {
      const words = segment.split(/\s+/);
      if (words.length <= 1) return segment;

      const result = [];
      let currentItem = [];

      for (let i = 0; i < words.length; i++) {
        const word = words[i].toLowerCase();
        const nextWord = words[i + 1]?.toLowerCase();
        
        currentItem.push(words[i]);

        // Decidir si el siguiente espacio es un separador o parte del mismo item
        // NO separamos si:
        // 1. La palabra actual es un artículo o cuantificador (ej: "un", "kilo")
        // 2. La siguiente palabra es un conector (ej: "de", "con")
        // 3. La palabra actual es un conector (ej: "aceite de" -> no separar aquí)
        
        const isArticle = articles.includes(word);
        const isQuantifier = quantifiers.includes(word);
        const isConnector = connectors.includes(word);
        const nextIsConnector = nextWord && connectors.includes(nextWord);

        const shouldKeepTogether = isArticle || isQuantifier || isConnector || nextIsConnector;

        if (!shouldKeepTogether && i < words.length - 1) {
          result.push(currentItem.join(' '));
          currentItem = [];
        }
      }

      if (currentItem.length > 0) {
        result.push(currentItem.join(' '));
      }

      return result;
    });
  }

  items = splitByPattern(items, /(?:\s*[;,]\s*|\s*\.\s+|\n+)/g);

  if (module === 'tareas') {
    items = splitTaskConjunctions(items);
  }

  return items;
}

export function cleanVoiceText(text) {
  const prefixes = [
    'comprar', 'traer', 'necesito', 'falta', 'lista de',
    'tengo que', 'hay que', 'debo', 'recordar', 'poner', 'anotar',
    'toca ', 'pon ', 'ponme ', 'añadir ', 'agrega ',
    'un ', 'una ', 'unos ', 'unas ', 'el ', 'la ', 'los ', 'las '
  ];

  let cleaned = text;
  let changed = true;
  while (changed) {
    changed = false;
    const lowerCleaned = cleaned.toLowerCase().trim();
    for (const p of prefixes) {
      if (lowerCleaned.startsWith(p)) {
        cleaned = cleaned.trim().slice(p.length).trim();
        changed = true;
      }
    }
  }
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
