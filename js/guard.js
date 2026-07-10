/**
 * guard.js — Auth Guard for 10X CRM
 *
 * Call requireAuth()  at the top of every PROTECTED page (dashboard, clients, profile).
 * Call requireGuest() at the top of every PUBLIC page    (login, signup).
 *
 * Logic (per PRD §P0.1):
 *   Protected page + no session  → redirect to index.html
 *   Public page   + has session  → redirect to dashboard.html
 */

/** Ensures user is logged in; redirects to login if not. */
function requireAuth() {
  if (!getSession()) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

/** Ensures user is NOT logged in; redirects to dashboard if they are. */
function requireGuest() {
  if (getSession()) {
    window.location.href = 'dashboard.html';
    return false;
  }
  return true;
}
