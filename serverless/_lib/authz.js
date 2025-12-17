const { readSession } = require('./session');

function requireAdmin(req, res) {
  const session = readSession(req);
  if (!session || session.admin !== true) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'not_authenticated' }));
    return null;
  }
  return session;
}

function requireUser(req, res) {
  const session = readSession(req);
  if (!session || session.admin === true || !session.userId) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'not_authenticated' }));
    return null;
  }
  return session;
}

function requireAuth(req, res) {
  const session = readSession(req);
  if (!session || (session.admin !== true && !session.userId)) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'not_authenticated' }));
    return null;
  }
  return session;
}

module.exports = { requireAdmin, requireUser, requireAuth };
