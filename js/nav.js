/**
 * nav.js — Shared navigation for all protected pages (Dashboard, Clients, Profile)
 *
 * Responsibilities (PRD §P0.2, §P0.3):
 *   - Apply saved theme on page load
 *   - Mark current page link as .active
 *   - Toggle Dark/Light theme and save to crm_theme
 *   - Logout: remove crm_session, redirect to index.html
 *
 * Call initNav() on every protected page after DOMContentLoaded.
 */

/** Entry point — call once per protected page */
function initNav() {
  applyTheme();
  setActiveNavLink();
  setupThemeToggle();
  setupLogout();
}

// ── Theme ──────────────────────────────────────────────────

/** Reads crm_theme and applies [data-theme] attribute to <html> */
function applyTheme() {
  const theme = getTheme();
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcon(theme);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function setupThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const current = getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    saveTheme(next);                                        // persist to crm_theme
    document.documentElement.setAttribute('data-theme', next);
    updateThemeIcon(next);
  });
}

// ── Active nav link ────────────────────────────────────────

/**
 * Compares the current filename with each .nav-link href,
 * adds .active class to the matching one.
 */
function setActiveNavLink() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href === current) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// ── Logout ─────────────────────────────────────────────────

/**
 * Removes crm_session (NOT crm_users or crm_clients) and
 * redirects to login page. (PRD §P0.2 Logout)
 */
function setupLogout() {
  const btn = document.getElementById('logout-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    clearSession();                   // only session is removed
    window.location.href = 'index.html';
  });
}
