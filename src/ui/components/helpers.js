export function renderCheckbox(checked, onChange) {
  const checkbox = document.createElement('div');
  checkbox.className = `checkbox ${checked ? 'checked' : ''}`;
  checkbox.innerHTML = `
    <svg viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  `;
  checkbox.addEventListener('click', (e) => {
    e.stopPropagation();
    onChange();
  });
  return checkbox;
}

export function createDeleteButton(onClick) {
  const btn = document.createElement('button');
  btn.className = 'delete-btn';
  btn.innerHTML = `
    <svg viewBox="0 0 24 24">
      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick();
  });
  return btn;
}

export function createIconButton(icon, onClick, title, activeClass = '') {
  const btn = document.createElement('button');
  btn.className = `idea-action-btn ${activeClass}`;
  btn.title = title;
  btn.innerHTML = icon;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick();
  });
  return btn;
}

export function renderEmptyState(icon, title, text) {
  const div = document.createElement('div');
  div.className = 'empty-state';
  div.innerHTML = `
    <div class="empty-icon">${icon}</div>
    <h3 class="empty-title">${title}</h3>
    <p class="empty-text">${text}</p>
  `;
  return div;
}

export function renderActionInput(id, placeholder) {
  return `
    <div class="action-input">
      <input type="text" class="input-field" id="${id}" placeholder="${placeholder}" autocomplete="off">
      <button class="add-btn" id="${id}-btn">
        <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>
      </button>
    </div>
  `;
}
