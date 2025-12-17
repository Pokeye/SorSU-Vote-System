const { ensureSeed } = require('../_lib/seed');
const { getJson, setJson } = require('../_lib/store');
const { requireAdmin } = require('../_lib/authz');

function slugifyElectionId(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
}

function electionStatus(endAt) {
  const endMs = endAt ? Date.parse(String(endAt)) : null;
  if (!endMs) return 'open';
  return Date.now() >= endMs ? 'closed' : 'open';
}

module.exports = async function handler(req, res) {
  await ensureSeed();

  const session = requireAdmin(req, res);
  if (!session) return;

  if (req.method === 'GET') {
    const electionsObj = await getJson('elections', {});
    const electionIds = electionsObj && typeof electionsObj === 'object' ? Object.keys(electionsObj).sort() : [];

    const elections = [];
    for (const id of electionIds) {
      const cfg = electionsObj[id] || {};
      const endAt = cfg.endAt || null;
      const startAt = cfg.startAt || null;
      const name = cfg.name || id;
      const positions = Array.isArray(cfg.positions) ? cfg.positions : null;

      const ballots = await getJson(`ballots:${id}`, []);
      const candidates = await getJson(`candidates:${id}`, []);

      elections.push({
        id,
        name,
        startAt,
        endAt,
        status: electionStatus(endAt),
        totalBallots: Array.isArray(ballots) ? ballots.length : 0,
        candidateCount: Array.isArray(candidates) ? candidates.length : 0,
        positions
      });
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: true, elections }));
  }

  if (req.method === 'POST') {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', async () => {
      let body = {};
      try {
        body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
      } catch {
        body = {};
      }

      const { orgClub, name, eventStart, eventEnd, startAt, endAt, positionIncluded, electionId } = body || {};

      const providedName = String(name || orgClub || '').trim();
      const normalizedEndAt = String(endAt || eventEnd || '').trim();
      const normalizedStartAt = String(startAt || eventStart || '').trim();

      const id = String(electionId || slugifyElectionId(providedName)).trim();
      if (!id) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'missing_fields' }));
      }
      if (!normalizedEndAt) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'missing_end_date' }));
      }

      const parsedEnd = Date.parse(normalizedEndAt.length === 10 ? `${normalizedEndAt}T23:59:59.000Z` : normalizedEndAt);
      if (!Number.isFinite(parsedEnd)) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'invalid_end_date' }));
      }
      const endAtIso = new Date(parsedEnd).toISOString();

      let startAtIso = null;
      if (normalizedStartAt) {
        const parsedStart = Date.parse(normalizedStartAt.length === 10 ? `${normalizedStartAt}T00:00:00.000Z` : normalizedStartAt);
        if (Number.isFinite(parsedStart)) startAtIso = new Date(parsedStart).toISOString();
      }

      const electionsObj = await getJson('elections', {});
      const existing = electionsObj && typeof electionsObj === 'object' && electionsObj[id] ? electionsObj[id] : {};
      const positions = new Set(Array.isArray(existing.positions) ? existing.positions.map(String) : []);
      if (positionIncluded) positions.add(String(positionIncluded));

      const next = {
        ...existing,
        id,
        name: providedName || existing.name || id,
        startAt: startAtIso || existing.startAt || null,
        endAt: endAtIso,
        positions: positions.size ? Array.from(positions) : existing.positions
      };

      await setJson('elections', { ...(electionsObj || {}), [id]: next });

      // Ensure storage keys exist for the new election.
      const existingCandidates = await getJson(`candidates:${id}`, null);
      if (!Array.isArray(existingCandidates)) await setJson(`candidates:${id}`, []);

      const existingBallots = await getJson(`ballots:${id}`, null);
      if (!Array.isArray(existingBallots)) await setJson(`ballots:${id}`, []);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          ok: true,
          election: {
            id,
            name: next.name || id,
            startAt: next.startAt || null,
            endAt: next.endAt || null,
            status: electionStatus(next.endAt),
            totalBallots: 0,
            candidateCount: 0,
            positions: Array.isArray(next.positions) ? next.positions : null
          }
        })
      );
    });

    return;
  }

  res.statusCode = 405;
  res.end('Method Not Allowed');
};
