/**
 * storage.js — LocalStorage helpers for 10X CRM
 *
 * Keys (exact, required by PRD):
 *   crm_users   — array of registered User objects
 *   crm_session — current session object (null when logged out)
 *   crm_clients — array of Client objects (main app state)
 *   crm_theme   — "dark" | "light"
 */

// ── Key constants ──────────────────────────────────────────
const STORAGE_KEYS = {
  USERS:   'crm_users',
  SESSION: 'crm_session',
  CLIENTS: 'crm_clients',
  THEME:   'crm_theme',
};

// ── Users ──────────────────────────────────────────────────

/** Returns registered users array; [] if empty */
function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
}

/** Persists users array to localStorage */
function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

// ── Session ────────────────────────────────────────────────

/** Returns current session object or null */
function getSession() {
  const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
  return raw ? JSON.parse(raw) : null;
}

/** Persists session object (written on successful login) */
function saveSession(session) {
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
}

/** Deletes session (called on logout) — does NOT touch users or clients */
function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

// ── Clients ────────────────────────────────────────────────

/** Returns stored clients array or null (null = needs API fetch) */
function getStoredClients() {
  const raw = localStorage.getItem(STORAGE_KEYS.CLIENTS);
  return raw ? JSON.parse(raw) : null;
}

/** Persists clients array (called after every state change) */
function saveClients(clients) {
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
}

/** Deletes clients (called on Profile → Reset CRM Data) */
function clearClients() {
  localStorage.removeItem(STORAGE_KEYS.CLIENTS);
}

// ── Theme ──────────────────────────────────────────────────

/** Returns "dark" | "light"; defaults to "dark" */
function getTheme() {
  return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
}

/** Persists chosen theme */
function saveTheme(theme) {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

// ── Helpers ────────────────────────────────────────────────

/**
 * Returns the full User object of the currently logged-in user
 * by cross-referencing crm_session.userId with crm_users.
 */
function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  return getUsers().find(u => u.id === session.userId) || null;
}
