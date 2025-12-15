import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// Workspace layout:
// <root>/server/server.js
// <root>/admin dashboard/<static files>
const STATIC_ROOT = path.resolve(__dirname, '..', 'admin dashboard');
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'db.json');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Allow frontend served by Live Server (or other local origins) to call the API in dev.
// This keeps the site working whether opened via http://localhost:3000 or http://127.0.0.1:5500.
const DEV_ALLOWED_ORIGINS = new Set([
  'http://localhost:5500',
  'http://127.0.0.1:5500'
]);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && DEV_ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
  }
  next();
});

app.use(
  session({
    name: 'admindash.sid',
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax'
      // secure: true  // enable when using https
    }
  })
);

async function ensureDb() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    const initial = {
      users: [],
      passwordResets: [],
      nominations: [
        { id: 'n1', name: 'Ariana Grande', section: 'BSCS 3 - 1', status: 'pending' },
        { id: 'n2', name: 'Sabrina Carpenter', section: 'BSIT 3 - 1', status: 'pending' },
        { id: 'n3', name: 'Harry Styles', section: 'BSIS 3 - 1', status: 'pending' },
        { id: 'n4', name: 'Justin Bieber', section: 'BSCS 3 - 1', status: 'pending' },
        { id: 'n5', name: 'Taylor Swift', section: 'BSIT 3 - 1', status: 'pending' }
      ],
      stats: {
        totalVoters: 894,
        activeNow: 136
      },
      admin: {
        accessCodeHash: hashSecret(process.env.ADMIN_ACCESS_CODE || '1234'),
        adminKeyHash: hashSecret(process.env.ADMIN_KEY || 'admin')
      }
    };
    await fs.writeFile(DATA_FILE, JSON.stringify(initial, null, 2), 'utf8');
  }
}

async function readDb() {
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

async function writeDb(db) {
  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
}

function pbkdf2(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = pbkdf2(password, salt);
  return { salt, hash };
}

function verifyPassword(password, { salt, hash }) {
  const candidate = pbkdf2(password, salt);
  return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(hash, 'hex'));
}

function hashSecret(secret) {
  return crypto.createHash('sha256').update(String(secret)).digest('hex');
}

function requireUser(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'not_authenticated' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.admin) return res.status(401).json({ error: 'not_admin' });
  next();
}

function requireAuth(req, res, next) {
  if (!req.session.admin && !req.session.userId) {
    return res.status(401).json({ error: 'not_authenticated' });
  }
  next();
}

// --- API ---

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/auth/register', async (req, res) => {
  const { fullname, course, department, studentid, email, password, gradDate } = req.body;

  if (!fullname || !course || !department || !studentid || !email || !password || !gradDate) {
    return res.status(400).json({ error: 'missing_fields' });
  }

  const allowedCourses = new Set(['BSCS', 'BSIT', 'BSIS', 'BTVTED', 'BPA', 'BSA', 'BSAIS', 'BSE']);
  const normalizedCourse = String(course).trim().toUpperCase();
  if (!allowedCourses.has(normalizedCourse)) {
    return res.status(400).json({ error: 'invalid_course' });
  }

  const allowedDepartments = new Set(['CICT', 'BME']);
  const normalizedDepartment = String(department).trim().toUpperCase();
  if (!allowedDepartments.has(normalizedDepartment)) {
    return res.status(400).json({ error: 'invalid_department' });
  }

  const db = await readDb();
  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedStudentId = String(studentid).trim();

  if (!normalizedEmail.endsWith('@gmail.com')) {
    return res.status(400).json({ error: 'invalid_email_domain' });
  }

  if (db.users.some(u => u.email === normalizedEmail || u.studentid === normalizedStudentId)) {
    return res.status(409).json({ error: 'account_exists' });
  }

  const { salt, hash } = hashPassword(String(password));
  const user = {
    id: crypto.randomUUID(),
    fullname: String(fullname).trim(),
    course: normalizedCourse,
    department: normalizedDepartment,
    studentid: normalizedStudentId,
    email: normalizedEmail,
    password: { salt, hash },
    gradDate: String(gradDate)
  };

  db.users.push(user);
  await writeDb(db);

  req.session.userId = user.id;
  req.session.admin = false;

  res.json({ ok: true });
});

app.post('/api/auth/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) return res.status(400).json({ error: 'missing_fields' });

  const db = await readDb();
  const id = String(identifier).trim();
  const normalizedEmail = id.toLowerCase();

  const user = db.users.find(u => u.email === normalizedEmail || u.studentid === id);
  if (!user) return res.status(401).json({ error: 'invalid_credentials' });

  if (!verifyPassword(String(password), user.password)) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  req.session.userId = user.id;
  req.session.admin = false;

  res.json({ ok: true });
});

app.post('/api/auth/admin-login', async (req, res) => {
  const { accessCode, adminKey } = req.body;
  if (!accessCode || !adminKey) return res.status(400).json({ error: 'missing_fields' });

  const db = await readDb();
  const accessOk = hashSecret(accessCode) === db.admin.accessCodeHash;
  const keyOk = hashSecret(adminKey) === db.admin.adminKeyHash;

  if (!accessOk || !keyOk) return res.status(401).json({ error: 'invalid_credentials' });

  req.session.userId = null;
  req.session.admin = true;

  res.json({ ok: true });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('admindash.sid');
    res.json({ ok: true });
  });
});

app.post('/api/auth/forgot', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'missing_fields' });

  // Dev-only: create a reset token, but don't email it.
  const db = await readDb();
  const normalizedEmail = String(email).trim().toLowerCase();

  if (!normalizedEmail.endsWith('@gmail.com')) {
    return res.status(400).json({ error: 'invalid_email_domain' });
  }

  const user = db.users.find(u => u.email === normalizedEmail);

  if (user) {
    const token = crypto.randomBytes(24).toString('hex');
    db.passwordResets.push({
      token,
      userId: user.id,
      expiresAt: Date.now() + 30 * 60 * 1000
    });
    await writeDb(db);

    return res.json({ ok: true, token });
  }

  // Avoid user enumeration
  res.json({ ok: true });
});

app.post('/api/auth/reset', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'missing_fields' });

  const db = await readDb();
  const entryIndex = db.passwordResets.findIndex(r => r.token === token);
  if (entryIndex === -1) return res.status(400).json({ error: 'invalid_token' });

  const entry = db.passwordResets[entryIndex];
  if (Date.now() > entry.expiresAt) return res.status(400).json({ error: 'expired_token' });

  const user = db.users.find(u => u.id === entry.userId);
  if (!user) return res.status(400).json({ error: 'invalid_token' });

  const { salt, hash } = hashPassword(String(password));
  user.password = { salt, hash };
  db.passwordResets.splice(entryIndex, 1);
  await writeDb(db);

  res.json({ ok: true });
});

// Admin-only data endpoints
app.get('/api/stats', requireAdmin, async (_req, res) => {
  const db = await readDb();
  res.json(db.stats);
});

app.get('/api/nominations', requireAdmin, async (_req, res) => {
  const db = await readDb();
  res.json(db.nominations);
});

app.post('/api/nominations/:id/:action(accept|reject)', requireAdmin, async (req, res) => {
  const { id, action } = req.params;
  const db = await readDb();
  const nom = db.nominations.find(n => n.id === id);
  if (!nom) return res.status(404).json({ error: 'not_found' });

  nom.status = action === 'accept' ? 'accepted' : 'rejected';
  await writeDb(db);

  res.json({ ok: true, nomination: nom });
});

// --- Static site ---

// Protect admin dashboard pages (HTML) from normal/user sessions.
// Only admins (Access Code + Admin Key) can view these pages.
const ADMIN_PAGE_RE = /^\/(admin dashboard\/)?(dashboard\.html|login\.html|poll management\.html|results&analytics\.html|settings\.html)$/;
app.get(ADMIN_PAGE_RE, (req, res, next) => {
  if (req.session?.admin) return next();
  res.redirect('/admin sign-in.html');
});

app.use(express.static(STATIC_ROOT));

// Support links opened with the workspace folder prefix (from Live Server redirects)
// e.g. /admin%20dashboard/admin.html
app.use('/admin dashboard', express.static(STATIC_ROOT));

app.get('/', (_req, res) => {
  res.redirect('/index.html');
});

await ensureDb();

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`Serving static from: ${STATIC_ROOT}`);
});
