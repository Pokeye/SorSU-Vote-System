const { getStorageMode } = require('./_lib/store');

module.exports = async function handler(_req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  const storage = await getStorageMode();
  res.end(JSON.stringify({ ok: true, storage }));
};
