const { ensureSeed } = require('../../_lib/seed');
const { getJson, setJson } = require('../../_lib/store');
const { requireAdmin } = require('../../_lib/authz');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end('Method Not Allowed');
  }

  await ensureSeed();
  if (!requireAdmin(req, res)) return;

  const url = new URL(req.url, `http://${req.headers.host}`);
  const parts = url.pathname.split('/').filter(Boolean);
  const id = parts[2];
  const action = parts[3];

  if (!id || !action || (action !== 'accept' && action !== 'reject')) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'invalid_request' }));
  }

  const nominations = await getJson('nominations', []);
  const idx = Array.isArray(nominations) ? nominations.findIndex((n) => n.id === id) : -1;
  if (idx === -1) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'not_found' }));
  }

  nominations[idx] = { ...nominations[idx], status: action === 'accept' ? 'accepted' : 'rejected' };
  await setJson('nominations', nominations);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: true }));
};
