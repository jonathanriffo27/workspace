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

export function hasMultipleItems(text) {
  const separators = [' y ', ' e ', ', ', ' más ', ' con ', ' además de '];
  return separators.some(s => text.toLowerCase().includes(s));
}

export function splitIntoItems(text) {
  let items = [text];
  const separators = [
    { pattern: /\s+y\s+/g, split: true },
    { pattern: /\s+e\s+/g, split: true },
    { pattern: /,\s*/g, split: true },
    { pattern: /\s+más\s+/g, split: true },
    { pattern: /\s+con\s+/g, split: true },
    { pattern: /\s+además\s+de\s+/g, split: true }
  ];

  for (const sep of separators) {
    const newItems = [];
    for (const item of items) {
      const parts = item.split(sep.pattern);
      newItems.push(...parts);
    }
    items = newItems.filter(i => i.trim().length > 0);
  }

  return items.map(item => item.trim()).filter(i => i.length > 0);
}

export function cleanVoiceText(text) {
  const prefixes = [
    'comprar', 'traer', 'necesito', 'falta', 'lista de',
    'tengo que', 'debo', 'recordar', 'poner', 'anotar',
    'un ', 'una ', 'unos ', 'unas ', 'el ', 'la '
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
