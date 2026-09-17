// State Management
let supabaseClient = null;
let currentUser = null;
let questions = [];
let currentIndex = 0;
let selectedAnswers = {};
let timerInterval = null;
let elapsedSeconds = 0;
let soundEnabled = true;
let audioCtx = null;
let pendingSubmissionData = null;

// DOM Elements
const stage = document.getElementById('stage');
const traceEl = document.getElementById('trace');
const qCountBadge = document.getElementById('qCountBadge');
const timerBadge = document.getElementById('timerBadge');
const currentScoreBadge = document.getElementById('currentScoreBadge');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const soundIcon = document.getElementById('soundIcon');
const viewLeaderboardBtn = document.getElementById('viewLeaderboardBtn');
const leaderboardModal = document.getElementById('leaderboardModal');
const closeLeaderboardBtn = document.getElementById('closeLeaderboardBtn');
const closeModalActionBtn = document.getElementById('closeModalActionBtn');
const leaderboardList = document.getElementById('leaderboardList');
const authPromptModal = document.getElementById('authPromptModal');
const closeAuthPromptBtn = document.getElementById('closeAuthPromptBtn');
const googleSignInBtn = document.getElementById('googleSignInBtn');
const modalGoogleSignInBtn = document.getElementById('modalGoogleSignInBtn');
const guestSubmitBtn = document.getElementById('guestSubmitBtn');
const guestCallsignInput = document.getElementById('guestCallsignInput');
const userProfileBadge = document.getElementById('userProfileBadge');
const userAvatarImg = document.getElementById('userAvatarImg');
const userNameTxt = document.getElementById('userNameTxt');
const signOutBtn = document.getElementById('signOutBtn');

// 1. Audio Synthesis (Web Audio API)
function playTone(freq = 440, type = 'sine', duration = 0.1) {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Audio autostart restricted or unsupported
  }
}

function playSelectSound() {
  playTone(587.33, 'triangle', 0.08); // D5
}

function playNextSound() {
  playTone(880, 'sine', 0.12); // A5
}

function playVictoryFanfare() {
  if (!soundEnabled) return;
  [523.25, 659.25, 783.99, 1046.50].forEach((f, idx) => {
    setTimeout(() => playTone(f, 'sine', 0.25), idx * 110);
  });
}

// 2. Initialize App and Supabase
async function init() {
  setupEventListeners();

  try {
    // Load config from server
    const configRes = await fetch('/api/config');
    const config = await configRes.json();
    
    if (window.supabase && config.url && config.anonKey) {
      supabaseClient = window.supabase.createClient(config.url, config.anonKey);
      setupSupabaseAuth();
      setupSupabaseRealtime();
    }
  } catch (err) {
    console.warn('Supabase initialization fallback:', err);
  }

  // Load questions
  try {
    const res = await fetch('/api/questions');
    questions = await res.json();
    buildTrace();
    startTimer();
    renderQuestion();
  } catch (err) {
    stage.innerHTML = `<div class="loading-state"><p>Error connecting to logic module. Please refresh.</p></div>`;
  }
}

// 3. Supabase Auth Setup
function setupSupabaseAuth() {
  if (!supabaseClient) return;

  // Check current session
  supabaseClient.auth.getSession().then(({ data: { session } }) => {
    updateUserAuthUI(session?.user || null);
  });

  // Listen to auth changes
  supabaseClient.auth.onAuthStateChange((event, session) => {
    updateUserAuthUI(session?.user || null);
    if (session?.user && pendingSubmissionData) {
      // Auto-save pending score if user signed in after quiz finished
      saveScoreToLeaderboard(pendingSubmissionData);
      pendingSubmissionData = null;
      authPromptModal.classList.add('hidden');
    }
  });
}

function updateUserAuthUI(user) {
  currentUser = user;
  if (user) {
    googleSignInBtn.classList.add('hidden');
    userProfileBadge.classList.remove('hidden');
    const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Engineer';
    const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;
    userNameTxt.textContent = name;
    userAvatarImg.src = avatar;
  } else {
    googleSignInBtn.classList.remove('hidden');
    userProfileBadge.classList.add('hidden');
  }
}

async function signInWithGoogle() {
  if (!supabaseClient) {
    alert('Database connection is not ready. Please try again in a moment.');
    return;
  }
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) {
    alert('Google Sign-in Error: ' + error.message);
  }
}

async function signOut() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  updateUserAuthUI(null);
}

// 4. Timer Handling
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  elapsedSeconds = 0;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    elapsedSeconds++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
}

function updateTimerDisplay() {
  const mins = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
  const secs = (elapsedSeconds % 60).toString().padStart(2, '0');
  timerBadge.textContent = `${mins}:${secs}`;
}

// 5. Quiz Trace / Progress Bar
function buildTrace() {
  traceEl.innerHTML = '';
  questions.forEach((_, idx) => {
    const node = document.createElement('div');
    node.className = 'trace__node';
    node.id = `trace-node-${idx}`;
    traceEl.appendChild(node);
  });
  updateTrace();
}

function updateTrace() {
  const nodes = traceEl.querySelectorAll('.trace__node');
  nodes.forEach((node, i) => {
    node.classList.toggle('done', i < currentIndex);
    node.classList.toggle('current', i === currentIndex);
  });
  qCountBadge.textContent = `${currentIndex + 1} / ${questions.length}`;
}

// 6. Render Questions
function renderQuestion() {
  updateTrace();
  const q = questions[currentIndex];
  const alreadyChosen = selectedAnswers[q.id];

  stage.innerHTML = `
    <div class="q-header">
      <span class="q-topic-tag">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10"/>
        </svg>
        Digital Electronics App
      </span>
      <span style="font-size: 11px; color: var(--cream-dim); font-family: var(--font-mono);">
        Q${currentIndex + 1}
      </span>
    </div>

    <h2 class="q-prompt">${q.prompt}</h2>

    <div class="options-list" id="optionsList"></div>

    <div class="nav-row">
      <button class="btn btn-secondary" id="prevBtn" ${currentIndex === 0 ? 'disabled style="opacity:0.3; pointer-events:none;"' : ''}>
        ← Back
      </button>
      <button class="btn btn-primary" id="nextBtn" ${!alreadyChosen ? 'disabled' : ''}>
        ${currentIndex === questions.length - 1 ? 'Submit Circuit Test ⚡' : 'Next Question →'}
      </button>
    </div>
  `;

  const optionsContainer = document.getElementById('optionsList');
  const optionKeys = ['A', 'B', 'C', 'D'];

  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn' + (alreadyChosen === opt.id ? ' selected' : '');
    btn.innerHTML = `
      <span class="option-key">${optionKeys[idx] || opt.id.toUpperCase()}</span>
      <span class="option-text">${opt.text}</span>
    `;
    btn.addEventListener('click', () => {
      selectOption(q.id, opt.id);
    });
    optionsContainer.appendChild(btn);
  });

  document.getElementById('nextBtn').addEventListener('click', handleNextAction);
  const prevBtn = document.getElementById('prevBtn');
  if (prevBtn) {
    prevBtn.addEventListener('click', handlePrevAction);
  }
}

function selectOption(questionId, optionId) {
  playSelectSound();
  selectedAnswers[questionId] = optionId;
  
  // Update styling
  const buttons = stage.querySelectorAll('.option-btn');
  const q = questions[currentIndex];
  const selectedIdx = q.options.findIndex(o => o.id === optionId);
  buttons.forEach((btn, i) => {
    btn.classList.toggle('selected', i === selectedIdx);
  });

  const nextBtn = document.getElementById('nextBtn');
  if (nextBtn) nextBtn.disabled = false;
}

function handlePrevAction() {
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestion();
  }
}

function handleNextAction() {
  playNextSound();
  if (currentIndex < questions.length - 1) {
    currentIndex++;
    renderQuestion();
  } else {
    submitQuiz();
  }
}

// 7. Submit Quiz & Result Breakdown
async function submitQuiz() {
  stopTimer();
  updateTrace();
  stage.innerHTML = `
    <div class="initial-loader">
      <div class="spinner"></div>
      <p class="loading">Validating logic outputs against truth tables…</p>
    </div>
  `;

  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: selectedAnswers })
    });
    const data = await res.json();
    data.timeTaken = elapsedSeconds;

    currentScoreBadge.textContent = `${data.score} pts`;

    if (data.percentage >= 70 && window.confetti) {
      window.confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      playVictoryFanfare();
    }

    renderResultsScreen(data);

    // Auto save if user is logged in, else open prompt
    if (currentUser) {
      saveScoreToLeaderboard(data);
    } else {
      pendingSubmissionData = data;
      authPromptModal.classList.remove('hidden');
    }
  } catch (err) {
    stage.innerHTML = `<div class="loading-state"><p>Error evaluating submission. Please try again.</p></div>`;
  }
}

function renderResultsScreen(data) {
  const circumference = 2 * Math.PI * 40; // r=40
  const offset = circumference - (data.percentage / 100) * circumference;

  const reviewItemsHtml = data.results.map((r, i) => {
    const q = questions.find(item => item.id === r.id);
    const chosenOpt = q.options.find(o => o.id === r.chosen);
    const correctOpt = q.options.find(o => o.id === r.correct);
    return `
      <div class="review-card ${r.isCorrect ? 'correct' : 'wrong'}">
        <div class="review-q-title">Q${i + 1}. ${q.prompt}</div>
        <div class="review-feedback">
          <div><strong>Your Answer:</strong> ${chosenOpt ? chosenOpt.text : 'None'} ${r.isCorrect ? '✅' : '❌'}</div>
          ${!r.isCorrect ? `<div><strong>Correct Logic:</strong> ${correctOpt.text}</div>` : ''}
          <div style="margin-top: 4px; color: var(--cream-dim)"><em>${r.explanation}</em></div>
        </div>
      </div>
    `;
  }).join('');

  stage.innerHTML = `
    <div class="result-screen">
      <span class="result-badge">Circuit Diagnostic Report</span>

      <div class="score-circle-wrap">
        <svg class="score-circle-svg" width="160" height="160" viewBox="0 0 100 100">
          <circle class="circle-bg-path" cx="50" cy="50" r="40"/>
          <circle class="circle-progress-path" cx="50" cy="50" r="40"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${offset}"/>
        </svg>
        <div class="score-digits">
          <span class="score-number">${data.score}</span>
          <span class="score-total">of ${data.total} Marks</span>
        </div>
      </div>

      <div class="score-summary-grid">
        <div class="summary-stat">
          <span class="stat-label">Accuracy</span>
          <span class="stat-val">${data.percentage}%</span>
        </div>
        <div class="summary-stat">
          <span class="stat-label">Time</span>
          <span class="stat-val">${Math.floor(data.timeTaken / 60)}m ${data.timeTaken % 60}s</span>
        </div>
        <div class="summary-stat">
          <span class="stat-label">Status</span>
          <span class="stat-val" style="color: ${data.percentage >= 60 ? 'var(--neon-emerald)' : 'var(--neon-amber)'}">
            ${data.percentage >= 80 ? 'Master' : data.percentage >= 50 ? 'Proficient' : 'Apprentice'}
          </span>
        </div>
      </div>

      <div class="result-actions">
        <button id="openRankingsBtn" class="btn btn-copper full-width">
          🏆 View Live Leaderboard
        </button>
        <button id="retakeQuizBtn" class="btn btn-secondary full-width">
          🔄 Retest Circuit
        </button>
      </div>

      <div class="breakdown-section">
        <div class="breakdown-title">Comprehensive Logic Analysis</div>
        <div class="review-list">${reviewItemsHtml}</div>
      </div>
    </div>
  `;

  document.getElementById('retakeQuizBtn').addEventListener('click', () => {
    currentIndex = 0;
    selectedAnswers = {};
    startTimer();
    renderQuestion();
  });

  document.getElementById('openRankingsBtn').addEventListener('click', () => {
    openLeaderboard();
  });
}

// 8. Save Score to Supabase
async function saveScoreToLeaderboard(data, guestName = null) {
  if (!supabaseClient) return;

  const displayName = guestName || (currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0] || 'Anonymous Engineer');
  const avatar = currentUser?.user_metadata?.avatar_url || currentUser?.user_metadata?.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(displayName)}`;

  try {
    const { error } = await supabaseClient
      .from('quiz_scores')
      .insert([
        {
          user_id: currentUser?.id || null,
          user_email: currentUser?.email || null,
          user_name: displayName,
          user_avatar: avatar,
          score: data.score,
          total_questions: data.total,
          percentage: data.percentage,
          time_taken_seconds: data.timeTaken || 0
        }
      ]);

    if (error) {
      console.warn('Error recording score in database:', error.message);
    } else {
      // Score saved, refresh leaderboard view if open
      loadLeaderboard();
    }
  } catch (err) {
    console.error('Failed to save score:', err);
  }
}

// 9. Live Leaderboard System & Supabase Realtime
async function loadLeaderboard() {
  if (!supabaseClient) {
    leaderboardList.innerHTML = `<div class="empty-state">Database not connected</div>`;
    return;
  }

  leaderboardList.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <span>Fetching rank telemetry…</span>
    </div>
  `;

  try {
    const { data, error } = await supabaseClient
      .from('quiz_scores')
      .select('*')
      .order('score', { ascending: false })
      .order('time_taken_seconds', { ascending: true })
      .limit(50);

    if (error) throw error;

    if (!data || data.length === 0) {
      leaderboardList.innerHTML = `<div class="empty-state">No engineer records yet. Complete a quiz to be #1!</div>`;
      return;
    }

    leaderboardList.innerHTML = data.map((entry, idx) => {
      const rank = idx + 1;
      const topClass = rank === 1 ? 'top-1' : rank === 2 ? 'top-2' : rank === 3 ? 'top-3' : '';
      const isMe = currentUser && (entry.user_id === currentUser.id || entry.user_email === currentUser.email);
      const mins = Math.floor(entry.time_taken_seconds / 60);
      const secs = entry.time_taken_seconds % 60;

      return `
        <div class="rank-row ${topClass} ${isMe ? 'highlight-me' : ''}">
          <div class="rank-num">#${rank}</div>
          <div class="rank-user-info">
            <img class="rank-avatar" src="${entry.user_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(entry.user_name)}`}" alt="Avatar" onerror="this.src='https://api.dicebear.com/7.x/bottts/svg?seed=engineer'" />
            <div class="rank-names">
              <span class="rank-display-name">${escapeHtml(entry.user_name)} ${isMe ? '(You)' : ''}</span>
              <span class="rank-meta-text">${mins}m ${secs}s • ${new Date(entry.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div class="rank-scores-block">
            <span class="rank-marks-value">${entry.score}/${entry.total_questions}</span>
            <span class="rank-percent-badge">${entry.percentage}%</span>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    leaderboardList.innerHTML = `<div class="empty-state">Error loading leaderboard: ${err.message}</div>`;
  }
}

function setupSupabaseRealtime() {
  if (!supabaseClient) return;
  
  supabaseClient
    .channel('quiz-leaderboard-changes')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quiz_scores' }, (payload) => {
      // If modal is open, re-render immediately
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

// 10. Event Listeners Setup
function setupEventListeners() {
  soundToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
  });

  viewLeaderboardBtn.addEventListener('click', openLeaderboard);
  closeLeaderboardBtn.addEventListener('click', () => leaderboardModal.classList.add('hidden'));
  closeModalActionBtn.addEventListener('click', () => leaderboardModal.classList.add('hidden'));

  leaderboardModal.addEventListener('click', (e) => {
    if (e.target === leaderboardModal) leaderboardModal.classList.add('hidden');
  });

  googleSignInBtn.addEventListener('click', signInWithGoogle);
  modalGoogleSignInBtn.addEventListener('click', signInWithGoogle);
  signOutBtn.addEventListener('click', signOut);

  closeAuthPromptBtn.addEventListener('click', () => {
    authPromptModal.classList.add('hidden');
  });

  guestSubmitBtn.addEventListener('click', () => {
    const callsign = guestCallsignInput.value.trim() || 'Anonymous Engineer';
    if (pendingSubmissionData) {
      saveScoreToLeaderboard(pendingSubmissionData, callsign);
      pendingSubmissionData = null;
    }
    authPromptModal.classList.add('hidden');
    openLeaderboard();
  });
}

// Start application
init();
