const { ensureSeed } = require('../_lib/seed');
const { getJson } = require('../_lib/store');
const { readSession } = require('../_lib/session');

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

  const session = readSession(req);
  const userId = session && session.userId ? session.userId : null;

  let hasVoted = false;
  if (userId) {
    const ballots = await getJson(`ballots:${electionId}`, []);
    if (Array.isArray(ballots)) {
      hasVoted = ballots.some((b) => b && b.userId === userId);
    }
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      ok: true,
      electionId,
      status,
      endAt,
      now: new Date(now).toISOString(),
      authenticated: Boolean(userId),
      hasVoted
    })
  );
};
