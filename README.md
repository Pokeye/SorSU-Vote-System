## SORSU E-Voting (Static Site)

This project is plain HTML/CSS/JS (no build step required) plus Vercel Serverless Functions under `/api`.

### Deploy to Vercel

1. Push this folder to a GitHub repo.
2. In Vercel: **New Project** → import the repo.
3. Framework preset: **Other**.
4. Build Command: leave **empty**.
5. Output Directory: leave **empty** (project root).

Vercel serves `index.html` at `/`, which redirects to `loginn.html`.

### Serverless API (Option B)

Admin pages call same-origin endpoints like:

- `/api/auth/admin-login`
- `/api/stats`
- `/api/nominations`

Recommended environment variables in Vercel **Project Settings → Environment Variables**:

- `SESSION_SECRET` (required for secure cookies)
- `ADMIN_ACCESS_CODE` (optional; default `1234`)
- `ADMIN_KEY` (optional; default `admin`)

Persistence:

- If you attach **Vercel KV** to the project, it will persist users/nominations/stats.
- If KV is not configured, the API uses an in-memory fallback (works for demos, but data can reset).

### Notes

- Pages/folders with spaces in their names work, but the URL will include `%20`.
- The old Express server (`admin dashboard/server/server.js`) is not used by Vercel; the deployed API is in `/api/*`.
