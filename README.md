# ticketing-tool
Ticketing Tool

## Running the app

1. **Backend (API)** – required for tickets, auth, categories, etc.
   ```bash
   cd backend
   cp .env.example .env   # set DATABASE_URL, JWT_SECRET, PORT
   npm install
   npm run db:setup       # create DB schema + seed (PostgreSQL)
   npm run dev
   ```
   API runs at `http://localhost:3000/api`. See `backend/README.md` for details.

2. **Web app**
   ```bash
   cd web
   npm install
   npm run dev
   ```
   Open `http://localhost:5173`. If you see "Cannot reach the API" or "Failed to fetch", start the backend first (step 1).
