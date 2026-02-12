# Ticketing Tool — Step-by-Step Implementation Guide

This document describes the **FedHub Ticketing Tool** project structure, architecture, and a step-by-step guide to run and implement the application from scratch.

---

## 1. Project Overview

| Layer | Stack | Purpose |
|-------|--------|--------|
| **Frontend** | React 18, Vite, TypeScript, Redux Toolkit (RTK Query), Tailwind CSS, Radix UI, Motion | Web UI for agents, managers, admins, and customer portal |
| **Backend** | Node.js, Express, TypeScript, PostgreSQL (pg) | REST API: auth, users, tickets, comments, SLAs, categories, zones, branches, enterprise, reports |
| **Database** | PostgreSQL | Schema with zones, branches, users, SLAs, escalation rules, categories, tickets, comments, enterprise config |

The app is a **service-desk / helpdesk ticketing system** with roles (admin, manager, agent, customer), SLA and escalation configuration, Kanban board, reports, and a customer-facing portal for ticket tracking.

---

## 2. Repository Structure

```
ticketing-tool/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── config.ts        # PORT, DATABASE_URL, JWT_SECRET, etc.
│   │   ├── index.ts         # Express app, CORS, routes, error handler
│   │   ├── db/index.ts      # pg Pool
│   │   ├── middleware/      # authMiddleware, requireRoles, errorHandler
│   │   ├── routes/          # auth, users, slas, escalationRules, categories, zones, branches, enterprise, tickets, reports
│   │   ├── controllers/     # One per route area
│   │   └── types/           # JwtPayload, etc.
│   ├── sql/
│   │   ├── 01_schema.sql    # Tables, enums, indexes, triggers
│   │   ├── 02_seed.sql      # Sample zones, branches, admin user, SLAs, escalation rules, categories
│   │   └── 03_fix_admin_password.sql   # Fix admin hash if login returns 500
│   ├── scripts/
│   │   ├── run-sql.js       # Run SQL files via pg (ESM; may need Node ESM or use psql)
│   │   └── seed.ts          # Alternative seed script
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── web/                     # React SPA
│   ├── src/
│   │   ├── main.tsx         # React root, Redux Provider
│   │   ├── app/
│   │   │   ├── App.tsx      # Routing by view state, Login/CustomerPortal gate
│   │   │   ├── components/  # Login, Sidebar, Header, Dashboard, TicketList, TicketDetail, CreateTicket, Board, Reports, Config screens, etc.
│   │   │   ├── store/       # Redux store, authSlice, baseApi + RTK Query APIs
│   │   │   ├── types.ts     # User, Ticket, SLA, Category, etc.
│   │   │   └── contexts/    # TicketsContext
│   │   └── styles/
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.ts       # @ alias → src
│   └── index.html
├── README.md
└── IMPLEMENTATION.md        # This file
```

---

## 3. Step-by-Step Implementation

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** (local or remote instance)
- **npm** (or pnpm; commands below use npm)

---

### Step 1: Clone and open the project

```bash
git clone <repo-url>
cd ticketing-tool
```

---

### Step 2: Database setup

1. **Create a PostgreSQL database** named `ticketing_tool` (e.g. via pgAdmin or `psql`).

2. **Apply schema and seed** using one of the following.

   **Option A — Using psql (if on PATH):**

   ```bash
   cd backend
   psql -U postgres -d ticketing_tool -f sql/01_schema.sql
   psql -U postgres -d ticketing_tool -f sql/02_seed.sql
   ```

   **Option B — Using Node (no psql):**

   From `backend/`, copy `.env.example` to `.env` and set `DATABASE_URL` (see Step 3). Then run:

   ```bash
   cd backend
   npm run db:setup
   ```

   Or run schema and seed separately: `npm run db:schema` then `npm run db:seed`. These use `scripts/run-sql.cjs` (CommonJS). You can also run SQL files manually: `node scripts/run-sql.cjs sql/01_schema.sql sql/02_seed.sql`.

3. **Optional — Fix admin password** (if login returns 500 after seed):

   ```bash
   node scripts/run-sql.cjs sql/03_fix_admin_password.sql
   ```

   Then log in with **admin@company.com** / **admin123**.

---

### Step 3: Backend environment and run

1. **Copy env and set variables:**

   ```bash
   cd backend
   copy .env.example .env
   ```

   Edit `.env`:

   - **DATABASE_URL** — e.g. `postgresql://postgres:YOUR_PASSWORD@localhost:5432/ticketing_tool` (use the same user/password as in pgAdmin).
   - **JWT_SECRET** — Strong secret for production; default is fine for dev.
   - **PORT** — Default `3000`.

2. **Install and start API:**

   ```bash
   npm install
   npm run dev
   ```

   API base: **http://localhost:3000/api**  
   Health: **http://localhost:3000/api/health**

---

### Step 4: Web app environment and run

1. **Copy env and set API URL:**

   ```bash
   cd web
   copy .env.example .env
   ```

   In `.env` set:

   - **VITE_API_URL** — `http://localhost:3000/api` (must match backend `PORT` and path).

2. **Install and start frontend:**

   ```bash
   npm install
   npm run dev
   ```

   Open the URL shown (e.g. **http://localhost:5173**).

---

### Step 5: First login

- **Email:** `admin@company.com`  
- **Password:** `admin123`  

After login you can use Dashboard, Tickets, Board, Reports, SLA Configuration, Escalation, Categories, Enterprise, User Management, and Profile.

---

## 4. Architecture Summary

### Backend

- **Entry:** `backend/src/index.ts` — Express app, `cors()`, `express.json()`, mounts all routes under `/api/*`, global `errorHandler`.
- **Config:** `backend/src/config.ts` — Reads `PORT`, `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN` from `process.env` (via `dotenv`).
- **DB:** `backend/src/db/index.ts` — Single `pg.Pool` using `config.databaseUrl`.
- **Auth:** JWT in `Authorization: Bearer <token>`. `authMiddleware` verifies token and sets `req.user`; `requireRoles('admin','manager')` restricts certain routes.
- **Routes (all under `/api`):**
  - `GET /api/health` — Health check.
  - **Auth:** `/api/auth` — POST `/login`, POST `/register`, GET `/me` (protected).
  - **Users:** `/api/users` — List, get by id, update (admin/manager for list/update).
  - **SLAs:** `/api/slas` — CRUD (admin/manager for write).
  - **Escalation rules:** `/api/escalation-rules` — CRUD (admin/manager for write).
  - **Categories:** `/api/categories` — CRUD (admin/manager for write).
  - **Zones:** `/api/zones` — List, create, update (admin/manager for write).
  - **Branches:** `/api/branches` — List, create, update (admin/manager for write).
  - **Enterprise:** `/api/enterprise` — GET one, PATCH (admin/manager).
  - **Tickets:** `/api/tickets` — CRUD; GET/POST/PATCH/DELETE `/api/tickets/:id/comments` and `/:id/comments/:cid`.
  - **Reports:** `/api/reports` — GET `/summary`.

### Frontend

- **Entry:** `web/src/main.tsx` — Renders `<App />` inside Redux `Provider` with `store`.
- **Store:** `web/src/app/store/index.ts` — `authSlice` + `baseApi` (RTK Query). All API calls go through `baseApi` (base URL from `VITE_API_URL`); `prepareHeaders` adds `Authorization: Bearer <token>` from `authSlice`.
- **Auth flow:** Login/Register call auth API → response returns `user` + `token` → `setCredentials({ user, token })` → token and user stored in Redux and `localStorage` (key `ticketing_auth`). Protected views render only when `currentUser` is set; otherwise Login or Customer Portal is shown.
- **Navigation:** View-based (no URL router): `App.tsx` holds `currentView` state and renders Dashboard, TicketList, TicketDetail, CreateTicket, Board, Reports, SLA Config, Escalations, Categories, Enterprise, User Management, Profile, etc., and handles “back” and ticket selection.

### Database (high level)

- **Enums:** `user_role`, `user_status`, `ticket_status`, `priority_level`.
- **Core tables:** `zones`, `branches`, `users`, `slas`, `escalation_rules`, `categories`, `tickets`, `ticket_comments`, `enterprise_config`.
- **Relations:** Branches → zone; users → zone/branch; tickets → category, zone, branch, assigned_to, created_by, sla; comments → ticket, author.
- **Triggers:** `updated_at` maintained on all main tables.

---

## 5. API Endpoints Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/login` | No | Login (email, password) → `{ user, token }` |
| POST | `/api/auth/register` | No | Register (name, email, password, role?) |
| GET | `/api/auth/me` | Bearer | Current user |
| GET | `/api/users` | Bearer, admin/manager | List users |
| GET | `/api/users/:id` | Bearer | Get user |
| PATCH | `/api/users/:id` | Bearer, admin/manager | Update user |
| GET | `/api/slas` | Bearer | List SLAs |
| GET | `/api/slas/:id` | Bearer | Get SLA |
| POST/PATCH/DELETE | `/api/slas`, `/:id` | Bearer, admin/manager | Create/update/delete SLA |
| GET | `/api/escalation-rules` | Bearer | List escalation rules |
| POST/PATCH/DELETE | `/api/escalation-rules`, `/:id` | Bearer, admin/manager | CRUD escalation rules |
| GET | `/api/categories` | Bearer | List categories |
| POST/PATCH/DELETE | `/api/categories`, `/:id` | Bearer, admin/manager | CRUD categories |
| GET | `/api/zones` | Bearer | List zones |
| POST/PATCH | `/api/zones`, `/:id` | Bearer, admin/manager | Create/update zone |
| GET | `/api/branches` | Bearer | List branches |
| POST/PATCH | `/api/branches`, `/:id` | Bearer, admin/manager | Create/update branch |
| GET | `/api/enterprise` | Bearer | Get enterprise config |
| PATCH | `/api/enterprise` | Bearer, admin/manager | Update enterprise config |
| GET | `/api/tickets` | Bearer | List tickets (query params for filters) |
| GET | `/api/tickets/:id` | Bearer | Get ticket |
| POST | `/api/tickets` | Bearer | Create ticket |
| PATCH | `/api/tickets/:id` | Bearer | Update ticket |
| DELETE | `/api/tickets/:id` | Bearer | Delete ticket |
| GET | `/api/tickets/:id/comments` | Bearer | List comments |
| POST | `/api/tickets/:id/comments` | Bearer | Add comment |
| PATCH/DELETE | `/api/tickets/:id/comments/:cid` | Bearer | Update/delete comment |
| GET | `/api/reports/summary` | Bearer | Report summary |

---

## 6. Configuration Checklist

| Step | Item | Where |
|------|------|--------|
| 1 | Create DB `ticketing_tool` | PostgreSQL |
| 2 | Run `01_schema.sql`, `02_seed.sql` | psql or run-sql script |
| 3 | Set `DATABASE_URL`, `JWT_SECRET`, `PORT` | `backend/.env` |
| 4 | Set `VITE_API_URL` to backend base URL | `web/.env` |
| 5 | Backend: `npm install` + `npm run dev` | `backend/` |
| 6 | Web: `npm install` + `npm run dev` | `web/` |
| 7 | Login with seed admin | admin@company.com / admin123 |

---

## 7. Optional: Production build

- **Backend:** `cd backend && npm run build && npm start` (serves `dist/index.js`).
- **Web:** `cd web && npm run build`; serve the `dist/` folder with a static server and point `VITE_API_URL` (or your production API URL) at build time.

---

## 8. Troubleshooting

- **Login 500:** Run `sql/03_fix_admin_password.sql` and try again with admin@company.com / admin123.
- **"password authentication failed for user":** Fix `DATABASE_URL` in `backend/.env` (correct user/password/host/port/db).
- **CORS or network errors from web:** Ensure `VITE_API_URL` matches the backend (scheme, host, port, path) and backend is running.
- **run-sql fails:** Use `scripts/run-sql.cjs` (e.g. `node scripts/run-sql.cjs sql/01_schema.sql`) or use psql. The repo also has `run-sql.js` (ESM); if you use it, run with Node ESM support or rename to `.mjs`.

This completes the step-by-step implementation guide for the Ticketing Tool.
