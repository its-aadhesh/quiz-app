// ============================================================================
// Quiz registry — every quiz the app can serve.
//
// Add a new subject by dropping a question bank file in this folder and
// registering it below. Nothing else in the app has to change: the subject
// cards, the timer, the question counter and the leaderboard tabs are all
// built from this metadata.
// ============================================================================

const csBasicsQuestions = require('./cs-basics');
const dpcoQuestions = require('./dpco');

const QUIZZES = {
  csbasics: {
    id: 'csbasics',
    name: 'CS Basics',
    icon: '⌥',
    fullName: 'Computer Science Basics — Programs & Algorithms',
    description: 'Problem definition, flowcharts and the fundamental algorithms every first-year student must know.',
    syllabus: 'Programs and Algorithms · Problem Definition · Flow Chart · Fundamental Algorithms · Design Considerations',
    year: '1st Year',
    difficulty: 'Beginner',
    timeLimitMinutes: 10,
    questions: csBasicsQuestions
  },
  dpco: {
    id: 'dpco',
    name: 'DPCO',
    icon: '◈',
    fullName: 'Applications of Digital Electronics',
    description: 'Logic gates, MUX/DEMUX, flip-flops, counters and real-world digital system applications.',
    syllabus: 'Digital Principles and Computer Organisation',
    year: '2nd Year',
    difficulty: 'Intermediate',
    timeLimitMinutes: 25,
    questions: dpcoQuestions
  }
};

// Subjects listed on the landing page that do not have a question bank yet.
const COMING_SOON = [
  { id: 'maths', name: 'Maths', icon: '∑' },
  { id: 'oops', name: 'OOPS', icon: '{ }' },
  { id: 'dsa', name: 'DSA', icon: '⌘' },
  { id: 'dse', name: 'DSE', icon: '▦' }
];

const DEFAULT_QUIZ_ID = 'csbasics';

/** Normalises whatever the client sent ("CSBASICS", " dpco ") to a known id. */
function resolveQuizId(rawId) {
  const key = String(rawId || '').trim().toLowerCase();
  return QUIZZES[key] ? key : DEFAULT_QUIZ_ID;
}

function getQuiz(rawId) {
  return QUIZZES[resolveQuizId(rawId)];
}

/** Catalogue for the landing page (no questions, no answer keys). */
function listQuizzes() {
  const ready = Object.values(QUIZZES).map((quiz) => ({
    id: quiz.id,
    name: quiz.name,
    icon: quiz.icon,
    fullName: quiz.fullName,
    description: quiz.description,
    syllabus: quiz.syllabus,
    year: quiz.year,
    difficulty: quiz.difficulty,
    timeLimitMinutes: quiz.timeLimitMinutes,
    questionCount: quiz.questions.length,
    available: true
  }));

  const soon = COMING_SOON.map((subject) => ({
    ...subject,
    fullName: `${subject.name} — coming soon`,
    description: 'Question bank is being prepared.',
    questionCount: 0,
    available: false
  }));

  return [...ready, ...soon];
}

/** Public shape of a question — the `correct` key never goes to the browser. */
function publicQuestions(rawId) {
  return getQuiz(rawId).questions.map(({ id, prompt, options, topic }) => ({
    id,
    prompt,
    options,
    topic: topic || null
  }));
}

/** Grades a submission server-side so answers cannot be scraped from the page. */
function grade(rawId, answers = {}) {
  const quiz = getQuiz(rawId);
  let score = 0;

  const results = quiz.questions.map((q) => {
    const chosen = answers[q.id];
    const isCorrect = chosen === q.correct;
    if (isCorrect) score += 1;
    return {
      id: q.id,
      topic: q.topic || null,
      chosen: chosen || null,
      correct: q.correct,
      isCorrect,
      explanation: q.explanation
    };
  });

  const total = quiz.questions.length;
  const percentage = total ? Math.round((score / total) * 100 * 100) / 100 : 0;

  return {
    subject: quiz.id,
    subjectName: quiz.name,
    score,
    total,
    percentage,
    results
  };
}

module.exports = {
  QUIZZES,
  DEFAULT_QUIZ_ID,
  resolveQuizId,
  getQuiz,
  listQuizzes,
  publicQuestions,
  grade
};
