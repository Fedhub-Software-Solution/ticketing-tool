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
   psql -U postgres -d ticketing_tool -f sql/04_roles.sql
   ```
   With Node: after `db:setup`, run `node scripts/run-sql.cjs sql/04_roles.sql` to create the roles table and seed system roles (for Access Management). For ticket attachments, run `node scripts/run-sql.cjs sql/04_ticket_attachments.sql`. For **notifications** (e.g. admin notified when a customer creates a ticket), run `node scripts/run-sql.cjs sql/06_notifications.sql`.

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

## Welcome emails (new users)

When an admin creates a user, the app can send a welcome email with a random password. To enable this, set in `.env`:

- `SMTP_HOST` – e.g. `smtp.gmail.com`, `smtp.office365.com`, or your provider’s SMTP host  
- `SMTP_PORT` – usually `587` (TLS) or `465` (SSL)  
- `SMTP_USER` – your SMTP login (often your email)  
- `SMTP_PASS` – password or app password (for Gmail use an [App Password](https://support.google.com/accounts/answer/185833))  
- `MAIL_FROM` (optional) – “From” address; defaults to `SMTP_USER`

If these are not set, the user is still created and the temporary password is printed in the server console (in development). The UI will show “User created” and note that the welcome email was not sent.

## Endpoints

See project root `IMPLEMENTATION.md` for the full API contract (auth, users, tickets, comments, categories, SLAs, escalation rules, zones, branches, enterprise, reports).
