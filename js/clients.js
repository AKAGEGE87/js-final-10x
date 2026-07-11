/**
 * clients.js — Clients page: full CRUD + filter/sort/search + modals
 *
 * Golden Cycle: state changes → saveClients() → renderClients()
 */

// -- State --
let clientsState = [];      // source of truth (loaded from localStorage or API)
let activeFilter = 'All';   // active status chip
let searchQuery  = '';      // search box value
let sortBy       = 'newest';// sort select value

// Status → CSS badge class
const STATUS_CLASS = { Lead: 'lead', Contacted: 'contacted', Won: 'won', Lost: 'lost' };

// -- INIT --

async function initClients() {
  if (!requireAuth()) return;
  initNav();
  await loadClients();
  setupToolbar();
  setupAddClientModal();
  setupDetailModal();
}

// -- LOAD (P4.2) --

async function loadClients() {
  const stored = getStoredClients();
  if (stored) {
    clientsState = stored;
    renderClients(getVisibleClients());
    return;
  }

  // Show loading spinner while fetching
  setListZone(`
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading clients...</p>
    </div>
  `);

  try {
    const res  = await fetch('https://dummyjson.com/users?limit=30');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    clientsState = data.users.map(u => ({
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

    saveClients(clientsState);
    renderClients(getVisibleClients());

  } catch (err) {
    setListZone(`
      <div class="error-state">
        <p>Could not load clients. Check your connection and try again.</p>
        <button class="btn btn-secondary" onclick="retryLoad()">Retry</button>
      </div>
    `);
  }
}

function retryLoad() {
  clearClients();
  loadClients();
}

// -- FILTER / SEARCH / SORT (P4.7) --

/**
 * Returns a filtered + searched + sorted copy of clientsState.
 * The original array is never mutated.
 */
function getVisibleClients() {
  let list = [...clientsState];

  if (activeFilter !== 'All') {
    list = list.filter(c => c.status === activeFilter);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q)
    );
  }

  if (sortBy === 'newest') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (sortBy === 'name')   list.sort((a, b) => a.name.localeCompare(b.name));
  if (sortBy === 'deal')   list.sort((a, b) => b.dealValue - a.dealValue);

  return list;
}

// -- RENDER (P4.3) --

function renderClients(list) {
  const container = document.getElementById('clients-list');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No clients found.</p></div>';
    return;
  }

  container.innerHTML = list.map(buildClientCard).join('');
}

function buildClientCard(c) {
  const avatar = c.image || avatarUrl(c.name, 56);
  const opts   = ['Lead', 'Contacted', 'Won', 'Lost']
    .map(s => `<option value="${s}" ${c.status === s ? 'selected' : ''}>${s}</option>`)
    .join('');

  return `
    <div class="client-card" data-id="${c.id}">
      <div class="client-card-header" onclick="openClientDetail(${c.id})">
        <img src="${avatar}" alt="${c.name}" class="client-avatar"
          onerror="this.src='${avatarUrl(c.name, 56)}'">
        <div class="client-info">
          <h3 class="client-name">${c.name}</h3>
          <p class="client-company">${c.company || '—'}</p>
          <p class="client-email">${c.email}</p>
        </div>
      </div>
      <div class="client-card-footer">
        <span class="badge badge-${STATUS_CLASS[c.status] || 'lead'}">${c.status}</span>
        <span class="deal-value">$${(c.dealValue || 0).toLocaleString()}</span>
        <select class="status-select" data-id="${c.id}"
          onchange="changeStatus(this)" onclick="event.stopPropagation()"
          aria-label="Change status for ${c.name}">${opts}</select>
        <button class="btn-delete" onclick="deleteClient(${c.id}, event)"
          aria-label="Delete ${c.name}">Delete</button>
      </div>
    </div>
  `;
}

// -- STATUS CHANGE (P4.6) --

function changeStatus(selectEl) {
  const id     = parseInt(selectEl.dataset.id, 10);
  const client = clientsState.find(c => c.id === id);
  if (!client) return;

  client.status = selectEl.value;
  saveClients(clientsState);
  renderClients(getVisibleClients());
}

// -- DELETE (P4.5) --

async function deleteClient(id, event) {
  event.stopPropagation();
  if (!confirm('Delete this client? This cannot be undone.')) return;

  try {
    await fetch(`https://dummyjson.com/users/${id}`, { method: 'DELETE' });
  } catch (err) {
    // Network error — still delete locally (DummyJSON returns 404 for locally-added clients too)
    console.warn('DELETE failed, removing locally:', err);
  }

  clientsState = clientsState.filter(c => c.id !== id);
  saveClients(clientsState);
  renderClients(getVisibleClients());
  showToast('Client deleted', 'success');
}

// -- TOOLBAR (search + chips + sort) --

function setupToolbar() {
  document.getElementById('search-input')?.addEventListener('input', e => {
    searchQuery = e.target.value;
    renderClients(getVisibleClients());
  });

  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.dataset.status;
      renderClients(getVisibleClients());
    });
  });

  document.getElementById('sort-select')?.addEventListener('change', e => {
    sortBy = e.target.value;
    renderClients(getVisibleClients());
  });
}

// -- ADD CLIENT MODAL (P4.4) --

function setupAddClientModal() {
  const addBtn = document.getElementById('add-client-btn');
  const modal  = document.getElementById('add-client-modal');
  const form   = document.getElementById('add-client-form');
  if (!addBtn || !modal || !form) return;

  addBtn.addEventListener('click', () => {
    form.reset();
    clearErrors(form);
    modal.classList.add('modal-open');
    document.getElementById('new-name').focus();
  });

  document.getElementById('add-modal-close').addEventListener('click', () => modal.classList.remove('modal-open'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('modal-open'); });
  form.addEventListener('submit', handleAddClient);
}

async function handleAddClient(e) {
  e.preventDefault();

  const form     = document.getElementById('add-client-form');
  const name     = document.getElementById('new-name').value.trim();
  const email    = document.getElementById('new-email').value.trim().toLowerCase();
  const phone    = document.getElementById('new-phone').value.trim();
  const company  = document.getElementById('new-company').value.trim();
  const dealVal  = document.getElementById('new-deal').value;
  const status   = document.getElementById('new-status').value;

  clearErrors(form);
  let hasError = false;

  if (name.length < 3) {
    showError('new-name', 'Name must be at least 3 characters', form);
    hasError = true;
  }

  if (!isValidEmail(email)) {
    showError('new-email', 'Please enter a valid email address', form);
    hasError = true;
  } else if (clientsState.some(c => c.email.toLowerCase() === email)) {
    showError('new-email', 'A client with this email already exists', form);
    hasError = true;
  }

  if (phone && phone.length < 6) {
    showError('new-phone', 'Phone number looks too short', form);
    hasError = true;
  }

  const dealNum = Number(dealVal);
  if (!dealVal || isNaN(dealNum) || dealNum <= 0) {
    showError('new-deal', 'Deal value must be a positive number', form);
    hasError = true;
  }

  if (hasError) return;

  // POST to API — result may not persist on server, localStorage is source of truth
  let serverId = Date.now();
  try {
    const res = await fetch('https://dummyjson.com/users/add', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ firstName: name, email, phone }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.id) serverId = data.id;
    }
  } catch (err) {
    console.warn('POST failed, adding locally:', err);
  }

  clientsState.unshift({
    id: serverId, name, email, phone, company,
    image:     avatarUrl(name, 128),
    status,
    dealValue: dealNum,
    notes:     [],
    createdAt: new Date().toISOString(),
  });

  saveClients(clientsState);
  renderClients(getVisibleClients());
  document.getElementById('add-client-modal').classList.remove('modal-open');
  showToast('Client added ✓', 'success');
}

// -- DETAIL MODAL (P4.8) --

function setupDetailModal() {
  const modal = document.getElementById('detail-modal');
  if (!modal) return;
  document.getElementById('detail-modal-close').addEventListener('click', () => modal.classList.remove('modal-open'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('modal-open'); });
}

function openClientDetail(id) {
  const client = clientsState.find(c => c.id === id);
  if (!client) return;

  const modal = document.getElementById('detail-modal');

  // Fill header
  const avatarEl = document.getElementById('detail-avatar');
  avatarEl.src = client.image || avatarUrl(client.name, 80);
  avatarEl.onerror = () => { avatarEl.src = avatarUrl(client.name, 80); };

  setText('detail-name',    client.name);
  setText('detail-company', client.company || '—');
  setText('detail-email',   client.email);
  setText('detail-phone',   client.phone || '—');
  setText('detail-deal',    '$' + (client.dealValue || 0).toLocaleString());
  setText('detail-since',   'Client since ' + new Date(client.createdAt).toLocaleDateString());

  const statusEl = document.getElementById('detail-status');
  statusEl.textContent = client.status;
  statusEl.className   = `badge badge-${STATUS_CLASS[client.status] || 'lead'}`;

  modal.dataset.clientId = id;
  renderNotes(client);

  document.getElementById('add-note-btn').onclick = () => addNote(id);
  document.getElementById('remind-btn').onclick   = () => setReminder(id, client.name);

  modal.classList.add('modal-open');
}

function renderNotes(client) {
  const list = document.getElementById('notes-list');
  if (!list) return;

  if (!client.notes?.length) {
    list.innerHTML = '<p class="text-muted">No notes yet.</p>';
    return;
  }

  list.innerHTML = client.notes.map(n => `
    <div class="note-item">
      <p class="note-text">${n.text}</p>
      <span class="note-date">${n.date}</span>
    </div>
  `).join('');

  list.scrollTop = list.scrollHeight; // show newest note
}

function addNote(clientId) {
  const input  = document.getElementById('note-input');
  const text   = input.value.trim();
  if (!text) return;

  const client = clientsState.find(c => c.id === clientId);
  if (!client) return;

  client.notes.push({ text, date: new Date().toLocaleString() });
  saveClients(clientsState);
  renderNotes(client);
  input.value = '';
  input.focus();
}

function setReminder(clientId, clientName) {
  showToast('Reminder set ✓', 'success');
  setTimeout(() => showToast(`⏰ Follow up: ${clientName}`, 'info', 5000), 60000);
}

// -- SHARED HELPERS --

/**
 * Shows an error message under a form field and marks it red.
 * Passing a scope element limits querySelector to that form.
 */
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

function isValidEmail(email) {
  const at = email.indexOf('@');
  return at !== -1 && email.slice(at + 1).includes('.');
}

/** Generates a UI-Avatars URL for a given name and size */
function avatarUrl(name, size) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6c63ff&color=fff&size=${size}`;
}

function setListZone(html) {
  const el = document.getElementById('clients-list');
  if (el) el.innerHTML = html;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
