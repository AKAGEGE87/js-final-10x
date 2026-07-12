/**
 * utils.js — Shared utility functions and constants for 10X CRM
 */

// -- CONSTANTS --
export const STATUS_CLASS = { Lead: 'lead', Contacted: 'contacted', Won: 'won', Lost: 'lost' };
export const STATUSES = ['Lead', 'Contacted', 'Won', 'Lost'];

// -- DOM HELPERS --
export const $ = (selector, scope = document) => scope.querySelector(selector);
export const $$ = (selector, scope = document) => scope.querySelectorAll(selector);

// -- UTILS --

/**
 * Returns true if the email string has @ and a dot after @
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const at = email.indexOf('@');
  return at !== -1 && email.slice(at + 1).includes('.');
}

/**
 * Escapes special HTML characters to prevent XSS attacks.
 * @param {string} str
 * @returns {string}
 */
export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Marks a field red and shows an error message below it.
 * Passing an empty message adds only the red border.
 * The error clears automatically on the next keystroke.
 * @param {string} fieldId
 * @param {string} message
 * @param {HTMLElement} [scope]
 */
export function showError(fieldId, message, scope) {
  const field = (scope || document).querySelector('#' + fieldId) || document.getElementById(fieldId);
  if (!field) return;

  field.classList.add('input-error');

  if (message) {
    let err = field.parentElement.querySelector('.field-error');
    if (!err) {
      err = document.createElement('span');
      err.className = 'field-error';
      field.parentElement.appendChild(err);
    }
    err.textContent = message;
  }

  // Clear error as soon as user starts typing
  field.addEventListener('input', () => {
    field.classList.remove('input-error');
    field.parentElement.querySelector('.field-error')?.remove();
  }, { once: true });
}

/**
 * Clears all error states in the given scope
 * @param {HTMLElement} [scope]
 */
export function clearErrors(scope) {
  const root = scope || document;
  root.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  root.querySelectorAll('.field-error').forEach(el => el.remove());
}

/**
 * Helper to set text content of a DOM element by ID
 * @param {string} id
 * @param {string|number} value
 */
export function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/**
 * Automatically binds click listeners to .toggle-password buttons to toggle input types.
 * @param {HTMLElement} [scope]
 */
export function setupPasswordToggles(scope = document) {
  const wrappers = scope.querySelectorAll('.input-wrapper');
  wrappers.forEach(wrapper => {
    const input = wrapper.querySelector('input[type="password"], input[type="text"]');
    const toggleBtn = wrapper.querySelector('.toggle-password');
    if (input && toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        input.type = input.type === 'password' ? 'text' : 'password';
      });
    }
  });
}

/**
 * Generates a UI-Avatars URL for a given name and size
 * @param {string} name
 * @param {number} size
 * @returns {string}
 */
export function avatarUrl(name, size) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6c63ff&color=fff&size=${size}`;
}
