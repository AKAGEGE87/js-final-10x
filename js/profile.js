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
  setupAvatarUpload(); // 📷 photo upload bonus
}

// -- DISPLAY (P5.1) --

function loadProfileData() {
  const user = getCurrentUser();
  if (!user) return;

  const initials = user.fullName
    .split(' ')
    .map(w => w[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const avatarEl = document.getElementById('profile-avatar');
  const customImg = document.getElementById('profile-avatar-custom');

  if (user.avatar) {
    if (avatarEl) avatarEl.style.display = 'none';
    if (customImg) {
      customImg.src = user.avatar;
      customImg.style.display = 'block';
    }
  } else {
    if (customImg) customImg.style.display = 'none';
    if (avatarEl) {
      avatarEl.style.display = 'flex';
      avatarEl.textContent = initials;

      // Custom gradient generator (bonus)
      const gradients = [
        'linear-gradient(135deg, #6c63ff, #a78bfa)',
        'linear-gradient(135deg, #ec4899, #f43f5e)',
        'linear-gradient(135deg, #10b981, #059669)',
        'linear-gradient(135deg, #f59e0b, #d97706)',
        'linear-gradient(135deg, #3b82f6, #1d4ed8)',
        'linear-gradient(135deg, #8b5cf6, #6d28d9)'
      ];

      let activeGrad = localStorage.getItem('crm_avatar_gradient') || 0;
      avatarEl.style.background = gradients[activeGrad];

      avatarEl.onclick = () => {
        activeGrad = (parseInt(activeGrad, 10) + 1) % gradients.length;
        localStorage.setItem('crm_avatar_gradient', activeGrad);
        avatarEl.style.background = gradients[activeGrad];
        showToast('Avatar style changed! 🎨', 'success', 1500);
      };
    }
  }

  setText('profile-name',     user.fullName);
  setText('profile-email',    user.email);
  setText('profile-company',  user.company || '—');
  setText('profile-since',    'Member since ' + new Date(user.createdAt).toLocaleDateString());

  setValue('edit-fullName', user.fullName);
  setValue('edit-company',  user.company || '');
}

/** Handles custom photo upload and saves as Base64 in localStorage crm_users (bonus) */
function setupAvatarUpload() {
  const uploadBtn = document.getElementById('upload-photo-btn');
  const fileInput = document.getElementById('avatar-file-input');
  if (!uploadBtn || !fileInput) return;

  uploadBtn.onclick = () => fileInput.click();

  fileInput.onchange = () => {
    const file = fileInput.files[0];
    if (!file) return;

    // Limit file size to 2MB to prevent localStorage quota issues
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image is too large (max 2MB)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateCurrentUser({ avatar: reader.result });
      loadProfileData();
      showToast('Profile photo updated! 📷', 'success');
    };
    reader.readAsDataURL(file);
  };
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
    // Visual shake feedback (bonus)
    btn.classList.add('shake-anim');
    btn.addEventListener('animationend', () => btn.classList.remove('shake-anim'), { once: true });

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

/** Toggle password field between text and password type (bonus) */
function togglePwd(fieldId) {
  const field = document.getElementById(fieldId);
  if (field) field.type = field.type === 'password' ? 'text' : 'password';
}
