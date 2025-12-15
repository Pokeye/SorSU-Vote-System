const { ensureSeed } = require('./_lib/seed');
const { getJson } = require('./_lib/store');
const { requireAdmin } = require('./_lib/authz');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    return res.end('Method Not Allowed');
  }

  await ensureSeed();
  if (!requireAdmin(req, res)) return;

  const stats = await getJson('stats', { totalVoters: 0, activeNow: 0 });
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(stats));
};
