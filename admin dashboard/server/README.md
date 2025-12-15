## Admin Dashboard Backend (local)

This backend serves your existing HTML/CSS/JS and exposes simple API endpoints.

### Run

1) Install dependencies:

- `cd server`
- `npm install`

2) Start server:

- `npm start`

Open:
- `http://localhost:3000/`

### Notes

- Static files are served from `../admin dashboard/`.
- Data is stored in `server/data/db.json` (JSON file).
- Default admin credentials (dev):
  - Access Code: `1234`
  - Admin Key: `admin`

- Showcase normal user credentials (dev):
  - Email: `showcase.user@gmail.com`
  - Student ID: `2025-0002`
  - Password: `Showcase123!`

- Existing demo user:
  - Email: `demo.user@gmail.com`
  - Student ID: `2025-0001`
  - Password: `Demo1234!`

You can override these with env vars:
- `ADMIN_ACCESS_CODE`
- `ADMIN_KEY`
- `SESSION_SECRET`
- `PORT`
