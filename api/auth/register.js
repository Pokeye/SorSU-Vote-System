const { readJson } = require('../_lib/body');
const { ensureSeed } = require('../_lib/seed');
const { getJson, setJson } = require('../_lib/store');
const { hashPassword, uuid } = require('../_lib/crypto');
const { writeSession } = require('../_lib/session');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end('Method Not Allowed');
  }

  await ensureSeed();
  const body = await readJson(req);
  const { fullname, course, department, studentid, email, password, gradDate } = body;

  if (!fullname || !course || !department || !studentid || !email || !password || !gradDate) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'missing_fields' }));
  }

  const normalizedCourse = String(course).trim();
  const normalizedDepartment = String(department).trim();

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedStudentId = String(studentid).trim();

  if (!normalizedEmail.includes('@')) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'invalid_email' }));
  }

  // Allow common demo domains (your demo seed uses @sorsu.edu.ph)
  const allowedDomains = new Set(['@gmail.com', '@sorsu.edu.ph']);
  const domainOk = Array.from(allowedDomains).some((d) => normalizedEmail.endsWith(d));
  if (!domainOk) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'invalid_email_domain' }));
  }

  const users = await getJson('users', []);
  if (Array.isArray(users) && users.some((u) => u.email === normalizedEmail || u.studentid === normalizedStudentId)) {
    res.statusCode = 409;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'account_exists' }));
  }

  const { salt, hash } = hashPassword(String(password));
  const user = {
    id: uuid(),
    fullname: String(fullname).trim(),
    course: normalizedCourse,
    department: normalizedDepartment,
    studentid: normalizedStudentId,
    email: normalizedEmail,
    password: { salt, hash },
    gradDate: String(gradDate)
  };

  const nextUsers = Array.isArray(users) ? [...users, user] : [user];
  await setJson('users', nextUsers);

  writeSession(res, { admin: false, userId: user.id });

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      ok: true,
      user: {
        id: user.id,
        fullname: user.fullname,
        course: user.course,
        department: user.department,
        studentid: user.studentid,
        email: user.email,
        gradDate: user.gradDate
      }
    })
  );
};
