// Tiny dependency-free test runner:  npm test
// Checks the question banks, the grader and the leaderboard store.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Keep the test leaderboard out of the real data/ folder
process.env.LEADERBOARD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'quzzo-test-'));

const quizzes = require('../quizzes');
const leaderboard = require('../leaderboard-store');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('\nQuiz banks');

test('CS Basics has exactly 10 questions', () => {
  assert.strictEqual(quizzes.getQuiz('csbasics').questions.length, 10);
});

test('every question has 4 options, a valid key and an explanation', () => {
  Object.values(quizzes.QUIZZES).forEach((quiz) => {
    quiz.questions.forEach((q) => {
      assert.strictEqual(q.options.length, 4, `${quiz.id}/${q.id} should have 4 options`);
      assert.ok(q.options.some((o) => o.id === q.correct), `${quiz.id}/${q.id} key must match an option`);
      assert.ok(q.explanation && q.explanation.length > 20, `${quiz.id}/${q.id} needs an explanation`);
    });
    const ids = quiz.questions.map((q) => q.id);
    assert.strictEqual(new Set(ids).size, ids.length, `${quiz.id} has duplicate question ids`);
  });
});

test('CS Basics answers are mixed across A/B/C/D (no giveaway pattern)', () => {
  const keys = quizzes.getQuiz('csbasics').questions.map((q) => q.correct);
  const spread = new Set(keys);
  assert.strictEqual(spread.size, 4, `expected all four letters, got ${[...spread].join(',')}`);
  keys.forEach((key, i) => {
    if (i >= 2) {
      assert.ok(!(key === keys[i - 1] && key === keys[i - 2]), 'no letter should repeat 3 times in a row');
    }
  });
  const counts = keys.reduce((acc, k) => ({ ...acc, [k]: (acc[k] || 0) + 1 }), {});
  Object.entries(counts).forEach(([letter, n]) => {
    assert.ok(n <= 4, `letter ${letter} used ${n} times — too predictable`);
  });
});

test('public questions never leak the answer key', () => {
  const asSent = quizzes.publicQuestions('csbasics');
  asSent.forEach((q) => {
    assert.strictEqual(q.correct, undefined);
    assert.strictEqual(q.explanation, undefined);
  });
});

console.log('\nGrading');

test('a perfect paper scores 10/10 at 100%', () => {
  const answers = {};
  quizzes.getQuiz('csbasics').questions.forEach((q) => { answers[q.id] = q.correct; });
  const result = quizzes.grade('csbasics', answers);
  assert.strictEqual(result.score, 10);
  assert.strictEqual(result.total, 10);
  assert.strictEqual(result.percentage, 100);
});

test('wrong and blank answers score zero', () => {
  const answers = { q1: 'a', q2: 'a' }; // q1 key is b, q2 key is c
  const result = quizzes.grade('csbasics', answers);
  assert.strictEqual(result.score, 0);
  assert.strictEqual(result.results.filter((r) => r.chosen === null).length, 8);
});

test('an unknown subject falls back to the default quiz', () => {
  assert.strictEqual(quizzes.resolveQuizId('nope'), quizzes.DEFAULT_QUIZ_ID);
  assert.strictEqual(quizzes.resolveQuizId('DPCO'), 'dpco');
});

console.log('\nLeaderboard');

test('entries rank by score, then by fastest time', () => {
  leaderboard.addEntry({ subject: 'csbasics', name: 'Riya', score: 8, total: 10, timeTaken: 200 });
  leaderboard.addEntry({ subject: 'csbasics', name: 'Arun', score: 10, total: 10, timeTaken: 300 });
  leaderboard.addEntry({ subject: 'csbasics', name: 'Meera', score: 10, total: 10, timeTaken: 120 });

  const board = leaderboard.getBoard({ subject: 'csbasics' });
  assert.deepStrictEqual(board.entries.map((e) => e.name), ['Meera', 'Arun', 'Riya']);
  assert.strictEqual(board.entries[0].rank, 1);
});

test('a retake only keeps the student best attempt', () => {
  leaderboard.addEntry({ subject: 'csbasics', name: 'Riya', score: 9, total: 10, timeTaken: 150 });
  const board = leaderboard.getBoard({ subject: 'csbasics' });
  const riyaRows = board.entries.filter((e) => e.name === 'Riya');
  assert.strictEqual(riyaRows.length, 1);
  assert.strictEqual(riyaRows[0].score, 9);
  assert.strictEqual(board.attempts, 4);
});

test('a weaker retake still reports the student ranking (never a null rank)', () => {
  const weaker = leaderboard.addEntry({ subject: 'csbasics', name: 'Riya', score: 2, total: 10, timeTaken: 90 });
  const placement = leaderboard.rankOf(weaker.id, 'csbasics');
  assert.strictEqual(placement.isBest, false);
  assert.ok(Number.isInteger(placement.rank), 'rank must be a number, not null');
  assert.strictEqual(placement.best.score, 9, 'the best attempt represents the student');
});

test('boards are kept separate per subject', () => {
  leaderboard.addEntry({ subject: 'dpco', name: 'Karthik', score: 20, total: 25, timeTaken: 600 });
  assert.strictEqual(leaderboard.getBoard({ subject: 'csbasics' }).players, 3);
  assert.strictEqual(leaderboard.getBoard({ subject: 'dpco' }).players, 1);
  assert.strictEqual(leaderboard.getBoard({ subject: 'all' }).players, 4);
});

test('names are trimmed, capped and never empty', () => {
  const entry = leaderboard.addEntry({ subject: 'csbasics', name: '   ', score: 1, total: 10 });
  assert.strictEqual(entry.name, 'Anonymous');
  const long = leaderboard.addEntry({ subject: 'csbasics', name: 'x'.repeat(80), score: 1, total: 10 });
  assert.strictEqual(long.name.length, 40);
});

test('scores cannot exceed the number of questions', () => {
  const entry = leaderboard.addEntry({ subject: 'csbasics', name: 'Cheater', score: 999, total: 10 });
  assert.strictEqual(entry.score, 10);
  assert.strictEqual(entry.percentage, 100);
});

console.log(`\n${passed} checks passed${process.exitCode ? ' (with failures above)' : ''}\n`);
fs.rmSync(process.env.LEADERBOARD_DIR, { recursive: true, force: true });
