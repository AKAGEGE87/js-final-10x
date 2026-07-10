/**
 * clients.js — Clients page: full CRUD + filter/sort/search + detail modal
 *
 * PRD Sections:
 *   P4.1 Layout     — rendered in HTML
 *   P4.2 Load       — loadClients() with loading/error/retry states
 *   P4.3 Render     — renderClients(list)
 *   P4.4 Add        — Add Client modal + POST
 *   P4.5 Delete     — confirm() + DELETE + filter from state
 *   P4.6 Status     — change event on select → update state → save → re-render
 *   P4.7 Filter/Sort/Search — getVisibleClients() combining all three
 *   P4.8 Detail     — detail modal + notes + 60s reminder
 *
 * "Golden Cycle" (PRD §5.4): state changes → saveClients() → renderClients()
 */

// ── State ─────────────────────────────────────────────────
let clientsState = [];        // source of truth
let activeFilter = 'All';     // chip filter value
let searchQuery  = '';        // search box value
let sortBy       = 'newest';  // sort select value

// Status → CSS badge class mapping
const STATUS_CLASS = { Lead: 'lead', Contacted: 'contacted', Won: 'won', Lost: 'lost' };

// ══════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════

/** Entry point — called on page load */
async function initClients() {
  if (!requireAuth()) return;
  initNav();
  await loadClients();
  setupToolbar();
  setupAddClientModal();
  setupDetailModal();
}

// ══════════════════════════════════════════════════════════
// P4.2 — LOAD
// ══════════════════════════════════════════════════════════

async function loadClients() {
  const stored = getStoredClients();
  if (stored) {
    // Already in localStorage — no API call
    clientsState = stored;
    renderClients(getVisibleClients());
    return;
  }

  // First load: show loading indicator
  setListZone(`
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading clients...</p>
    </div>
  `);

  try {
    const res = await fetch('https://dummyjson.com/users?limit=30');
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
    // P4.2 FULL — error state with Retry button
    setListZone(`
      <div class="error-state">
        <p>Could not load clients. Check your connection and try again.</p>
        <button class="btn btn-secondary" onclick="retryLoad()">Retry</button>
      </div>
    `);
  }
}

/** Retry button calls this (kept global so inline onclick works) */
function retryLoad() {
  clearClients();
  loadClients();
}

// ══════════════════════════════════════════════════════════
// P4.7 — getVisibleClients: filter → search → sort (on a COPY)
// ══════════════════════════════════════════════════════════

/**
 * Returns a filtered/searched/sorted subset of clientsState.
 * The original array is never mutated (spread copy for sort).
 */
function getVisibleClients() {
  let result = [...clientsState];

  // 1. Status filter chip
  if (activeFilter !== 'All') {
    result = result.filter(c => c.status === activeFilter);
  }

  // 2. Search by name or company (case-insensitive)
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q)
    );
  }

  // 3. Sort (operates on the copy — original stays intact)
  if (sortBy === 'newest') {
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortBy === 'name') {
    result.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'deal') {
    result.sort((a, b) => b.dealValue - a.dealValue);
  }

  return result;
}

// ══════════════════════════════════════════════════════════
// P4.3 — RENDER
// ══════════════════════════════════════════════════════════

/**
 * renderClients(list) — clears container and builds card elements.
 * Every action ends with a call to this function (Golden Cycle).
 */
function renderClients(list) {
  const container = document.getElementById('clients-list');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No clients found.</p></div>';
    return;
  }

  // Build cards with data-id attribute for identification
  container.innerHTML = list.map(c => buildClientCard(c)).join('');
}

function buildClientCard(c) {
  const avatarSrc = c.image ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=6c63ff&color=fff&size=56`;

  return `
    <div class="client-card" data-id="${c.id}">
      <div class="client-card-header" onclick="openClientDetail(${c.id})">
        <img
          src="${avatarSrc}"
          alt="${c.name}"
          class="client-avatar"
          onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=6c63ff&color=fff&size=56'"
        >
        <div class="client-info">
          <h3 class="client-name">${c.name}</h3>
          <p class="client-company">${c.company || '—'}</p>
          <p class="client-email">${c.email}</p>
        </div>
      </div>
      <div class="client-card-footer">
        <span class="badge badge-${STATUS_CLASS[c.status] || 'lead'}">${c.status}</span>
        <span class="deal-value">$${(c.dealValue || 0).toLocaleString()}</span>
        <select
          class="status-select"
          data-id="${c.id}"
          onchange="changeStatus(this)"
          onclick="event.stopPropagation()"
          aria-label="Change status for ${c.name}"
        >
          <option value="Lead"      ${c.status === 'Lead'      ? 'selected' : ''}>Lead</option>
          <option value="Contacted" ${c.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
          <option value="Won"       ${c.status === 'Won'       ? 'selected' : ''}>Won</option>
          <option value="Lost"      ${c.status === 'Lost'      ? 'selected' : ''}>Lost</option>
        </select>
        <button
          class="btn-delete"
          onclick="deleteClient(${c.id}, event)"
          aria-label="Delete ${c.name}"
        >Delete</button>
      </div>
    </div>
  `;
}

// ══════════════════════════════════════════════════════════
// P4.6 — STATUS CHANGE
// ══════════════════════════════════════════════════════════

/** Called by onchange on the status select inside a card */
function changeStatus(selectEl) {
  const id        = parseInt(selectEl.dataset.id, 10);
  const newStatus = selectEl.value;

  const client = clientsState.find(c => c.id === id);
  if (!client) return;

  client.status = newStatus;          // mutate state
  saveClients(clientsState);          // persist
  renderClients(getVisibleClients()); // re-render
}

// ══════════════════════════════════════════════════════════
// P4.5 — DELETE
// ══════════════════════════════════════════════════════════

async function deleteClient(id, event) {
  event.stopPropagation(); // prevent card click (detail modal)

  // PRD §P0.4: confirm() is allowed for destructive actions
  if (!confirm('Delete this client? This cannot be undone.')) return;

  // DELETE request to API (expected to return 404 for locally-added clients)
  try {
    await fetch(`https://dummyjson.com/users/${id}`, { method: 'DELETE' });
  } catch (err) {
    // Network error — still delete locally (PRD §P4.5 note)
    console.warn('DELETE request failed — removing locally:', err);
  }

  // Remove from state regardless of API response (404 is expected)
  clientsState = clientsState.filter(c => c.id !== id);
  saveClients(clientsState);
  renderClients(getVisibleClients());
  showToast('Client deleted', 'success');
}

// ══════════════════════════════════════════════════════════
// TOOLBAR (search + chips + sort)
// ══════════════════════════════════════════════════════════

function setupToolbar() {
  // Search input — triggers re-render on every keystroke
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      searchQuery = e.target.value;
      renderClients(getVisibleClients());
    });
  }

  // Filter chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.dataset.status;
      renderClients(getVisibleClients());
    });
  });

  // Sort select
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', e => {
      sortBy = e.target.value;
      renderClients(getVisibleClients());
    });
  }
}

// ══════════════════════════════════════════════════════════
// P4.4 — ADD CLIENT MODAL
// ══════════════════════════════════════════════════════════

function setupAddClientModal() {
  const addBtn    = document.getElementById('add-client-btn');
  const modal     = document.getElementById('add-client-modal');
  const closeBtn  = document.getElementById('add-modal-close');
  const form      = document.getElementById('add-client-form');

  if (!addBtn || !modal || !form) return;

  // Open modal
  addBtn.addEventListener('click', () => {
    form.reset();
    clearModalErrors(form);
    modal.classList.add('modal-open');
    document.getElementById('new-name').focus();
  });

  // Close buttons
  closeBtn.addEventListener('click',  () => modal.classList.remove('modal-open'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('modal-open'); });

  // Submit
  form.addEventListener('submit', handleAddClient);
}

async function handleAddClient(e) {
  e.preventDefault();

  const form     = document.getElementById('add-client-form');
  const name     = document.getElementById('new-name').value.trim();
  const emailRaw = document.getElementById('new-email').value.trim();
  const email    = emailRaw.toLowerCase();
  const phone    = document.getElementById('new-phone').value.trim();
  const company  = document.getElementById('new-company').value.trim();
  const dealVal  = document.getElementById('new-deal').value;
  const status   = document.getElementById('new-status').value;

  clearModalErrors(form);
  let hasError = false;

  // Name: min 3 chars after trim
  if (name.length < 3) {
    showModalError('new-name', 'Name must be at least 3 characters');
    hasError = true;
  }

  // Email: valid format
  const atIdx = email.indexOf('@');
  if (!email || atIdx === -1 || !email.slice(atIdx + 1).includes('.')) {
    showModalError('new-email', 'Please enter a valid email address');
    hasError = true;
  } else if (clientsState.some(c => c.email.toLowerCase() === email)) {
    showModalError('new-email', 'A client with this email already exists');
    hasError = true;
  }

  // Phone: optional but if filled — min 6 chars
  if (phone && phone.length < 6) {
    showModalError('new-phone', 'Phone number looks too short');
    hasError = true;
  }

  // Deal Value: must be a positive number
  const dealNum = Number(dealVal);
  if (!dealVal || isNaN(dealNum) || dealNum <= 0) {
    showModalError('new-deal', 'Deal value must be a positive number');
    hasError = true;
  }

  if (hasError) return;

  // POST to DummyJSON API (response may not persist — localStorage is source of truth)
  let serverId = Date.now(); // fallback id
  try {
    const res = await fetch('https://dummyjson.com/users/add', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ firstName: name, email, phone }),
    });
    if (res.ok) {
      const serverData = await res.json();
      if (serverData.id) serverId = serverData.id; // use server's id if provided
    }
  } catch (err) {
    console.warn('POST to API failed — adding locally:', err);
  }

  const newClient = {
    id:        serverId,
    name,
    email,
    phone,
    company,
    image:     `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6c63ff&color=fff&size=128`,
    status,
    dealValue: dealNum,
    notes:     [],
    createdAt: new Date().toISOString(),
  };

  clientsState.unshift(newClient); // add to TOP so it shows first
  saveClients(clientsState);
  renderClients(getVisibleClients());

  document.getElementById('add-client-modal').classList.remove('modal-open');
  showToast('Client added ✓', 'success');
}

// ══════════════════════════════════════════════════════════
// P4.8 — DETAIL MODAL (notes + reminder)
// ══════════════════════════════════════════════════════════

function setupDetailModal() {
  const modal    = document.getElementById('detail-modal');
  const closeBtn = document.getElementById('detail-modal-close');
  if (!modal) return;

  closeBtn.addEventListener('click',  () => modal.classList.remove('modal-open'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('modal-open'); });
}

/** Opens the detail modal for the given client id */
function openClientDetail(id) {
  const client = clientsState.find(c => c.id === id);
  if (!client) return;

  const modal = document.getElementById('detail-modal');

  // Populate header
  const avatarSrc = client.image ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=6c63ff&color=fff&size=80`;

  document.getElementById('detail-avatar').src = avatarSrc;
  document.getElementById('detail-avatar').onerror = function() {
    this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=6c63ff&color=fff&size=80`;
  };
  document.getElementById('detail-name').textContent    = client.name;
  document.getElementById('detail-company').textContent = client.company || '—';

  // Detail fields
  document.getElementById('detail-email').textContent   = client.email;
  document.getElementById('detail-phone').textContent   = client.phone || '—';
  document.getElementById('detail-deal').textContent    = '$' + (client.dealValue || 0).toLocaleString();
  document.getElementById('detail-since').textContent   = 'Client since ' + new Date(client.createdAt).toLocaleDateString();

  const statusEl = document.getElementById('detail-status');
  statusEl.textContent  = client.status;
  statusEl.className    = `badge badge-${STATUS_CLASS[client.status] || 'lead'}`;

  // Store id for note/reminder actions
  modal.dataset.clientId = id;

  // Render notes
  renderNotes(client);

  // Wire Add Note button
  document.getElementById('add-note-btn').onclick = () => addNote(id);

  // Wire Remind button
  document.getElementById('remind-btn').onclick = () => setReminder(id, client.name);

  modal.classList.add('modal-open');
}

function renderNotes(client) {
  const list = document.getElementById('notes-list');
  if (!list) return;

  if (!client.notes || client.notes.length === 0) {
    list.innerHTML = '<p class="text-muted">No notes yet.</p>';
    return;
  }

  // Oldest → newest order
  list.innerHTML = client.notes.map(n => `
    <div class="note-item">
      <p class="note-text">${n.text}</p>
      <span class="note-date">${n.date}</span>
    </div>
  `).join('');

  // Scroll to bottom so newest note is visible
  list.scrollTop = list.scrollHeight;
}

function addNote(clientId) {
  const input = document.getElementById('note-input');
  const text  = input.value.trim(); // empty notes not allowed
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

  // Fire after 60 seconds even if modal is closed
  setTimeout(() => {
    showToast(`⏰ Follow up: ${clientName}`, 'info', 5000);
  }, 60000);
}

// ══════════════════════════════════════════════════════════
// MODAL ERROR HELPERS
// ══════════════════════════════════════════════════════════

function showModalError(fieldId, message) {
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
}

function clearModalErrors(formEl) {
  (formEl || document).querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  (formEl || document).querySelectorAll('.field-error').forEach(el => el.remove());
}

// ── Utility ───────────────────────────────────────────────

function setListZone(html) {
  const container = document.getElementById('clients-list');
  if (container) container.innerHTML = html;
}
