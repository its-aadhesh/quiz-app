// Applications of Digital Electronics Quiz & Leaderboard Controller
// Human-crafted light theme with Student Accounts & Realtime Sync

let supabaseClient = null;
let currentUser = null;
let currentStudentProfile = null;
let questions = [];
let currentQuestionIndex = 0;
let studentAnswers = {};
let timerInterval = null;
let elapsedSeconds = 0;
let soundEnabled = true;
let audioContext = null;
let pendingSubmissionData = null;

// DOM View Panels
const frontPageView = document.getElementById('frontPageView');
const quizView = document.getElementById('quizView');
const resultsView = document.getElementById('resultsView');

// Header Elements
const homeLogoBtn = document.getElementById('homeLogoBtn');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const soundIcon = document.getElementById('soundIcon');
const viewLeaderboardBtn = document.getElementById('viewLeaderboardBtn');
const headerSignInBtn = document.getElementById('headerSignInBtn');
const studentProfileBadge = document.getElementById('studentProfileBadge');
const headerStudentName = document.getElementById('headerStudentName');
const headerStudentDept = document.getElementById('headerStudentDept');
const studentAvatarInitial = document.getElementById('studentAvatarInitial');
const logoutBtn = document.getElementById('logoutBtn');

// Front Page Auth & Entry Elements
const guestEntryBox = document.getElementById('guestEntryBox');
const authenticatedEntryBox = document.getElementById('authenticatedEntryBox');
const tabLoginBtn = document.getElementById('tabLoginBtn');
const tabRegisterBtn = document.getElementById('tabRegisterBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const regName = document.getElementById('regName');
const regDept = document.getElementById('regDept');
const regEmail = document.getElementById('regEmail');
const regPassword = document.getElementById('regPassword');
const authErrorMsg = document.getElementById('authErrorMsg');
const regErrorMsg = document.getElementById('regErrorMsg');
const googleOAuthBtn = document.getElementById('googleOAuthBtn');
const guestEnterBtn = document.getElementById('guestEnterBtn');
const welcomeStudentName = document.getElementById('welcomeStudentName');
const welcomeStudentDept = document.getElementById('welcomeStudentDept');
const welcomeAvatar = document.getElementById('welcomeAvatar');
const authenticatedEnterQuizBtn = document.getElementById('authenticatedEnterQuizBtn');
const switchAccountBtn = document.getElementById('switchAccountBtn');

// Quiz View Elements
const exitQuizPromptBtn = document.getElementById('exitQuizPromptBtn');
const currentQNum = document.getElementById('currentQNum');
const totalQNum = document.getElementById('totalQNum');
const quizTimer = document.getElementById('quizTimer');
const quizPlayerName = document.getElementById('quizPlayerName');
const quizPlayerDept = document.getElementById('quizPlayerDept');
const progressFillLine = document.getElementById('progressFillLine');
const questionStage = document.getElementById('questionStage');
const resultsContainer = document.getElementById('resultsContainer');

// Leaderboard Modal Elements
const leaderboardModal = document.getElementById('leaderboardModal');
const closeLeaderboardBtn = document.getElementById('closeLeaderboardBtn');
const closeLeaderboardActionBtn = document.getElementById('closeLeaderboardActionBtn');
const leaderboardBody = document.getElementById('leaderboardBody');

// Guest Submission Modal
const guestCallsignModal = document.getElementById('guestCallsignModal');
const closeGuestModalBtn = document.getElementById('closeGuestModalBtn');
const guestRecordForm = document.getElementById('guestRecordForm');
const guestStudentName = document.getElementById('guestStudentName');
const guestStudentDept = document.getElementById('guestStudentDept');

// 1. Audio Synthesizer (Natural subtle chimes)
function playChime(freq = 440, type = 'sine', duration = 0.12) {
  if (!soundEnabled) return;
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioContext.currentTime);
    gain.gain.setValueAtTime(0.06, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + duration);
  } catch (e) {
    // Web audio blocked before interaction
  }
}

function playSelectSound() {
  playChime(523.25, 'triangle', 0.08); // C5
}

function playNextSound() {
  playChime(659.25, 'sine', 0.1); // E5
}

function playSuccessFanfare() {
  if (!soundEnabled) return;
  [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
    setTimeout(() => playChime(freq, 'sine', 0.22), i * 90);
  });
}

// 2. App Initialization
async function initApp() {
  setupEventListeners();

  // Load server config for Supabase
  try {
    const configRes = await fetch('/api/config');
    const config = await configRes.json();
    if (window.supabase && config.url && config.anonKey) {
      supabaseClient = window.supabase.createClient(config.url, config.anonKey);
      await initSupabaseAuth();
      setupRealtimeLeaderboard();
    }
  } catch (err) {
    console.warn('Could not initialize Supabase:', err);
  }

  // Load questions
  try {
    const qRes = await fetch('/api/questions');
    questions = await qRes.json();
    totalQNum.textContent = questions.length;
  } catch (err) {
    console.error('Failed to load questions:', err);
  }
}

// 3. Supabase Auth Management
async function initSupabaseAuth() {
  if (!supabaseClient) return;

  const { data: { session } } = await supabaseClient.auth.getSession();
  await handleAuthChange(session?.user || null);

  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    await handleAuthChange(session?.user || null);
  });
}

async function handleAuthChange(user) {
  currentUser = user;
  if (user) {
    // Fetch student profile or metadata
    await fetchStudentProfile(user);
    renderAuthenticatedUI();
  } else {
    currentStudentProfile = null;
    renderGuestUI();
  }
}

async function fetchStudentProfile(user) {
  if (!supabaseClient || !user) return;
  
  try {
    const { data, error } = await supabaseClient
      .from('student_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      currentStudentProfile = data;
    } else {
      // Fallback to user metadata
      const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Student';
      const department = user.user_metadata?.department || 'ECE';
      currentStudentProfile = {
        id: user.id,
        name: name,
        department: department,
        email: user.email
      };

      // Ensure profile row exists
      await supabaseClient.from('student_profiles').upsert([{
        id: user.id,
        email: user.email,
        name: name,
        department: department
      }]);
    }
  } catch (err) {
    console.warn('Profile fetch warning:', err);
    currentStudentProfile = {
      id: user.id,
      name: user.user_metadata?.full_name || 'Student',
      department: user.user_metadata?.department || 'General',
      email: user.email
    };
  }
}

function renderAuthenticatedUI() {
  const name = currentStudentProfile?.name || 'Student';
  const dept = currentStudentProfile?.department || 'ECE';
  const initial = name.charAt(0).toUpperCase() || 'S';

  // Header
  headerSignInBtn.classList.add('hidden');
  studentProfileBadge.classList.remove('hidden');
  headerStudentName.textContent = name;
  headerStudentDept.textContent = dept;
  studentAvatarInitial.textContent = initial;

  // Front page entry
  guestEntryBox.classList.add('hidden');
  authenticatedEntryBox.classList.remove('hidden');
  welcomeStudentName.textContent = name;
  welcomeStudentDept.textContent = `Department: ${dept}`;
  welcomeAvatar.textContent = initial;
}

function renderGuestUI() {
  headerSignInBtn.classList.remove('hidden');
  studentProfileBadge.classList.add('hidden');
  guestEntryBox.classList.remove('hidden');
  authenticatedEntryBox.classList.add('hidden');
}

// 4. Auth Actions: Email / Password / Google
async function handleLogin(e) {
  e.preventDefault();
  authErrorMsg.classList.add('hidden');
  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!supabaseClient) {
    showError(authErrorMsg, 'Backend database is connecting. Please wait a moment.');
    return;
  }

  const submitBtn = loginForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span>Verifying credentials…</span>';

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  submitBtn.disabled = false;
  submitBtn.innerHTML = `<span>Sign In & Enter Quiz</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;

  if (error) {
    showError(authErrorMsg, error.message || 'Invalid email or password.');
  } else {
    // Successfully signed in, start quiz
    startQuiz();
  }
}

async function handleRegister(e) {
  e.preventDefault();
  regErrorMsg.classList.add('hidden');
  const name = regName.value.trim();
  const department = regDept.value;
  const email = regEmail.value.trim();
  const password = regPassword.value;

  if (!supabaseClient) {
    showError(regErrorMsg, 'Database not ready. Please try again in a moment.');
    return;
  }

  const submitBtn = registerForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span>Creating Student Account…</span>';

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        department: department
      }
    }
  });

  submitBtn.disabled = false;
  submitBtn.innerHTML = `<span>Create Student Account & Enter Quiz</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;

  if (error) {
    showError(regErrorMsg, error.message || 'Registration failed.');
    return;
  }

  if (data.user) {
    // Insert student profile row
    await supabaseClient.from('student_profiles').upsert([{
      id: data.user.id,
      email: data.user.email,
      name: name,
      department: department
    }]);

    currentStudentProfile = {
      id: data.user.id,
      email: data.user.email,
      name: name,
      department: department
    };

    startQuiz();
  }
}

async function handleGoogleSignIn() {
  if (!supabaseClient) {
    alert('Database client is loading, please try again in a moment.');
    return;
  }

  try {
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      console.warn('Google OAuth error:', error);
      const googleSetupModal = document.getElementById('googleSetupModal');
      if (googleSetupModal) {
        googleSetupModal.classList.remove('hidden');
      } else {
        showError(authErrorMsg, `Google Sign-In is not enabled yet in your Supabase Dashboard (${error.message}). Please create a student account with your email & password above!`);
      }
    }
  } catch (err) {
    console.error('Google OAuth unexpected error:', err);
    const googleSetupModal = document.getElementById('googleSetupModal');
    if (googleSetupModal) {
      googleSetupModal.classList.remove('hidden');
    }
  }
}

async function handleLogout() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  showFrontPage();
}

function showError(el, message) {
  el.textContent = message;
  el.classList.remove('hidden');
}

// 5. Quiz Navigation & Engine
function startQuiz() {
  if (questions.length === 0) {
    alert('Quiz questions are loading, please try again in a second.');
    return;
  }

  currentQuestionIndex = 0;
  studentAnswers = {};
  elapsedSeconds = 0;

  // Set student info in quiz HUD
  const name = currentStudentProfile?.name || 'Guest Student';
  const dept = currentStudentProfile?.department || 'General';
  quizPlayerName.textContent = name;
  quizPlayerDept.textContent = dept;

  // Switch view
  frontPageView.classList.add('hidden');
  resultsView.classList.add('hidden');
  quizView.classList.remove('hidden');

  startTimer();
  renderQuestion();
}

function showFrontPage() {
  stopTimer();
  quizView.classList.add('hidden');
  resultsView.classList.add('hidden');
  frontPageView.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function startTimer() {
  stopTimer();
  elapsedSeconds = 0;
  updateTimerUI();
  timerInterval = setInterval(() => {
    elapsedSeconds++;
    updateTimerUI();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
}

function updateTimerUI() {
  const m = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
  const s = (elapsedSeconds % 60).toString().padStart(2, '0');
  quizTimer.textContent = `${m}:${s}`;
}

function renderQuestion() {
  const q = questions[currentQuestionIndex];
  const chosen = studentAnswers[q.id];

  currentQNum.textContent = currentQuestionIndex + 1;
  const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100;
  progressFillLine.style.width = `${progressPercent}%`;

  const optionLetters = ['A', 'B', 'C', 'D'];
  const optionsHtml = q.options.map((opt, idx) => `
    <div class="option-tile ${chosen === opt.id ? 'selected' : ''}" data-qid="${q.id}" data-optid="${opt.id}">
      <span class="option-key-badge">${optionLetters[idx] || opt.id.toUpperCase()}</span>
      <span class="option-content-text">${opt.text}</span>
    </div>
  `).join('');

  questionStage.innerHTML = `
    <div class="q-topic-header">
      <span class="q-badge">Digital Electronics Application</span>
      <span class="q-marks-indicator">1 Mark</span>
    </div>

    <h2 class="question-text">${q.prompt}</h2>

    <div class="options-stack" id="optionsStack">
      ${optionsHtml}
    </div>

    <div class="quiz-nav-row">
      <button class="btn btn-secondary" id="quizPrevBtn" ${currentQuestionIndex === 0 ? 'disabled style="opacity:0.4;"' : ''}>
        ← Previous
      </button>

      <button class="btn btn-main" id="quizNextBtn" ${!chosen ? 'disabled style="opacity:0.45; cursor:not-allowed;"' : ''}>
        ${currentQuestionIndex === questions.length - 1 ? 'Complete & Submit Quiz ⚡' : 'Next Question →'}
      </button>
    </div>
  `;

  // Attach option click listeners
  const tiles = questionStage.querySelectorAll('.option-tile');
  tiles.forEach(tile => {
    tile.addEventListener('click', () => {
      playSelectSound();
      const qid = tile.dataset.qid;
      const optid = tile.dataset.optid;
      studentAnswers[qid] = optid;

      tiles.forEach(t => t.classList.remove('selected'));
      tile.classList.add('selected');

      const nextBtn = document.getElementById('quizNextBtn');
      if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.style.opacity = '1';
        nextBtn.style.cursor = 'pointer';
      }
    });
  });

  document.getElementById('quizNextBtn').addEventListener('click', handleNextStep);
  const prevBtn = document.getElementById('quizPrevBtn');
  if (prevBtn) prevBtn.addEventListener('click', handlePrevStep);
}

function handlePrevStep() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderQuestion();
  }
}

function handleNextStep() {
  playNextSound();
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    renderQuestion();
  } else {
    submitQuizEvaluation();
  }
}

// 6. Submit Evaluation & Results
async function submitQuizEvaluation() {
  stopTimer();
  questionStage.innerHTML = `
    <div style="text-align:center; padding: 48px 16px;">
      <div class="table-loading-spinner"></div>
      <p style="color: var(--ink-secondary); font-size: 1rem;">Evaluating circuit logic marks against answer keys…</p>
    </div>
  `;

  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: studentAnswers })
    });
    const resultData = await res.json();
    resultData.timeTaken = elapsedSeconds;

    if (resultData.percentage >= 70 && window.confetti) {
      window.confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
      playSuccessFanfare();
    }

    renderResultsView(resultData);

    // If student is signed in, save directly to database
    if (currentUser) {
      await recordScoreToDatabase(resultData, currentStudentProfile.name, currentStudentProfile.department);
    } else {
      // Prompt guest student for name & department
      pendingSubmissionData = resultData;
      guestCallsignModal.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Quiz submission error:', err);
    alert('Error submitting quiz. Please check connection and try again.');
  }
}

function renderResultsView(data) {
  quizView.classList.add('hidden');
  resultsView.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const explanationCards = data.results.map((r, idx) => {
    const q = questions.find(item => item.id === r.id);
    const chosenOpt = q.options.find(o => o.id === r.chosen);
    const correctOpt = q.options.find(o => o.id === r.correct);
    return `
      <div class="explanation-card ${r.isCorrect ? 'correct' : 'incorrect'}">
        <div class="review-q-prompt">Q${idx + 1}. ${q.prompt}</div>
        <div class="review-meta">
          <div><strong>Your Answer:</strong> ${chosenOpt ? chosenOpt.text : 'None'} ${r.isCorrect ? '✅' : '❌'}</div>
          ${!r.isCorrect ? `<div style="color: var(--state-danger);"><strong>Correct Answer:</strong> ${correctOpt.text}</div>` : ''}
          <div style="margin-top: 4px; color: var(--ink-secondary); font-style: italic;">${r.explanation}</div>
        </div>
      </div>
    `;
  }).join('');

  resultsContainer.innerHTML = `
    <span class="result-badge-top">Quiz Evaluation Complete</span>

    <div class="score-display-box">
      <div class="score-big-num">${data.score}</div>
      <div class="score-max-sub">out of ${data.total} Marks</div>
    </div>

    <div class="score-meta-grid">
      <div class="stat-item">
        <span class="stat-label">Accuracy</span>
        <span class="stat-data">${data.percentage}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Time Taken</span>
        <span class="stat-data">${Math.floor(data.timeTaken / 60)}m ${data.timeTaken % 60}s</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Rating</span>
        <span class="stat-data" style="color: ${data.percentage >= 70 ? 'var(--state-success)' : 'var(--accent-terracotta)'}">
          ${data.percentage >= 80 ? 'Distinction' : data.percentage >= 50 ? 'Passed' : 'Review Needed'}
        </span>
      </div>
    </div>

    <div class="results-cta-stack">
      <button id="viewLeaderboardFromResultsBtn" class="btn btn-main full-width">
        🏆 View Student Leaderboard
      </button>
      <button id="retakeQuizBtn" class="btn btn-secondary full-width">
        🔄 Retake Quiz
      </button>
    </div>

    <div class="explanation-accordion-wrap">
      <h3 class="accordion-header-title">Detailed Solutions & Explanations</h3>
      <div class="explanation-list">
        ${explanationCards}
      </div>
    </div>
  `;

  document.getElementById('retakeQuizBtn').addEventListener('click', startQuiz);
  document.getElementById('viewLeaderboardFromResultsBtn').addEventListener('click', openLeaderboard);
}

// 7. Record Score & Leaderboard
async function recordScoreToDatabase(data, name, department) {
  if (!supabaseClient) return;

  try {
    const { error } = await supabaseClient
      .from('quiz_scores')
      .insert([{
        student_id: currentUser?.id || null,
        user_name: name || 'Student',
        department: department || 'General',
        user_email: currentUser?.email || null,
        score: data.score,
        total_questions: data.total,
        percentage: data.percentage,
        time_taken_seconds: data.timeTaken || 0
      }]);

    if (error) {
      console.warn('Score recording notice:', error.message);
    }
  } catch (err) {
    console.error('Error recording score:', err);
  }
}

async function loadLeaderboard() {
  if (!supabaseClient) {
    leaderboardBody.innerHTML = `<tr><td colspan="4" class="table-empty-cell">Database not connected</td></tr>`;
    return;
  }

  leaderboardBody.innerHTML = `
    <tr>
      <td colspan="4" class="table-empty-cell">
        <div class="table-loading-spinner"></div>
        Fetching latest academic standings…
      </td>
    </tr>
  `;

  try {
    // Query the student_leaderboard view or quiz_scores table
    const { data, error } = await supabaseClient
      .from('student_leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .order('best_time_seconds', { ascending: true })
      .limit(50);

    if (error) throw error;

    if (!data || data.length === 0) {
      leaderboardBody.innerHTML = `<tr><td colspan="4" class="table-empty-cell">No student scores recorded yet. Complete the quiz to be the first!</td></tr>`;
      return;
    }

    leaderboardBody.innerHTML = data.map((row, index) => {
      const rank = index + 1;
      const rankClass = rank === 1 ? 'rank-top-1' : rank === 2 ? 'rank-top-2' : rank === 3 ? 'rank-top-3' : '';
      return `
        <tr class="${rankClass}">
          <td class="rank-cell">#${rank}</td>
          <td class="name-cell">${escapeHtml(row.name)}</td>
          <td><span class="dept-tag-cell">${escapeHtml(row.department || 'General')}</span></td>
          <td class="score-cell">${row.score} / ${row.total_questions || 25}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.warn('View fallback to raw quiz_scores table:', err);
    loadLeaderboardFallback();
  }
}

// Fallback direct table query if view permissions are restricted
async function loadLeaderboardFallback() {
  try {
    const { data, error } = await supabaseClient
      .from('quiz_scores')
      .select('user_name, department, score, total_questions, time_taken_seconds')
      .order('score', { ascending: false })
      .order('time_taken_seconds', { ascending: true })
      .limit(50);

    if (error || !data || data.length === 0) {
      leaderboardBody.innerHTML = `<tr><td colspan="4" class="table-empty-cell">No rankings recorded yet.</td></tr>`;
      return;
    }

    leaderboardBody.innerHTML = data.map((row, idx) => {
      const rank = idx + 1;
      const rankClass = rank === 1 ? 'rank-top-1' : rank === 2 ? 'rank-top-2' : rank === 3 ? 'rank-top-3' : '';
      return `
        <tr class="${rankClass}">
          <td class="rank-cell">#${rank}</td>
          <td class="name-cell">${escapeHtml(row.user_name)}</td>
          <td><span class="dept-tag-cell">${escapeHtml(row.department || 'General')}</span></td>
          <td class="score-cell">${row.score} / ${row.total_questions || 25}</td>
        </tr>
      `;
    }).join('');
  } catch (e) {
    leaderboardBody.innerHTML = `<tr><td colspan="4" class="table-empty-cell">Error loading leaderboard</td></tr>`;
  }
}

function setupRealtimeLeaderboard() {
  if (!supabaseClient) return;

  supabaseClient
    .channel('student-leaderboard-live')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quiz_scores' }, () => {
      // When any student submits a score, auto-refresh leaderboard if visible
      if (!leaderboardModal.classList.contains('hidden')) {
        loadLeaderboard();
      }
    })
    .subscribe();
}

function openLeaderboard() {
  leaderboardModal.classList.remove('hidden');
  loadLeaderboard();
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[m]);
}

// 8. Event Listeners
function setupEventListeners() {
  homeLogoBtn.addEventListener('click', showFrontPage);

  soundToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundIcon.textContent = soundEnabled ? '🔔' : '🔕';
  });

  viewLeaderboardBtn.addEventListener('click', openLeaderboard);
  closeLeaderboardBtn.addEventListener('click', () => leaderboardModal.classList.add('hidden'));
  closeLeaderboardActionBtn.addEventListener('click', () => leaderboardModal.classList.add('hidden'));
  leaderboardModal.addEventListener('click', (e) => {
    if (e.target === leaderboardModal) leaderboardModal.classList.add('hidden');
  });

  // Auth tabs
  tabLoginBtn.addEventListener('click', () => {
    tabLoginBtn.classList.add('active');
    tabRegisterBtn.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    authErrorMsg.classList.add('hidden');
  });

  tabRegisterBtn.addEventListener('click', () => {
    tabRegisterBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    regErrorMsg.classList.add('hidden');
  });

  headerSignInBtn.addEventListener('click', () => {
    showFrontPage();
    tabLoginBtn.click();
    loginEmail.focus();
  });

  loginForm.addEventListener('submit', handleLogin);
  registerForm.addEventListener('submit', handleRegister);
  googleOAuthBtn.addEventListener('click', handleGoogleSignIn);
  logoutBtn.addEventListener('click', handleLogout);

  guestEnterBtn.addEventListener('click', startQuiz);
  authenticatedEnterQuizBtn.addEventListener('click', startQuiz);

  switchAccountBtn.addEventListener('click', handleLogout);

  exitQuizPromptBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to exit the quiz? Your current progress will be lost.')) {
      showFrontPage();
    }
  });

  // Guest callsign recording
  guestRecordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = guestStudentName.value.trim() || 'Guest Student';
    const dept = guestStudentDept.value;
    if (pendingSubmissionData) {
      await recordScoreToDatabase(pendingSubmissionData, name, dept);
      pendingSubmissionData = null;
    }
    guestCallsignModal.classList.add('hidden');
    openLeaderboard();
  });

  closeGuestModalBtn.addEventListener('click', () => {
    guestCallsignModal.classList.add('hidden');
  });

  // Google setup guide modal listeners
  const googleSetupModal = document.getElementById('googleSetupModal');
  const closeGoogleSetupBtn = document.getElementById('closeGoogleSetupBtn');
  const switchToEmailRegisterBtn = document.getElementById('switchToEmailRegisterBtn');
  const enterAsGuestFromModalBtn = document.getElementById('enterAsGuestFromModalBtn');

  if (closeGoogleSetupBtn) {
    closeGoogleSetupBtn.addEventListener('click', () => {
      googleSetupModal.classList.add('hidden');
    });
  }

  if (switchToEmailRegisterBtn) {
    switchToEmailRegisterBtn.addEventListener('click', () => {
      googleSetupModal.classList.add('hidden');
      tabRegisterBtn.click();
      regName.focus();
    });
  }

  if (enterAsGuestFromModalBtn) {
    enterAsGuestFromModalBtn.addEventListener('click', () => {
      googleSetupModal.classList.add('hidden');
      startQuiz();
    });
  }
}

// Start application
initApp();
