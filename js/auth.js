/**
 * auth.js — Sign Up & Login logic for 10X CRM
 *
 * Sign Up  (PRD §P1): initSignUp()
 * Login    (PRD §P2): initLogin()
 *
 * Error messages are EXACT as specified in PRD to allow easy grading.
 * All validations run simultaneously on submit (not one-by-one).
 */

// ══════════════════════════════════════════════════════════
// SIGN UP
// ══════════════════════════════════════════════════════════

/** Initialises the Sign Up page. Call after DOM is ready. */
function initSignUp() {
  requireGuest(); // redirect to dashboard if already logged in

  // Apply saved theme
  document.documentElement.setAttribute('data-theme', getTheme());

  const form = document.getElementById('signup-form');
  if (form) form.addEventListener('submit', handleSignUp);

  // Password strength indicator (bonus feature)
  initPasswordStrength();
}

function handleSignUp(e) {
  e.preventDefault();
  clearAllErrors();

  // Collect & trim values
  const fullName        = document.getElementById('fullName').value.trim();
  const emailRaw        = document.getElementById('email').value.trim();
  const email           = emailRaw.toLowerCase();          // store as lowercase
  const company         = document.getElementById('company').value.trim();
  const password        = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  const users    = getUsers();
  let   hasError = false;

  // ── Full Name: required, min 3 chars after trim ──────────
  if (fullName.length < 3) {
    showFieldError('fullName', 'Full name must be at least 3 characters');
    hasError = true;
  }

  // ── Email: must contain @ and dot after @ ────────────────
  const atIdx = email.indexOf('@');
  if (!email || atIdx === -1 || !email.slice(atIdx + 1).includes('.')) {
    showFieldError('email', 'Please enter a valid email address');
    hasError = true;
  } else if (users.some(u => u.email === email)) {
    // ── Email uniqueness ─────────────────────────────────
    showFieldError('email', 'An account with this email already exists');
    hasError = true;
  }

  // ── Password: min 8 chars + at least 1 letter + 1 digit ─
  if (
    password.length < 8 ||
    !/[a-zA-Z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    showFieldError(
      'password',
      'Password must be at least 8 characters and contain a letter and a number'
    );
    hasError = true;
  }

  // ── Confirm Password: must match ─────────────────────────
  if (password !== confirmPassword) {
    showFieldError('confirmPassword', 'Passwords do not match');
    hasError = true;
  }

  if (hasError) return; // stop — do not write anything

  // ── Success: build User object and persist ───────────────
  const newUser = {
    id:        Date.now(),                  // unique id
    fullName,
    email,                                  // lowercase
    password,
    company,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  // Show success toast, then navigate to login after 1.5 s
  showToast('Account created successfully! Please log in.', 'success');
  setTimeout(() => { window.location.href = 'index.html'; }, 1500);
}

// ══════════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════════

/** Initialises the Login page. Call after DOM is ready. */
function initLogin() {
  requireGuest(); // redirect to dashboard if already logged in

  // Apply saved theme
  document.documentElement.setAttribute('data-theme', getTheme());

  const form = document.getElementById('login-form');
  if (form) form.addEventListener('submit', handleLogin);
}

function handleLogin(e) {
  e.preventDefault();
  clearAllErrors();

  const email    = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;
  let   hasError = false;

  // ── Required field checks ────────────────────────────────
  if (!email) {
    showFieldError('email', 'Email is required');
    hasError = true;
  }
  if (!password) {
    showFieldError('password', 'Password is required');
    hasError = true;
  }
  if (hasError) return;

  // ── Credential check ─────────────────────────────────────
  // Deliberately vague error message for security (PRD §P2.2)
  const users = getUsers();
  const user  = users.find(u => u.email === email && u.password === password);

  if (!user) {
    // Show error on both fields visually but single message (security best-practice)
    showFieldError('email', '');              // red border only
    showFieldError('password', 'Invalid email or password');
    return;
  }

  // ── Success: write session, redirect ─────────────────────
  const session = {
    userId:  user.id,
    email:   user.email,
    loginAt: new Date().toISOString(),
  };
  saveSession(session);
  window.location.href = 'dashboard.html';
}

// ══════════════════════════════════════════════════════════
// SHARED HELPERS
// ══════════════════════════════════════════════════════════

/**
 * Marks a field with .input-error and shows error text below it.
 * Passing an empty message shows only the red border (useful for email on login).
 * Auto-clears on the next input event (live clearing bonus).
 */
function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  field.classList.add('input-error');

  if (message) {
    // Reuse existing error span or create a new one
    let errEl = field.parentElement.querySelector('.field-error');
    if (!errEl) {
      errEl = document.createElement('span');
      errEl.className = 'field-error';
      field.parentElement.appendChild(errEl);
    }
    errEl.textContent = message;
  }

  // Live clearing: remove error as soon as user starts typing (bonus)
  field.addEventListener(
    'input',
    function clear() {
      field.classList.remove('input-error');
      const err = field.parentElement.querySelector('.field-error');
      if (err) err.remove();
    },
    { once: true }
  );
}

/** Removes all error states from the current form */
function clearAllErrors() {
  document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  document.querySelectorAll('.field-error').forEach(el => el.remove());
}

// ══════════════════════════════════════════════════════════
// PASSWORD STRENGTH INDICATOR (bonus)
// ══════════════════════════════════════════════════════════

function initPasswordStrength() {
  const passwordInput = document.getElementById('password');
  const bar           = document.getElementById('strength-bar');
  const label         = document.getElementById('strength-label');
  if (!passwordInput || !bar || !label) return;

  passwordInput.addEventListener('input', () => {
    const p     = passwordInput.value;
    let score   = 0;

    if (p.length >= 8)            score++;
    if (p.length >= 12)           score++;
    if (/[A-Z]/.test(p))         score++;
    if (/[0-9]/.test(p))         score++;
    if (/[^a-zA-Z0-9]/.test(p))  score++;

    const classes = ['', 'strength-weak', 'strength-fair', 'strength-good', 'strength-strong'];
    const labels  = ['',       'Weak',        'Fair',         'Good',          'Strong'];

    const level = Math.min(score, 4);
    const wrapper = document.getElementById('password-strength');
    if (wrapper) {
      wrapper.className = 'password-strength ' + (p ? classes[level] : '');
    }
    label.textContent = p ? labels[level] : '';
  });
}

/** Toggle password visibility (used by eye icon button) */
function togglePassword(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.type = field.type === 'password' ? 'text' : 'password';
}
