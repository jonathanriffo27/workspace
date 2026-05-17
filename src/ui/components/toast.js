export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none"><path d="M20 6L9 17l-5-5"/></svg>',
    error: '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>',
    info: '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>',
    revert: '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}
