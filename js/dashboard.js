/**
 * dashboard.js — Dashboard page logic for 10X CRM
 */

import { requireAuth } from './guard.js';
import { initNav } from './nav.js';
import { getCurrentUser, getStoredClients, saveClients } from './storage.js';
import { $, escapeHTML, setText, avatarUrl } from './utils.js';

let dashboardClients = []; // local state

/** Entry point — called on page load */
export async function initDashboard() {
  if (!requireAuth()) return;   // guard: redirect if no session
  initNav();                    // sidebar, theme, logout
  renderWelcome();
  startLiveClock();
  await loadData();
}

// ── P3.1 — Welcome & Clock ────────────────────────────────

function renderWelcome() {
  const user      = getCurrentUser();
  const firstName = user ? user.fullName.split(' ')[0] : 'there';
  const el        = $('#welcome-name');
  if (el) el.textContent = firstName;
}

function startLiveClock() {
  function tick() {
    const now = new Date();
    const timeEl = $('#live-time');
    const dateEl = $('#live-date');
    if (timeEl) timeEl.textContent = now.toLocaleTimeString();
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
    }
  }
  tick();
  setInterval(tick, 1000); // updates every second
}

// ── P3.5 — Data ───────────────────────────────────────────

async function loadData() {
  const stored = getStoredClients();
  if (stored) {
    // Use existing localStorage data — no API call needed
    dashboardClients = stored;
  } else {
    // First time: fetch from DummyJSON API and store
    dashboardClients = await fetchFromAPI();
    if (dashboardClients.length > 0) saveClients(dashboardClients);
  }
  renderDashboard();
}

/** Transforms DummyJSON user records into Client objects */
async function fetchFromAPI() {
  try {
    const res = await fetch('https://dummyjson.com/users?limit=30');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    return data.users.map(u => ({
      id:        u.id,
      name:      u.firstName + ' ' + u.lastName,
      email:     u.email,
      phone:     u.phone,
      company:   u.company.name,           // API: company.name
      image:     u.image,
      status:    'Lead',
      dealValue: Math.floor(Math.random() * 9500) + 500, // 500–10 000
      notes:     [],
      createdAt: new Date().toISOString(),
    }));
  } catch (err) {
    console.error('Dashboard API fetch failed:', err);
    return [];
  }
}

// ── Render ────────────────────────────────────────────────

function renderDashboard() {
  renderStats();
  renderPipeline();
  renderRecentClients();
}

// ── P3.2 — Stat Cards ─────────────────────────────────────

function renderStats() {
  const clients = dashboardClients;

  // Total Clients
  setText('stat-total', clients.length);

  // Active Deals: status is NOT "Won" and NOT "Lost"
  const active = clients.filter(c => c.status !== 'Won' && c.status !== 'Lost');
  setText('stat-active', active.length);

  // Won Revenue: sum of dealValue for Won clients, formatted $12,500
  const revenue = clients
    .filter(c => c.status === 'Won')
    .reduce((sum, c) => sum + (c.dealValue || 0), 0);
  setText('stat-revenue', '$' + revenue.toLocaleString());

  // New This Week: createdAt within last 7 days
  const newClients = clients.filter(
    c => (Date.now() - new Date(c.createdAt).getTime()) / 86400000 <= 7
  );
  setText('stat-new', newClients.length);
}

// ── P3.3 — Pipeline Overview ──────────────────────────────

function renderPipeline() {
  const total    = dashboardClients.length || 1; // avoid div-by-zero
  const statuses = ['Lead', 'Contacted', 'Won', 'Lost'];

  statuses.forEach(status => {
    const count  = dashboardClients.filter(c => c.status === status).length;
    const elId   = `pipeline-${status.toLowerCase()}`;
    const el     = $('#' + elId);
    if (!el) return;

    const countEl = el.querySelector('.pipeline-count');
    const barEl   = el.querySelector('.pipeline-bar-fill');
    if (countEl) countEl.textContent = count;
    if (barEl)   barEl.style.width   = Math.round((count / total) * 100) + '%';
  });
}

// ── P3.4 — Recent Clients (last 5) ───────────────────────

function renderRecentClients() {
  const container = $('#recent-clients-list');
  if (!container) return;

  // Sort descending by createdAt and take first 5
  const recent = [...dashboardClients]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  if (recent.length === 0) {
    container.innerHTML = '<p class="text-muted" style="padding:1rem 0">No clients yet. <a href="clients.html">Add some →</a></p>';
    return;
  }

  const statusClass = { Lead: 'lead', Contacted: 'contacted', Won: 'won', Lost: 'lost' };

  container.innerHTML = recent.map(c => {
    const safeName = escapeHTML(c.name);
    const safeCompany = escapeHTML(c.company || '—');
    return `
      <div class="recent-client-item">
        <img
          src="${c.image || ''}"
          alt="${safeName}"
          class="client-avatar-sm"
          onerror="this.src='${avatarUrl(safeName, 40)}'"
        >
        <div class="recent-client-info">
          <span class="recent-client-name">${safeName}</span>
          <span class="recent-client-company">${safeCompany}</span>
        </div>
        <span class="badge badge-${statusClass[c.status] || 'lead'}">${c.status}</span>
        <span class="recent-client-date">${new Date(c.createdAt).toLocaleDateString()}</span>
      </div>
    `;
  }).join('');
}
