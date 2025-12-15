const memory = global.__EVOTING_STORE__ || (global.__EVOTING_STORE__ = new Map());

async function getKvClient() {
  // Only use KV if Vercel KV env vars are present.
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  try {
    const mod = await import('@vercel/kv');
    return mod.kv;
  } catch {
    return null;
  }
}

async function get(key) {
  const kv = await getKvClient();
  if (kv) return kv.get(key);
  return memory.get(key) ?? null;
}

async function set(key, value) {
  const kv = await getKvClient();
  if (kv) {
    await kv.set(key, value);
    return;
  }
  memory.set(key, value);
}

async function del(key) {
  const kv = await getKvClient();
  if (kv) {
    await kv.del(key);
    return;
  }
  memory.delete(key);
}

async function getJson(key, fallback = null) {
  const value = await get(key);
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(String(value));
  } catch {
    return fallback;
  }
}

async function setJson(key, obj) {
  await set(key, obj);
}

module.exports = {
  get,
  set,
  del,
  getJson,
  setJson,
};
