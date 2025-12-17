const { getJson, setJson } = require('./store');
const { hashSecret, hashPassword, verifyPassword } = require('./crypto');

async function ensureSeed() {
  // Election config (used by voting + leaderboards)
  // Supports multiple org/club elections via the `elections` key.
  const defaultEndAt = process.env.ELECTION_END_AT || process.env.ELECTION_END || '2025-12-31T23:59:59.000Z';
  const elections = await getJson('elections', null);
  if (!elections || typeof elections !== 'object') {
    await setJson('elections', {
      skc: { id: 'skc', endAt: defaultEndAt },
      jpia: { id: 'jpia', endAt: defaultEndAt },
      rcyc: { id: 'rcyc', endAt: defaultEndAt },
      bookclub: { id: 'bookclub', endAt: defaultEndAt },
      arts_dance: { id: 'arts_dance', endAt: defaultEndAt },
      nstp: { id: 'nstp', endAt: defaultEndAt },
      freethinker: { id: 'freethinker', endAt: defaultEndAt },
      ssc: { id: 'ssc', endAt: defaultEndAt }
    });
  }

  // Legacy single election key (kept for backwards compatibility).
  const election = await getJson('election', null);
  if (!election) {
    // Keep in sync with the frontend countdown (homepage.js)
    await setJson('election', {
      id: 'skc',
      endAt: defaultEndAt
    });
  }

  // Candidates
  const skcCandidates = await getJson('candidates:skc', null);
  if (!Array.isArray(skcCandidates)) {
    await setJson('candidates:skc', [
      { id: 'skc-president-mami-oni', electionId: 'skc', position: 'President', name: 'Mami Oni', party: 'BSIT-3-2' },
      { id: 'skc-president-daddy-rob', electionId: 'skc', position: 'President', name: 'Daddy Rob', party: 'BSIT-3-2' },
      { id: 'skc-vice-president-meew-maaw', electionId: 'skc', position: 'Vice President', name: 'Meew Maaw', party: 'BSIT-3-2' },
      { id: 'skc-vice-president-ricardo-dalisay', electionId: 'skc', position: 'Vice President', name: 'Ricardo Dalisay', party: 'BSIT-3-2' },
      { id: 'skc-secretary-peter-poloan', electionId: 'skc', position: 'Secretary', name: 'Peter Poloan', party: 'BSIT-3-2' },
      { id: 'skc-secretary-merry-christmas', electionId: 'skc', position: 'Secretary', name: 'Merry Christmas', party: 'BSIT-3-2' },
      { id: 'skc-treasurer-jose-rizal', electionId: 'skc', position: 'Treasurer', name: 'Jose Rizal', party: 'BSIT-3-2' },
      { id: 'skc-treasurer-bruno-mars', electionId: 'skc', position: 'Treasurer', name: 'Bruno Mars', party: 'BSIT-3-2' },
      { id: 'skc-auditor-camille-prats', electionId: 'skc', position: 'Auditor', name: 'Camille Prats', party: 'BSIT-3-2' },
      { id: 'skc-auditor-ricardo-dalisay', electionId: 'skc', position: 'Auditor', name: 'Ricardo Dalisay', party: 'BSIT-3-2' }
    ]);
  }

  const jpiaCandidates = await getJson('candidates:jpia', null);
  if (!Array.isArray(jpiaCandidates)) {
    await setJson('candidates:jpia', [
      { id: 'jpia-president-kenny-rogers', electionId: 'jpia', position: 'President', name: 'Kenny Rogers', party: 'BSA-4-1' },
      { id: 'jpia-vice-president-james-reid', electionId: 'jpia', position: 'Vice President', name: 'James Reid', party: 'BSA 3-1' },
      { id: 'jpia-vice-president-tiffany-young', electionId: 'jpia', position: 'Vice President', name: 'Tiffany Young', party: 'BSAIS-3-2' },
      { id: 'jpia-vice-president-mang-inasal', electionId: 'jpia', position: 'Vice President', name: 'Mang Inasal', party: 'BSE-3-2' },
      { id: 'jpia-secretaryr-adobo-enthusiast', electionId: 'jpia', position: 'Secretaryr', name: 'Adobo Enthusiast', party: 'BSA-4-1' },
      { id: 'jpia-auditor-dia-ria', electionId: 'jpia', position: 'Auditor', name: 'Dia Ria', party: 'BSE 4-1' },
      { id: 'jpia-auditor-two-left-feet', electionId: 'jpia', position: 'Auditor', name: 'Two Left Feet', party: 'BSAIS-3-2' },
      { id: 'jpia-auditor-morisette-amon', electionId: 'jpia', position: 'Auditor', name: 'Morisette Amon', party: 'BSE-3-2' },
      { id: 'jpia-membership-audit-frodo-took', electionId: 'jpia', position: 'Membership Audit', name: 'Frodo Took', party: 'BSA-4-1' },
      { id: 'jpia-pio-treebreebeard', electionId: 'jpia', position: 'PIO', name: 'Treebreebeard', party: 'BSA-4-1' },
      { id: 'jpia-business-manager-help-me', electionId: 'jpia', position: 'Business Manager', name: 'Help Me', party: 'BSA-4-1' }
    ]);
  }

  const rcycCandidates = await getJson('candidates:rcyc', null);
  if (!Array.isArray(rcycCandidates)) {
    await setJson('candidates:rcyc', [
      { id: 'rcyc-vice-president-zeinab-harake', electionId: 'rcyc', position: 'Vice President', name: 'Zeinab Harake', party: 'BSSA-4-1' },
      { id: 'rcyc-secretary-zack-tabudlo', electionId: 'rcyc', position: 'Secretary', name: 'Zack Tabudlo', party: 'Sswarwhorpl Gshwswp' },
      { id: 'rcyc-secretary-moira-dela-torre', electionId: 'rcyc', position: 'Secretary', name: 'Moira Dela Torre', party: 'BSIT-3-2' },
      { id: 'rcyc-vice-president-2-niana-guerrero', electionId: 'rcyc', position: 'Vice President 2', name: 'Niana Guerrero', party: 'BSSA-4-1' },
      { id: 'rcyc-pio-chef-rv-manabat', electionId: 'rcyc', position: 'PIO', name: 'Chef RV Manabat', party: 'yshsk' },
      { id: 'rcyc-treasurer-rixx-mirasol', electionId: 'rcyc', position: 'Treasurer', name: 'Rixx Mirasol', party: 'BSSA-4-1' },
      { id: 'rcyc-business-manager-bret-maverick', electionId: 'rcyc', position: 'Business Manager', name: 'Bret Maverick', party: 'BSSA-4-1' },
      { id: 'rcyc-auditor-maymay-entrata', electionId: 'rcyc', position: 'Auditor', name: 'Maymay Entrata', party: 'BSSA-4-1' }
    ]);
  }

  const bookclubCandidates = await getJson('candidates:bookclub', null);
  if (!Array.isArray(bookclubCandidates)) {
    await setJson('candidates:bookclub', [
      { id: 'bookclub-president-jane-austen', electionId: 'bookclub', position: 'President (The Literary Critic)', name: 'Jane Austen', party: 'BAPhilo-4-A' },
      { id: 'bookclub-vice-president-gabriel-garcia-marquez', electionId: 'bookclub', position: 'Vice President (The Storyteller)', name: 'Gabriel Garcia Marquez', party: 'BAComm-3-B' },
      { id: 'bookclub-vice-president-virginia-woolf', electionId: 'bookclub', position: 'Vice President (The Storyteller)', name: 'Virginia Woolf', party: 'BAPhilo-3-A' },
      { id: 'bookclub-secretary-jrr-tolkien', electionId: 'bookclub', position: 'Secretary (The Note-Taker)', name: 'J.R.R. Tolkien', party: 'BSEd-2-A' },
      { id: 'bookclub-treasurer-f-scott-fitzgerald', electionId: 'bookclub', position: 'Treasurer (The Fund Raiser)', name: 'F. Scott Fitzgerald', party: 'BSBA-4-B' },
      { id: 'bookclub-events-ernest-hemingway', electionId: 'bookclub', position: 'Events Coordinator', name: 'Ernest Hemingway', party: 'BAPhilo-3-C' },
      { id: 'bookclub-events-harper-lee', electionId: 'bookclub', position: 'Events Coordinator', name: 'Harper Lee', party: 'BSEd-3-D' }
    ]);
  }

  const artsDanceCandidates = await getJson('candidates:arts_dance', null);
  if (!Array.isArray(artsDanceCandidates)) {
    await setJson('candidates:arts_dance', [
      { id: 'arts-dance-president-arturo-dela-cruz', electionId: 'arts_dance', position: 'President', name: 'Arturo Dela Cruz', party: 'BSAD-3-1' },
      { id: 'arts-dance-vp-dance-vicki-belo', electionId: 'arts_dance', position: 'Vice President for Dance', name: 'Vicki Belo', party: 'BSEd-2-2' },
      { id: 'arts-dance-vp-culture-aga-muhlach', electionId: 'arts_dance', position: 'VP for Culture & Arts', name: 'Aga Muhlach', party: 'BSIT-4-1' },
      { id: 'arts-dance-secretary-sarah-g', electionId: 'arts_dance', position: 'Secretary', name: 'Sarah G.', party: 'BAComm-3-1' },
      { id: 'arts-dance-secretary-bamboo-manalac', electionId: 'arts_dance', position: 'Secretary', name: 'Bamboo Manalac', party: 'BSPsych-2-1' },
      { id: 'arts-dance-treasurer-kathryn-bernardo', electionId: 'arts_dance', position: 'Treasurer', name: 'Kathryn Bernardo', party: 'BBA-3-1' },
      { id: 'arts-dance-communications-daniel-padilla', electionId: 'arts_dance', position: 'Communications Officer', name: 'Daniel Padilla', party: 'BSIT-3-1' },
      { id: 'arts-dance-muse-liza-soberano', electionId: 'arts_dance', position: 'Muse', name: 'Liza Soberano', party: 'BAComm-4-1' }
    ]);
  }

  const nstpCandidates = await getJson('candidates:nstp', null);
  if (!Array.isArray(nstpCandidates)) {
    await setJson('candidates:nstp', [
      { id: 'nstp-head-commander-benitez', electionId: 'nstp', position: 'Head Commander', name: 'Sgt. Maj. Benitez', party: 'ROTC-4-1' },
      { id: 'nstp-vice-commander-lts-luzon', electionId: 'nstp', position: 'Vice Commander (LTS)', name: 'Luzon P. Dela Cruz', party: 'BSED-3-LTS' },
      { id: 'nstp-vice-commander-cwts-visayas', electionId: 'nstp', position: 'Vice Commander (CWTS)', name: 'Visayas S. De Leon', party: 'BSIT-2-CWTS' },
      { id: 'nstp-adjutant-secretary-mindanao', electionId: 'nstp', position: 'Adjutant/Secretary', name: 'Mindanao T. Lopez', party: 'BSHM-3-ROTC' },
      { id: 'nstp-treasurer-pfc-juan-luna', electionId: 'nstp', position: 'Treasurer', name: 'PFC Juan Luna', party: 'ROTC-4-2' },
      { id: 'nstp-pio-cdt-officer-emilio', electionId: 'nstp', position: 'Public Information Officer', name: 'Cdt. Officer Emilio', party: 'ROTC-3-1' },
      { id: 'nstp-muse-cdt-lt-heneral-luna', electionId: 'nstp', position: 'Muse', name: 'Cdt. Lt. Heneral Luna', party: 'ROTC-4-1' }
    ]);
  }

  const freethinkerCandidates = await getJson('candidates:freethinker', null);
  if (!Array.isArray(freethinkerCandidates)) {
    await setJson('candidates:freethinker', [
      { id: 'freethinker-president-aristotle-cruz', electionId: 'freethinker', position: 'President (The Rationalist)', name: 'Aristotle Cruz', party: 'BAPhilo-4-1' },
      { id: 'freethinker-vp-socrates-reyes', electionId: 'freethinker', position: 'Vice President (The Skeptic)', name: 'Socrates Reyes', party: 'BAPhilo-3-2' },
      { id: 'freethinker-vp-plato-garcia', electionId: 'freethinker', position: 'Vice President (The Skeptic)', name: 'Plato Garcia', party: 'BSPolSci-3-1' },
      { id: 'freethinker-secretary-simone-de-beauvoir', electionId: 'freethinker', position: 'Secretary (Keeper of Logic)', name: 'Simone De Beauvoir', party: 'BAComm-2-1' },
      { id: 'freethinker-treasurer-noam-chomsky', electionId: 'freethinker', position: 'Treasurer (The Pragmatist)', name: 'Noam Chomsky', party: 'BSEd-4-1' },
      { id: 'freethinker-communications-bertrand-russell', electionId: 'freethinker', position: 'Communications Officer', name: 'Bertrand Russell', party: 'BAPhilo-3-1' },
      { id: 'freethinker-communications-ayn-rand', electionId: 'freethinker', position: 'Communications Officer', name: 'Ayn Rand', party: 'BSPsych-4-2' },
      { id: 'freethinker-auditor-carl-sagan', electionId: 'freethinker', position: 'Auditor (The Fact-Checker)', name: 'Carl Sagan', party: 'BSSci-3-1' }
    ]);
  }

  const sscCandidates = await getJson('candidates:ssc', null);
  if (!Array.isArray(sscCandidates)) {
    await setJson('candidates:ssc', [
      { id: 'ssc-president-pia-alonzo-wurtzbach', electionId: 'ssc', position: 'President', name: 'Pia Alonzo Wurtzbach', party: 'BSBA-4-A' },
      { id: 'ssc-vice-president-catriona-gray', electionId: 'ssc', position: 'Vice President', name: 'Catriona Gray', party: 'BSIT-3-B' },
      { id: 'ssc-secretary-general-hillary-clinton', electionId: 'ssc', position: 'Secretary General', name: 'Hillary P. Clinton', party: 'BAPolSci-2-A' },
      { id: 'ssc-secretary-general-barack-obama', electionId: 'ssc', position: 'Secretary General', name: 'Barack H. Obama', party: 'BAComm-2-B' },
      { id: 'ssc-treasurer-queen-elizabeth-ii', electionId: 'ssc', position: 'Treasurer', name: 'Queen Elizabeth II', party: 'BSAcc-4-C' },
      { id: 'ssc-auditor-king-charles-iii', electionId: 'ssc', position: 'Auditor', name: 'King Charles III', party: 'BSBA-3-D' },
      { id: 'ssc-auditor-prince-william', electionId: 'ssc', position: 'Auditor', name: 'Prince William', party: 'BSED-3-E' },
      { id: 'ssc-public-information-officer-meghan-markle', electionId: 'ssc', position: 'Public Information Officer', name: 'Meghan Markle', party: 'BAComm-4-F' }
    ]);
  }

  // Stats
  const stats = await getJson('stats', null);
  if (!stats) {
    await setJson('stats', { totalVoters: 894, activeNow: 136 });
  }

  // Users (demo account for showcasing)
  const demoStudentId = '2025-0001';
  const demoEmail = 'student@sorsu.edu.ph';
  const demoPassword = 'student123';

  let users = await getJson('users', []);
  if (!Array.isArray(users)) users = [];

  const idx = users.findIndex(
    (u) =>
      u &&
      (String(u.studentid || '').trim() === demoStudentId ||
        String(u.email || '').trim().toLowerCase() === demoEmail)
  );

  if (idx === -1) {
    users.push({
      id: 'demo-user-1',
      fullname: 'Demo User',
      course: 'BSCS',
      department: 'CICT',
      studentid: demoStudentId,
      email: demoEmail,
      password: hashPassword(demoPassword),
      gradDate: '2026-03-31'
    });
    await setJson('users', users);
  } else {
    const existing = users[idx];
    const existingPassword = existing && existing.password;

    let passwordOk = false;
    try {
      passwordOk =
        existingPassword &&
        typeof existingPassword === 'object' &&
        typeof existingPassword.salt === 'string' &&
        typeof existingPassword.hash === 'string' &&
        verifyPassword(demoPassword, existingPassword);
    } catch {
      passwordOk = false;
    }

    if (!passwordOk) {
      users[idx] = {
        ...existing,
        id: existing.id || 'demo-user-1',
        fullname: existing.fullname || 'Demo User',
        course: existing.course || 'BSCS',
        department: existing.department || 'CICT',
        studentid: demoStudentId,
        email: String(existing.email || '').trim() ? String(existing.email).trim().toLowerCase() : demoEmail,
        password: hashPassword(demoPassword),
        gradDate: existing.gradDate || '2026-03-31'
      };
      await setJson('users', users);
    }
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
