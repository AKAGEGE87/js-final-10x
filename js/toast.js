/**
 * toast.js — Toast notification system for 10X CRM
 *
 * Usage:
 *   showToast('Client added ✓', 'success');
 *   showToast('Invalid email or password', 'error');
 *   showToast('⏰ Follow up: Emily', 'info', 5000);
 *
 * Types: 'success' (green) | 'error' (red) | 'info' (blue) | 'warning' (amber)
 * NOTE: browser alert() is FORBIDDEN per PRD §P0.4
 */

/**
 * Displays a toast notification.
 * @param {string} message   - Text to show
 * @param {string} type      - 'success' | 'error' | 'info' | 'warning'
 * @param {number} duration  - Auto-close delay in ms (default 3000)
 */
export function showToast(message, type = 'success', duration = 3000) {
  // Ensure container exists
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" aria-label="Close notification">×</button>
  `;

  // Manual close
  toast.querySelector('.toast-close').addEventListener('click', () => removeToast(toast));

  container.appendChild(toast);

  // Two-frame trick: append first, then add class to trigger CSS transition
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('toast-show')));

  // Auto-remove after duration
  setTimeout(() => removeToast(toast), duration);
}

/** Animates toast out then removes it from DOM */
function removeToast(toast) {
  toast.classList.remove('toast-show');
  setTimeout(() => toast.remove(), 300);
}
