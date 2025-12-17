const { ensureSeed } = require('../_lib/seed');
const { readJson } = require('../_lib/body');
const { getJson, setJson } = require('../_lib/store');
const { requireUser } = require('../_lib/authz');
const { uuid } = require('../_lib/crypto');

async function getElectionConfig(electionId) {
  const elections = await getJson('elections', null);
  if (elections && typeof elections === 'object' && elections[electionId]) {
    return elections[electionId];
  }
  return await getJson('election', { id: electionId, endAt: null });
}

function normalizeKey(value) {
  return String(value || '').trim();
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end('Method Not Allowed');
  }

  await ensureSeed();

  const session = requireUser(req, res);
  if (!session) return;

  const body = await readJson(req);
  const electionId = normalizeKey(body.electionId || 'skc');
  const votes = body.votes && typeof body.votes === 'object' ? body.votes : null;

  if (!votes) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'missing_votes' }));
  }

  const election = await getElectionConfig(electionId);
  const endAt = election && election.endAt ? String(election.endAt) : null;
  const endMs = endAt ? Date.parse(endAt) : null;
  if (endMs && Date.now() >= endMs) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'voting_closed', endAt }));
  }

  const candidates = await getJson(`candidates:${electionId}`, []);
  const allowedByPosition = new Map();
  if (Array.isArray(candidates)) {
    for (const c of candidates) {
      if (!c || !c.position || !c.name) continue;
      const pos = String(c.position);
      const set = allowedByPosition.get(pos) || new Set();
      set.add(String(c.name));
      allowedByPosition.set(pos, set);
    }
  }

  // Validate all submitted votes against the seeded candidate list.
  for (const [position, candidateName] of Object.entries(votes)) {
    const pos = String(position);
    const cand = String(candidateName);
    const allowed = allowedByPosition.get(pos);
    if (!allowed || !allowed.has(cand)) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'invalid_vote', position: pos }));
    }
  }

  const ballotsKey = `ballots:${electionId}`;
  const ballots = await getJson(ballotsKey, []);
  const nextBallots = Array.isArray(ballots) ? ballots : [];

  if (nextBallots.some((b) => b && b.userId === session.userId)) {
    res.statusCode = 409;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'already_voted' }));
  }

  const receiptID = `#${Math.floor(10000000 + Math.random() * 90000000)}`;
  const timestamp = new Date().toISOString();

  nextBallots.push({
    id: uuid(),
    electionId,
    userId: session.userId,
    receiptID,
    timestamp,
    votes
  });

  await setJson(ballotsKey, nextBallots);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: true, receiptID, timestamp }));
};
