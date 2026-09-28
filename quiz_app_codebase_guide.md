# 📚 Quiz App — Complete Codebase Guide

> A deep-dive into every file, every UI button, every CSS class, how login works, and how Supabase powers the backend.

---

## 🗂️ Project Structure

```
quiz-app/
├── server.js              ← Node.js backend (Express routes only)
├── quizzes/
│   ├── index.js           ← Quiz registry: metadata, grading, public shapes
│   ├── cs-basics.js       ← 10 questions — Programs & Algorithms (1st year)
│   └── dpco.js            ← 25 questions — Applications of Digital Electronics
├── leaderboard-store.js   ← JSON-file leaderboard (ranking, best-per-student)
├── tests/quiz.test.js     ← `npm test` — banks, grading & leaderboard checks
├── data/leaderboard.json  ← Created at runtime, git-ignored
├── package.json           ← Project metadata & dependencies
├── public/
│   ├── index.html         ← All the HTML markup (views + modals)
│   ├── style.css          ← All styling (design system + components)
│   └── script.js          ← All frontend logic (guest mode, quiz, leaderboard)
```

There are **no frameworks** — this is pure vanilla HTML + CSS + JavaScript with a Node/Express backend.

---

## 1. `server.js` — The Backend

**What it does:** a thin Express layer. All the thinking lives in two modules
next to it (`quizzes/` and `leaderboard-store.js`).

1. **Serve the frontend files** (HTML, CSS, JS) from the `public/` folder
2. **Expose Supabase credentials** via a config API (optional cloud accounts)
3. **Serve questions & grade answers** server-side (students can't read the key)
4. **Store and rank leaderboard marks** so every finished quiz shows up instantly

### The API

| Route | Purpose |
|---|---|
| `GET /api/config` | Supabase URL + anon key for the browser client |
| `GET /api/quizzes` | Catalogue: every subject, question count, time limit, `available` flag |
| `GET /api/questions?subject=csbasics` | Questions for one subject **without** the answer key |
| `POST /api/submit` | `{ subject, answers }` → `{ score, total, percentage, results[] }` |
| `GET /api/leaderboard?subject=csbasics&limit=50` | Ranked board (best row per student) |
| `POST /api/leaderboard` | Saves one finished attempt, replies with `{ entry, rank, players, isBest }` |

```js
// Server setup
app.use(express.json());                                  // read JSON bodies
app.use(express.static(path.join(__dirname, 'public')));  // serve the frontend
```

**To change your Supabase project:** edit `SUPABASE_CONFIG` near the top of `server.js`.

---

## 1b. `quizzes/` — Question banks & grading

`quizzes/index.js` is the single source of truth for subjects. The landing-page
subject cards, the timer, the question counter and the leaderboard tabs are all
built from this metadata — nothing is hard-coded in the HTML.

```js
const QUIZZES = {
  csbasics: {
    id: 'csbasics',
    name: 'CS Basics',
    fullName: 'Computer Science Basics — Programs & Algorithms',
    year: '1st Year',
    timeLimitMinutes: 10,
    questions: require('./cs-basics')   // 10 questions
  },
  dpco: { /* … 25 questions, 25 min … */ }
};
```

Each question object looks like:
```js
{
  id: 'q3',
  topic: 'Flow Chart',                        // shown as the badge above the question
  prompt: 'In a flowchart, which symbol represents a DECISION?',
  options: [
    { id: 'a', text: 'Rectangle' },
    { id: 'b', text: 'Parallelogram' },
    { id: 'c', text: 'Oval (ellipse)' },
    { id: 'd', text: 'Diamond (rhombus)' }
  ],
  correct: 'd',            // ← ONLY on the server, never sent to the browser
  explanation: 'Oval = Start/Stop, Parallelogram = Input/Output …'
}
```

Helper functions exported by `quizzes/index.js`:

| Function | What it does |
|---|---|
| `listQuizzes()` | Catalogue for the landing page (ready subjects + "coming soon" ones) |
| `publicQuestions(id)` | Strips `correct` + `explanation` before sending to the browser |
| `grade(id, answers)` | Scores a paper and returns per-question feedback |
| `resolveQuizId(raw)` | Normalises `"DPCO"`, `" dpco "`, junk → a known subject id |

**To add a question:** edit `quizzes/cs-basics.js` (or `dpco.js`) and restart the
server. Keep the answer key mixed across a/b/c/d — `npm test` fails if one letter
is used more than 4 times or repeats three times in a row.

**To add a whole subject:** drop `quizzes/my-subject.js` next to the others and
register it in `QUIZZES`. The UI picks it up automatically.

---

## 1c. `leaderboard-store.js` — Where marks live

A tiny JSON-file database (`data/leaderboard.json`, git-ignored, created on the
first submission). No cloud project or table setup is needed, so guest marks
always appear on the board.

| Function | What it does |
|---|---|
| `addEntry(attempt)` | Sanitises the name (40 chars max), clamps the score, appends the row, writes the file atomically |
| `getBoard({ subject, limit, mode })` | Ranks by **score ↓, then time ↑, then who finished first**; `mode: 'best'` (default) keeps one row per student so retakes don't flood the table |
| `rankOf(entryId, subject)` | Where a just-saved attempt landed → `{ rank, players, isBest, best }` |

---

## 2. `public/index.html` — The Markup

The HTML is divided into **3 main views** and **4 modals**. They are all loaded at once; JavaScript shows/hides them by toggling the `hidden` CSS class.

### The 3 Views

#### View 1: Front / Landing Page (`#frontPageView`)
The home screen. `#subjectGrid` is filled by JavaScript from `/api/quizzes`, and the
entry card has two sub-states:
- **`#guestEntryBox`** — shown when no one is logged in. Four tabs:
  | Tab | Form | What it does |
  |---|---|---|
  | **Guest Mode** (default) | `#guestStartForm` | Name → straight into the quiz. No account, no email. |
  | Student Login | `#loginForm` | Supabase email + password |
  | Create Account | `#registerForm` | Supabase sign-up |
  | Teacher | `#teacherForm` | Placeholder for the upcoming question editor |
- **`#authenticatedEntryBox`** — shown when a student is logged in (their name and "Enter Quiz" button)

#### View 2: Active Quiz (`#quizView`)
Shows one question at a time. The question card (`#questionStage`) is **dynamically injected** by JavaScript — it is empty in the HTML.

#### View 3: Results Screen (`#resultsView`)
Also dynamically filled by JavaScript after submission. Contains score, accuracy, time, and answer explanations.

### The 4 Modals

| Modal ID | Purpose |
|---|---|
| `#leaderboardModal` | Ranked marks table + `#lbSubjectTabs` (CS Basics / DPCO / All subjects) |
| `#googleSetupModal` | Guide shown when Google OAuth isn't configured |
| `#userDashboardModal` | Edit profile form (name, department, year) |
| `#guestCallsignModal` | Safety net only — name entry if a quiz somehow ends without a player name |

---

## 3. `public/style.css` — The Design System

### CSS Custom Properties (Design Tokens)
All colors, fonts, and sizes are defined as variables at the top (`lines 6–51`). This makes the design consistent and easy to change globally.

```css
:root {
  --bg-page: #FBF9F5;              /* warm off-white background */
  --ink-primary: #1E293B;          /* main text color (dark slate) */
  --accent-amber: #D97706;         /* primary accent (buttons, highlights) */
  --accent-terracotta: #C2410C;    /* secondary accent (hover states, errors) */
  --font-sans: 'Plus Jakarta Sans' /* main UI font */
  --font-serif: 'Fraunces'         /* headings & question text */
  --font-mono: 'JetBrains Mono'    /* timer, scores */
}
```

**To change the color scheme:** Edit the values inside `:root {}` in `style.css`. Everything that uses `var(--accent-amber)` will update automatically.

### How UI Buttons Are Designed

Each button has a specific CSS class that defines its look:

#### `.btn-main` — Primary CTA (amber/orange)
Used for: "Sign In & Enter Quiz", "Next Question", "Submit Quiz"
```css
.btn-main {
  background: var(--accent-amber);   /* amber orange */
  color: #FFFFFF;
  box-shadow: 0 4px 14px rgba(217,119,6,0.25);
}
.btn-main:hover {
  background: var(--accent-terracotta); /* darkens to terracotta on hover */
  transform: translateY(-1px);          /* subtle lift effect */
}
```

#### `.btn-secondary` — Neutral Action (light gray)
Used for: "Previous", "Close Leaderboard", "Cancel"
```css
.btn-secondary {
  background: var(--bg-subtle); /* light warm gray */
  border: 1px solid var(--border-subtle);
}
```

#### `.btn-white` — White Ghost Button
Used for: the "Google Account" sign-in button
```css
.btn-white {
  background: var(--surface-white);
  border: 1px solid var(--border-subtle);
}
```

#### `.pill-outline-btn` — Pill-shaped Outline Button
Used for: the "Leaderboard" button in the header, "Edit Profile" button
```css
.pill-outline-btn {
  border-radius: var(--radius-full); /* fully rounded */
  border: 1px solid var(--border-subtle);
  background: var(--surface-white);
}
```

#### `.pill-primary-btn` — Filled Pill Button
Used for: the "Sign In" button in the header (when logged out)
```css
.pill-primary-btn {
  background: var(--ink-primary); /* dark slate black */
  color: white;
  border-radius: var(--radius-full);
}
```

#### `.text-link-btn` — Invisible Link-style Button
Used for: "Take quiz as Guest", "Sign in with a different account"
```css
.text-link-btn {
  background: none;
  text-decoration: underline; /* looks like a hyperlink */
}
```

#### `.header-icon-btn` — Circular Icon Button
Used for: the 🔔 sound toggle button
```css
.header-icon-btn {
  width: 36px; height: 36px;
  border-radius: var(--radius-full); /* circle */
}
```

#### `.header-icon-btn-sm` — Small Gear/Settings Button
Used for: the ⚙️ gear icon inside the student profile pill
```css
.header-icon-btn-sm:hover {
  transform: rotate(30deg); /* spins slightly on hover */
}
```

#### `.back-link-btn` — Exit/Back Button
Used for: the "← Exit" button during the quiz

### Option Tiles (Quiz Answers)
```css
.option-tile { border-radius: var(--radius-md); transition: all 0.2s; }
.option-tile:hover { border-color: var(--accent-amber); transform: translateY(-1px); }
.option-tile.selected {
  background: var(--accent-warm-tint); /* light amber tint */
  border-color: var(--accent-amber);
  box-shadow: 0 0 0 1px var(--accent-amber); /* double border glow */
}
```

### Important Utility Classes

| Class | What It Does |
|---|---|
| `.hidden` | `display: none !important` — hides any element |
| `.full-width` | `width: 100%` |
| `.view-panel` | Wrapper for main views with fade-in animation |
| `.modal-overlay` | Full-screen dark backdrop for modals |
| `.modal-card` | The white card that pops up inside a modal |

---

## 4. `public/script.js` — The Brain

This is the most important file. It runs the entire app. Here's how it's organized:

### Global State Variables (lines 4–14)
```js
let supabaseClient = null;         // the Supabase SDK instance
let currentUser = null;            // logged-in Supabase user object
let currentStudentProfile = null;  // their name/dept/year from the DB
let questions = [];                // loaded from /api/questions
let currentQuestionIndex = 0;      // which question you're on (0-24)
let studentAnswers = {};           // { q1: 'a', q3: 'c', ... }
let timerInterval = null;          // reference to the countdown setInterval
let elapsedSeconds = 0;            // how many seconds taken
let soundEnabled = true;           // is the chime sound on?
let pendingSubmissionData = null;  // holds score data while guest enters name
```

### Section 1 — Audio Synthesizer (lines 98–136)
The app plays tiny chime sounds using the **Web Audio API** (no audio files needed).
- `playChime(freq, type, duration)` — creates a tone with an oscillator
- `playSelectSound()` — plays when you click an answer (C5 note)
- `playNextSound()` — plays when you go to the next question (E5 note)
- `playSuccessFanfare()` — plays a 4-note rising fanfare when you score ≥70%

**To disable sounds:** The `soundEnabled` flag is toggled by the 🔔 button. To change the sound frequencies, edit lines 124–135.

### Section 2 — App Initialization (lines 139–163)
```js
async function initApp() {
  setupEventListeners();        // attach all button click handlers
  // fetch /api/config → create Supabase client
  // setup realtime leaderboard listener
  // fetch /api/questions → store in `questions[]`
}
initApp(); // called on line 1006 — runs everything when page loads
```

### Section 3 — Supabase Auth Management (lines 165–261)

#### `initSupabaseAuth()`
- Calls `supabaseClient.auth.getSession()` — checks if the browser already has a login session (stored in `localStorage` automatically by Supabase).
- Attaches `onAuthStateChange` — Supabase calls this whenever the user logs in or out, even across page refreshes.

#### `handleAuthChange(user)`
- If a user is detected → calls `fetchStudentProfile()` then `renderAuthenticatedUI()`
- If no user → calls `renderGuestUI()`

#### `fetchStudentProfile(user)`
- Queries the `student_profiles` table in Supabase for the user's name/department/year.
- If no profile row exists yet, creates one using the user's metadata.

#### `renderAuthenticatedUI()` / `renderGuestUI()`
- These functions toggle which elements are visible in the header and hero card by adding/removing the `hidden` class.

### Section 4 — Auth Actions (lines 263–401)

#### `handleLogin(e)` — Email/Password Sign In
1. Reads `#loginEmail` and `#loginPassword` inputs
2. Calls `supabaseClient.auth.signInWithPassword({ email, password })`
3. On success → calls `startQuiz()` directly
4. On error → shows message in `#authErrorMsg`

#### `handleRegister(e)` — Create New Account
1. Reads name, dept, year, email, password from the register form
2. Calls `supabaseClient.auth.signUp({ email, password, options: { data: { full_name, department, year } } })`
3. Also inserts a row into `student_profiles` table
4. On success → calls `startQuiz()`

#### `handleGoogleSignIn()` — Google OAuth
1. Calls `supabaseClient.auth.signInWithOAuth({ provider: 'google' })`
2. Redirects the user to Google → on return, Supabase handles the session
3. If Google auth isn't set up in Supabase → shows `#googleSetupModal` with instructions

#### `handleLogout()`
1. Calls `supabaseClient.auth.signOut()`
2. Calls `showFrontPage()` to navigate back home

### Section 5 — Quiz Navigation (lines 403–555)

#### `startQuiz()`
- Resets `currentQuestionIndex` and `studentAnswers`
- Shows `#quizView`, hides `#frontPageView`
- Calls `startTimer()` and `renderQuestion()`

#### `startTimer()` / `updateTimerUI()`
- Sets `remainingSeconds = 1500` (25 minutes)
- Every 1 second: decrements, updates `#quizTimer` display
- When `remainingSeconds <= 180` (3 min): adds `.timer-warning` class → timer pulses red
- When `remainingSeconds <= 0`: auto-submits the quiz

#### `renderQuestion()`
- Reads `questions[currentQuestionIndex]`
- Generates HTML for the question + 4 option tiles using template literals
- Injects it into `#questionStage`
- Attaches click listeners to each `.option-tile`
- When a tile is clicked: stores answer in `studentAnswers[qid]`, highlights tile as `.selected`, enables the Next button

#### `handleNextStep()` / `handlePrevStep()`
- Increment/decrement `currentQuestionIndex` and re-render
- On the last question, "Next" becomes "Submit" and calls `submitQuizEvaluation()`

### Section 6 — Submit & Results (lines 557–667)

#### `submitQuizEvaluation()`
1. Shows a loading spinner in `#questionStage`
2. `POST /api/submit` with `{ answers: studentAnswers }`
3. Server responds with score, percentage, and per-question results
4. If percentage ≥ 70%: fires confetti + fanfare
5. Calls `renderResultsView(resultData)`
6. If signed in: calls `recordScoreToDatabase()` automatically
7. If guest: shows `#guestCallsignModal` to collect name before saving

#### `renderResultsView(data)`
- Fills `#resultsContainer` with score, accuracy %, time taken, and rating ("Distinction" / "Passed" / "Review Needed")
- Renders per-question explanation cards (green left border = correct, red = incorrect)

### Section 7 — Leaderboard (lines 669–805)

#### `recordScoreToDatabase(data, name, department, year)`
- Inserts a row into the `quiz_scores` Supabase table
- Fields saved: `student_id`, `user_name`, `department`, `year`, `score`, `total_questions`, `percentage`, `time_taken_seconds`

#### `loadLeaderboard()`
- Queries the `student_leaderboard` **view** in Supabase (sorted by score desc, then by fastest time)
- Falls back to the raw `quiz_scores` table if the view has permission errors
- Renders a `<tr>` for each student with rank #, name, department, score
- Top 3 rows get special CSS classes: `.rank-top-1` (gold), `.rank-top-2` (silver), `.rank-top-3` (bronze)

#### `setupRealtimeLeaderboard()`
```js
supabaseClient.channel('student-leaderboard-live')
  .on('postgres_changes', { event: 'INSERT', table: 'quiz_scores' }, () => {
    if (!leaderboardModal.classList.contains('hidden')) {
      loadLeaderboard(); // auto-refresh when new score is inserted
    }
  })
  .subscribe();
```
This is Supabase Realtime — whenever any student submits a score anywhere in the world, the leaderboard refreshes automatically if it's open.

### Section 8 — Event Listeners (lines 807–1003)
`setupEventListeners()` wires every button to its handler. Here's a summary:

| Button/Element | Handler |
|---|---|
| Logo (top-left) | `showFrontPage()` |
| 🔔 Sound toggle | Flips `soundEnabled`, changes icon |
| "Leaderboard" header btn | `openLeaderboard()` |
| "Sign In" header btn | Shows front page + focuses email input |
| Login form submit | `handleLogin()` |
| Register form submit | `handleRegister()` |
| Google OAuth button | `handleGoogleSignIn()` |
| "Log out" button | `handleLogout()` |
| "Take quiz as Guest" | `startQuiz()` |
| "Enter Quiz" (auth'd) | `startQuiz()` |
| "← Exit" in quiz | Confirm dialog → `showFrontPage()` |
| ⚙️ gear / name in header | `openDashboard()` |
| "✏️ Edit Profile" button | `openDashboard()` |
| Edit profile form submit | Updates `student_profiles` in Supabase + `auth.updateUser()` |
| Guest record form submit | `recordScoreToDatabase()` → `openLeaderboard()` |

---

## 5. How Login Works — Step by Step

```
User opens http://localhost:3000
      ↓
initApp() runs
      ↓
Fetch /api/config → get Supabase URL + key
      ↓
Create supabaseClient = supabase.createClient(url, key)
      ↓
supabaseClient.auth.getSession()
      ↓
  [Has session?]
  YES → fetchStudentProfile() → renderAuthenticatedUI()
        Shows: welcome card + "Enter Quiz" button
  NO  → renderGuestUI()
        Shows: Sign In / Register form tabs
```

### Email Login Flow:
```
User fills email + password → clicks "Sign In & Enter Quiz"
      ↓
handleLogin() → supabase.auth.signInWithPassword()
      ↓
  [Success?]
  YES → onAuthStateChange fires → handleAuthChange(user)
        → renderAuthenticatedUI() + startQuiz()
  NO  → showError() → red message appears in form
```

### Registration Flow:
```
User fills name, dept, year, email, password → clicks "Create Student Account"
      ↓
handleRegister() → supabase.auth.signUp() [creates auth user]
                 → supabase.from('student_profiles').upsert() [creates profile row]
      ↓
startQuiz() immediately (no email confirmation needed by default)
```

### Guest Flow (name first — no account, no email):
```
Landing page opens on the "Guest Mode" tab
      ↓
Student types their name (department & year optional) → "Start Quiz as Guest"
      ↓
handleGuestStart() validates the name, saves it to localStorage
   (so the box is pre-filled next time) → guestProfile = { name, department, year }
      ↓
startQuiz() — the HUD shows "Name · Guest · CSE", the countdown uses the
              subject's own time limit (10 min for CS Basics)
      ↓
Last question → POST /api/submit { subject, answers } → marks calculated server-side
      ↓
publishScore() → POST /api/leaderboard { name, score, total, timeTaken, mode: 'guest' }
      ↓
Results screen shows: "🏆 Saved as <name> — rank #3 of 12 with 7/10 marks"
      ↓
"View Leaderboard" → the student's own row is highlighted with a "you" tag
```

---

## 6. Supabase — How It's Used

Supabase is the cloud database + authentication backend. Here's everything it does:

### Tables Used

#### `student_profiles`
Stores registered students' details.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Same as Supabase auth user ID |
| `email` | text | Student's email |
| `name` | text | Full name |
| `department` | text | ECE, CSE, etc. |
| `year` | text | 1st Year, 2nd Year, etc. |

**Modified in code at:** `fetchStudentProfile()` (read), `handleRegister()` (write), `editProfileForm` submit handler (update)

#### `quiz_scores`
Every quiz attempt (from signed-in users and guests) is recorded here.

| Column | Type | Description |
|---|---|---|
| `student_id` | UUID | null if guest |
| `user_name` | text | Display name |
| `department` | text | Student's dept |
| `year` | text | Year of study |
| `score` | int | Raw score (0–25) |
| `total_questions` | int | Always 25 |
| `percentage` | float | Score % |
| `time_taken_seconds` | int | Elapsed time |

**Written in code at:** `recordScoreToDatabase()` (lines 670–694)

#### `student_leaderboard` (a View, not a table)
A pre-configured SQL View in Supabase that returns the **best score per student** (de-duplicates multiple attempts). The code queries this first, falling back to `quiz_scores` if it's unavailable.

### Supabase Auth Used For:
- `signInWithPassword()` — email/password login
- `signUp()` — registration
- `signInWithOAuth({ provider: 'google' })` — Google login
- `signOut()` — logout
- `getSession()` — check existing session on page load
- `onAuthStateChange()` — reactive listener
- `updateUser()` — update name/dept/year in auth metadata

### Supabase Realtime Used For:
- Listening to `INSERT` events on `quiz_scores` table
- Automatically refreshing the leaderboard when any student submits

### Where to Find Supabase Credentials
```js
// server.js, lines 11–14
const SUPABASE_CONFIG = {
  url: 'https://mbnwtelvfzjofeeviutg.supabase.co',
  anonKey: 'eyJ...'
};
```
**To switch to a different Supabase project:** Replace `url` and `anonKey` here.

---

## 7. Where to Change Specific Things

| What You Want to Change | File | Location |
|---|---|---|
| Add / edit / delete a question | `server.js` | `QUESTIONS` array, lines 21–322 |
| Change quiz time limit | `script.js` | Line 95: `const QUIZ_TIME_LIMIT_SECONDS = 25 * 60;` |
| Change accent color | `style.css` | `--accent-amber` and `--accent-terracotta` in `:root` |
| Change fonts | `index.html` + `style.css` | Google Fonts link (line 13) + `--font-sans` / `--font-serif` variables |
| Change app title | `index.html` | `<title>` tag (line 8) + `.site-title` div (line 35) |
| Add a new department option | `index.html` | `#regDept` select (line 162), `#editProfileDept` (line 406), `#guestStudentDept` (line 462) |
| Change score thresholds (Pass/Distinction) | `script.js` | Lines 643–644 in `renderResultsView()` |
| Change Supabase project | `server.js` | Lines 12–13 |
| Enable confetti threshold | `script.js` | Line 576: `if (resultData.percentage >= 70 && window.confetti)` |
| Change warning timer threshold | `script.js` | Line 450: `if (remainingSeconds <= 180 ...)` |

---

## 8. CSS Classes Reference

### Layout & Structure
| Class | Purpose |
|---|---|
| `.page-container` | Centers content, max 780px wide |
| `.view-panel` | Animated wrapper for each main view |
| `.hero-card` | Main white card on landing page |
| `.entry-card` | The auth form card inside hero |
| `.modal-overlay` | Full-screen dark backdrop |
| `.modal-card` | White dialog box inside modal |
| `.modal-card-sm` | Smaller dialog (max 440px) |

### Authentication Forms
| Class | Purpose |
|---|---|
| `.auth-tabs` | Tab switcher (Sign In / Register) |
| `.auth-tab-btn` | Individual tab button |
| `.auth-tab-btn.active` | Selected tab (white bg) |
| `.auth-form-body` | Vertical flex form container |
| `.form-group` | Label + input pair |
| `.input-field` | Styled text/email/password input |
| `.select-field` | Styled dropdown select |
| `.form-row-2` | Two-column form grid |
| `.form-alert` | Red error message box |
| `.form-actions-stack` | Vertical stack of action buttons |
| `.divider-text` | "OR CONTINUE WITH" divider |

### Header
| Class | Purpose |
|---|---|
| `.site-header` | Sticky blurred top bar |
| `.header-inner` | Inner flex container |
| `.logo-area` | Clickable logo + title group |
| `.logo-badge` | Square icon box |
| `.header-actions` | Right side button group |
| `.header-icon-btn` | Circular icon button (🔔) |
| `.header-icon-btn-sm` | Small circular gear button |
| `.pill-outline-btn` | Pill-shaped outlined button |
| `.pill-primary-btn` | Pill-shaped filled button |
| `.student-pill` | Logged-in user info strip |
| `.student-avatar` | Amber circle with name initial |
| `.text-logout-btn` | Subtle "Log out" text button |

### Quiz Session
| Class | Purpose |
|---|---|
| `.quiz-tracker-card` | Top bar showing question # and timer |
| `.progress-track-wrapper` | Gray progress bar track |
| `.progress-fill-line` | Amber gradient fill (grows each question) |
| `.question-stage-card` | White card containing question + options |
| `.quiz-timer-bubble` | Mono font timer display |
| `.timer-warning` | Red pulsing timer state (last 3 min) |
| `.option-tile` | Clickable answer choice card |
| `.option-tile.selected` | Amber highlighted answer |
| `.option-key-badge` | A/B/C/D letter badge |
| `.quiz-nav-row` | Previous / Next buttons row |

### Results
| Class | Purpose |
|---|---|
| `.results-card` | Main results white card |
| `.score-big-num` | Large serif score number |
| `.score-meta-grid` | 3-column accuracy/time/rating grid |
| `.explanation-card` | Per-question review card |
| `.explanation-card.correct` | Green left border |
| `.explanation-card.incorrect` | Red left border |

### Leaderboard Table
| Class | Purpose |
|---|---|
| `.academic-table` | Clean table with sticky header |
| `.rank-top-1` | Gold highlight for 1st place |
| `.rank-top-2` | Silver highlight for 2nd place |
| `.rank-top-3` | Bronze/orange highlight for 3rd |
| `.score-cell` | Right-aligned score in terracotta |
| `.dept-tag-cell` | Department pill tag |
| `.table-loading-spinner` | CSS-only spinning ring |

### Utility
| Class | Purpose |
|---|---|
| `.hidden` | Completely hides element (`display: none !important`) |
| `.full-width` | `width: 100%` |
| `.btn` | Base button styles |
| `.btn-main` | Amber primary button |
| `.btn-secondary` | Gray secondary button |
| `.btn-white` | White/outlined button |
| `.btn-lg` | Larger padding variant |
| `.text-link-btn` | Underlined text button |

---

## 9. Data Flow Diagram

```
Browser loads  → GET /                       → index.html + style.css + script.js
initApp()      → GET /api/quizzes            → subject cards + leaderboard tabs
               → GET /api/questions?subject= → questions for the selected subject (no answers)
               → GET /api/config + Supabase  → optional: student accounts

[Guest types a name / student signs in, clicks Start]
   → startQuiz() → renderQuestion() → option clicks fill studentAnswers{}

[Last question]
   → POST /api/submit { subject, answers }
   → server grades against the key → { score, total, percentage, results[] }
   → renderResultsView()

[Immediately after grading]
   → POST /api/leaderboard { subject, name, department, score, total, timeTaken, mode }
   → leaderboard-store writes data/leaderboard.json → replies { rank, players, isBest }
   → results screen shows the rank banner
   → (signed-in students only) supabase.from('quiz_scores').insert() as a cloud mirror

[Leaderboard opens]
   → GET /api/leaderboard?subject=… → ranked table, own row highlighted
   → refreshes every 15 s while open, plus instantly on a Supabase realtime INSERT
```
