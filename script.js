// Initialize Supabase Client
const SUPABASE_URL = 'https://wtbojotyzjvzywaqykbn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0Ym9qb3R5emp2enl3YXF5a2JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2Njg3ODYsImV4cCI6MjEwMzI0NDc4Nn0.hseExg_69fR025A8V_vxQmlG75AbUAj2TOdQGjCr2L0'; 
const _supabase = (typeof supabase !== 'undefined') ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Global State
let userEmail = localStorage.getItem('userEmail') || '';
let userName = localStorage.getItem('userName') || '';
let playerScore = parseInt(localStorage.getItem('playerScore') || '0', 10);

const isFormPage = !!(document.getElementById('step-email') || document.getElementById('auth-form'));

// ==========================================
// 1. HOMEPAGE & GAMES LOGIC (index.html)
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
  const viewRPS = document.getElementById('view-game-rps');
  const viewTTT = document.getElementById('view-game-ttt');
  const viewGuess = document.getElementById('view-game-guess');

  const allViews = [viewHome, viewLeaderboard, viewProfile, viewRPS, viewTTT, viewGuess];

  // Global score display setup
  const globalScoreDisplay = document.getElementById('global-score-display');
  if (globalScoreDisplay) {
    globalScoreDisplay.textContent = playerScore;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const justSignedIn = urlParams.get('signedin') === 'true';
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  // 5-Second Sign In Prompt Modal
  if (!isLoggedIn && !justSignedIn && modalAuthPrompt) {
    setTimeout(() => {
      if (!localStorage.getItem('isLoggedIn')) {
        modalAuthPrompt.classList.remove('hidden');
      }
    }, 5000);
  }

  // Username prompt modal check
  if ((justSignedIn || (isLoggedIn && !userName)) && modalUsernamePrompt) {
    modalUsernamePrompt.classList.remove('hidden');
  }

  if (btnGoToLogin) {
    btnGoToLogin.addEventListener('click', () => {
      window.location.href = 'form.html';
    });
  }

  if (btnSaveUsername) {
    btnSaveUsername.addEventListener('click', async () => {
      const val = usernameInput ? usernameInput.value.trim() : '';
      if (!val) {
        if (usernameError) {
          usernameError.textContent = 'Enter a username.';
          usernameError.style.display = 'block';
        }
        return;
      }

      if (_supabase) {
        const { data: existingUser } = await _supabase
          .from('leaderboard')
          .select('username')
          .ilike('username', val)
          .maybeSingle();

        if (existingUser && existingUser.username.toLowerCase() !== userName.toLowerCase()) {
          if (usernameError) {
            usernameError.textContent = 'Username taken! Pick another.';
            usernameError.style.display = 'block';
          }
          return;
        }
      }

      if (usernameError) usernameError.style.display = 'none';
      userName = val;
      localStorage.setItem('userName', userName);
      localStorage.setItem('isLoggedIn', 'true');
      if (modalUsernamePrompt) modalUsernamePrompt.classList.add('hidden');

      updateProfileUI();
      await saveScoreToSupabase();
    });
  }

  // Safe Navigation Switching Logic
  function switchView(targetView, activeNavBtn = null) {
    allViews.forEach(v => {
      if (v) v.classList.add('hidden');
    });

    [navHome, navLeaderboard, navProfile].forEach(b => {
      if (b) b.classList.remove('active');
    });

    if (targetView) targetView.classList.remove('hidden');
    if (activeNavBtn) activeNavBtn.classList.add('active');

    if (targetView === viewLeaderboard) fetchSupabaseLeaderboard();
    if (targetView === viewProfile) updateProfileUI();
    if (targetView === viewHome && globalScoreDisplay) {
      globalScoreDisplay.textContent = playerScore;
    }
  }

  if (navHome) navHome.addEventListener('click', () => switchView(viewHome, navHome));
  if (navLeaderboard) navLeaderboard.addEventListener('click', () => switchView(viewLeaderboard, navLeaderboard));
  if (navProfile) navProfile.addEventListener('click', () => switchView(viewProfile, navProfile));

  // Quit / Close Button Logic
  document.querySelectorAll('.btn-close').forEach(btn => {
    btn.addEventListener('click', () => {
      switchView(viewHome, navHome);
    });
  });

  // --- GAME 1: ROCK PAPER SCISSORS (10 Rounds) ---
  let rpsRound = 1;
  let rpsMatchScore = 0;
  const btnOpenRPS = document.getElementById('btn-open-rps');

  if (btnOpenRPS) {
    btnOpenRPS.addEventListener('click', () => {
      rpsRound = 1;
      rpsMatchScore = 0;
      const rpsRoundEl = document.getElementById('rps-round');
      const rpsScoreEl = document.getElementById('rps-match-score');
      const rpsStatusEl = document.getElementById('rps-status');

      if (rpsRoundEl) rpsRoundEl.textContent = `${rpsRound}/10`;
      if (rpsScoreEl) rpsScoreEl.textContent = rpsMatchScore;
      if (rpsStatusEl) rpsStatusEl.textContent = 'Choose your move to start';
      document.querySelectorAll('.rps-btn, .choice-btn').forEach(b => b.disabled = false);
      switchView(viewRPS);
    });
  }

  document.querySelectorAll('.rps-btn, .choice-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const playerChoice = btn.getAttribute('data-choice');
      if (!playerChoice) return;

      const choices = ['rock', 'paper', 'scissors'];
      const aiChoice = choices[Math.floor(Math.random() * 3)];
      const statusEl = document.getElementById('rps-status');
      const rpsScoreEl = document.getElementById('rps-match-score');
      const rpsRoundEl = document.getElementById('rps-round');

      let result = '';
      if (playerChoice === aiChoice) {
        result = `Draw! Both picked ${playerChoice}.`;
      } else if (
        (playerChoice === 'rock' && aiChoice === 'scissors') ||
        (playerChoice === 'paper' && aiChoice === 'rock') ||
        (playerChoice === 'scissors' && aiChoice === 'paper')
      ) {
        rpsMatchScore++;
        result = `Win! ${playerChoice} beats ${aiChoice}.`;
      } else {
        result = `Lose! ${aiChoice} beats ${playerChoice}.`;
      }

      if (rpsScoreEl) rpsScoreEl.textContent = rpsMatchScore;

      if (rpsRound >= 10) {
        if (statusEl) statusEl.textContent = `Match Over! Scored ${rpsMatchScore} Pts. Returning...`;
        document.querySelectorAll('.rps-btn, .choice-btn').forEach(b => b.disabled = true);

        playerScore += rpsMatchScore;
        localStorage.setItem('playerScore', playerScore);
        await saveScoreToSupabase();

        setTimeout(() => switchView(viewHome, navHome), 2200);
      } else {
        if (statusEl) statusEl.textContent = result;
        rpsRound++;
        if (rpsRoundEl) rpsRoundEl.textContent = `${rpsRound}/10`;
      }
    });
  });

  // --- GAME 2: TIC TAC TOE (+5 PTS) ---
  let tttBoard = ["", "", "", "", "", "", "", "", ""];
  let tttActive = false;
  const boardEl = document.getElementById('ttt-board');
  const tttStatus = document.getElementById('ttt-status');
  const btnOpenTTT = document.getElementById('btn-open-ttt');

  if (btnOpenTTT) {
    btnOpenTTT.addEventListener('click', () => {
      tttBoard = ["", "", "", "", "", "", "", "", ""];
      tttActive = true;
      if (tttStatus) tttStatus.textContent = "You are X. It's your turn!";
      if (boardEl) {
        boardEl.innerHTML = '';
        for (let i = 0; i < 9; i++) {
          const cell = document.createElement('button');
          cell.classList.add('ttt-cell');
          cell.addEventListener('click', () => handleTttClick(i, cell));
          boardEl.appendChild(cell);
        }
      }
      switchView(viewTTT);
    });
  }

  async function handleTttClick(index, cell) {
    if (!tttActive || tttBoard[index] !== "") return;

    tttBoard[index] = "X";
    cell.textContent = "X";

    if (checkTttWin("X")) {
      tttActive = false;
      if (tttStatus) tttStatus.textContent = "You won! +5 Global Points.";
      playerScore += 5;
      localStorage.setItem('playerScore', playerScore);
      await saveScoreToSupabase();
      setTimeout(() => switchView(viewHome, navHome), 2000);
      return;
    }

    if (!tttBoard.includes("")) {
      tttActive = false;
      if (tttStatus) tttStatus.textContent = "It's a draw!";
      setTimeout(() => switchView(viewHome, navHome), 2000);
      return;
    }

    tttActive = false;
    if (tttStatus) tttStatus.textContent = "AI is thinking...";

    setTimeout(async () => {
      let emptyCells = tttBoard.map((v, i) => v === "" ? i : null).filter(v => v !== null);
      if (emptyCells.length === 0) return;
      let aiPick = emptyCells[Math.floor(Math.random() * emptyCells.length)];

      tttBoard[aiPick] = "O";
      if (boardEl && boardEl.children[aiPick]) {
        boardEl.children[aiPick].textContent = "O";
      }

      if (checkTttWin("O")) {
        tttActive = false;
        if (tttStatus) tttStatus.textContent = "AI won! Returning...";
        setTimeout(() => switchView(viewHome, navHome), 2000);
      } else if (!tttBoard.includes("")) {
        tttActive = false;
        if (tttStatus) tttStatus.textContent = "It's a draw!";
        setTimeout(() => switchView(viewHome, navHome), 2000);
      } else {
        tttActive = true;
        if (tttStatus) tttStatus.textContent = "Your turn (X).";
      }
    }, 500);
  }

  function checkTttWin(p) {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return wins.some(w => tttBoard[w[0]] === p && tttBoard[w[1]] === p && tttBoard[w[2]] === p);
  }

  // --- GAME 3: NUMBER GUESSER (+10 PTS) ---
  let guessTarget = 0;
  let guessLives = 5;
  const btnOpenGuess = document.getElementById('btn-open-guess');
  const btnGuessSubmit = document.getElementById('btn-guess-submit');

  if (btnOpenGuess) {
    btnOpenGuess.addEventListener('click', () => {
      guessTarget = Math.floor(Math.random() * 50) + 1;
      guessLives = 5;
      const guessLivesEl = document.getElementById('guess-lives');
      const guessStatusEl = document.getElementById('guess-status');
      const guessInputEl = document.getElementById('guess-input');

      if (guessLivesEl) guessLivesEl.textContent = guessLives;
      if (guessStatusEl) guessStatusEl.textContent = 'Guess a number between 1 and 50';
      if (guessInputEl) {
        guessInputEl.value = '';
        guessInputEl.disabled = false;
      }
      if (btnGuessSubmit) btnGuessSubmit.disabled = false;
      switchView(viewGuess);
    });
  }

  if (btnGuessSubmit) {
    btnGuessSubmit.addEventListener('click', async () => {
      const inputEl = document.getElementById('guess-input');
      const val = parseInt(inputEl ? inputEl.value : '', 10);
      const statusEl = document.getElementById('guess-status');
      const guessLivesEl = document.getElementById('guess-lives');

      if (isNaN(val) || val < 1 || val > 50) {
        if (statusEl) statusEl.textContent = "Enter a number between 1 and 50.";
        return;
      }

      if (val === guessTarget) {
        if (statusEl) statusEl.textContent = "Correct! +10 Global Points!";
        if (inputEl) inputEl.disabled = true;
        btnGuessSubmit.disabled = true;

        playerScore += 10;
        localStorage.setItem('playerScore', playerScore);
        await saveScoreToSupabase();
        setTimeout(() => switchView(viewHome, navHome), 2000);
      } else {
        guessLives--;
        if (guessLivesEl) guessLivesEl.textContent = guessLives;
        if (guessLives <= 0) {
          if (statusEl) statusEl.textContent = `Out of lives! Number was ${guessTarget}.`;
          if (inputEl) inputEl.disabled = true;
          btnGuessSubmit.disabled = true;
          setTimeout(() => switchView(viewHome, navHome), 2200);
        } else {
          if (statusEl) statusEl.textContent = val > guessTarget ? "Too high!" : "Too low!";
        }
      }
    });
  }

  // --- SUPABASE RANKING SYNC ---
  async function saveScoreToSupabase() {
    if (!userName || !_supabase) return;
    try {
      const { data: existingRecord } = await _supabase
        .from('leaderboard')
        .select('score')
        .eq('username', userName)
        .maybeSingle();

      if (existingRecord) {
        await _supabase.from('leaderboard').update({ score: playerScore }).eq('username', userName);
      } else {
        await _supabase.from('leaderboard').insert([{ username: userName, score: playerScore }]);
      }
    } catch (err) {
      console.error("Database sync error:", err);
    }
  }

  async function fetchSupabaseLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Loading rankings...</td></tr>';

    if (!_supabase) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#ef4444;">Database unavailable.</td></tr>';
      return;
    }

    const { data, error } = await _supabase
      .from('leaderboard')
      .select('username, score')
      .order('score', { ascending: false })
      .limit(10);

    if (error || !data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No rankings yet. Play to rank up!</td></tr>';
      return;
    }

    tbody.innerHTML = data.map((entry, idx) => `
      <tr>
        <td>#${idx + 1}</td>
        <td>${entry.username}</td>
        <td>${entry.score}</td>
      </tr>
    `).join('');
  }

  function updateProfileUI() {
    const nameEl = document.getElementById('profile-display-name');
    const emailEl = document.getElementById('profile-display-email');
    const winsEl = document.getElementById('profile-wins');
    const btnLogout = document.getElementById('btn-logout');

    if (nameEl) nameEl.textContent = userName || 'Guest Player';
    if (emailEl) emailEl.textContent = userEmail || 'Not Signed In';
    if (winsEl) winsEl.textContent = playerScore;

    if (btnLogout) {
      if (localStorage.getItem('isLoggedIn') !== 'true') {
        btnLogout.textContent = 'Sign In';
        btnLogout.onclick = () => window.location.href = 'form.html';
      } else {
        btnLogout.textContent = 'Sign Out';
        btnLogout.onclick = () => {
          localStorage.clear();
          playerScore = 0;
          window.location.href = 'form.html';
        };
      }
    }

    if (_supabase && userName) {
      _supabase
        .from('leaderboard')
        .select('username')
        .order('score', { ascending: false })
        .then(({ data }) => {
          if (data) {
            const rank = data.findIndex(e => e.username.toLowerCase() === userName.toLowerCase()) + 1;
            const rankEl = document.getElementById('profile-rank');
            if (rankEl) rankEl.textContent = rank > 0 ? `#${rank}` : '#--';
          }
        });
    }
  }

// ==========================================
// 2. FORM & SIGN UP LOGIC (form.html)
// ==========================================
} else {
  const emailStep = document.getElementById('step-email');
  const passwordStep = document.getElementById('step-password');
  const emailInput = document.getElementById('email-input');
  const passwordInput = document.getElementById('password-input');
  const emailError = document.getElementById('email-error');
  const authError = document.getElementById('auth-error');
  const btnNext = document.getElementById('btn-next');
  const btnBack = document.getElementById('btn-back');
  const btnSubmit = document.getElementById('btn-submit');
  const togglePass = document.getElementById('toggle-password');
  const displayUserEmail = document.getElementById('display-user-email');
  const linkToggleMode = document.getElementById('link-toggle-mode');
  const authForm = document.getElementById('auth-form');

  let isSignUpMode = true;

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim().toLowerCase());
  }

  // Next Button Handler
  if (btnNext) {
    btnNext.addEventListener('click', (e) => {
      e.preventDefault();
      const emailValue = emailInput ? emailInput.value.trim() : '';

      if (emailError) emailError.style.display = 'none';

      if (!emailValue || !isValidEmail(emailValue)) {
        if (emailError) {
          emailError.textContent = 'Please enter a valid email address.';
          emailError.style.display = 'block';
        }
        return;
      }

      if (displayUserEmail) displayUserEmail.textContent = emailValue;
      if (emailStep) emailStep.classList.add('hidden');
      if (passwordStep) passwordStep.classList.remove('hidden');
    });
  }

  // Handle "Enter" key on email field
  if (emailInput) {
    emailInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (btnNext) btnNext.click();
      }
    });
  }

  // Back Button Handler
  if (btnBack) {
    btnBack.addEventListener('click', (e) => {
      e.preventDefault();
      if (authError) authError.style.display = 'none';
      if (passwordStep) passwordStep.classList.add('hidden');
      if (emailStep) emailStep.classList.remove('hidden');
    });
  }

  // Toggle Password Visibility
  if (togglePass && passwordInput) {
    togglePass.addEventListener('change', () => {
      passwordInput.type = togglePass.checked ? 'text' : 'password';
    });
  }

  // Toggle Between Sign Up / Sign In
  if (linkToggleMode) {
    linkToggleMode.addEventListener('click', (e) => {
      e.preventDefault();
      isSignUpMode = !isSignUpMode;
      if (btnSubmit) btnSubmit.textContent = isSignUpMode ? 'Sign Up' : 'Sign In';
      linkToggleMode.textContent = isSignUpMode ? 'Sign In' : 'Sign Up';
    });
  }

  // Form Submission
  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

      if (authError) authError.style.display = 'none';

      if (!password || password.length < 6) {
        if (authError) {
          authError.textContent = 'Password must be at least 6 characters.';
          authError.style.display = 'block';
        }
        return;
      }

      if (!_supabase) {
        if (authError) {
          authError.textContent = 'Supabase client not initialized.';
          authError.style.display = 'block';
        }
        return;
      }

      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Processing...';
      }

      try {
        let res;
        if (isSignUpMode) {
          res = await _supabase.auth.signUp({ email, password });
        } else {
          res = await _supabase.auth.signInWithPassword({ email, password });
        }

        if (res.error) {
          if (authError) {
            authError.textContent = res.error.message;
            authError.style.display = 'block';
          }
          if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.textContent = isSignUpMode ? 'Sign Up' : 'Sign In';
          }
        } else {
          localStorage.setItem('userEmail', email);
          localStorage.setItem('isLoggedIn', 'true');
          window.location.href = 'index.html?signedin=true';
        }
      } catch (err) {
        if (authError) {
          authError.textContent = 'An unexpected error occurred.';
          authError.style.display = 'block';
        }
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = isSignUpMode ? 'Sign Up' : 'Sign In';
        }
      }
    });
  }
}
