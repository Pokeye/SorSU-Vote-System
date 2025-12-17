import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const ELECTION_END_AT = process.env.ELECTION_END_AT || process.env.ELECTION_END || null;

// Workspace layout:
// <root>/server/server.js
// <root>/admin dashboard/<static files>
const STATIC_ROOT = path.resolve(__dirname, '..', 'admin dashboard');
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'db.json');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Allow local frontends (Live Server or file://) to call the API in dev.
// - Live Server can use different ports (5500, 5501, ...)
// - file:// requests typically send Origin: null
function isAllowedDevOrigin(origin) {
  if (!origin) return false;
  if (origin === 'null') return true;
  return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (isAllowedDevOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
  }
  next();
});

app.use(
  session({
    name: 'admindash.sid',
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax'
      // secure: true  // enable when using https
    }
  })
);

async function ensureDb() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);

    // Lightweight migration for older db.json versions.
    const db = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
    let changed = false;

    const defaultEndAt = ELECTION_END_AT || '2025-12-31T23:59:59.000Z';

    if (!Array.isArray(db.users)) {
      db.users = [];
      changed = true;
    }

    if (!db.election || typeof db.election !== 'object') {
      db.election = { id: 'skc', endAt: defaultEndAt };
      changed = true;
    }

    if (!db.elections || typeof db.elections !== 'object') {
      db.elections = {};
      changed = true;
    }

    // If there was only a single election config before, keep it in sync.
    if (db.election && db.election.id) {
      const legacyId = String(db.election.id).trim();
      if (!db.elections[legacyId] || typeof db.elections[legacyId] !== 'object') {
        db.elections[legacyId] = { id: legacyId, endAt: db.election.endAt || null };
        changed = true;
      }
    }

    const electionIds = ['skc', 'jpia', 'rcyc', 'bookclub', 'arts_dance', 'nstp', 'freethinker', 'ssc'];
    for (const id of electionIds) {
      if (!db.elections[id] || typeof db.elections[id] !== 'object') {
        db.elections[id] = { id, endAt: defaultEndAt };
        changed = true;
      }
      if (!('endAt' in db.elections[id])) {
        db.elections[id].endAt = defaultEndAt;
        changed = true;
      }
    }

    // Dev override: set all elections to the provided end time.
    if (ELECTION_END_AT) {
      for (const id of electionIds) {
        if (db.elections[id].endAt !== ELECTION_END_AT) {
          db.elections[id].endAt = ELECTION_END_AT;
          changed = true;
        }
      }
      if (db.election && db.election.id === 'skc' && db.election.endAt !== ELECTION_END_AT) {
        db.election.endAt = ELECTION_END_AT;
        changed = true;
      }
    }

    if (!db.candidates || typeof db.candidates !== 'object') {
      db.candidates = {};
      changed = true;
    }

    // Seed/repair a demo account for showcasing (always works)
    {
      const demoStudentId = '2025-0001';
      const demoEmail = 'student@sorsu.edu.ph';
      const demoPassword = 'student123';

      const demoIndex = db.users.findIndex(
        (u) =>
          u &&
          (String(u.studentid || '').trim() === demoStudentId ||
            String(u.email || '').trim().toLowerCase() === demoEmail)
      );

      if (demoIndex === -1) {
        db.users.push({
          id: 'demo-user-1',
          fullname: 'Demo User',
          course: 'BSCS',
          department: 'CICT',
          studentid: demoStudentId,
          email: demoEmail,
          password: hashPassword(demoPassword),
          gradDate: '2026-03-31'
        });
        changed = true;
      } else {
        const existing = db.users[demoIndex];
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
          db.users[demoIndex] = {
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
          changed = true;
        }
      }
    }

    const defaultSkcCandidates = [
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
    ];

    const defaultJpiaCandidates = [
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
    ];

    const defaultRcycCandidates = [
      { id: 'rcyc-vice-president-zeinab-harake', electionId: 'rcyc', position: 'Vice President', name: 'Zeinab Harake', party: 'BSSA-4-1' },
      { id: 'rcyc-secretary-zack-tabudlo', electionId: 'rcyc', position: 'Secretary', name: 'Zack Tabudlo', party: 'Sswarwhorpl Gshwswp' },
      { id: 'rcyc-secretary-moira-dela-torre', electionId: 'rcyc', position: 'Secretary', name: 'Moira Dela Torre', party: 'BSIT-3-2' },
      { id: 'rcyc-vice-president-2-niana-guerrero', electionId: 'rcyc', position: 'Vice President 2', name: 'Niana Guerrero', party: 'BSSA-4-1' },
      { id: 'rcyc-pio-chef-rv-manabat', electionId: 'rcyc', position: 'PIO', name: 'Chef RV Manabat', party: 'yshsk' },
      { id: 'rcyc-treasurer-rixx-mirasol', electionId: 'rcyc', position: 'Treasurer', name: 'Rixx Mirasol', party: 'BSSA-4-1' },
      { id: 'rcyc-business-manager-bret-maverick', electionId: 'rcyc', position: 'Business Manager', name: 'Bret Maverick', party: 'BSSA-4-1' },
      { id: 'rcyc-auditor-maymay-entrata', electionId: 'rcyc', position: 'Auditor', name: 'Maymay Entrata', party: 'BSSA-4-1' }
    ];

    const defaultBookclubCandidates = [
      { id: 'bookclub-president-jane-austen', electionId: 'bookclub', position: 'President (The Literary Critic)', name: 'Jane Austen', party: 'BAPhilo-4-A' },
      { id: 'bookclub-vice-president-gabriel-garcia-marquez', electionId: 'bookclub', position: 'Vice President (The Storyteller)', name: 'Gabriel Garcia Marquez', party: 'BAComm-3-B' },
      { id: 'bookclub-vice-president-virginia-woolf', electionId: 'bookclub', position: 'Vice President (The Storyteller)', name: 'Virginia Woolf', party: 'BAPhilo-3-A' },
      { id: 'bookclub-secretary-jrr-tolkien', electionId: 'bookclub', position: 'Secretary (The Note-Taker)', name: 'J.R.R. Tolkien', party: 'BSEd-2-A' },
      { id: 'bookclub-treasurer-f-scott-fitzgerald', electionId: 'bookclub', position: 'Treasurer (The Fund Raiser)', name: 'F. Scott Fitzgerald', party: 'BSBA-4-B' },
      { id: 'bookclub-events-ernest-hemingway', electionId: 'bookclub', position: 'Events Coordinator', name: 'Ernest Hemingway', party: 'BAPhilo-3-C' },
      { id: 'bookclub-events-harper-lee', electionId: 'bookclub', position: 'Events Coordinator', name: 'Harper Lee', party: 'BSEd-3-D' }
    ];

    const defaultArtsDanceCandidates = [
      { id: 'arts-dance-president-arturo-dela-cruz', electionId: 'arts_dance', position: 'President', name: 'Arturo Dela Cruz', party: 'BSAD-3-1' },
      { id: 'arts-dance-vp-dance-vicki-belo', electionId: 'arts_dance', position: 'Vice President for Dance', name: 'Vicki Belo', party: 'BSEd-2-2' },
      { id: 'arts-dance-vp-culture-aga-muhlach', electionId: 'arts_dance', position: 'VP for Culture & Arts', name: 'Aga Muhlach', party: 'BSIT-4-1' },
      { id: 'arts-dance-secretary-sarah-g', electionId: 'arts_dance', position: 'Secretary', name: 'Sarah G.', party: 'BAComm-3-1' },
      { id: 'arts-dance-secretary-bamboo-manalac', electionId: 'arts_dance', position: 'Secretary', name: 'Bamboo Manalac', party: 'BSPsych-2-1' },
      { id: 'arts-dance-treasurer-kathryn-bernardo', electionId: 'arts_dance', position: 'Treasurer', name: 'Kathryn Bernardo', party: 'BBA-3-1' },
      { id: 'arts-dance-communications-daniel-padilla', electionId: 'arts_dance', position: 'Communications Officer', name: 'Daniel Padilla', party: 'BSIT-3-1' },
      { id: 'arts-dance-muse-liza-soberano', electionId: 'arts_dance', position: 'Muse', name: 'Liza Soberano', party: 'BAComm-4-1' }
    ];

    const defaultNstpCandidates = [
      { id: 'nstp-head-commander-benitez', electionId: 'nstp', position: 'Head Commander', name: 'Sgt. Maj. Benitez', party: 'ROTC-4-1' },
      { id: 'nstp-vice-commander-lts-luzon', electionId: 'nstp', position: 'Vice Commander (LTS)', name: 'Luzon P. Dela Cruz', party: 'BSED-3-LTS' },
      { id: 'nstp-vice-commander-cwts-visayas', electionId: 'nstp', position: 'Vice Commander (CWTS)', name: 'Visayas S. De Leon', party: 'BSIT-2-CWTS' },
      { id: 'nstp-adjutant-secretary-mindanao', electionId: 'nstp', position: 'Adjutant/Secretary', name: 'Mindanao T. Lopez', party: 'BSHM-3-ROTC' },
      { id: 'nstp-treasurer-pfc-juan-luna', electionId: 'nstp', position: 'Treasurer', name: 'PFC Juan Luna', party: 'ROTC-4-2' },
      { id: 'nstp-pio-cdt-officer-emilio', electionId: 'nstp', position: 'Public Information Officer', name: 'Cdt. Officer Emilio', party: 'ROTC-3-1' },
      { id: 'nstp-muse-cdt-lt-heneral-luna', electionId: 'nstp', position: 'Muse', name: 'Cdt. Lt. Heneral Luna', party: 'ROTC-4-1' }
    ];

    const defaultFreethinkerCandidates = [
      { id: 'freethinker-president-aristotle-cruz', electionId: 'freethinker', position: 'President (The Rationalist)', name: 'Aristotle Cruz', party: 'BAPhilo-4-1' },
      { id: 'freethinker-vp-socrates-reyes', electionId: 'freethinker', position: 'Vice President (The Skeptic)', name: 'Socrates Reyes', party: 'BAPhilo-3-2' },
      { id: 'freethinker-vp-plato-garcia', electionId: 'freethinker', position: 'Vice President (The Skeptic)', name: 'Plato Garcia', party: 'BSPolSci-3-1' },
      { id: 'freethinker-secretary-simone-de-beauvoir', electionId: 'freethinker', position: 'Secretary (Keeper of Logic)', name: 'Simone De Beauvoir', party: 'BAComm-2-1' },
      { id: 'freethinker-treasurer-noam-chomsky', electionId: 'freethinker', position: 'Treasurer (The Pragmatist)', name: 'Noam Chomsky', party: 'BSEd-4-1' },
      { id: 'freethinker-communications-bertrand-russell', electionId: 'freethinker', position: 'Communications Officer', name: 'Bertrand Russell', party: 'BAPhilo-3-1' },
      { id: 'freethinker-communications-ayn-rand', electionId: 'freethinker', position: 'Communications Officer', name: 'Ayn Rand', party: 'BSPsych-4-2' },
      { id: 'freethinker-auditor-carl-sagan', electionId: 'freethinker', position: 'Auditor (The Fact-Checker)', name: 'Carl Sagan', party: 'BSSci-3-1' }
    ];

    const defaultSscCandidates = [
      { id: 'ssc-president-pia-alonzo-wurtzbach', electionId: 'ssc', position: 'President', name: 'Pia Alonzo Wurtzbach', party: 'BSBA-4-A' },
      { id: 'ssc-vice-president-catriona-gray', electionId: 'ssc', position: 'Vice President', name: 'Catriona Gray', party: 'BSIT-3-B' },
      { id: 'ssc-secretary-general-hillary-clinton', electionId: 'ssc', position: 'Secretary General', name: 'Hillary P. Clinton', party: 'BAPolSci-2-A' },
      { id: 'ssc-secretary-general-barack-obama', electionId: 'ssc', position: 'Secretary General', name: 'Barack H. Obama', party: 'BAComm-2-B' },
      { id: 'ssc-treasurer-queen-elizabeth-ii', electionId: 'ssc', position: 'Treasurer', name: 'Queen Elizabeth II', party: 'BSAcc-4-C' },
      { id: 'ssc-auditor-king-charles-iii', electionId: 'ssc', position: 'Auditor', name: 'King Charles III', party: 'BSBA-3-D' },
      { id: 'ssc-auditor-prince-william', electionId: 'ssc', position: 'Auditor', name: 'Prince William', party: 'BSED-3-E' },
      { id: 'ssc-public-information-officer-meghan-markle', electionId: 'ssc', position: 'Public Information Officer', name: 'Meghan Markle', party: 'BAComm-4-F' }
    ];

    if (!Array.isArray(db.candidates.skc) || db.candidates.skc.length === 0) {
      db.candidates.skc = defaultSkcCandidates;
      changed = true;
    }

    if (!Array.isArray(db.candidates.jpia) || db.candidates.jpia.length === 0) {
      db.candidates.jpia = defaultJpiaCandidates;
      changed = true;
    }

    if (!Array.isArray(db.candidates.rcyc) || db.candidates.rcyc.length === 0) {
      db.candidates.rcyc = defaultRcycCandidates;
      changed = true;
    }

    if (!Array.isArray(db.candidates.bookclub) || db.candidates.bookclub.length === 0) {
      db.candidates.bookclub = defaultBookclubCandidates;
      changed = true;
    }

    if (!Array.isArray(db.candidates.arts_dance) || db.candidates.arts_dance.length === 0) {
      db.candidates.arts_dance = defaultArtsDanceCandidates;
      changed = true;
    }

    if (!Array.isArray(db.candidates.nstp) || db.candidates.nstp.length === 0) {
      db.candidates.nstp = defaultNstpCandidates;
      changed = true;
    }

    if (!Array.isArray(db.candidates.freethinker) || db.candidates.freethinker.length === 0) {
      db.candidates.freethinker = defaultFreethinkerCandidates;
      changed = true;
    }

    if (!Array.isArray(db.candidates.ssc) || db.candidates.ssc.length === 0) {
      db.candidates.ssc = defaultSscCandidates;
      changed = true;
    }

    if (!db.ballots || typeof db.ballots !== 'object') {
      db.ballots = {};
      changed = true;
    }
    if (!Array.isArray(db.ballots.skc)) {
      db.ballots.skc = [];
      changed = true;
    }

    if (!Array.isArray(db.ballots.jpia)) {
      db.ballots.jpia = [];
      changed = true;
    }
    if (!Array.isArray(db.ballots.rcyc)) {
      db.ballots.rcyc = [];
      changed = true;
    }
    if (!Array.isArray(db.ballots.bookclub)) {
      db.ballots.bookclub = [];
      changed = true;
    }
    if (!Array.isArray(db.ballots.arts_dance)) {
      db.ballots.arts_dance = [];
      changed = true;
    }
    if (!Array.isArray(db.ballots.nstp)) {
      db.ballots.nstp = [];
      changed = true;
    }
    if (!Array.isArray(db.ballots.freethinker)) {
      db.ballots.freethinker = [];
      changed = true;
    }
    if (!Array.isArray(db.ballots.ssc)) {
      db.ballots.ssc = [];
      changed = true;
    }

    if (changed) {
      await writeDb(db);
    }
  } catch {
    const defaultEndAt = ELECTION_END_AT || '2025-12-31T23:59:59.000Z';
    const demoStudentId = '2025-0001';
    const demoEmail = 'student@sorsu.edu.ph';
    const demoPassword = 'student123';
    const initial = {
      users: [
        {
          id: 'demo-user-1',
          fullname: 'Demo User',
          course: 'BSCS',
          department: 'CICT',
          studentid: demoStudentId,
          email: demoEmail,
          password: hashPassword(demoPassword),
          gradDate: '2026-03-31'
        }
      ],
      passwordResets: [],
      election: {
        id: 'skc',
        endAt: defaultEndAt
      },
      elections: {
        skc: { id: 'skc', endAt: defaultEndAt },
        jpia: { id: 'jpia', endAt: defaultEndAt },
        rcyc: { id: 'rcyc', endAt: defaultEndAt },
        bookclub: { id: 'bookclub', endAt: defaultEndAt },
        arts_dance: { id: 'arts_dance', endAt: defaultEndAt },
        nstp: { id: 'nstp', endAt: defaultEndAt },
        freethinker: { id: 'freethinker', endAt: defaultEndAt },
        ssc: { id: 'ssc', endAt: defaultEndAt }
      },
      candidates: {
        skc: [
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
        ],
        jpia: [
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
        ],
        rcyc: [
          { id: 'rcyc-vice-president-zeinab-harake', electionId: 'rcyc', position: 'Vice President', name: 'Zeinab Harake', party: 'BSSA-4-1' },
          { id: 'rcyc-secretary-zack-tabudlo', electionId: 'rcyc', position: 'Secretary', name: 'Zack Tabudlo', party: 'Sswarwhorpl Gshwswp' },
          { id: 'rcyc-secretary-moira-dela-torre', electionId: 'rcyc', position: 'Secretary', name: 'Moira Dela Torre', party: 'BSIT-3-2' },
          { id: 'rcyc-vice-president-2-niana-guerrero', electionId: 'rcyc', position: 'Vice President 2', name: 'Niana Guerrero', party: 'BSSA-4-1' },
          { id: 'rcyc-pio-chef-rv-manabat', electionId: 'rcyc', position: 'PIO', name: 'Chef RV Manabat', party: 'yshsk' },
          { id: 'rcyc-treasurer-rixx-mirasol', electionId: 'rcyc', position: 'Treasurer', name: 'Rixx Mirasol', party: 'BSSA-4-1' },
          { id: 'rcyc-business-manager-bret-maverick', electionId: 'rcyc', position: 'Business Manager', name: 'Bret Maverick', party: 'BSSA-4-1' },
          { id: 'rcyc-auditor-maymay-entrata', electionId: 'rcyc', position: 'Auditor', name: 'Maymay Entrata', party: 'BSSA-4-1' }
        ],
        bookclub: [
          { id: 'bookclub-president-jane-austen', electionId: 'bookclub', position: 'President (The Literary Critic)', name: 'Jane Austen', party: 'BAPhilo-4-A' },
          { id: 'bookclub-vice-president-gabriel-garcia-marquez', electionId: 'bookclub', position: 'Vice President (The Storyteller)', name: 'Gabriel Garcia Marquez', party: 'BAComm-3-B' },
          { id: 'bookclub-vice-president-virginia-woolf', electionId: 'bookclub', position: 'Vice President (The Storyteller)', name: 'Virginia Woolf', party: 'BAPhilo-3-A' },
          { id: 'bookclub-secretary-jrr-tolkien', electionId: 'bookclub', position: 'Secretary (The Note-Taker)', name: 'J.R.R. Tolkien', party: 'BSEd-2-A' },
          { id: 'bookclub-treasurer-f-scott-fitzgerald', electionId: 'bookclub', position: 'Treasurer (The Fund Raiser)', name: 'F. Scott Fitzgerald', party: 'BSBA-4-B' },
          { id: 'bookclub-events-ernest-hemingway', electionId: 'bookclub', position: 'Events Coordinator', name: 'Ernest Hemingway', party: 'BAPhilo-3-C' },
          { id: 'bookclub-events-harper-lee', electionId: 'bookclub', position: 'Events Coordinator', name: 'Harper Lee', party: 'BSEd-3-D' }
        ],
        arts_dance: [
          { id: 'arts-dance-president-arturo-dela-cruz', electionId: 'arts_dance', position: 'President', name: 'Arturo Dela Cruz', party: 'BSAD-3-1' },
          { id: 'arts-dance-vp-dance-vicki-belo', electionId: 'arts_dance', position: 'Vice President for Dance', name: 'Vicki Belo', party: 'BSEd-2-2' },
          { id: 'arts-dance-vp-culture-aga-muhlach', electionId: 'arts_dance', position: 'VP for Culture & Arts', name: 'Aga Muhlach', party: 'BSIT-4-1' },
          { id: 'arts-dance-secretary-sarah-g', electionId: 'arts_dance', position: 'Secretary', name: 'Sarah G.', party: 'BAComm-3-1' },
          { id: 'arts-dance-secretary-bamboo-manalac', electionId: 'arts_dance', position: 'Secretary', name: 'Bamboo Manalac', party: 'BSPsych-2-1' },
          { id: 'arts-dance-treasurer-kathryn-bernardo', electionId: 'arts_dance', position: 'Treasurer', name: 'Kathryn Bernardo', party: 'BBA-3-1' },
          { id: 'arts-dance-communications-daniel-padilla', electionId: 'arts_dance', position: 'Communications Officer', name: 'Daniel Padilla', party: 'BSIT-3-1' },
          { id: 'arts-dance-muse-liza-soberano', electionId: 'arts_dance', position: 'Muse', name: 'Liza Soberano', party: 'BAComm-4-1' }
        ],
        nstp: [
          { id: 'nstp-head-commander-benitez', electionId: 'nstp', position: 'Head Commander', name: 'Sgt. Maj. Benitez', party: 'ROTC-4-1' },
          { id: 'nstp-vice-commander-lts-luzon', electionId: 'nstp', position: 'Vice Commander (LTS)', name: 'Luzon P. Dela Cruz', party: 'BSED-3-LTS' },
          { id: 'nstp-vice-commander-cwts-visayas', electionId: 'nstp', position: 'Vice Commander (CWTS)', name: 'Visayas S. De Leon', party: 'BSIT-2-CWTS' },
          { id: 'nstp-adjutant-secretary-mindanao', electionId: 'nstp', position: 'Adjutant/Secretary', name: 'Mindanao T. Lopez', party: 'BSHM-3-ROTC' },
          { id: 'nstp-treasurer-pfc-juan-luna', electionId: 'nstp', position: 'Treasurer', name: 'PFC Juan Luna', party: 'ROTC-4-2' },
          { id: 'nstp-pio-cdt-officer-emilio', electionId: 'nstp', position: 'Public Information Officer', name: 'Cdt. Officer Emilio', party: 'ROTC-3-1' },
          { id: 'nstp-muse-cdt-lt-heneral-luna', electionId: 'nstp', position: 'Muse', name: 'Cdt. Lt. Heneral Luna', party: 'ROTC-4-1' }
        ],
        freethinker: [
          { id: 'freethinker-president-aristotle-cruz', electionId: 'freethinker', position: 'President (The Rationalist)', name: 'Aristotle Cruz', party: 'BAPhilo-4-1' },
          { id: 'freethinker-vp-socrates-reyes', electionId: 'freethinker', position: 'Vice President (The Skeptic)', name: 'Socrates Reyes', party: 'BAPhilo-3-2' },
          { id: 'freethinker-vp-plato-garcia', electionId: 'freethinker', position: 'Vice President (The Skeptic)', name: 'Plato Garcia', party: 'BSPolSci-3-1' },
          { id: 'freethinker-secretary-simone-de-beauvoir', electionId: 'freethinker', position: 'Secretary (Keeper of Logic)', name: 'Simone De Beauvoir', party: 'BAComm-2-1' },
          { id: 'freethinker-treasurer-noam-chomsky', electionId: 'freethinker', position: 'Treasurer (The Pragmatist)', name: 'Noam Chomsky', party: 'BSEd-4-1' },
          { id: 'freethinker-communications-bertrand-russell', electionId: 'freethinker', position: 'Communications Officer', name: 'Bertrand Russell', party: 'BAPhilo-3-1' },
          { id: 'freethinker-communications-ayn-rand', electionId: 'freethinker', position: 'Communications Officer', name: 'Ayn Rand', party: 'BSPsych-4-2' },
          { id: 'freethinker-auditor-carl-sagan', electionId: 'freethinker', position: 'Auditor (The Fact-Checker)', name: 'Carl Sagan', party: 'BSSci-3-1' }
        ],
        ssc: [
          { id: 'ssc-president-pia-alonzo-wurtzbach', electionId: 'ssc', position: 'President', name: 'Pia Alonzo Wurtzbach', party: 'BSBA-4-A' },
          { id: 'ssc-vice-president-catriona-gray', electionId: 'ssc', position: 'Vice President', name: 'Catriona Gray', party: 'BSIT-3-B' },
          { id: 'ssc-secretary-general-hillary-clinton', electionId: 'ssc', position: 'Secretary General', name: 'Hillary P. Clinton', party: 'BAPolSci-2-A' },
          { id: 'ssc-secretary-general-barack-obama', electionId: 'ssc', position: 'Secretary General', name: 'Barack H. Obama', party: 'BAComm-2-B' },
          { id: 'ssc-treasurer-queen-elizabeth-ii', electionId: 'ssc', position: 'Treasurer', name: 'Queen Elizabeth II', party: 'BSAcc-4-C' },
          { id: 'ssc-auditor-king-charles-iii', electionId: 'ssc', position: 'Auditor', name: 'King Charles III', party: 'BSBA-3-D' },
          { id: 'ssc-auditor-prince-william', electionId: 'ssc', position: 'Auditor', name: 'Prince William', party: 'BSED-3-E' },
          { id: 'ssc-public-information-officer-meghan-markle', electionId: 'ssc', position: 'Public Information Officer', name: 'Meghan Markle', party: 'BAComm-4-F' }
        ]
      },
      ballots: {
        skc: [],
        jpia: [],
        rcyc: [],
        bookclub: [],
        arts_dance: [],
        nstp: [],
        freethinker: [],
        ssc: []
      },
      nominations: [
        { id: 'n1', name: 'Ariana Grande', section: 'BSCS 3 - 1', status: 'pending' },
        { id: 'n2', name: 'Sabrina Carpenter', section: 'BSIT 3 - 1', status: 'pending' },
        { id: 'n3', name: 'Harry Styles', section: 'BSIS 3 - 1', status: 'pending' },
        { id: 'n4', name: 'Justin Bieber', section: 'BSCS 3 - 1', status: 'pending' },
        { id: 'n5', name: 'Taylor Swift', section: 'BSIT 3 - 1', status: 'pending' }
      ],
      stats: {
        totalVoters: 894,
        activeNow: 136
      },
      admin: {
        accessCodeHash: hashSecret(process.env.ADMIN_ACCESS_CODE || '1234'),
        adminKeyHash: hashSecret(process.env.ADMIN_KEY || 'admin')
      }
    };
    await fs.writeFile(DATA_FILE, JSON.stringify(initial, null, 2), 'utf8');
  }
}

async function readDb() {
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

async function writeDb(db) {
  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
}

function getElection(db, electionId) {
  const key = String(electionId || '').trim();

  if (db && db.elections && typeof db.elections === 'object') {
    const cfg = db.elections[key];
    if (cfg && typeof cfg === 'object') {
      return {
        id: key,
        endAt: cfg.endAt || null
      };
    }
  }

  const legacy = db && db.election ? db.election : null;
  if (legacy && String(legacy.id || '').trim() === key) return legacy;
  return { id: key, endAt: null };
}

function electionStatus(endAt) {
  const endMs = endAt ? Date.parse(endAt) : null;
  if (!endMs) return 'open';
  return Date.now() >= endMs ? 'closed' : 'open';
}

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

function requireUser(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'not_authenticated' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.admin) return res.status(401).json({ error: 'not_admin' });
  next();
}

function requireAuth(req, res, next) {
  if (!req.session.admin && !req.session.userId) {
    return res.status(401).json({ error: 'not_authenticated' });
  }
  next();
}

// --- API ---

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/auth/me', async (req, res) => {
  if (req.session?.admin) {
    return res.json({ authenticated: true, admin: true });
  }
  if (!req.session?.userId) {
    return res.json({ authenticated: false });
  }

  const db = await readDb();
  const user = db.users.find((u) => u.id === req.session.userId);

  return res.json({
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
  });
});

app.post('/api/auth/register', async (req, res) => {
  const { fullname, course, department, studentid, email, password, gradDate } = req.body;

  if (!fullname || !course || !department || !studentid || !email || !password || !gradDate) {
    return res.status(400).json({ error: 'missing_fields' });
  }

  const normalizedCourse = String(course).trim();
  const normalizedDepartment = String(department).trim();

  const db = await readDb();
  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedStudentId = String(studentid).trim();

  const allowedDomains = ['@gmail.com', '@sorsu.edu.ph'];
  if (!allowedDomains.some((d) => normalizedEmail.endsWith(d))) {
    return res.status(400).json({ error: 'invalid_email_domain' });
  }

  if (db.users.some(u => u.email === normalizedEmail || u.studentid === normalizedStudentId)) {
    return res.status(409).json({ error: 'account_exists' });
  }

  const { salt, hash } = hashPassword(String(password));
  const user = {
    id: crypto.randomUUID(),
    fullname: String(fullname).trim(),
    course: normalizedCourse,
    department: normalizedDepartment,
    studentid: normalizedStudentId,
    email: normalizedEmail,
    password: { salt, hash },
    gradDate: String(gradDate)
  };

  db.users.push(user);
  await writeDb(db);

  req.session.userId = user.id;
  req.session.admin = false;

  res.json({
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
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) return res.status(400).json({ error: 'missing_fields' });

  const db = await readDb();
  const id = String(identifier).trim();
  const normalizedEmail = id.toLowerCase();

  const user = db.users.find(u => u.email === normalizedEmail || u.studentid === id);
  if (!user) return res.status(401).json({ error: 'invalid_credentials' });

  if (!verifyPassword(String(password), user.password)) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  req.session.userId = user.id;
  req.session.admin = false;

  res.json({
    ok: true,
    user: {
      id: user.id,
      fullname: user.fullname || '',
      course: user.course || '',
      department: user.department || '',
      studentid: user.studentid || '',
      email: user.email || '',
      gradDate: user.gradDate || ''
    }
  });
});

app.post('/api/auth/admin-login', async (req, res) => {
  const { accessCode, adminKey } = req.body;
  if (!accessCode || !adminKey) return res.status(400).json({ error: 'missing_fields' });

  const db = await readDb();
  const accessOk = hashSecret(accessCode) === db.admin.accessCodeHash;
  const keyOk = hashSecret(adminKey) === db.admin.adminKeyHash;

  if (!accessOk || !keyOk) return res.status(401).json({ error: 'invalid_credentials' });

  req.session.userId = null;
  req.session.admin = true;

  res.json({ ok: true });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('admindash.sid');
    res.json({ ok: true });
  });
});

app.post('/api/nominations', requireUser, async (req, res) => {
  const { club, position, nomineeName, program, year, block, reason, imageData } = req.body;
  if (!club || !position || !nomineeName) return res.status(400).json({ error: 'missing_fields' });

  const db = await readDb();
  const section = `${String(program || '').trim()} ${String(year || '').trim()} ${String(block || '').trim()}`.trim();

  db.nominations.push({
    id: crypto.randomUUID(),
    club: String(club).trim(),
    position: String(position).trim(),
    name: String(nomineeName).trim(),
    program: String(program || '').trim(),
    year: String(year || '').trim(),
    block: String(block || '').trim(),
    section,
    reason: String(reason || '').trim(),
    imageData: typeof imageData === 'string' && imageData.startsWith('data:image/') ? imageData : '',
    status: 'pending',
    createdBy: req.session.userId,
    createdAt: new Date().toISOString()
  });

  await writeDb(db);
  res.json({ ok: true });
});

app.get('/api/votes/status', async (req, res) => {
  const electionId = String(req.query.electionId || 'skc').trim();
  const db = await readDb();
  const election = getElection(db, electionId);
  const status = electionStatus(election.endAt);

  const ballots = (db.ballots && Array.isArray(db.ballots[electionId])) ? db.ballots[electionId] : [];
  const authenticated = Boolean(req.session?.userId);
  const hasVoted = authenticated ? ballots.some((b) => b && b.userId === req.session.userId) : false;

  res.json({
    ok: true,
    electionId,
    status,
    endAt: election.endAt || null,
    now: new Date().toISOString(),
    authenticated,
    hasVoted
  });
});

app.post('/api/votes/submit', requireUser, async (req, res) => {
  const electionId = String(req.body.electionId || 'skc').trim();
  const votes = req.body.votes && typeof req.body.votes === 'object' ? req.body.votes : null;
  if (!votes) return res.status(400).json({ error: 'missing_votes' });

  const db = await readDb();
  const election = getElection(db, electionId);
  if (electionStatus(election.endAt) === 'closed') {
    return res.status(403).json({ error: 'voting_closed', endAt: election.endAt || null });
  }

  const candidates = (db.candidates && Array.isArray(db.candidates[electionId])) ? db.candidates[electionId] : [];
  const allowedByPosition = new Map();
  candidates.forEach((c) => {
    if (!c || !c.position || !c.name) return;
    const set = allowedByPosition.get(String(c.position)) || new Set();
    set.add(String(c.name));
    allowedByPosition.set(String(c.position), set);
  });

  for (const [position, candidateName] of Object.entries(votes)) {
    const allowed = allowedByPosition.get(String(position));
    if (!allowed || !allowed.has(String(candidateName))) {
      return res.status(400).json({ error: 'invalid_vote', position: String(position) });
    }
  }

  if (!db.ballots) db.ballots = {};
  if (!Array.isArray(db.ballots[electionId])) db.ballots[electionId] = [];
  if (db.ballots[electionId].some((b) => b && b.userId === req.session.userId)) {
    return res.status(409).json({ error: 'already_voted' });
  }

  const receiptID = `#${Math.floor(10000000 + Math.random() * 90000000)}`;
  const timestamp = new Date().toISOString();

  db.ballots[electionId].push({
    id: crypto.randomUUID(),
    electionId,
    userId: req.session.userId,
    receiptID,
    timestamp,
    votes
  });

  await writeDb(db);
  res.json({ ok: true, receiptID, timestamp });
});

app.get('/api/candidates', async (req, res) => {
  const electionId = String(req.query.electionId || 'skc').trim();
  const db = await readDb();
  const election = getElection(db, electionId);
  const status = electionStatus(election.endAt);

  const candidates = (db.candidates && Array.isArray(db.candidates[electionId])) ? db.candidates[electionId] : [];
  const positionsMap = new Map();
  candidates.forEach((c) => {
    if (!c || !c.position || !c.name) return;
    const pos = String(c.position);
    if (!positionsMap.has(pos)) positionsMap.set(pos, []);
    positionsMap.get(pos).push({ name: String(c.name), party: String(c.party || '') });
  });

  const positions = Array.from(positionsMap.entries()).map(([position, list]) => ({
    position,
    candidates: list
  }));

  res.json({
    ok: true,
    electionId,
    status,
    endAt: election.endAt || null,
    now: new Date().toISOString(),
    positions
  });
});

app.get('/api/results', async (req, res) => {
  const electionId = String(req.query.electionId || 'skc').trim();
  const db = await readDb();
  const election = getElection(db, electionId);
  const status = electionStatus(election.endAt);
  const generatedAt = new Date().toISOString();

  if (status !== 'closed') {
    return res.json({ ok: true, electionId, status, endAt: election.endAt || null, generatedAt, results: [] });
  }

  const candidates = (db.candidates && Array.isArray(db.candidates[electionId])) ? db.candidates[electionId] : [];
  const ballots = (db.ballots && Array.isArray(db.ballots[electionId])) ? db.ballots[electionId] : [];

  const positions = new Map();
  candidates.forEach((c) => {
    if (!c || !c.position || !c.name) return;
    const pos = String(c.position);
    if (!positions.has(pos)) positions.set(pos, []);
    positions.get(pos).push({ name: String(c.name), party: String(c.party || '') });
  });

  const counts = new Map();
  for (const [pos, list] of positions.entries()) {
    const m = new Map();
    list.forEach((c) => m.set(c.name, 0));
    counts.set(pos, m);
  }

  ballots.forEach((b) => {
    if (!b || !b.votes) return;
    Object.entries(b.votes).forEach(([pos, cand]) => {
      const m = counts.get(String(pos));
      if (!m) return;
      const name = String(cand);
      if (!m.has(name)) return;
      m.set(name, m.get(name) + 1);
    });
  });

  const results = Array.from(positions.entries()).map(([position, candidateList]) => {
    const m = counts.get(position) || new Map();
    const total = Array.from(m.values()).reduce((a, b) => a + b, 0);
    const candidatesOut = candidateList
      .map((c) => {
        const votes = m.get(c.name) || 0;
        const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
        return { name: c.name, party: c.party, votes, percentage: `${pct}%`, percentageValue: pct };
      })
      .sort((a, b) => b.votes - a.votes);
    return { position, candidates: candidatesOut };
  });

  res.json({ ok: true, electionId, status, endAt: election.endAt || null, generatedAt, results });
});

app.post('/api/auth/forgot', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'missing_fields' });

  // Dev-only: create a reset token, but don't email it.
  const db = await readDb();
  const normalizedEmail = String(email).trim().toLowerCase();

  const allowedDomains = ['@gmail.com', '@sorsu.edu.ph'];
  if (!allowedDomains.some((d) => normalizedEmail.endsWith(d))) {
    return res.status(400).json({ error: 'invalid_email_domain' });
  }

  const user = db.users.find(u => u.email === normalizedEmail);

  if (user) {
    const token = crypto.randomBytes(24).toString('hex');
    db.passwordResets.push({
      token,
      userId: user.id,
      expiresAt: Date.now() + 30 * 60 * 1000
    });
    await writeDb(db);

    return res.json({ ok: true, token });
  }

  // Avoid user enumeration
  res.json({ ok: true });
});

app.post('/api/auth/reset', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'missing_fields' });

  const db = await readDb();
  const entryIndex = db.passwordResets.findIndex(r => r.token === token);
  if (entryIndex === -1) return res.status(400).json({ error: 'invalid_token' });

  const entry = db.passwordResets[entryIndex];
  if (Date.now() > entry.expiresAt) return res.status(400).json({ error: 'expired_token' });

  const user = db.users.find(u => u.id === entry.userId);
  if (!user) return res.status(400).json({ error: 'invalid_token' });

  const { salt, hash } = hashPassword(String(password));
  user.password = { salt, hash };
  db.passwordResets.splice(entryIndex, 1);
  await writeDb(db);

  res.json({ ok: true });
});

// Admin-only data endpoints
app.get('/api/stats', requireAdmin, async (_req, res) => {
  const db = await readDb();
  res.json(db.stats);
});

app.get('/api/nominations', requireAdmin, async (_req, res) => {
  const db = await readDb();
  res.json(db.nominations);
});

app.post('/api/nominations/:id/:action(accept|reject)', requireAdmin, async (req, res) => {
  const { id, action } = req.params;
  const db = await readDb();
  const nom = db.nominations.find(n => n.id === id);
  if (!nom) return res.status(404).json({ error: 'not_found' });

  nom.status = action === 'accept' ? 'accepted' : 'rejected';
  await writeDb(db);

  res.json({ ok: true, nomination: nom });
});

app.get('/api/elections', requireAdmin, async (_req, res) => {
  const db = await readDb();

  const electionsObj = (db.elections && typeof db.elections === 'object') ? db.elections : {};
  const electionIds = Object.keys(electionsObj).sort();

  const elections = electionIds.map((id) => {
    const cfg = electionsObj[id] || {};
    const endAt = cfg.endAt || null;
    const startAt = cfg.startAt || null;
    const name = cfg.name || id;
    const positions = Array.isArray(cfg.positions) ? cfg.positions : null;

    const ballots = db.ballots && Array.isArray(db.ballots[id]) ? db.ballots[id] : [];
    const candidates = db.candidates && Array.isArray(db.candidates[id]) ? db.candidates[id] : [];

    return {
      id,
      name,
      startAt,
      endAt,
      status: electionStatus(endAt),
      totalBallots: ballots.length,
      candidateCount: candidates.length,
      positions
    };
  });

  res.json({ ok: true, elections });
});

function slugifyElectionId(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
}

app.post('/api/elections', requireAdmin, async (req, res) => {
  const { orgClub, name, eventStart, eventEnd, startAt, endAt, positionIncluded, electionId } = req.body || {};

  const providedName = String(name || orgClub || '').trim();
  const normalizedEndAt = String(endAt || eventEnd || '').trim();
  const normalizedStartAt = String(startAt || eventStart || '').trim();

  const id = String(electionId || slugifyElectionId(providedName)).trim();
  if (!id) return res.status(400).json({ error: 'missing_fields' });
  if (!normalizedEndAt) return res.status(400).json({ error: 'missing_end_date' });

  // Accept YYYY-MM-DD or full ISO. Store ISO in db.
  const parsedEnd = Date.parse(normalizedEndAt.length === 10 ? `${normalizedEndAt}T23:59:59.000Z` : normalizedEndAt);
  if (!Number.isFinite(parsedEnd)) return res.status(400).json({ error: 'invalid_end_date' });
  const endAtIso = new Date(parsedEnd).toISOString();

  let startAtIso = null;
  if (normalizedStartAt) {
    const parsedStart = Date.parse(normalizedStartAt.length === 10 ? `${normalizedStartAt}T00:00:00.000Z` : normalizedStartAt);
    if (Number.isFinite(parsedStart)) startAtIso = new Date(parsedStart).toISOString();
  }

  const db = await readDb();
  if (!db.elections || typeof db.elections !== 'object') db.elections = {};
  if (!db.candidates || typeof db.candidates !== 'object') db.candidates = {};
  if (!db.ballots || typeof db.ballots !== 'object') db.ballots = {};

  const existing = db.elections[id] && typeof db.elections[id] === 'object' ? db.elections[id] : {};
  const positions = new Set(Array.isArray(existing.positions) ? existing.positions.map(String) : []);
  if (positionIncluded) positions.add(String(positionIncluded));

  db.elections[id] = {
    ...existing,
    id,
    name: providedName || existing.name || id,
    startAt: startAtIso || existing.startAt || null,
    endAt: endAtIso,
    positions: positions.size ? Array.from(positions) : existing.positions || undefined
  };

  if (!Array.isArray(db.candidates[id])) db.candidates[id] = [];
  if (!Array.isArray(db.ballots[id])) db.ballots[id] = [];

  await writeDb(db);
  res.json({
    ok: true,
    election: {
      id,
      name: db.elections[id].name || id,
      startAt: db.elections[id].startAt || null,
      endAt: db.elections[id].endAt || null,
      status: electionStatus(db.elections[id].endAt),
      totalBallots: db.ballots[id].length,
      candidateCount: db.candidates[id].length,
      positions: Array.isArray(db.elections[id].positions) ? db.elections[id].positions : null
    }
  });
});

// --- Static site ---

// Protect admin dashboard pages (HTML) from normal/user sessions.
// Only admins (Access Code + Admin Key) can view these pages.
const ADMIN_PAGE_RE = /^\/(admin dashboard\/)?(dashboard\.html|login\.html|poll management\.html|results&analytics\.html|settings\.html)$/;
app.get(ADMIN_PAGE_RE, (req, res, next) => {
  if (req.session?.admin) return next();
  res.redirect('/admin sign-in.html');
});

app.use(express.static(STATIC_ROOT));

// Support links opened with the workspace folder prefix (from Live Server redirects)
// e.g. /admin%20dashboard/admin.html
app.use('/admin dashboard', express.static(STATIC_ROOT));

app.get('/', (_req, res) => {
  res.redirect('/index.html');
});

await ensureDb();

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`Serving static from: ${STATIC_ROOT}`);
});
