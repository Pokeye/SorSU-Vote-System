const { ensureSeed } = require('../_lib/seed');
const { getJson } = require('../_lib/store');
const { readSession } = require('../_lib/session');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    return res.end('Method Not Allowed');
  }

  await ensureSeed();

  const session = readSession(req);
  if (!session) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ authenticated: false }));
  }

  if (session.admin === true) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ authenticated: true, admin: true }));
  }

  if (!session.userId) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ authenticated: false }));
  }

  const users = await getJson('users', []);
  const user = Array.isArray(users) ? users.find((u) => u && u.id === session.userId) : null;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      authenticated: Boolean(user),
      admin: false,
      user: user
        ? {
            id: user.id,
            fullname: user.fullname || '',
            course: user.course || '',
            department: user.department || '',
            studentid: user.studentid || '',
            email: user.email || '',
            gradDate: user.gradDate || ''
          }
        : null
    })
  );
};
