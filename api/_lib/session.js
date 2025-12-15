const crypto = require('crypto');
const { parseCookieHeader, serializeCookie } = require('./cookies');

const COOKIE_NAME = 'evoting.sid';

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64urlJson(obj) {
  return base64url(JSON.stringify(obj));
}

function fromBase64url(str) {
  const pad = str.length % 4;
  const padded = str + (pad ? '='.repeat(4 - pad) : '');
  const b64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(b64, 'base64').toString('utf8');
}

function sign(payload, secret) {
  const mac = crypto.createHmac('sha256', secret).update(payload).digest('base64');
  return mac.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function timingSafeEqual(a, b) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function getSecret() {
  return process.env.SESSION_SECRET || 'dev-secret-change-me';
}

function readSession(req) {
  const cookies = parseCookieHeader(req.headers.cookie);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, sig] = parts;
  const secret = getSecret();
  const expected = sign(payloadB64, secret);
  if (!timingSafeEqual(sig, expected)) return null;

  try {
    const json = JSON.parse(fromBase64url(payloadB64));
    if (!json || typeof json !== 'object') return null;

    // Optional expiry (7 days)
    const iat = Number(json.iat || 0);
    if (iat && Date.now() - iat > 7 * 24 * 60 * 60 * 1000) return null;

    return json;
  } catch {
    return null;
  }
}

function writeSession(res, session) {
  const secret = getSecret();
  const payload = { ...session, iat: Date.now() };
  const payloadB64 = base64urlJson(payload);
  const sig = sign(payloadB64, secret);
  const token = `${payloadB64}.${sig}`;

  const secure = (process.env.VERCEL || process.env.NODE_ENV === 'production') ? true : false;
  const cookie = serializeCookie(COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    secure,
    maxAge: 7 * 24 * 60 * 60,
  });

  res.setHeader('Set-Cookie', cookie);
}

function clearSession(res) {
  const secure = (process.env.VERCEL || process.env.NODE_ENV === 'production') ? true : false;
  const cookie = serializeCookie(COOKIE_NAME, '', {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    secure,
    expires: new Date(0),
  });
  res.setHeader('Set-Cookie', cookie);
}

module.exports = {
  readSession,
  writeSession,
  clearSession,
};
