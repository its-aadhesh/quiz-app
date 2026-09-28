const express = require('express');
const path = require('path');

const quizzes = require('./quizzes');
const leaderboard = require('./leaderboard-store');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Supabase configuration exposed for client init (optional cloud mirror)
const SUPABASE_CONFIG = {
  url: 'https://mbnwtelvfzjofeeviutg.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibnd0ZWx2Znpqb2ZlZXZpdXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMzU2MzksImV4cCI6MjEwMzkxMTYzOX0.M7sQ4UXvEQAPfL5z_Ne07MH8WwK1KpXGywcQ4UEu8ws'
};

app.get('/api/config', (req, res) => {
  res.json(SUPABASE_CONFIG);
});

// ---------------------------------------------------------------------------
// Quiz catalogue: every subject, its question count and its time limit
// ---------------------------------------------------------------------------
app.get('/api/quizzes', (req, res) => {
  res.json({
    defaultSubject: quizzes.DEFAULT_QUIZ_ID,
    quizzes: quizzes.listQuizzes()
  });
});

// ---------------------------------------------------------------------------
// Questions for one subject (answer keys are stripped out)
//   GET /api/questions?subject=csbasics
// ---------------------------------------------------------------------------
app.get('/api/questions', (req, res) => {
  const quiz = quizzes.getQuiz(req.query.subject);
  res.json({
    subject: quiz.id,
    name: quiz.name,
    fullName: quiz.fullName,
    timeLimitMinutes: quiz.timeLimitMinutes,
    questions: quizzes.publicQuestions(quiz.id)
  });
});

// ---------------------------------------------------------------------------
// Grading — done server-side so the answer key never reaches the browser
//   POST /api/submit  { subject, answers: { q1: 'b', ... } }
// ---------------------------------------------------------------------------
app.post('/api/submit', (req, res) => {
  const result = quizzes.grade(req.body.subject, req.body.answers || {});
  res.json(result);
});

// ---------------------------------------------------------------------------
// Leaderboard
//   GET  /api/leaderboard?subject=csbasics&limit=50&mode=best
//   POST /api/leaderboard  { subject, name, department, score, total, timeTaken }
// ---------------------------------------------------------------------------
app.get('/api/leaderboard', (req, res) => {
  const { subject = 'all', limit = 50, mode = 'best' } = req.query;
  res.json(leaderboard.getBoard({ subject, limit, mode }));
});

app.post('/api/leaderboard', (req, res) => {
  const body = req.body || {};

  if (!String(body.name || '').trim()) {
    return res.status(400).json({ error: 'A player name is required to join the leaderboard.' });
  }

  const quiz = quizzes.getQuiz(body.subject);
  const entry = leaderboard.addEntry({
    ...body,
    subject: quiz.id,
    subjectName: quiz.name,
    total: body.total || quiz.questions.length
  });

  const placement = leaderboard.rankOf(entry.id, quiz.id);
  res.status(201).json({ entry, ...placement });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Quiz app running at http://localhost:${PORT}`);
  console.log(`Quizzes loaded: ${Object.keys(quizzes.QUIZZES).join(', ')}`);
});
