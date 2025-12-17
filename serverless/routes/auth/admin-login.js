const { readJson } = require('../../_lib/body');
const { ensureSeed } = require('../../_lib/seed');
const { getJson } = require('../../_lib/store');
const { hashSecret } = require('../../_lib/crypto');
const { writeSession } = require('../../_lib/session');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end('Method Not Allowed');
  }

  await ensureSeed();
  const body = await readJson(req);
  const { accessCode, adminKey } = body;

  if (!accessCode || !adminKey) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'missing_fields' }));
  }

  const admin = await getJson('admin', null);
  const accessOk = admin && hashSecret(accessCode) === admin.accessCodeHash;
  const keyOk = admin && hashSecret(adminKey) === admin.adminKeyHash;

  if (!accessOk || !keyOk) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'invalid_credentials' }));
  }

  writeSession(res, { admin: true });

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: true }));
};
