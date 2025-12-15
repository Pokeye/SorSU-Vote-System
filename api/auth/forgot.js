const crypto = require('crypto');
const { readJson } = require('../_lib/body');
const { ensureSeed } = require('../_lib/seed');
const { getJson, setJson } = require('../_lib/store');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end('Method Not Allowed');
  }

  await ensureSeed();
  const body = await readJson(req);
  const { email } = body;

  if (!email) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'missing_fields' }));
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const users = await getJson('users', []);
  const user = Array.isArray(users) ? users.find((u) => u.email === normalizedEmail) : null;

  const resets = await getJson('passwordResets', []);

  if (user) {
    const token = crypto.randomBytes(24).toString('hex');
    const entry = {
      token,
      userId: user.id,
      expiresAt: Date.now() + 30 * 60 * 1000
    };
    const nextResets = Array.isArray(resets) ? [...resets, entry] : [entry];
    await setJson('passwordResets', nextResets);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: true, token }));
  }

  // Avoid user enumeration
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: true }));
};
