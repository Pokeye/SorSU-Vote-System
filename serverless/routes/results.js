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

  // Only publish results once voting is closed.
  if (status !== 'closed') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        ok: true,
        electionId,
        status,
        endAt,
        generatedAt: new Date(now).toISOString(),
        results: []
      })
    );
  }

  const candidates = await getJson(`candidates:${electionId}`, []);
  const ballots = await getJson(`ballots:${electionId}`, []);

  const positions = new Map();
  if (Array.isArray(candidates)) {
    for (const c of candidates) {
      if (!c || !c.position || !c.name) continue;
      const pos = String(c.position);
      if (!positions.has(pos)) positions.set(pos, []);
      positions.get(pos).push({ name: String(c.name), party: String(c.party || '') });
    }
  }

  const counts = new Map();
  for (const [pos, list] of positions.entries()) {
    const posCounts = new Map();
    for (const c of list) posCounts.set(c.name, 0);
    counts.set(pos, posCounts);
  }

  if (Array.isArray(ballots)) {
    for (const b of ballots) {
      if (!b || !b.votes) continue;
      for (const [pos, cand] of Object.entries(b.votes)) {
        const posCounts = counts.get(String(pos));
        if (!posCounts) continue;
        const name = String(cand);
        if (!posCounts.has(name)) continue;
        posCounts.set(name, posCounts.get(name) + 1);
      }
    }
  }

  const results = Array.from(positions.entries()).map(([position, candidateList]) => {
    const posCounts = counts.get(position) || new Map();
    const total = Array.from(posCounts.values()).reduce((a, b) => a + b, 0);

    const candidatesOut = candidateList
      .map((c) => {
        const votes = posCounts.get(c.name) || 0;
        const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
        return {
          name: c.name,
          party: c.party,
          votes,
          percentage: `${pct}%`,
          percentageValue: pct
        };
      })
      .sort((a, b) => b.votes - a.votes);

    return { position, candidates: candidatesOut };
  });

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      ok: true,
      electionId,
      status,
      endAt,
      generatedAt: new Date(now).toISOString(),
      results
    })
  );
};
