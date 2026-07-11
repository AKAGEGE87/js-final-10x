/**
 * profile.js — Profile page for 10X CRM
 * Handles: display user info, edit profile, change password, reset CRM data.
 */

function initProfile() {
  if (!requireAuth()) return;
  initNav();
  loadProfileData();
  setupProfileForm();
  setupPasswordForm();
  setupResetData();
}

// -- DISPLAY (P5.1) --

function loadProfileData() {
  const user = getCurrentUser();
  if (!user) return;

  // Build initials from each word in fullName
  const initials = user.fullName
    .split(' ')
    .map(w => w[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  setText('profile-avatar',   initials);
  setText('profile-name',     user.fullName);
  setText('profile-email',    user.email);
  setText('profile-company',  user.company || '—');
  setText('profile-since',    'Member since ' + new Date(user.createdAt).toLocaleDateString());

  setValue('edit-fullName', user.fullName);
  setValue('edit-company',  user.company || '');
}

// -- EDIT PROFILE (P5.2) --

function setupProfileForm() {
  const form = document.getElementById('profile-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    clearErrors(form);

    const fullName = document.getElementById('edit-fullName').value.trim();
    const company  = document.getElementById('edit-company').value.trim();

    if (fullName.length < 3) {
      showError('edit-fullName', 'Full name must be at least 3 characters', form);
      return;
    }

    updateCurrentUser({ fullName, company });
    loadProfileData();
    showToast('Profile updated ✓', 'success');
  });
}

// -- CHANGE PASSWORD (P5.3) --

function setupPasswordForm() {
  const form = document.getElementById('password-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    clearErrors(form);

    const currentPwd    = document.getElementById('current-password').value;
    const newPwd        = document.getElementById('new-password').value;
    const confirmNewPwd = document.getElementById('confirm-new-password').value;
    const user          = getCurrentUser();
    let   hasError      = false;

    if (currentPwd !== user.password) {
      showError('current-password', 'Current password is incorrect', form);
      hasError = true;
    }

    if (newPwd.length < 8 || !/[a-zA-Z]/.test(newPwd) || !/[0-9]/.test(newPwd)) {
      showError('new-password', 'Password must be at least 8 characters and contain a letter and a number', form);
      hasError = true;
    } else if (newPwd === currentPwd) {
      showError('new-password', 'New password must be different from the current one', form);
      hasError = true;
    }

    if (newPwd !== confirmNewPwd) {
      showError('confirm-new-password', 'Passwords do not match', form);
      hasError = true;
    }

    if (hasError) return;

    updateCurrentUser({ password: newPwd });
    form.reset();
    showToast('Password changed ✓', 'success');
  });
}

// -- RESET CRM DATA (P5.4) --

function setupResetData() {
  const btn = document.getElementById('reset-data-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    if (!confirm('This will reset all client data to the original 30 records. Your account will not be affected. Continue?')) return;

    clearClients();
    btn.disabled    = true;
    btn.textContent = 'Resetting...';

    try {
      const res  = await fetch('https://dummyjson.com/users?limit=30');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      saveClients(data.users.map(u => ({
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
      })));

      showToast('CRM data has been reset to 30 clients ✓', 'success');

    } catch (err) {
      showToast('Could not fetch fresh data. Check your connection.', 'error');
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Reset Data';
    }
  });
}

// -- HELPERS --

/** Updates the current user's fields in crm_users */
function updateCurrentUser(fields) {
  const users   = getUsers();
  const session = getSession();
  const idx     = users.findIndex(u => u.id === session.userId);
  if (idx === -1) return;
  Object.assign(users[idx], fields);
  saveUsers(users);
}

/** Shows a red error message under a form field */
function showError(fieldId, message, scope) {
  const field = (scope || document).querySelector('#' + fieldId) || document.getElementById(fieldId);
  if (!field) return;

  field.classList.add('input-error');

  let err = field.parentElement.querySelector('.field-error');
  if (!err) {
    err = document.createElement('span');
    err.className = 'field-error';
    field.parentElement.appendChild(err);
  }
  err.textContent = message;

  field.addEventListener('input', () => {
    field.classList.remove('input-error');
    field.parentElement.querySelector('.field-error')?.remove();
  }, { once: true });
}

function clearErrors(scope) {
  const root = scope || document;
  root.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  root.querySelectorAll('.field-error').forEach(el => el.remove());
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}
