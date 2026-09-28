// ============================================================================
// Leaderboard store — tiny JSON-file database for quiz results.
//
// Why not Supabase for this? The cloud leaderboard needs a project, a table
// and network access. A classroom running this app locally (or a reviewer
// opening the preview) must still see marks appear on the board the moment a
// guest finishes, so scores are always written here. Supabase remains a
// best-effort mirror for signed-in students (see public/script.js).
//
// Storage: data/leaderboard.json  (git-ignored, created on first submission)
// ============================================================================

const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.LEADERBOARD_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'leaderboard.json');
const MAX_ENTRIES = 5000;

let entries = load();

function load() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn('[leaderboard] could not read store, starting empty:', err.message);
    }
    return [];
  }
}

function persist() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(entries, null, 2), 'utf8');
    fs.renameSync(tmp, DATA_FILE); // atomic-ish: never leaves a half-written file
  } catch (err) {
    console.warn('[leaderboard] could not write store:', err.message);
  }
}

function clean(value, maxLength, fallback = '') {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
  return trimmed || fallback;
}

function toInt(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : fallback;
}

/** Highest score wins; ties broken by the faster attempt, then by who was first. */
function compareEntries(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  if (a.timeTakenSeconds !== b.timeTakenSeconds) return a.timeTakenSeconds - b.timeTakenSeconds;
  return new Date(a.createdAt) - new Date(b.createdAt);
}

/**
 * Saves one completed attempt.
 * Returns the stored entry (with its generated id) so the client can highlight
 * that row on the board.
 */
function addEntry(input) {
  const total = Math.max(1, toInt(input.total, 1));
  const score = Math.min(total, toInt(input.score, 0));

  const entry = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    subject: clean(input.subject, 32, 'csbasics').toLowerCase(),
    subjectName: clean(input.subjectName, 48, ''),
    name: clean(input.name, 40, 'Anonymous'),
    department: clean(input.department, 32, 'General'),
    year: clean(input.year, 16, '1st Year'),
    mode: input.mode === 'student' ? 'student' : 'guest',
    score,
    total,
    percentage: total ? Math.round((score / total) * 10000) / 100 : 0,
    timeTakenSeconds: toInt(input.timeTaken ?? input.timeTakenSeconds, 0),
    createdAt: new Date().toISOString()
  };

  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries = entries.slice(-MAX_ENTRIES);
  persist();
  return entry;
}

/**
 * Ranked board.
 * mode 'best' (default) keeps each student's best attempt so retakes do not
 * flood the table; mode 'all' returns every attempt.
 */
function getBoard({ subject = 'all', limit = 50, mode = 'best' } = {}) {
  const wanted = String(subject || 'all').toLowerCase();
  let rows = wanted === 'all' ? [...entries] : entries.filter((e) => e.subject === wanted);

  if (mode !== 'all') {
    const best = new Map();
    rows.forEach((row) => {
      const key = `${row.subject}::${row.name.toLowerCase()}`;
      const current = best.get(key);
      if (!current || compareEntries(row, current) < 0) best.set(key, row);
    });
    rows = [...best.values()];
  }

  rows.sort(compareEntries);

  const attempts = wanted === 'all'
    ? entries.length
    : entries.filter((e) => e.subject === wanted).length;

  return {
    subject: wanted,
    players: rows.length,
    attempts,
    entries: rows.slice(0, Math.max(1, toInt(limit, 50))).map((row, index) => ({
      ...row,
      rank: index + 1
    }))
  };
}

/**
 * Where a just-saved attempt sits on the board.
 * The board shows one row per student, so a weaker retake is represented by
 * that student's best row — `isBest` says which of the two happened.
 */
function rankOf(entryId, subject) {
  const board = getBoard({ subject, limit: MAX_ENTRIES });
  const saved = entries.find((row) => row.id === entryId);
  const shown = board.entries.find((row) => row.id === entryId)
    || (saved && board.entries.find((row) => row.name.toLowerCase() === saved.name.toLowerCase()));

  return {
    rank: shown ? shown.rank : null,
    players: board.players,
    isBest: Boolean(shown && shown.id === entryId),
    best: shown ? { id: shown.id, score: shown.score, total: shown.total } : null
  };
}

module.exports = { addEntry, getBoard, rankOf, DATA_FILE };
