# 10X CRM

A client relationship management (CRM) web application built with Vanilla JavaScript as a final exam project for the JavaScript module.

Live Demo: **[https://10x-crm-akaki.vercel.app](https://10x-crm-akaki.vercel.app)**

---

## About

10X CRM is a lightweight, fully client-side CRM that helps sales managers track their leads and deals. It includes user authentication, a live dashboard with sales statistics, full client management with filtering and search, and a user profile page — all powered by `localStorage` and the DummyJSON API.

## Features

- **Authentication** — Sign Up with validation, Login with session management, Auth Guard on all protected pages
- **Dashboard** — Live clock, 4 stat cards (Total Clients, Active Deals, Won Revenue, New This Week), Pipeline Overview, Recent Clients
- **Clients** — Load 30 clients from API, Add (POST), Delete (DELETE), status change, search by name/company, filter by status, sort by date/name/deal value
- **Client Details** — Notes with timestamps, 1-minute follow-up reminder (setTimeout)
- **Profile** — Edit name/company, change password, reset CRM data
- **Dark / Light theme** — persisted in `localStorage`

## Tech Stack

| Technology | Usage |
|---|---|
| HTML5 | Semantic page structure |
| Vanilla CSS | Design system, dark/light themes, animations |
| Vanilla JavaScript (ES6+) | All logic — no frameworks |
| DummyJSON API | Initial client data (GET/POST/DELETE) |
| localStorage | Data persistence (users, session, clients, theme) |
| Google Fonts (Inter) | Typography |

## How to Run

No build step required — this is a plain HTML/CSS/JS project.

1. Clone the repository:
   ```bash
   git clone https://github.com/AKAGEGE87/10x-crm-akaki.git
   ```
2. Open `index.html` in your browser directly, **or** use a local dev server (e.g. VS Code Live Server extension) to avoid any CORS issues.

> **Recommended:** Use VS Code + Live Server extension for the best experience.

## Test Account

To skip registration and explore the app immediately, use:

| Field | Value |
|---|---|
| Email | `demo@test.com` |
| Password | `demo1234` |

> Or simply click **Sign Up** on the login page to create your own account.

## localStorage Keys

| Key | Contents |
|---|---|
| `crm_users` | Array of registered User objects |
| `crm_session` | Current session object (removed on logout) |
| `crm_clients` | Array of Client objects — main app state |
| `crm_theme` | `"dark"` or `"light"` |

## Credits

- **DummyJSON** (dummyjson.com) — free mock REST API for realistic user/client data
- **UI Avatars** (ui-avatars.com) — fallback avatar generation
- **Google Fonts** — Inter typeface
- AI tools used: Claude, Gemini (see `ai-log.md` for details)

---

*Built with ⚡ for the 10X JavaScript Exam — July 2026*
