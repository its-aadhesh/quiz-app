# Changelog / Walkthrough

## Latest — CS Basics quiz (1st year) + Guest Mode + local leaderboard

### 1. New 10-question quiz: "CS Basics — Programs & Algorithms"
Added `quizzes/cs-basics.js` covering the first-year portion:
Programs and Algorithms · Problem Definition · Flow Chart · Fundamental Algorithms
(exchange of two variables, counting, summation, factorial, sine function
computation, Fibonacci sequence, reversing the digits of an integer, base
conversion) · algorithm development, description, design considerations and
applications.

- Deliberately **mixed answer key** — `b, c, d, a, c, a, d, b, d, a` (A×3, B×2, C×2, D×3).
- Every question carries a `topic` badge and a teaching explanation shown in the review.
- 10 minute countdown; 1 mark per question.

### 2. Multi-subject architecture
- `quizzes/index.js` is now the single registry of subjects (metadata + banks).
  `server.js` shrank to routes only.
- New `GET /api/quizzes`; `GET /api/questions` and `POST /api/submit` take a
  `subject`. The landing-page subject cards, timer, question counter and
  leaderboard tabs are generated from the registry.

### 3. Guest Mode — name first, then the quiz
- The entry card opens on a **Guest Mode** tab: enter a name (department/year
  optional) and go straight into the quiz. No email, no password, no post-quiz prompt.
- The name is remembered in `localStorage` and shown in the quiz HUD as
  `Name · Guest · CSE`.
- Marks are published automatically on submission; the results screen reports
  the exact rank: *"🏆 Saved as Aadhesh — rank #3 of 12 with 7/10 marks."*

### 4. Leaderboard that always works
- New `leaderboard-store.js` writes to `data/leaderboard.json` (git-ignored), so
  marks appear with zero database setup; Supabase remains an optional mirror for
  signed-in students.
- Ranked by score ↓, then fastest time, then who finished first; one row per
  student (a retake only replaces a weaker result).
- Per-subject tabs (CS Basics / DPCO / All subjects), medals for the top three,
  `guest` and `you` tags, time column, auto-refresh while open.

### 5. Tests
`npm test` runs 13 dependency-free checks: bank integrity, no leaked answer keys,
mixed-answer enforcement, grading maths, ranking, retake handling and input
sanitisation.

---

## Earlier — Circuit Check: Applications of Digital Electronics Quiz

We have completely upgraded the quiz platform with a cloud backend, Google authentication, 25 specialized questions, an instantaneous live leaderboard, and a mobile-optimized cyber aesthetic.

---

## 1. Database & Cloud Architecture (Supabase)
- Applied a database migration creating the `quiz_scores` table:
  - Columns: `id`, `user_id`, `user_email`, `user_name`, `user_avatar`, `score`, `total_questions`, `percentage`, `time_taken_seconds`, and `created_at`.
  - Configured Row Level Security (RLS) policies allowing public read of rankings and authenticated/guest score submissions.
  - Added table to `supabase_realtime` publication for instant leaderboard socket updates.

## 2. 25 High-Yield Questions on Applications of Digital Electronics
- Expanded the question bank in [server.js](file:///Users/nameadd/quiz-app/server.js) to 25 questions spanning:
  - Automotive Engine Control Units (ECUs) and ABS brake controllers
  - Avionics bus architectures (ARINC 429 & MIL-STD-1553)
  - Industrial PLCs & Robotics optical encoders
  - Digital Signal Processing in ECG monitors & Medical infusion pumps
  - ADC/DAC in smart consumer audio
  - IoT edge microcontrollers & PWM servo drives
  - 5G OFDM multicarrier modulation & PMU smart grids
  - Rad-Hard space electronics and low-power VLSI CMOS

## 3. Google Sign-In & Callsign Support
- Integrated Supabase Auth (`@supabase/supabase-js`) in [public/script.js](file:///Users/nameadd/quiz-app/public/script.js).
- Added a one-click Google Sign-In button with avatar display.
- Also provided a custom engineer callsign fallback so users can save their marks and compete immediately even without signing in.

## 4. Real-Time Global Leaderboard
- Top 50 global rankings sorted by highest score and lowest time taken.
- Displays Gold, Silver, and Bronze podium styling.
- Subscribes via Supabase Realtime so when any user completes a quiz, the leaderboard updates instantly on all connected screens without refreshing.

## 5. Mobile-First PCB Cyber UI & Bonus Features
- **HUD Bar**: Live question counter, live elapsed stopwatch timer, and current score badge.
- **Trace Nodes**: Visual circuit trace at the top showing completed and current question states.
- **Web Audio API Sound Effects**: Synthesized click and transition beeps, plus victory fanfare on high scores (with toggle button).
- **Celebration**: Confetti effect when scoring >= 70%.
- **Detailed Logic Diagnostic**: Breakdown showing selected answers, correct answers, and engineering explanations for every question.
