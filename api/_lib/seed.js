const { getJson, setJson } = require('./store');
const { hashSecret } = require('./crypto');

async function ensureSeed() {
  // Stats
  const stats = await getJson('stats', null);
  if (!stats) {
    await setJson('stats', { totalVoters: 894, activeNow: 136 });
  }

  // Nominations
  const nominations = await getJson('nominations', null);
  if (!Array.isArray(nominations)) {
    await setJson('nominations', [
      { id: 'n1', name: 'Ariana Grande', section: 'BSCS 3 - 1', status: 'pending' },
      { id: 'n2', name: 'Sabrina Carpenter', section: 'BSIT 3 - 1', status: 'pending' },
      { id: 'n3', name: 'Harry Styles', section: 'BSIS 3 - 1', status: 'pending' },
      { id: 'n4', name: 'Justin Bieber', section: 'BSCS 3 - 1', status: 'pending' },
      { id: 'n5', name: 'Taylor Swift', section: 'BSIT 3 - 1', status: 'pending' }
    ]);
  }

  // Admin hashes
  const admin = await getJson('admin', null);
  if (!admin) {
    const accessCode = process.env.ADMIN_ACCESS_CODE || '1234';
    const adminKey = process.env.ADMIN_KEY || 'admin';
    await setJson('admin', {
      accessCodeHash: hashSecret(accessCode),
      adminKeyHash: hashSecret(adminKey)
    });
  }
}

module.exports = { ensureSeed };
