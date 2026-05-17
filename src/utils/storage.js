export function loadFromStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error loading from localStorage:', e);
    return [];
  }
}

export function saveToStorage(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
}
