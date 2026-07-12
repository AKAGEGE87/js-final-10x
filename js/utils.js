/**
 * utils.js — Shared utility functions for 10X CRM
 */

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
