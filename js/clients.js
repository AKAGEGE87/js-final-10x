/**
 * clients.js — Clients page: full CRUD + filter/sort/search + modals
 *
 * Golden Cycle: state changes → saveClients() → renderClients()
 */

import { requireAuth } from './guard.js';
import { initNav } from './nav.js';
import { getStoredClients, saveClients, clearClients } from './storage.js';
import { showToast } from './toast.js';
import { isValidEmail, showError, clearErrors, setText } from './utils.js';

// -- State --
let clientsState   = [];      // source of truth (loaded from localStorage or API)
let activeFilter   = 'All';   // active status chip
let searchQuery    = '';      // search box value
let sortBy         = 'newest';// sort select value
let editingClientId = null;   // null = add mode, number = edit mode

// Status → CSS badge class
const STATUS_CLASS = { Lead: 'lead', Contacted: 'contacted', Won: 'won', Lost: 'lost' };

// -- INIT --

export async function initClients() {
  if (!requireAuth()) return;
  initNav();
  await loadClients();
  setupToolbar();
  setupAddClientModal();
  setupDetailModal();
  setupKeyboardShortcuts();
  document.getElementById('export-csv-btn')?.addEventListener('click', exportCSV);
}

/** Global keyboard shortcuts for the clients page */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    // Escape — close any open modal
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.modal-open').forEach(m => {
        m.classList.remove('modal-open');
        stopCallTimer(); // stop timer if detail modal closes via keyboard
      });
    }

    // / or Ctrl+K — focus search input (skip if already in an input)
    if ((e.key === '/' || (e.ctrlKey && e.key === 'k')) &&
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      document.getElementById('search-input')?.focus();
    }
  });
}

// -- LOAD (P4.2) --

async function loadClients() {
  const stored = getStoredClients();
  if (stored) {
    clientsState = stored;
    renderClients(getVisibleClients());
    return;
  }

  // Show premium skeleton loading state while fetching (bonus)
  setListZone(`
    <div class="skeleton-grid">
      <div class="skeleton-card">
        <div class="skeleton-avatar pulse-anim"></div>
        <div class="skeleton-info">
          <div class="skeleton-line short pulse-anim"></div>
          <div class="skeleton-line long pulse-anim"></div>
        </div>
      </div>
      <div class="skeleton-card">
        <div class="skeleton-avatar pulse-anim"></div>
        <div class="skeleton-info">
          <div class="skeleton-line short pulse-anim"></div>
          <div class="skeleton-line long pulse-anim"></div>
        </div>
      </div>
      <div class="skeleton-card">
        <div class="skeleton-avatar pulse-anim"></div>
        <div class="skeleton-info">
          <div class="skeleton-line short pulse-anim"></div>
          <div class="skeleton-line long pulse-anim"></div>
        </div>
      </div>
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
  } else {
    container.innerHTML = list.map(buildClientCard).join('');
  }

  updateChipCounts(); // keep chip labels in sync after every render
}

/** Updates each filter chip to show how many clients match that status */
function updateChipCounts() {
  const totals = { All: clientsState.length };
  ['Lead', 'Contacted', 'Won', 'Lost'].forEach(s => {
    totals[s] = clientsState.filter(c => c.status === s).length;
  });

  Object.entries(totals).forEach(([status, count]) => {
    const chip = document.getElementById(`chip-${status}`);
    if (chip) chip.textContent = count > 0 ? `${status} (${count})` : status;
  });
}

function highlightHTML(text, query) {
  if (!query || !text) return text;
  const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const reg = new RegExp(`(${escapedQuery})`, 'gi');
  return text.replace(reg, '<mark class="highlight">$1</mark>');
}

function buildClientCard(c) {
  const avatar = c.image || avatarUrl(c.name, 56);
  const opts   = ['Lead', 'Contacted', 'Won', 'Lost']
    .map(s => `<option value="${s}" ${c.status === s ? 'selected' : ''}>${s}</option>`)
    .join('');

  const nameHTML = highlightHTML(c.name, searchQuery);
  const compHTML = highlightHTML(c.company || '—', searchQuery);

  return `
    <div class="client-card" data-id="${c.id}">
      <div class="client-card-header" onclick="openClientDetail(${c.id})">
        <img src="${avatar}" alt="${c.name}" class="client-avatar"
          onerror="this.src='${avatarUrl(c.name, 56)}'">
        <div class="client-info">
          <h3 class="client-name">${nameHTML}</h3>
          <p class="client-company">${compHTML}</p>
          <p class="client-email">${c.email}</p>
        </div>
      </div>
      <div class="client-card-footer">
        <div style="display:flex; align-items:center; gap:0.5rem">
          <span class="badge badge-${STATUS_CLASS[c.status] || 'lead'}">${c.status}</span>
          <span class="notes-count-badge" title="Notes count">💬 ${(c.notes || []).length}</span>
        </div>
        <span class="deal-value">$${(c.dealValue || 0).toLocaleString()}</span>
        <select class="status-select" data-id="${c.id}"
          onchange="changeStatus(this)" onclick="event.stopPropagation()"
          aria-label="Change status for ${c.name}">${opts}</select>
        <button class="btn-edit" onclick="openEditModal(${c.id}, event)"
          aria-label="Edit ${c.name}">Edit</button>
        <button class="btn-delete" onclick="deleteClient(${c.id}, event)"
          aria-label="Delete ${c.name}">Delete</button>
      </div>
    </div>
  `;
}

// -- STATUS CHANGE (P4.6) --

export function changeStatus(selectEl) {
  const id     = parseInt(selectEl.dataset.id, 10);
  const client = clientsState.find(c => c.id === id);
  if (!client) return;

  client.status = selectEl.value;
  saveClients(clientsState);
  renderClients(getVisibleClients());
}

// -- DELETE (P4.5) --

export async function deleteClient(id, event) {
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

let searchDebounceTimer = null; // holds the pending setTimeout id

function setupToolbar() {
  const searchInput = document.getElementById('search-input');
  const clearBtn    = document.getElementById('search-clear');

  if (searchInput) {
    searchInput.addEventListener('input', e => {
      // Show/hide clear button
      if (clearBtn) clearBtn.style.display = e.target.value ? 'flex' : 'none';

      // Debounce: wait 300ms after last keystroke before re-rendering
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        searchQuery = e.target.value;
        renderClients(getVisibleClients());
      }, 300);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value  = '';
      clearBtn.style.display = 'none';
      searchQuery = '';
      renderClients(getVisibleClients());
      searchInput.focus();
    });
  }

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
    editingClientId = null;                                          // switch to add mode
    form.reset();
    clearErrors(form);
    document.getElementById('add-modal-title').textContent  = 'Add New Client';
    document.getElementById('add-submit-btn').textContent   = 'Add Client';
    modal.classList.add('modal-open');
    document.getElementById('new-name').focus();
  });

  document.getElementById('add-modal-close').addEventListener('click', closeAddModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeAddModal(); });
  form.addEventListener('submit', handleClientForm);
}

/** Closes the add/edit modal and resets its mode back to "add" */
export function closeAddModal() {
  document.getElementById('add-client-modal').classList.remove('modal-open');
  document.getElementById('add-modal-title').textContent = 'Add New Client';
  document.getElementById('add-submit-btn').textContent  = 'Add Client';
  editingClientId = null;
}

/** Opens the shared modal pre-filled with the client's existing data (edit mode) */
export function openEditModal(id, event) {
  if (event) event.stopPropagation(); // prevent card click opening detail modal

  const client = clientsState.find(c => c.id === id);
  if (!client) return;

  editingClientId = id; // switch to edit mode

  // Pre-fill form fields with current values
  document.getElementById('new-name').value    = client.name;
  document.getElementById('new-email').value   = client.email;
  document.getElementById('new-phone').value   = client.phone    || '';
  document.getElementById('new-company').value = client.company  || '';
  document.getElementById('new-deal').value    = client.dealValue || '';
  document.getElementById('new-status').value  = client.status;

  clearErrors(document.getElementById('add-client-form'));
  document.getElementById('add-modal-title').textContent = 'Edit Client';
  document.getElementById('add-submit-btn').textContent  = 'Save Changes';
  document.getElementById('add-client-modal').classList.add('modal-open');
  document.getElementById('new-name').focus();
}

/** Single submit handler — routes to add or edit based on editingClientId */
async function handleClientForm(e) {
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
  } else {
    // Email must be unique — when editing, exclude the client's own current email
    const duplicate = clientsState.some(
      c => c.email.toLowerCase() === email && c.id !== editingClientId
    );
    if (duplicate) {
      showError('new-email', 'A client with this email already exists', form);
      hasError = true;
    }
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

  const formData = { name, email, phone, company, status, dealValue: dealNum };

  if (editingClientId !== null) {
    await saveEditedClient(editingClientId, formData);
  } else {
    await saveNewClient(formData);
  }
}

/** Sends POST, adds client to state top, saves, renders */
async function saveNewClient(data) {
  let serverId = Date.now();
  try {
    const res = await fetch('https://dummyjson.com/users/add', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ firstName: data.name, email: data.email, phone: data.phone }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.id) serverId = json.id;
    }
  } catch (err) {
    console.warn('POST failed, adding locally:', err);
  }

  clientsState.unshift({
    id: serverId, ...data,
    image:     avatarUrl(data.name, 128),
    notes:     [],
    createdAt: new Date().toISOString(),
  });

  saveClients(clientsState);
  renderClients(getVisibleClients());
  closeAddModal();
  showToast('Client added ✓', 'success');
}

/** Sends PUT, updates client in state, saves, renders */
async function saveEditedClient(id, data) {
  try {
    await fetch(`https://dummyjson.com/users/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
  } catch (err) {
    // Network error — still update locally
    console.warn('PUT failed, updating locally:', err);
  }

  // Golden Cycle: update state → save → render
  const client = clientsState.find(c => c.id === id);
  if (client) Object.assign(client, data);
  saveClients(clientsState);
  renderClients(getVisibleClients());
  closeAddModal();
  showToast('Client updated ✓', 'success');
}

// -- DETAIL MODAL (P4.8) --

function setupDetailModal() {
  const modal = document.getElementById('detail-modal');
  if (!modal) return;

  const closeModal = () => {
    stopCallTimer(); // always stop any running call timer on close
    modal.classList.remove('modal-open');
  };

  document.getElementById('detail-modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
}

export function openClientDetail(id) {
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
  setupCallTimer(id); // wire up call timer for this client

  // Clipboard copy helpers (bonus)
  const emailEl = document.getElementById('detail-email');
  if (emailEl) {
    emailEl.onclick = () => {
      navigator.clipboard.writeText(client.email);
      showToast('Email copied to clipboard! 📋', 'success', 2000);
    };
  }
  const phoneEl = document.getElementById('detail-phone');
  if (phoneEl && client.phone) {
    phoneEl.onclick = () => {
      navigator.clipboard.writeText(client.phone);
      showToast('Phone copied to clipboard! 📋', 'success', 2000);
    };
  }

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

// -- CALL TIMER (bonus) --

let callTimerInterval = null; // active setInterval id
let callSeconds       = 0;    // elapsed seconds

function setupCallTimer(clientId) {
  const startBtn = document.getElementById('call-start-btn');
  const endBtn   = document.getElementById('call-end-btn');
  const clock    = document.getElementById('call-timer-clock');
  if (!startBtn || !endBtn || !clock) return;

  // Reset to clean state every time modal opens
  stopCallTimer();
  clock.textContent = '00:00';

  startBtn.onclick = () => {
    callSeconds = 0;
    clock.textContent = '00:00';
    startBtn.disabled = true;
    endBtn.disabled   = false;

    // setInterval increments callSeconds every second and updates the display
    callTimerInterval = setInterval(() => {
      callSeconds++;
      const mm = String(Math.floor(callSeconds / 60)).padStart(2, '0');
      const ss = String(callSeconds % 60).padStart(2, '0');
      clock.textContent = `${mm}:${ss}`;
    }, 1000);
  };

  endBtn.onclick = () => {
    stopCallTimer();
    startBtn.disabled = false;
    endBtn.disabled   = true;

    // Save call duration as a note
    const mm  = String(Math.floor(callSeconds / 60)).padStart(2, '0');
    const ss  = String(callSeconds % 60).padStart(2, '0');
    const txt = `📞 Call duration: ${mm}:${ss}`;

    const client = clientsState.find(c => c.id === clientId);
    if (client) {
      client.notes.push({ text: txt, date: new Date().toLocaleString() });
      saveClients(clientsState);
      renderNotes(client);
    }
    showToast(`Call logged: ${mm}:${ss}`, 'success');
  };
}

/** Clears the interval and resets counter */
function stopCallTimer() {
  clearInterval(callTimerInterval);
  callTimerInterval = null;
  callSeconds = 0;
}

// -- SHARED HELPERS --

/** Generates a UI-Avatars URL for a given name and size */
function avatarUrl(name, size) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6c63ff&color=fff&size=${size}`;
}

function setListZone(html) {
  const el = document.getElementById('clients-list');
  if (el) el.innerHTML = html;
}

// -- CSV EXPORT (bonus) --

/**
 * Converts clientsState to a .csv file and triggers a browser download.
 * Uses the Blob API to create a file in memory without a server.
 */
function exportCSV() {
  if (!clientsState.length) {
    showToast('No clients to export', 'error');
    return;
  }

  // Build CSV rows: header + one row per client
  const headers = ['Name', 'Email', 'Phone', 'Company', 'Status', 'Deal Value', 'Created At'];

  const rows = clientsState.map(c => [
    `"${c.name}"`,
    `"${c.email}"`,
    `"${c.phone  || ''}"`,
    `"${c.company || ''}"`,
    `"${c.status}"`,
    c.dealValue || 0,
    new Date(c.createdAt).toLocaleDateString(),
  ].join(','));

  const csv  = [headers.join(','), ...rows].join('\n');

  // Create a Blob (in-memory file) and a temporary download link
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = `10x-crm-clients-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  // Clean up the temporary object URL from memory
  URL.revokeObjectURL(url);
  showToast(`Exported ${clientsState.length} clients ✓`, 'success');
}
