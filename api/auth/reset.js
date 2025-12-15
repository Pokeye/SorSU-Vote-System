const { readJson } = require('../_lib/body');
const { ensureSeed } = require('../_lib/seed');
const { getJson, setJson } = require('../_lib/store');
const { hashPassword } = require('../_lib/crypto');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end('Method Not Allowed');
  }

  await ensureSeed();
  const body = await readJson(req);
  const { token, password } = body;

  if (!token || !password) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'missing_fields' }));
  }

  const resets = await getJson('passwordResets', []);
  const users = await getJson('users', []);

  const idx = Array.isArray(resets) ? resets.findIndex((r) => r.token === token) : -1;
  if (idx === -1) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'invalid_token' }));
  }

  const entry = resets[idx];
  if (Date.now() > entry.expiresAt) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'expired_token' }));
  }

  const user = Array.isArray(users) ? users.find((u) => u.id === entry.userId) : null;
  if (!user) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'invalid_token' }));
  }

  user.password = hashPassword(String(password));

  const nextResets = resets.slice();
  nextResets.splice(idx, 1);

  await setJson('users', users);
  await setJson('passwordResets', nextResets);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: true }));
};
