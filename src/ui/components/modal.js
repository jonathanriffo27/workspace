export function showModal(title, content, buttons, callback) {
  const existing = document.querySelector('.modal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h3 class="modal-title">${title}</h3>
      ${content}
      <div class="modal-actions">
        ${buttons.map(btn => `<button class="modal-btn ${btn.primary ? 'primary' : 'secondary'}" data-action="${btn.action}">${btn.label}</button>`).join('')}
      </div>
    </div>
  `;

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
