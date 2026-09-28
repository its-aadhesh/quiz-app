# Quzzo — Student Quiz Platform with Guest Mode & Live Leaderboard

A small, framework-free quiz app (Node + Express + vanilla JS) built for classroom use.
Students pick a subject, take the quiz, and their final marks land on a ranked
leaderboard straight away — **no account required**.

---

## Quiz banks

| Subject | Questions | Time | Level | Covers |
|---|---|---|---|---|
| **CS Basics** | 10 | 10 min | 1st year | Programs & Algorithms · Problem Definition · Flow Chart · Fundamental Algorithms (exchange of two variables, counting, summation, factorial, sine function computation, Fibonacci, reversing digits, base conversion) · Algorithm development, description, design considerations & applications |
| **DPCO** | 25 | 25 min | 2nd year | Applications of Digital Electronics — logic gates, MUX/DEMUX, flip-flops, counters, encoders/decoders |

Maths, OOPS, DSA and DSE appear on the landing page as *coming soon* until a
question bank is added for them.

Answer keys for **CS Basics are deliberately mixed** across options A–D
(`b, c, d, a, c, a, d, b, d, a`) so nobody can pass by always picking the same
letter. `npm test` enforces that: it fails if a letter appears more than four
times or three times in a row.

---

## Guest mode (the quick path)

1. Open the app — the entry card starts on the **Guest Mode** tab.
2. Type your **name** (department and year are optional) and press **Start Quiz as Guest**.
3. Answer the questions. The HUD shows your name, a countdown and your progress.
4. On the last question the paper is graded server-side and your marks are posted
   to the leaderboard automatically:
   > 🏆 Saved as **Aadhesh** — rank **#3** of 12 on the CS Basics board with **7/10** marks.
5. Open the leaderboard to see every student ranked; your own row is highlighted
   with a **you** tag, and guest entries carry a **guest** tag.

Your name is remembered in `localStorage`, so the box is pre-filled on the next
attempt. Signed-in students (Supabase email/password or Google) skip the name
step entirely and play under their profile.

### Ranking rules
- Highest **score** first, then the **fastest time**, then whoever finished first.
- One row per student: a retake replaces your row only if it beats your best.
- One board per subject, plus an **All subjects** view.

---

## Running locally

```bash
npm install
npm start          # http://localhost:3000
npm test           # 13 checks: question banks, grading, leaderboard ranking
```

Marks are stored in `data/leaderboard.json` (created automatically, git-ignored),
so the leaderboard works with no database setup and survives a server restart.

---

## API

| Route | Purpose |
|---|---|
| `GET /api/quizzes` | Subject catalogue: question count, time limit, availability |
| `GET /api/questions?subject=csbasics` | Questions **without** the answer key |
| `POST /api/submit` | `{ subject, answers }` → `{ score, total, percentage, results[] }` |
| `GET /api/leaderboard?subject=csbasics` | Ranked board (best attempt per student) |
| `POST /api/leaderboard` | Saves an attempt → `{ entry, rank, players, isBest }` |
| `GET /api/config` | Supabase URL + anon key (optional cloud accounts) |

Answer keys and explanations never leave the server until a paper is graded, so
students can't read them from DevTools.

---

## Editing the quiz

- **Change a question:** edit `quizzes/cs-basics.js` or `quizzes/dpco.js`, then restart.
- **Add a subject:** create `quizzes/my-subject.js` exporting an array of questions
  and register it in `quizzes/index.js`. Subject cards, timers, question counters
  and leaderboard tabs all build themselves from that registry.

```js
{
  id: 'q3',
  topic: 'Flow Chart',                 // badge shown above the question
  prompt: 'Which symbol represents a DECISION?',
  options: [
    { id: 'a', text: 'Rectangle' },
    { id: 'b', text: 'Parallelogram' },
    { id: 'c', text: 'Oval (ellipse)' },
    { id: 'd', text: 'Diamond (rhombus)' }
  ],
  correct: 'd',                        // server-side only
  explanation: 'Oval = Start/Stop, Parallelogram = I/O, Rectangle = process…'
}
```

---

## Optional: Supabase student accounts

Guest mode and the leaderboard work without any cloud service. Supabase only adds
named student accounts and a cloud mirror of scores:

1. Put your project URL and anon key in `SUPABASE_CONFIG` in `server.js`.
2. Tables used: `student_profiles` (name, department, year) and `quiz_scores`.
3. For Google sign-in: Supabase Dashboard → **Authentication → Providers → Google**,
   paste the Client ID/Secret from Google Cloud Console and set the redirect URI to
   `https://<your-project>.supabase.co/auth/v1/callback`.

If Supabase is unreachable the app degrades gracefully — the login tabs explain
the situation and guest mode keeps working.

---

## Project layout

```
server.js               Express routes only
quizzes/index.js        Subject registry + grading helpers
quizzes/cs-basics.js    10 questions — Programs & Algorithms
quizzes/dpco.js         25 questions — Digital Electronics
leaderboard-store.js    JSON-file leaderboard (ranking, best-per-student)
tests/quiz.test.js      npm test
public/                 index.html · style.css · script.js
```

See `quiz_app_codebase_guide.md` for a file-by-file walkthrough.
