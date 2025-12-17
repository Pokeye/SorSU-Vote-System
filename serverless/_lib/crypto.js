const crypto = require('crypto');

function pbkdf2(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = pbkdf2(password, salt);
  return { salt, hash };
}

function verifyPassword(password, { salt, hash }) {
  const candidate = pbkdf2(password, salt);
  return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(hash, 'hex'));
}

function hashSecret(secret) {
  return crypto.createHash('sha256').update(String(secret)).digest('hex');
}

function uuid() {
  return crypto.randomUUID();
}

module.exports = {
  hashPassword,
  verifyPassword,
  hashSecret,
  uuid,
};
