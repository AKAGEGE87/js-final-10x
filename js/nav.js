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
  setupEasterEgg(); // 🥚 hidden bonus
  initSessionTimer(); // Live session timer (bonus)
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

// ── Easter Egg 🥚 ──────────────────────────────────────────

/**
 * Click the logo 5 times within 2 seconds to trigger the Easter Egg.
 * Fires a party toast and drops CSS confetti across the screen.
 */
function setupEasterEgg() {
  const logo = document.getElementById('nav-logo');
  if (!logo) return;

  let clicks = 0;
  let timer  = null;

  logo.addEventListener('click', () => {
    clicks++;
    clearTimeout(timer);
    timer = setTimeout(() => { clicks = 0; }, 2000);

    if (clicks >= 5) {
      clicks = 0;
      showToast('🎉 Easter Egg unlocked! You found the secret! 🥚', 'success', 4000);
      launchConfetti();
    }
  });
}

function launchConfetti() {
  const emojis = ['🎉', '⭐', '🚀', '✨', '🎊', '💥', '🏆'];
  for (let i = 0; i < 30; i++) {
    const el = document.createElement('span');
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.cssText = `
      position:fixed;
      top:-2rem;
      left:${Math.random() * 100}vw;
      font-size:${1.2 + Math.random() * 1.5}rem;
      animation: confettiFall ${1.5 + Math.random() * 2}s ease-in forwards;
      pointer-events:none;
      z-index:9999;
    `;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

// ── Session Timer ⏱️ ────────────────────────────────────────

/**
 * Tracks the elapsed time since session loginAt.
 * Updates the display every second in the sidebar footer.
 */
function initSessionTimer() {
  const el = document.getElementById('session-duration');
  if (!el) return;

  const session = getSession();
  if (!session || !session.loginAt) return;

  const loginTime = new Date(session.loginAt).getTime();

  const update = () => {
    const diff = Math.floor((Date.now() - loginTime) / 1000);
    const mins = String(Math.floor(diff / 60)).padStart(2, '0');
    const secs = String(diff % 60).padStart(2, '0');
    el.textContent = `Session: ${mins}:${secs}`;
  };

  update();
  setInterval(update, 1000);
}
