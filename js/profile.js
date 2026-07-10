/**
 * profile.js — Profile page logic for 10X CRM
 *
 * Features (PRD §P5):
 *   P5.1 — Display current user info (initials avatar, name, email, company, member since)
 *   P5.2 — Edit profile form (Full Name + Company) with validation
 *   P5.3 — Change password form (current, new, confirm) with validation
 *   P5.4 — Reset CRM Data: delete crm_clients, re-fetch from API
 *
 * All error messages are EXACT per PRD specification.
 */

/** Entry point — called on page load */
function initProfile() {
  if (!requireAuth()) return;
  initNav();
  loadProfileData();
  setupProfileForm();
  setupPasswordForm();
  setupResetData();
}

// ══════════════════════════════════════════════════════════
// P5.1 — DISPLAY USER INFO
// ══════════════════════════════════════════════════════════

function loadProfileData() {
  const user = getCurrentUser();
  if (!user) return;

  // Initials avatar: first letter of each word in fullName
  const initials = user.fullName
    .split(' ')
    .map(part => part[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  setText('profile-avatar',   initials);
  setText('profile-name',     user.fullName);
  setText('profile-email',    user.email);
  setText('profile-company',  user.company || '—');
  setText('profile-since',    'Member since ' + new Date(user.createdAt).toLocaleDateString());

  // Pre-fill edit form with current values
  setValue('edit-fullName', user.fullName);
  setValue('edit-company',  user.company || '');
}

// ══════════════════════════════════════════════════════════
// P5.2 — EDIT PROFILE (Save Changes)
// ══════════════════════════════════════════════════════════

function setupProfileForm() {
  const form = document.getElementById('profile-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    clearFormErrors(form);

    const fullName = document.getElementById('edit-fullName').value.trim();
    const company  = document.getElementById('edit-company').value.trim();

    // Validate Full Name (min 3 chars after trim)
    if (fullName.length < 3) {
      showError('edit-fullName', 'Full name must be at least 3 characters');
      return;
    }

    // Find and update user in crm_users
    const users   = getUsers();
    const session = getSession();
    const idx     = users.findIndex(u => u.id === session.userId);
    if (idx === -1) return;

    users[idx].fullName = fullName;
    users[idx].company  = company;
    saveUsers(users);

    // Refresh displayed info immediately
    loadProfileData();
    showToast('Profile updated ✓', 'success');
  });
}

// ══════════════════════════════════════════════════════════
// P5.3 — CHANGE PASSWORD
// ══════════════════════════════════════════════════════════

function setupPasswordForm() {
  const form = document.getElementById('password-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    clearFormErrors(form);

    const currentPwd    = document.getElementById('current-password').value;
    const newPwd        = document.getElementById('new-password').value;
    const confirmNewPwd = document.getElementById('confirm-new-password').value;

    const user     = getCurrentUser();
    let   hasError = false;

    // Current password must match stored password
    if (currentPwd !== user.password) {
      showError('current-password', 'Current password is incorrect');
      hasError = true;
    }

    // New password: min 8 chars + letter + digit
    if (
      newPwd.length < 8 ||
      !/[a-zA-Z]/.test(newPwd) ||
      !/[0-9]/.test(newPwd)
    ) {
      showError(
        'new-password',
        'Password must be at least 8 characters and contain a letter and a number'
      );
      hasError = true;
    } else if (newPwd === currentPwd) {
      // New password must differ from current
      showError('new-password', 'New password must be different from the current one');
      hasError = true;
    }

    // Confirm must match new
    if (newPwd !== confirmNewPwd) {
      showError('confirm-new-password', 'Passwords do not match');
      hasError = true;
    }

    if (hasError) return;

    // Update password in crm_users
    const users   = getUsers();
    const session = getSession();
    const idx     = users.findIndex(u => u.id === session.userId);
    if (idx === -1) return;

    users[idx].password = newPwd;
    saveUsers(users);

    form.reset();
    showToast('Password changed ✓', 'success');
  });
}

// ══════════════════════════════════════════════════════════
// P5.4 — RESET CRM DATA
// ══════════════════════════════════════════════════════════

function setupResetData() {
  const btn = document.getElementById('reset-data-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    if (!confirm('This will reset all client data to the original 30 records. Your account will not be affected. Continue?')) return;

    clearClients();   // removes crm_clients from localStorage
    btn.disabled = true;
    btn.textContent = 'Resetting...';
    showToast('Resetting client data...', 'info');

    try {
      const res = await fetch('https://dummyjson.com/users?limit=30');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const freshClients = data.users.map(u => ({
        id:        u.id,
        name:      u.firstName + ' ' + u.lastName,
        email:     u.email,
        phone:     u.phone,
        company:   u.company.name,
        image:     u.image,
        status:    'Lead',
        dealValue: Math.floor(Math.random() * 9500) + 500,
        notes:     [],
        createdAt: new Date().toISOString(),
      }));

      saveClients(freshClients);
      showToast('CRM data has been reset to 30 clients ✓', 'success');

    } catch (err) {
      showToast('Could not fetch fresh data. Check your connection.', 'error');
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Reset CRM Data';
    }
  });
}

// ══════════════════════════════════════════════════════════
// ERROR HELPERS
// ══════════════════════════════════════════════════════════

function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  field.classList.add('input-error');
  let err = field.parentElement.querySelector('.field-error');
  if (!err) {
    err = document.createElement('span');
    err.className = 'field-error';
    field.parentElement.appendChild(err);
  }
  err.textContent = message;

  // Live clear on next input
  field.addEventListener('input', function clear() {
    field.classList.remove('input-error');
    const e = field.parentElement.querySelector('.field-error');
    if (e) e.remove();
  }, { once: true });
}

function clearFormErrors(formEl) {
  formEl.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  formEl.querySelectorAll('.field-error').forEach(el => el.remove());
}

// ── DOM helpers ───────────────────────────────────────────

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}
