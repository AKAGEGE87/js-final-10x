/**
 * storage.js — LocalStorage helpers for 10X CRM
 *
 * Keys (exact, required by PRD):
 *   crm_users   — array of registered User objects
 *   crm_session — current session object (null when logged out)
 *   crm_clients — array of Client objects (main app state)
 *   crm_theme   — "dark" | "light"
 *
 * Session storage note (bonus — Remember me):
 *   "Remember me" checked  → session in localStorage  (survives tab close)
 *   "Remember me" unchecked → session in sessionStorage (expires on tab close)
 *   getSession() checks both storages so guard.js works either way.
 */

const STORAGE_KEYS = {
  USERS:   'crm_users',
  SESSION: 'crm_session',
  CLIENTS: 'crm_clients',
  THEME:   'crm_theme',
};

// -- Users --

export function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
}

export function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

// -- Session --

/**
 * Returns the current session or null.
 * Checks localStorage first (remember me), then sessionStorage (tab-only).
 */
export function getSession() {
  const fromLocal   = localStorage.getItem(STORAGE_KEYS.SESSION);
  const fromSession = sessionStorage.getItem(STORAGE_KEYS.SESSION);
  const raw = fromLocal || fromSession;
  return raw ? JSON.parse(raw) : null;
}

/**
 * Saves the session.
 * @param {Object} session   — session data to persist
 * @param {boolean} remember — true = localStorage, false = sessionStorage
 */
export function saveSession(session, remember = true) {
  const data = JSON.stringify(session);
  if (remember) {
    localStorage.setItem(STORAGE_KEYS.SESSION, data);
  } else {
    sessionStorage.setItem(STORAGE_KEYS.SESSION, data);
  }
}

/** Removes session from both storages (called on logout) */
export function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
  sessionStorage.removeItem(STORAGE_KEYS.SESSION);
}

// -- Clients --

export function getStoredClients() {
  const raw = localStorage.getItem(STORAGE_KEYS.CLIENTS);
  return raw ? JSON.parse(raw) : null;
}

export function saveClients(clients) {
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
}

export function clearClients() {
  localStorage.removeItem(STORAGE_KEYS.CLIENTS);
}

// -- Theme --

export function getTheme() {
  return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
}

export function saveTheme(theme) {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

// -- Helpers --

/** Returns full User object of the currently logged-in user */
export function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  return getUsers().find(u => u.id === session.userId) || null;
}

