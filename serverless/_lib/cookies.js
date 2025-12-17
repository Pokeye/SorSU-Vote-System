function parseCookieHeader(header) {
  const out = {};
  if (!header) return out;
  const parts = header.split(';');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    out[key] = decodeURIComponent(val);
  }
  return out;
}

function serializeCookie(name, value, opts = {}) {
  const enc = encodeURIComponent(value);
  let cookie = `${name}=${enc}`;

  if (opts.maxAge != null) cookie += `; Max-Age=${opts.maxAge}`;
  if (opts.expires) cookie += `; Expires=${opts.expires.toUTCString()}`;
  if (opts.path) cookie += `; Path=${opts.path}`;
  if (opts.httpOnly) cookie += '; HttpOnly';
  if (opts.sameSite) cookie += `; SameSite=${opts.sameSite}`;
  if (opts.secure) cookie += '; Secure';

  return cookie;
}

module.exports = { parseCookieHeader, serializeCookie };
