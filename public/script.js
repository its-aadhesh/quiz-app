// Quzzo — multi-subject quiz controller
// Subjects come from /api/quizzes, grading from /api/submit and every finished
// attempt is posted to /api/leaderboard so marks show up instantly.
// Supabase (when reachable) still powers student accounts and mirrors scores.

let supabaseClient = null;
let currentUser = null;
let currentStudentProfile = null;

// Quiz state
let quizCatalogue = [];
let selectedSubject = 'csbasics';
let activeQuiz = null;              // metadata of the subject being played
let questions = [];
let currentQuestionIndex = 0;
let studentAnswers = {};
let activePlayer = null;            // { name, department, year, mode } for this attempt

// Guest state — captured BEFORE the quiz starts
let guestProfile = loadStoredGuestProfile();

// Leaderboard state
let leaderboardFilter = 'csbasics';
let lastLeaderboardEntryId = null;
let lastLeaderboardName = null;
let leaderboardPollTimer = null;

let timerInterval = null;
let elapsedSeconds = 0;
let soundEnabled = true;
let audioContext = null;
let pendingSubmissionData = null;

const GUEST_STORAGE_KEY = 'quzzo.guest.profile';
const LB_COLSPAN = 5;

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

// Subject picker
const subjectGrid = document.getElementById('subjectGrid');
const subjectNote = document.getElementById('subjectNote');
const pillTimeLimit = document.getElementById('pillTimeLimit');
const pillMarks = document.getElementById('pillMarks');

// Front Page Auth & Entry Elements
const guestEntryBox = document.getElementById('guestEntryBox');
const authenticatedEntryBox = document.getElementById('authenticatedEntryBox');
const tabGuestBtn = document.getElementById('tabGuestBtn');
const tabLoginBtn = document.getElementById('tabLoginBtn');
const tabRegisterBtn = document.getElementById('tabRegisterBtn');
const tabTeacherBtn = document.getElementById('tabTeacherBtn');
const guestStartForm = document.getElementById('guestStartForm');
const guestNameInput = document.getElementById('guestNameInput');
const guestDeptInput = document.getElementById('guestDeptInput');
const guestYearInput = document.getElementById('guestYearInput');
const guestErrorMsg = document.getElementById('guestErrorMsg');
const guestStartBtnLabel = document.getElementById('guestStartBtnLabel');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const teacherForm = document.getElementById('teacherForm');
const teacherMsg = document.getElementById('teacherMsg');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const regName = document.getElementById('regName');
const regDept = document.getElementById('regDept');
const regYear = document.getElementById('regYear');
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
const authenticatedEnterQuizLabel = document.getElementById('authenticatedEnterQuizLabel');
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
const lbSubjectTabs = document.getElementById('lbSubjectTabs');
const lbModalSub = document.getElementById('lbModalSub');
const lbStatusText = document.getElementById('lbStatusText');

// Guest fallback modal (only used if a quiz somehow finishes with no name)
const guestCallsignModal = document.getElementById('guestCallsignModal');
const guestRecordForm = document.getElementById('guestRecordForm');
const closeGuestModalBtn = document.getElementById('closeGuestModalBtn');
const guestStudentName = document.getElementById('guestStudentName');
const guestStudentDept = document.getElementById('guestStudentDept');

// User Dashboard Modal Elements
const userDashboardModal = document.getElementById('userDashboardModal');
const closeDashboardBtn = document.getElementById('closeDashboardBtn');
const closeDashboardSecondaryBtn = document.getElementById('closeDashboardSecondaryBtn');
const editProfileForm = document.getElementById('editProfileForm');
const editProfileName = document.getElementById('editProfileName');
const editProfileDept = document.getElementById('editProfileDept');
const editProfileYear = document.getElementById('editProfileYear');
const editProfileEmail = document.getElementById('editProfileEmail');
const profileSaveMsg = document.getElementById('profileSaveMsg');
const headerDashboardBtn = document.getElementById('headerDashboardBtn');
const profileAvatarTrigger = document.getElementById('studentAvatarInitial');
const headerProfileTrigger = document.getElementById('headerProfileTrigger');
const openDashboardFromHeroBtn = document.getElementById('openDashboardFromHeroBtn');

// Countdown length comes from the selected quiz (10 min for CS Basics, 25 for DPCO)
let quizTimeLimitSeconds = 10 * 60;
let remainingSeconds = quizTimeLimitSeconds;

// ---------------------------------------------------------------------------
// 1. Audio Synthesizer (natural subtle chimes)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// 2. App Initialization
// ---------------------------------------------------------------------------
async function initApp() {
  setupEventListeners();
  prefillGuestForm();

  await loadCatalogue();

  // Supabase is optional: accounts + cloud mirror. The quiz and the
  // leaderboard work fully without it.
  try {
    const configRes = await fetch('/api/config');
    const config = await configRes.json();
    if (window.supabase && config.url && config.anonKey) {
      supabaseClient = window.supabase.createClient(config.url, config.anonKey);
      await initSupabaseAuth();
      setupRealtimeLeaderboard();
    }
  } catch (err) {
    console.warn('Supabase unavailable — running in local mode:', err);
  }
}

// ---------------------------------------------------------------------------
// 3. Subjects & question loading
// ---------------------------------------------------------------------------
async function loadCatalogue() {
  try {
    const res = await fetch('/api/quizzes');
    const data = await res.json();
    quizCatalogue = data.quizzes || [];
    selectedSubject = data.defaultSubject || quizCatalogue[0]?.id || 'csbasics';
    leaderboardFilter = selectedSubject;
  } catch (err) {
    console.error('Could not load subject catalogue:', err);
    subjectNote.textContent = 'Could not reach the quiz server. Please refresh the page.';
    return;
  }

  renderSubjectGrid();
  renderLeaderboardTabs();
  await selectSubject(selectedSubject);
}

function findQuiz(id) {
  return quizCatalogue.find((q) => q.id === id) || null;
}

function renderSubjectGrid() {
  subjectGrid.innerHTML = quizCatalogue.map((quiz) => `
    <button type="button" role="listitem"
            class="subject-card ${quiz.id === selectedSubject ? 'selected' : ''} ${quiz.available ? '' : 'is-soon'}"
            data-subject="${quiz.id}"
            title="${escapeHtml(quiz.fullName)}">
      <span class="subject-icon">${quiz.icon || '◆'}</span>
      <span>${escapeHtml(quiz.name)}</span>
      <small>${quiz.available ? `${quiz.questionCount} questions ready` : 'Coming soon'}</small>
    </button>
  `).join('');

  subjectGrid.querySelectorAll('.subject-card').forEach((card) => {
    card.addEventListener('click', () => selectSubject(card.dataset.subject));
  });
}

async function selectSubject(subjectId) {
  const quiz = findQuiz(subjectId);
  if (!quiz) return;

  subjectGrid.querySelectorAll('.subject-card').forEach((card) => {
    card.classList.toggle('selected', card.dataset.subject === subjectId);
  });

  if (!quiz.available) {
    subjectNote.textContent = `${quiz.name} is coming soon. Pick a subject marked “questions ready” to start practising.`;
    return;
  }

  selectedSubject = quiz.id;
  activeQuiz = quiz;
  quizTimeLimitSeconds = (quiz.timeLimitMinutes || 10) * 60;

  subjectNote.innerHTML = `<strong>${escapeHtml(quiz.fullName)}</strong> — ${quiz.questionCount} questions · ${quiz.timeLimitMinutes} min · ${escapeHtml(quiz.year)} · ${escapeHtml(quiz.difficulty)}`;
  pillTimeLimit.textContent = `${quiz.timeLimitMinutes} min timer`;
  pillMarks.textContent = `${quiz.questionCount} total marks`;
  totalQNum.textContent = quiz.questionCount;
  if (guestStartBtnLabel) {
    guestStartBtnLabel.textContent = `Start ${quiz.name} Quiz as Guest`;
  }
  if (authenticatedEnterQuizLabel) {
    authenticatedEnterQuizLabel.textContent = `Enter ${quiz.name} Quiz (${quiz.timeLimitMinutes} min)`;
  }

  await loadQuestions(quiz.id);
}

async function loadQuestions(subjectId) {
  try {
    const res = await fetch(`/api/questions?subject=${encodeURIComponent(subjectId)}`);
    const data = await res.json();
    questions = data.questions || [];
    totalQNum.textContent = questions.length;
  } catch (err) {
    console.error('Failed to load questions:', err);
    questions = [];
  }
}

// ---------------------------------------------------------------------------
// 4. Guest mode — name first, quiz second
// ---------------------------------------------------------------------------
function loadStoredGuestProfile() {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

function storeGuestProfile(profile) {
  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    // private browsing — the name still works for this session
  }
}

function prefillGuestForm() {
  if (!guestProfile) return;
  if (guestNameInput) guestNameInput.value = guestProfile.name || '';
  if (guestDeptInput && guestProfile.department) guestDeptInput.value = guestProfile.department;
  if (guestYearInput && guestProfile.year) guestYearInput.value = guestProfile.year;
}

function handleGuestStart(e) {
  e.preventDefault();
  guestErrorMsg.classList.add('hidden');

  const name = (guestNameInput.value || '').trim().replace(/\s+/g, ' ');
  if (name.length < 2) {
    showError(guestErrorMsg, 'Please enter your name (at least 2 characters) so your marks can be listed.');
    guestNameInput.focus();
    return;
  }

  guestProfile = {
    name: name.slice(0, 40),
    department: guestDeptInput.value || 'General',
    year: guestYearInput.value || '1st Year'
  };
  storeGuestProfile(guestProfile);
  startQuiz();
}

// ---------------------------------------------------------------------------
// 5. Supabase Auth Management (optional)
// ---------------------------------------------------------------------------
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
    const { data } = await supabaseClient
      .from('student_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      currentStudentProfile = data;
    } else {
      const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Student';
      const department = user.user_metadata?.department || 'CSE';
      const year = user.user_metadata?.year || '1st Year';
      currentStudentProfile = { id: user.id, name, department, year, email: user.email };

      await supabaseClient.from('student_profiles').upsert([{
        id: user.id,
        email: user.email,
        name,
        department,
        year
      }]);
    }
  } catch (err) {
    console.warn('Profile fetch warning:', err);
    currentStudentProfile = {
      id: user.id,
      name: user.user_metadata?.full_name || 'Student',
      department: user.user_metadata?.department || 'General',
      year: user.user_metadata?.year || '1st Year',
      email: user.email
    };
  }
}

function renderAuthenticatedUI() {
  const name = currentStudentProfile?.name || 'Student';
  const dept = currentStudentProfile?.department || 'CSE';
  const year = currentStudentProfile?.year || '1st Year';
  const initial = name.charAt(0).toUpperCase() || 'S';

  headerSignInBtn.classList.add('hidden');
  studentProfileBadge.classList.remove('hidden');
  headerStudentName.textContent = name;
  headerStudentDept.textContent = dept;
  studentAvatarInitial.textContent = initial;

  guestEntryBox.classList.add('hidden');
  authenticatedEntryBox.classList.remove('hidden');
  welcomeStudentName.textContent = name;
  welcomeStudentDept.textContent = `Department: ${dept} • ${year}`;
  welcomeAvatar.textContent = initial;
}

function renderGuestUI() {
  headerSignInBtn.classList.remove('hidden');
  studentProfileBadge.classList.add('hidden');
  guestEntryBox.classList.remove('hidden');
  authenticatedEntryBox.classList.add('hidden');
}

// ---------------------------------------------------------------------------
// 6. Auth Actions: Email / Password / Google
// ---------------------------------------------------------------------------
async function handleLogin(e) {
  e.preventDefault();
  authErrorMsg.classList.add('hidden');
  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!supabaseClient) {
    showError(authErrorMsg, 'Student accounts need the cloud database, which is not reachable right now. Use Guest Mode to take the quiz — your marks still reach the leaderboard.');
    return;
  }

  const submitBtn = loginForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span>Verifying credentials…</span>';

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  submitBtn.disabled = false;
  submitBtn.innerHTML = `<span>Sign In & Enter Quiz</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;

  if (error) {
    let errMsg = error.message || 'Invalid email or password.';
    if (errMsg.toLowerCase().includes('email not confirmed')) {
      errMsg = 'Your email has not been confirmed yet. Please check your inbox for a confirmation link, or ask your admin to disable email confirmation in Supabase settings.';
    }
    showError(authErrorMsg, errMsg);
  } else {
    startQuiz();
  }
}

async function handleRegister(e) {
  e.preventDefault();
  regErrorMsg.classList.add('hidden');
  const name = regName.value.trim();
  const department = regDept.value;
  const year = regYear ? regYear.value : '1st Year';
  const email = regEmail.value.trim();
  const password = regPassword.value;

  if (!supabaseClient) {
    showError(regErrorMsg, 'Account creation needs the cloud database, which is not reachable right now. Use Guest Mode to take the quiz instead.');
    return;
  }

  const submitBtn = registerForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span>Creating Student Account…</span>';

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: { data: { full_name: name, department, year } }
  });

  submitBtn.disabled = false;
  submitBtn.innerHTML = `<span>Create Student Account & Enter Quiz</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;

  if (error) {
    showError(regErrorMsg, error.message || 'Registration failed.');
    return;
  }

  if (data.user) {
    await supabaseClient.from('student_profiles').upsert([{
      id: data.user.id,
      email: data.user.email,
      name,
      department,
      year
    }]);

    currentStudentProfile = { id: data.user.id, email: data.user.email, name, department, year };
    startQuiz();
  }
}

async function handleGoogleSignIn() {
  if (!supabaseClient) {
    alert('Google sign-in needs the cloud database. Use Guest Mode to take the quiz right now.');
    return;
  }

  try {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });

    if (error) {
      console.warn('Google OAuth error:', error);
      const googleSetupModal = document.getElementById('googleSetupModal');
      if (googleSetupModal) {
        googleSetupModal.classList.remove('hidden');
      } else {
        showError(authErrorMsg, `Google Sign-In is not enabled yet (${error.message}). Use Guest Mode or create a student account.`);
      }
    }
  } catch (err) {
    console.error('Google OAuth unexpected error:', err);
    const googleSetupModal = document.getElementById('googleSetupModal');
    if (googleSetupModal) googleSetupModal.classList.remove('hidden');
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

// ---------------------------------------------------------------------------
// 7. Quiz engine
// ---------------------------------------------------------------------------
function resolvePlayer() {
  if (currentUser && currentStudentProfile) {
    return {
      name: currentStudentProfile.name || 'Student',
      department: currentStudentProfile.department || 'General',
      year: currentStudentProfile.year || '1st Year',
      mode: 'student'
    };
  }
  if (guestProfile?.name) {
    return { ...guestProfile, mode: 'guest' };
  }
  return null;
}

function startQuiz() {
  if (!activeQuiz || !activeQuiz.available) {
    alert('Please choose a subject that has questions ready.');
    return;
  }
  if (questions.length === 0) {
    alert('Quiz questions are still loading, please try again in a second.');
    return;
  }

  const player = resolvePlayer();
  if (!player) {
    // Guest mode requires a name up front
    switchAuthTab('guest');
    showError(guestErrorMsg, 'Enter your name first — it is used to list your marks on the leaderboard.');
    guestNameInput.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  activePlayer = player;
  currentQuestionIndex = 0;
  studentAnswers = {};

  quizPlayerName.textContent = player.name;
  quizPlayerDept.textContent = player.mode === 'guest' ? `Guest · ${player.department}` : player.department;

  frontPageView.classList.add('hidden');
  resultsView.classList.add('hidden');
  quizView.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });

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
  remainingSeconds = quizTimeLimitSeconds;
  elapsedSeconds = 0;
  quizTimer.classList.remove('timer-warning');
  updateTimerUI();

  timerInterval = setInterval(() => {
    remainingSeconds--;
    elapsedSeconds++;
    updateTimerUI();

    if (remainingSeconds <= 120 && remainingSeconds > 0) {
      quizTimer.classList.add('timer-warning');
    }

    if (remainingSeconds <= 0) {
      stopTimer();
      quizTimer.textContent = '00:00';
      alert('Time is up! Submitting your quiz now.');
      submitQuizEvaluation();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
}

function updateTimerUI() {
  const displaySecs = Math.max(0, remainingSeconds);
  const m = Math.floor(displaySecs / 60).toString().padStart(2, '0');
  const s = (displaySecs % 60).toString().padStart(2, '0');
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
      <span class="option-content-text">${escapeHtml(opt.text)}</span>
    </div>
  `).join('');

  questionStage.innerHTML = `
    <div class="q-topic-header">
      <span class="q-badge">${escapeHtml(q.topic || activeQuiz?.name || 'Quiz')}</span>
      <span class="q-marks-indicator">1 Mark</span>
    </div>

    <h2 class="question-text">${escapeHtml(q.prompt)}</h2>

    <div class="options-stack" id="optionsStack">
      ${optionsHtml}
    </div>

    <div class="quiz-nav-row">
      <button class="btn btn-secondary" id="quizPrevBtn" ${currentQuestionIndex === 0 ? 'disabled style="opacity:0.4;"' : ''}>
        ← Previous
      </button>

      <button class="btn btn-main" id="quizNextBtn" ${!chosen ? 'disabled style="opacity:0.45; cursor:not-allowed;"' : ''}>
        ${currentQuestionIndex === questions.length - 1 ? 'Finish & See Marks ⚡' : 'Next Question →'}
      </button>
    </div>
  `;

  const tiles = questionStage.querySelectorAll('.option-tile');
  tiles.forEach((tile) => {
    tile.addEventListener('click', () => {
      playSelectSound();
      studentAnswers[tile.dataset.qid] = tile.dataset.optid;

      tiles.forEach((t) => t.classList.remove('selected'));
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

// ---------------------------------------------------------------------------
// 8. Submit, grade & publish marks
// ---------------------------------------------------------------------------
async function submitQuizEvaluation() {
  stopTimer();
  questionStage.innerHTML = `
    <div style="text-align:center; padding: 48px 16px;">
      <div class="table-loading-spinner"></div>
      <p style="color: var(--ink-secondary); font-size: 1rem;">Checking your answers against the answer key…</p>
    </div>
  `;

  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: selectedSubject, answers: studentAnswers })
    });
    const resultData = await res.json();
    resultData.timeTaken = elapsedSeconds;

    if (resultData.percentage >= 70 && window.confetti) {
      window.confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
      playSuccessFanfare();
    }

    renderResultsView(resultData);

    const player = activePlayer || resolvePlayer();
    if (player) {
      await publishScore(resultData, player);
    } else {
      // Safety net: quiz finished without a name (shouldn't normally happen)
      pendingSubmissionData = resultData;
      guestCallsignModal.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Quiz submission error:', err);
    alert('Error submitting quiz. Please check your connection and try again.');
  }
}

function renderResultsView(data) {
  quizView.classList.add('hidden');
  resultsView.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const explanationCards = data.results.map((r, idx) => {
    const q = questions.find((item) => item.id === r.id);
    const chosenOpt = q.options.find((o) => o.id === r.chosen);
    const correctOpt = q.options.find((o) => o.id === r.correct);
    const letterOf = (optId) => {
      const i = q.options.findIndex((o) => o.id === optId);
      return i >= 0 ? ['A', 'B', 'C', 'D'][i] : '—';
    };
    return `
      <div class="explanation-card ${r.isCorrect ? 'correct' : 'incorrect'}">
        <div class="review-q-prompt">Q${idx + 1}. ${escapeHtml(q.prompt)}</div>
        <div class="review-meta">
          <div><strong>Your answer:</strong> ${chosenOpt ? `(${letterOf(r.chosen)}) ${escapeHtml(chosenOpt.text)}` : 'Not answered'} ${r.isCorrect ? '✅' : '❌'}</div>
          ${!r.isCorrect ? `<div style="color: var(--state-success);"><strong>Correct answer:</strong> (${letterOf(r.correct)}) ${escapeHtml(correctOpt.text)}</div>` : ''}
          <div style="margin-top: 4px; color: var(--ink-secondary); font-style: italic;">${escapeHtml(r.explanation)}</div>
        </div>
      </div>
    `;
  }).join('');

  const playerName = (activePlayer || resolvePlayer())?.name || 'Student';

  resultsContainer.innerHTML = `
    <span class="result-badge-top">${escapeHtml(activeQuiz?.name || 'Quiz')} · Evaluation complete</span>

    <h2 class="results-player-line">Well done, ${escapeHtml(playerName)}!</h2>

    <div class="score-display-box">
      <div class="score-big-num">${data.score}</div>
      <div class="score-max-sub">out of ${data.total} marks</div>
    </div>

    <div class="score-meta-grid">
      <div class="stat-item">
        <span class="stat-label">Accuracy</span>
        <span class="stat-data">${data.percentage}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Time taken</span>
        <span class="stat-data">${Math.floor(data.timeTaken / 60)}m ${data.timeTaken % 60}s</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Rating</span>
        <span class="stat-data" style="color: ${data.percentage >= 70 ? 'var(--state-success)' : 'var(--accent-terracotta)'}">
          ${data.percentage >= 80 ? 'Distinction' : data.percentage >= 50 ? 'Passed' : 'Review needed'}
        </span>
      </div>
    </div>

    <div class="leaderboard-status-card" id="leaderboardStatusCard">
      <div class="table-loading-spinner" style="width:18px;height:18px;margin:0;"></div>
      <span id="leaderboardStatusText">Publishing your marks to the leaderboard…</span>
    </div>

    <div class="results-cta-stack">
      <button id="viewLeaderboardFromResultsBtn" class="btn btn-main full-width">
        🏆 View Leaderboard
      </button>
      <button id="retakeQuizBtn" class="btn btn-secondary full-width">
        🔄 Retake Quiz
      </button>
      <button id="backHomeFromResultsBtn" class="text-link-btn">Back to subjects</button>
    </div>

    <div class="explanation-accordion-wrap">
      <h3 class="accordion-header-title">Answer key & explanations</h3>
      <div class="explanation-list">
        ${explanationCards}
      </div>
    </div>
  `;

  document.getElementById('retakeQuizBtn').addEventListener('click', startQuiz);
  document.getElementById('viewLeaderboardFromResultsBtn').addEventListener('click', () => openLeaderboard(selectedSubject));
  document.getElementById('backHomeFromResultsBtn').addEventListener('click', showFrontPage);
}

function setLeaderboardStatus(message, state = 'info') {
  const card = document.getElementById('leaderboardStatusCard');
  const text = document.getElementById('leaderboardStatusText');
  if (!card || !text) return;
  card.classList.remove('is-success', 'is-error');
  if (state === 'success') card.classList.add('is-success');
  if (state === 'error') card.classList.add('is-error');
  card.innerHTML = `<span>${message}</span>`;
}

/** Posts the finished attempt to the local board (always) + Supabase (if up). */
async function publishScore(data, player) {
  try {
    const res = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: data.subject || selectedSubject,
        name: player.name,
        department: player.department,
        year: player.year,
        mode: player.mode,
        score: data.score,
        total: data.total,
        timeTaken: data.timeTaken || 0
      })
    });

    if (!res.ok) throw new Error(`Server responded ${res.status}`);
    const saved = await res.json();
    // The board keeps one row per student, so highlight whichever row is theirs
    lastLeaderboardEntryId = saved.best?.id || saved.entry.id;
    lastLeaderboardName = player.name.toLowerCase();

    const board = escapeHtml(activeQuiz?.name || '');
    setLeaderboardStatus(
      saved.isBest
        ? `🏆 Saved as <strong>${escapeHtml(player.name)}</strong> — rank <strong>#${saved.rank}</strong> of ${saved.players} on the ${board} board with <strong>${data.score}/${data.total}</strong> marks.`
        : `Saved as <strong>${escapeHtml(player.name)}</strong>. Your best ${board} result (<strong>${saved.best.score}/${saved.best.total}</strong>) still holds rank <strong>#${saved.rank}</strong> of ${saved.players}.`,
      'success'
    );

    if (!leaderboardModal.classList.contains('hidden')) {
      loadLeaderboard(leaderboardFilter);
    }
  } catch (err) {
    console.error('Could not publish score:', err);
    setLeaderboardStatus('Could not reach the leaderboard server — your marks are shown above but were not saved.', 'error');
  }

  // Optional cloud mirror for signed-in students (never blocks the UI)
  if (supabaseClient && currentUser) {
    recordScoreToSupabase(data, player).catch(() => {});
  }
}

async function recordScoreToSupabase(data, player) {
  try {
    const { error } = await supabaseClient
      .from('quiz_scores')
      .insert([{
        student_id: currentUser?.id || null,
        user_name: player.name,
        department: player.department || 'General',
        year: player.year || '1st Year',
        user_email: currentUser?.email || null,
        score: data.score,
        total_questions: data.total,
        percentage: data.percentage,
        time_taken_seconds: data.timeTaken || 0
      }]);
    if (error) console.warn('Supabase mirror notice:', error.message);
  } catch (err) {
    console.warn('Supabase mirror failed (local board still has the score).');
  }
}

// ---------------------------------------------------------------------------
// 9. Leaderboard
// ---------------------------------------------------------------------------
function renderLeaderboardTabs() {
  const ready = quizCatalogue.filter((q) => q.available);
  lbSubjectTabs.innerHTML = [
    ...ready.map((q) => `<button type="button" class="lb-tab ${q.id === leaderboardFilter ? 'active' : ''}" data-lb-subject="${q.id}">${escapeHtml(q.name)}</button>`),
    `<button type="button" class="lb-tab ${leaderboardFilter === 'all' ? 'active' : ''}" data-lb-subject="all">All subjects</button>`
  ].join('');

  lbSubjectTabs.querySelectorAll('.lb-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      leaderboardFilter = tab.dataset.lbSubject;
      lbSubjectTabs.querySelectorAll('.lb-tab').forEach((t) => t.classList.toggle('active', t === tab));
      loadLeaderboard(leaderboardFilter);
    });
  });
}

function formatClock(seconds) {
  const s = Math.max(0, Number(seconds) || 0);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

async function loadLeaderboard(subject = leaderboardFilter) {
  leaderboardBody.innerHTML = `
    <tr>
      <td colspan="${LB_COLSPAN}" class="table-empty-cell">
        <div class="table-loading-spinner"></div>
        Fetching latest standings…
      </td>
    </tr>
  `;

  try {
    const res = await fetch(`/api/leaderboard?subject=${encodeURIComponent(subject)}&limit=50`);
    const board = await res.json();

    const quizMeta = findQuiz(subject);
    lbModalSub.textContent = subject === 'all'
      ? 'Best result of every student across all subjects'
      : `${quizMeta ? quizMeta.fullName : subject} — best result per student`;
    lbStatusText.textContent = board.players
      ? `${board.players} student${board.players === 1 ? '' : 's'} ranked · ${board.attempts} attempt${board.attempts === 1 ? '' : 's'} recorded`
      : 'Marks are posted to this board the moment a quiz is submitted';

    if (!board.entries || board.entries.length === 0) {
      leaderboardBody.innerHTML = `<tr><td colspan="${LB_COLSPAN}" class="table-empty-cell">No marks recorded yet. Finish the quiz to be the first name on the board!</td></tr>`;
      return;
    }

    leaderboardBody.innerHTML = board.entries.map((row) => {
      const rankClass = row.rank === 1 ? 'rank-top-1' : row.rank === 2 ? 'rank-top-2' : row.rank === 3 ? 'rank-top-3' : '';
      const isMine = row.id === lastLeaderboardEntryId
        || (lastLeaderboardName && row.name.toLowerCase() === lastLeaderboardName);
      const medal = row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : '';
      return `
        <tr class="${rankClass} ${isMine ? 'is-you' : ''}">
          <td class="rank-cell">${medal || `#${row.rank}`}</td>
          <td class="name-cell">
            ${escapeHtml(row.name)}
            ${row.mode === 'guest' ? '<span class="guest-tag">guest</span>' : ''}
            ${isMine ? '<span class="you-tag">you</span>' : ''}
            ${subject === 'all' ? `<span class="subject-tag">${escapeHtml(row.subjectName || row.subject)}</span>` : ''}
          </td>
          <td class="col-dept"><span class="dept-tag-cell">${escapeHtml(row.department || 'General')}</span></td>
          <td class="col-time score-cell" style="font-weight:600;">${formatClock(row.timeTakenSeconds)}</td>
          <td class="score-cell">${row.score} / ${row.total}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Leaderboard load failed:', err);
    leaderboardBody.innerHTML = `<tr><td colspan="${LB_COLSPAN}" class="table-empty-cell">Could not load the leaderboard. Is the server running?</td></tr>`;
  }
}

function setupRealtimeLeaderboard() {
  if (!supabaseClient) return;
  try {
    supabaseClient
      .channel('student-leaderboard-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quiz_scores' }, () => {
        if (!leaderboardModal.classList.contains('hidden')) loadLeaderboard(leaderboardFilter);
      })
      .subscribe();
  } catch (err) {
    console.warn('Realtime channel unavailable:', err);
  }
}

function openLeaderboard(subject) {
  if (subject) {
    leaderboardFilter = subject;
    renderLeaderboardTabs();
  }
  leaderboardModal.classList.remove('hidden');
  loadLeaderboard(leaderboardFilter);

  // Light polling keeps the board fresh while several students submit
  clearInterval(leaderboardPollTimer);
  leaderboardPollTimer = setInterval(() => {
    if (leaderboardModal.classList.contains('hidden')) {
      clearInterval(leaderboardPollTimer);
      return;
    }
    loadLeaderboard(leaderboardFilter);
  }, 15000);
}

function closeLeaderboard() {
  leaderboardModal.classList.add('hidden');
  clearInterval(leaderboardPollTimer);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[m]);
}

// ---------------------------------------------------------------------------
// 10. Tabs & Event Listeners
// ---------------------------------------------------------------------------
function switchAuthTab(tab) {
  const tabs = {
    guest: [tabGuestBtn, guestStartForm],
    login: [tabLoginBtn, loginForm],
    register: [tabRegisterBtn, registerForm],
    teacher: [tabTeacherBtn, teacherForm]
  };

  Object.entries(tabs).forEach(([key, [btn, form]]) => {
    const isActive = key === tab;
    if (btn) btn.classList.toggle('active', isActive);
    if (form) form.classList.toggle('hidden', !isActive);
  });

  guestErrorMsg.classList.add('hidden');
  authErrorMsg.classList.add('hidden');
  regErrorMsg.classList.add('hidden');
}

function setupEventListeners() {
  homeLogoBtn.addEventListener('click', showFrontPage);

  soundToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundIcon.textContent = soundEnabled ? '🔔' : '🔕';
  });

  viewLeaderboardBtn.addEventListener('click', () => openLeaderboard(leaderboardFilter));
  closeLeaderboardBtn.addEventListener('click', closeLeaderboard);
  closeLeaderboardActionBtn.addEventListener('click', closeLeaderboard);
  leaderboardModal.addEventListener('click', (e) => {
    if (e.target === leaderboardModal) closeLeaderboard();
  });

  // Auth / entry tabs
  tabGuestBtn.addEventListener('click', () => switchAuthTab('guest'));
  tabLoginBtn.addEventListener('click', () => switchAuthTab('login'));
  tabRegisterBtn.addEventListener('click', () => switchAuthTab('register'));
  tabTeacherBtn.addEventListener('click', () => switchAuthTab('teacher'));

  guestStartForm.addEventListener('submit', handleGuestStart);

  teacherForm.addEventListener('submit', (e) => {
    e.preventDefault();
    teacherMsg.textContent = 'Teacher sign-in is reserved for the upcoming question editor. Student and guest quiz access is available now.';
    teacherMsg.classList.remove('hidden');
  });

  headerSignInBtn.addEventListener('click', () => {
    showFrontPage();
    switchAuthTab('login');
    loginEmail.focus();
  });

  loginForm.addEventListener('submit', handleLogin);
  registerForm.addEventListener('submit', handleRegister);
  googleOAuthBtn.addEventListener('click', handleGoogleSignIn);
  logoutBtn.addEventListener('click', handleLogout);

  guestEnterBtn.addEventListener('click', () => {
    switchAuthTab('guest');
    guestNameInput.focus();
  });

  authenticatedEnterQuizBtn.addEventListener('click', startQuiz);
  switchAccountBtn.addEventListener('click', handleLogout);

  exitQuizPromptBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to exit the quiz? Your current progress will be lost.')) {
      showFrontPage();
    }
  });

  // Fallback name capture (only if a quiz ends with no player name)
  guestRecordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = guestStudentName.value.trim() || 'Guest Student';
    const player = { name, department: guestStudentDept.value, year: '1st Year', mode: 'guest' };
    guestProfile = { name, department: player.department, year: player.year };
    storeGuestProfile(guestProfile);
    activePlayer = player;

    if (pendingSubmissionData) {
      await publishScore(pendingSubmissionData, player);
      pendingSubmissionData = null;
    }
    guestCallsignModal.classList.add('hidden');
    openLeaderboard(selectedSubject);
  });

  closeGuestModalBtn.addEventListener('click', () => guestCallsignModal.classList.add('hidden'));

  // Google setup guide modal
  const googleSetupModal = document.getElementById('googleSetupModal');
  const closeGoogleSetupBtn = document.getElementById('closeGoogleSetupBtn');
  const switchToEmailRegisterBtn = document.getElementById('switchToEmailRegisterBtn');
  const enterAsGuestFromModalBtn = document.getElementById('enterAsGuestFromModalBtn');

  if (closeGoogleSetupBtn) {
    closeGoogleSetupBtn.addEventListener('click', () => googleSetupModal.classList.add('hidden'));
  }
  if (switchToEmailRegisterBtn) {
    switchToEmailRegisterBtn.addEventListener('click', () => {
      googleSetupModal.classList.add('hidden');
      switchAuthTab('register');
      regName.focus();
    });
  }
  if (enterAsGuestFromModalBtn) {
    enterAsGuestFromModalBtn.addEventListener('click', () => {
      googleSetupModal.classList.add('hidden');
      switchAuthTab('guest');
      guestNameInput.focus();
    });
  }

  // User dashboard
  async function openDashboard() {
    if (!currentUser) {
      alert('Please sign in to access your user dashboard.');
      return;
    }
    if (!currentStudentProfile) await fetchStudentProfile(currentUser);
    const profile = currentStudentProfile || {
      name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Student',
      department: currentUser.user_metadata?.department || 'CSE',
      year: currentUser.user_metadata?.year || '1st Year',
      email: currentUser.email
    };
    editProfileName.value = profile.name || '';
    editProfileDept.value = profile.department || 'CSE';
    editProfileYear.value = profile.year || '1st Year';
    editProfileEmail.value = profile.email || currentUser.email || '';
    profileSaveMsg.classList.add('hidden');
    userDashboardModal.classList.remove('hidden');
  }

  function closeDashboard() {
    userDashboardModal.classList.add('hidden');
  }

  if (headerDashboardBtn) headerDashboardBtn.addEventListener('click', openDashboard);
  if (headerProfileTrigger) headerProfileTrigger.addEventListener('click', openDashboard);
  if (profileAvatarTrigger) {
    profileAvatarTrigger.addEventListener('click', openDashboard);
    profileAvatarTrigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') openDashboard();
    });
  }
  if (openDashboardFromHeroBtn) openDashboardFromHeroBtn.addEventListener('click', openDashboard);
  if (closeDashboardBtn) closeDashboardBtn.addEventListener('click', closeDashboard);
  if (closeDashboardSecondaryBtn) closeDashboardSecondaryBtn.addEventListener('click', closeDashboard);

  userDashboardModal.addEventListener('click', (e) => {
    if (e.target === userDashboardModal) closeDashboard();
  });

  if (editProfileForm) {
    editProfileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newName = editProfileName.value.trim();
      const newDept = editProfileDept.value;
      const newYear = editProfileYear.value;
      if (!newName) return;

      const saveBtn = document.getElementById('saveProfileBtn');
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span>Saving Changes…</span>';

      try {
        const { error } = await supabaseClient
          .from('student_profiles')
          .upsert([{ id: currentUser.id, email: currentUser.email, name: newName, department: newDept, year: newYear }]);
        if (error) throw error;

        await supabaseClient.auth.updateUser({
          data: { full_name: newName, department: newDept, year: newYear }
        });

        currentStudentProfile.name = newName;
        currentStudentProfile.department = newDept;
        currentStudentProfile.year = newYear;
        renderAuthenticatedUI();

        profileSaveMsg.textContent = '✓ Profile details updated successfully!';
        profileSaveMsg.classList.remove('hidden');
        setTimeout(closeDashboard, 900);
      } catch (err) {
        console.error('Error updating profile:', err);
        alert('Failed to update details: ' + (err.message || 'Unknown error'));
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<span>Save Profile Changes</span>';
      }
    });
  }
}

// Start application
initApp();
