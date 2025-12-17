const { ensureSeed } = require('../_lib/seed');
const { readJson } = require('../_lib/body');
const { getJson, setJson } = require('../_lib/store');
const { requireAdmin, requireUser } = require('../_lib/authz');
const { uuid } = require('../_lib/crypto');

module.exports = async function handler(req, res) {
  await ensureSeed();

  // Admin: list nominations
  if (req.method === 'GET') {
    if (!requireAdmin(req, res)) return;

    const nominations = await getJson('nominations', []);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(nominations));
  }

  // User: submit nomination
  if (req.method === 'POST') {
    const session = requireUser(req, res);
    if (!session) return;

    const body = await readJson(req);
    const {
      club,
      position,
      nomineeName,
      program,
      year,
      block,
      reason,
      imageData
    } = body;

    if (!club || !position || !nomineeName) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'missing_fields' }));
    }

    const nominations = await getJson('nominations', []);
    const next = Array.isArray(nominations) ? nominations : [];

    const nomination = {
      id: uuid(),
      club: String(club).trim(),
      position: String(position).trim(),
      name: String(nomineeName).trim(),
      program: String(program || '').trim(),
      year: String(year || '').trim(),
      block: String(block || '').trim(),
      section: `${String(program || '').trim()} ${String(year || '').trim()} ${String(block || '').trim()}`.trim(),
      reason: String(reason || '').trim(),
      imageData: typeof imageData === 'string' && imageData.startsWith('data:image/') ? imageData : '',
      status: 'pending',
      createdBy: session.userId,
      createdAt: new Date().toISOString()
    };

    next.push(nomination);
    await setJson('nominations', next);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: true, nomination }));
  }

  res.statusCode = 405;
  return res.end('Method Not Allowed');
};
