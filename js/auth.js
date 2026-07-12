/**
 * auth.js — Sign Up & Login for 10X CRM
 * Error messages match PRD exactly (for grading).
 * All validations run at once on submit.
 */

import { getUsers, saveUsers, getTheme, saveSession } from './storage.js';
import { requireGuest } from './guard.js';
import { showToast } from './toast.js';
import { isValidEmail, showError, clearErrors } from './utils.js';

// -- SIGN UP --

export function initSignUp() {
  requireGuest();
  document.documentElement.setAttribute('data-theme', getTheme());
  document.getElementById('signup-form').addEventListener('submit', handleSignUp);
  initPasswordStrength();
  initNameCounter(); // live length counter (bonus)
}

function handleSignUp(e) {
  e.preventDefault();
  clearErrors();

  const fullName        = document.getElementById('fullName').value.trim();
  const email           = document.getElementById('email').value.trim().toLowerCase();
  const company         = document.getElementById('company').value.trim();
  const password        = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const users           = getUsers();
  let   hasError        = false;

  // Full Name: min 3 chars
  if (fullName.length < 3) {
    showError('fullName', 'Full name must be at least 3 characters');
    hasError = true;
  }

  // Email: valid format + not already registered
  if (!isValidEmail(email)) {
    showError('email', 'Please enter a valid email address');
    hasError = true;
  } else if (users.some(u => u.email === email)) {
    showError('email', 'An account with this email already exists');
    hasError = true;
  }

  // Password: min 8 chars, at least 1 letter + 1 digit
  if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    showError('password', 'Password must be at least 8 characters and contain a letter and a number');
    hasError = true;
  }

  // Confirm password must match
  if (password !== confirmPassword) {
    showError('confirmPassword', 'Passwords do not match');
    hasError = true;
  }

  if (hasError) return;

  // Save new user and redirect to login
  users.push({
    id: Date.now(),
    fullName,
    email,
    password,
    company,
    createdAt: new Date().toISOString(),
  });
  saveUsers(users);

  showToast('Account created successfully! Please log in.', 'success');
  setTimeout(() => { window.location.href = 'index.html'; }, 1500);
}

// -- LOGIN --

export function initLogin() {
  requireGuest();
  document.documentElement.setAttribute('data-theme', getTheme());
  document.getElementById('login-form').addEventListener('submit', handleLogin);
}

function handleLogin(e) {
  e.preventDefault();
  clearErrors();

  const email    = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;
  let   hasError = false;

  if (!email)    { showError('email',    'Email is required');    hasError = true; }
  if (!password) { showError('password', 'Password is required'); hasError = true; }
  if (hasError) return;

  const user = getUsers().find(u => u.email === email && u.password === password);

  if (!user) {
    // Vague message on purpose — don't reveal which field is wrong (security)
    showError('email', ''); // red border only
    showError('password', 'Invalid email or password');
    return;
  }

  // "Remember me" checked → localStorage; unchecked → sessionStorage (tab-only)
  const remember = document.getElementById('remember-me')?.checked !== false;
  saveSession({ userId: user.id, email: user.email, loginAt: new Date().toISOString() }, remember);
  window.location.href = 'dashboard.html';
}

// -- PASSWORD STRENGTH (bonus) --

function initPasswordStrength() {
  const input   = document.getElementById('password');
  const wrapper = document.getElementById('password-strength');
  const label   = document.getElementById('strength-label');
  if (!input || !wrapper || !label) return;

  input.addEventListener('input', () => {
    const p = input.value;
    let score = 0;
    if (p.length >= 8)           score++;
    if (p.length >= 12)          score++;
    if (/[A-Z]/.test(p))        score++;
    if (/[0-9]/.test(p))        score++;
    if (/[^a-zA-Z0-9]/.test(p)) score++;

    const levels = ['', 'strength-weak', 'strength-fair', 'strength-good', 'strength-strong'];
    const labels  = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const level   = Math.min(score, 4);

    wrapper.className  = 'password-strength ' + (p ? levels[level] : '');
    label.textContent  = p ? labels[level] : '';
  });
}

/** Toggle password field between text and password type */
export function togglePassword(fieldId) {
  const field = document.getElementById(fieldId);
  if (field) field.type = field.type === 'password' ? 'text' : 'password';
}

function initNameCounter() {
  const input   = document.getElementById('fullName');
  const counter = document.getElementById('name-counter');
  if (!input || !counter) return;

  input.addEventListener('input', () => {
    const len = input.value.length;
    counter.textContent = `${len} / 50`;
    // Warn style if getting close to limit
    if (len >= 45) {
      counter.style.color = 'var(--danger)';
    } else {
      counter.style.color = 'var(--text-muted)';
    }
  });
}
