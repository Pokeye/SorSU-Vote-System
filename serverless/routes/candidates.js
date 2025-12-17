const { ensureSeed } = require('../_lib/seed');
const { getJson } = require('../_lib/store');

async function getElectionConfig(electionId) {
  const elections = await getJson('elections', null);
  if (elections && typeof elections === 'object' && elections[electionId]) {
    return elections[electionId];
  }
  return await getJson('election', { id: electionId, endAt: null });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    return res.end('Method Not Allowed');
  }

  await ensureSeed();

  const url = new URL(req.url, `http://${req.headers.host}`);
  const electionId = (url.searchParams.get('electionId') || 'skc').trim();

  const election = await getElectionConfig(electionId);
  const endAt = election && election.endAt ? String(election.endAt) : null;
  const now = Date.now();
  const endMs = endAt ? Date.parse(endAt) : null;
  const status = endMs && now >= endMs ? 'closed' : 'open';

  const candidates = await getJson(`candidates:${electionId}`, []);

  const byPosition = new Map();
  if (Array.isArray(candidates)) {
    for (const c of candidates) {
      if (!c || !c.position || !c.name) continue;
      const pos = String(c.position);
      if (!byPosition.has(pos)) byPosition.set(pos, []);
      byPosition.get(pos).push({
        name: String(c.name),
        party: String(c.party || '')
      });
    }
  }

  const positions = Array.from(byPosition.entries()).map(([position, list]) => ({
    position,
    candidates: list
  }));

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      ok: true,
      electionId,
      status,
      endAt,
      now: new Date(now).toISOString(),
      positions
    })
  );
};
