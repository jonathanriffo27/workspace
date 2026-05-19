export function showModal(title, content, buttons, callback) {
  const existing = document.querySelector('.modal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h3 class="modal-title"></h3>
      <div class="modal-content-area"></div>
      <div class="modal-actions"></div>
    </div>
  `;

  overlay.querySelector('.modal-title').textContent = title;
  
  const contentArea = overlay.querySelector('.modal-content-area');
  if (typeof content === 'string') {
    contentArea.innerHTML = content; // Still allow HTML for internal trusted strings
  } else if (content instanceof HTMLElement) {
    contentArea.appendChild(content);
  }

  const actions = overlay.querySelector('.modal-actions');
  buttons.forEach(btn => {
    const button = document.createElement('button');
    button.className = `modal-btn ${btn.primary ? 'primary' : 'secondary'}`;
    button.dataset.action = btn.action;
    button.textContent = btn.label;
    actions.appendChild(button);
  });

  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('active'), 10);

  overlay.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn) {
      const action = actionBtn.dataset.action;
      if (callback) callback(action);
      closeModal();
    } else if (e.target === overlay) {
      closeModal();
    }
  });

  return overlay;
}

export function closeModal() {
  const overlay = document.querySelector('.modal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 200);
  }
}
