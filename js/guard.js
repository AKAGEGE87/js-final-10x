/**
 * guard.js — Auth Guard for 10X CRM
 *
 * Call requireAuth()  at the top of every PROTECTED page (dashboard, clients, profile).
 * Call requireGuest() at the top of every PUBLIC page    (login, signup).
 *
 * Logic (per PRD §P0.1):
 *   Protected page + no session  → redirect to index.html
 *   Public page   + has session  → redirect to dashboard.html
 */import { getSession, clearSession } from './storage.js';

/** Ensures user is logged in; redirects to login if not. */
export function requireAuth() {
  const session = getSession();
  if (!session) {
    window.location.href = 'index.html';
    return false;
  }

  // Session Inactivity/Expiration auto-logout (15 minutes limit) (bonus)
  const loginTime = new Date(session.loginAt).getTime();
  const now = Date.now();
  const fifteenMinutes = 15 * 60 * 1000;

  if (now - loginTime > fifteenMinutes) {
    clearSession();
    alert('Session expired for security! Please log in again.');
    window.location.href = 'index.html';
    return false;
  }

  return true;
}

/** Ensures user is NOT logged in; redirects to dashboard if they are. */
export function requireGuest() {
  if (getSession()) {
    window.location.href = 'dashboard.html';
    return false;
  }
  return true;
}
