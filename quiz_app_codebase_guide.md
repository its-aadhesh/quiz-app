# 📚 Quiz App — Complete Codebase Guide

> A deep-dive into every file, every UI button, every CSS class, how login works, and how Supabase powers the backend.

---

## 🗂️ Project Structure

```
quiz-app/
├── server.js              ← Node.js backend (Express server)
├── package.json           ← Project metadata & dependencies
├── public/
│   ├── index.html         ← All the HTML markup (views + modals)
│   ├── style.css          ← All styling (design system + components)
│   └── script.js          ← All frontend logic (auth, quiz, leaderboard)
```

There are **no frameworks** — this is pure vanilla HTML + CSS + JavaScript with a Node/Express backend.

---

## 1. `server.js` — The Backend

**What it does:** Acts as a simple web server. It has three jobs:
1. **Serve the frontend files** (HTML, CSS, JS) from the `public/` folder
2. **Expose Supabase credentials** via a config API
3. **Store questions and grade answers** server-side (so users can't cheat by inspecting the page)

### Key Sections

#### Server Setup (lines 1–8)
```js
const express = require('express');
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
```
- `express.json()` lets the server read JSON data sent from the browser.
- `express.static('public')` automatically serves `index.html`, `style.css`, and `script.js` when you visit `http://localhost:3000`.

#### `GET /api/config` (lines 11–18)
```js
const SUPABASE_CONFIG = { url: '...', anonKey: '...' };
app.get('/api/config', (req, res) => { res.json(SUPABASE_CONFIG); });
```
- **Why?** The Supabase URL and anonymous key are stored server-side, then fetched by the browser at startup. This keeps them out of the raw HTML source.
- **To change your Supabase project:** Edit the `url` and `anonKey` values on lines 12–13.

#### `GET /api/questions` (lines 325–328)
```js
const publicQuestions = QUESTIONS.map(({ id, prompt, options }) => ...);
```
- Sends questions **without** the `correct` answer field. This means a student can't open browser DevTools and see the answers.

#### `POST /api/submit` (lines 331–352)
- Receives the student's answers as `{ "answers": { "q1": "a", "q2": "c", ... } }`
- Compares each answer against the stored `correct` field server-side
- Returns: `{ score, total, percentage, results[] }` with explanations

#### The 25 Questions (lines 21–322)
Each question object looks like:
```js
{
  id: 'q1',
  prompt: 'Which component is considered...',
  options: [
    { id: 'a', text: 'Logic gates (AND, OR, NOT, NAND)' },
    { id: 'b', text: 'Capacitor discharge banks' },
    ...
  ],
  correct: 'a',               // ← ONLY on the server, never sent to browser
  explanation: 'Logic gates implement Boolean algebra...'
}
```
**To add/change a question:** Edit the `QUESTIONS` array in `server.js` (lines 21–322). Restart the server after saving.

---

## 2. `public/index.html` — The Markup

The HTML is divided into **3 main views** and **4 modals**. They are all loaded at once; JavaScript shows/hides them by toggling the `hidden` CSS class.

### The 3 Views

#### View 1: Front / Landing Page (`#frontPageView`)
The home screen. It has two sub-states:
- **`#guestEntryBox`** — shown when no one is logged in (has the Sign In / Register tabs)
- **`#authenticatedEntryBox`** — shown when a student is logged in (has their name and "Enter Quiz" button)

#### View 2: Active Quiz (`#quizView`)
Shows one question at a time. The question card (`#questionStage`) is **dynamically injected** by JavaScript — it is empty in the HTML.

#### View 3: Results Screen (`#resultsView`)
Also dynamically filled by JavaScript after submission. Contains score, accuracy, time, and answer explanations.

### The 4 Modals

| Modal ID | Purpose |
|---|---|
| `#leaderboardModal` | Shows the ranked student leaderboard table |
| `#googleSetupModal` | Guide shown when Google OAuth isn't configured |
| `#userDashboardModal` | Edit profile form (name, department, year) |
| `#guestCallsignModal` | Name entry for guests after they finish the quiz |

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

### Guest Flow:
```
User clicks "Take quiz as Guest"
      ↓
startQuiz() (no auth at all, currentUser = null)
      ↓
Quiz runs normally...
      ↓
On submit: pendingSubmissionData stored → #guestCallsignModal shown
      ↓
Guest enters name + dept → recordScoreToDatabase() with null student_id
      ↓
openLeaderboard()
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
Browser loads → GET /          → server sends index.html + style.css + script.js
initApp() runs → GET /api/config  → server sends Supabase URL + key
               → GET /api/questions → server sends 25 questions (no answers)
               → Supabase auth check → user state determined

[Student clicks "Enter Quiz"]
   → startQuiz() → renderQuestion() → student clicks options → studentAnswers{}

[Student clicks "Submit"]
   → POST /api/submit { answers }
   → server grades answers → returns { score, results, explanation }
   → renderResultsView()

[If signed in]
   → supabase.from('quiz_scores').insert() → score saved to cloud

[Leaderboard opens]
   → supabase.from('student_leaderboard').select() → renders table

[Another student submits]
   → Supabase Realtime fires → loadLeaderboard() auto-called → table refreshes
```
