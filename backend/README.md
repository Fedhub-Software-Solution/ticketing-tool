# Ticketing Tool API

Node.js + Express REST API for the Ticketing Tool. Used by the React web app and (later) Flutter mobile app.

## Setup

1. **PostgreSQL**: Create a database named `ticketing_tool` (e.g. in pgAdmin or with PostgreSQL installed). Then run the SQL scripts.

   **Option A – Node (no `psql` required, works on Windows):**
   ```bash
   # After setting DATABASE_URL in .env (see step 2)
   npm run db:setup
   ```
   Or run schema and seed separately: `npm run db:schema` then `npm run db:seed`.

   **Option B – If `psql` is on your PATH:**
   ```bash
   psql -U postgres -d ticketing_tool -f sql/01_schema.sql
   psql -U postgres -d ticketing_tool -f sql/02_seed.sql
   ```

2. **Environment**: Copy `.env.example` to `.env` and set:
   - `DATABASE_URL` – PostgreSQL connection string, e.g. `postgresql://postgres:YOUR_PASSWORD@localhost:5432/ticketing_tool`  
     Use the **same username and password** you use in pgAdmin. If you get "password authentication failed for user", the username or password in `DATABASE_URL` is wrong.
   - `JWT_SECRET` – Secret for JWT signing (use a strong value in production)
   - `PORT` – Server port (default 3000)

3. **Install and run**:
   ```bash
   npm install
   npm run dev
   ```

API base URL: `http://localhost:3000/api`

## Seed login

After running `02_seed.sql` you can log in with:

- **Email:** `admin@company.com`
- **Password:** `admin123`

If login returns **500**: the admin password may be in the wrong format. Update it with:
`node scripts/run-sql.cjs sql/03_fix_admin_password.sql`
Then try logging in again with admin@company.com / admin123.

## Endpoints

See project root `IMPLEMENTATION.md` for the full API contract (auth, users, tickets, comments, categories, SLAs, escalation rules, zones, branches, enterprise, reports).
