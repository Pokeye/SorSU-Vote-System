const { readJson } = require('../_lib/body');
const { ensureSeed } = require('../_lib/seed');
const { getJson } = require('../_lib/store');
const { verifyPassword } = require('../_lib/crypto');
const { writeSession } = require('../_lib/session');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end('Method Not Allowed');
  }

  await ensureSeed();
  const body = await readJson(req);
  const { identifier, password } = body;

  if (!identifier || !password) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'missing_fields' }));
  }

  const users = await getJson('users', []);
  const id = String(identifier).trim();
  const normalizedEmail = id.toLowerCase();

  const user = Array.isArray(users)
    ? users.find((u) => u.email === normalizedEmail || u.studentid === id)
    : null;

  if (!user) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'invalid_credentials' }));
  }

  if (!verifyPassword(String(password), user.password)) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'invalid_credentials' }));
  }

  writeSession(res, { admin: false, userId: user.id });

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: true }));
};
