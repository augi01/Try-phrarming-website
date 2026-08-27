// Initialize Supabase Client
const SUPABASE_URL = 'https://wtbojotyzjvzywaqykbn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0Ym9qb3R5emp2enl3YXF5a2JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2Njg3ODYsImV4cCI6MjEwMzI0NDc4Nn0.hseExg_69fR025A8V_vxQmlG75AbUAj2TOdQGjCr2L0'; 
const _supabase = (typeof supabase !== 'undefined') ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Global State
let userEmail = localStorage.getItem('userEmail') || '';
let userName = localStorage.getItem('userName') || '';
let playerScore = parseInt(localStorage.getItem('playerScore') || '0', 10);

const isFormPage = !!document.getElementById('step-email');

// ==========================================
// HOMEPAGE & GAMES LOGIC
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
  if (document.getElementById('global-score-display')) {
    document.getElementById('global-score-display').textContent = playerScore;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const justSignedIn = urlParams.get('signedin') === 'true';
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  // 5-Second Sign In Prompt Modal
  if (!isLoggedIn && !justSignedIn) {
    setTimeout(() => {
      if (!localStorage.getItem('isLoggedIn')) {
        modalAuthPrompt.classList.remove('hidden');
      }
    }, 5000);
  }

  // Username prompt modal check
  if (justSignedIn || (isLoggedIn && !userName)) {
    modalUsernamePrompt.classList.remove('hidden');
  }

  btnGoToLogin.addEventListener('click', () => {
    window.location.href = 'form.html';
  });

  btnSaveUsername.addEventListener('click', async () => {
    const val = usernameInput.value.trim();
    if (!val) {
      usernameError.textContent = 'Enter a username.';
      usernameError.style.display = 'block';
      return;
    }

    if (_supabase) {
      const { data: existingUser } = await _supabase
        .from('leaderboard')
        .select('username')
        .ilike('username', val)
        .maybeSingle();

      if (existingUser && existingUser.username.toLowerCase() !== userName.toLowerCase()) {
        usernameError.textContent = 'Username taken! Pick another.';
        usernameError.style.display = 'block';
        return;
      }
    }

    usernameError.style.display = 'none';
    userName = val;
    localStorage.setItem('userName', userName);
    localStorage.setItem('isLoggedIn', 'true');
    modalUsernamePrompt.classList.add('hidden');

    updateProfileUI();
    await saveScoreToSupabase();
  });

  // Navigation Logic
  function switchView(targetView, activeNavBtn = null) {
    allViews.forEach(v => v.classList.add('hidden'));
    [navHome, navLeaderboard, navProfile].forEach(b => b.classList.remove('active'));

    targetView.classList.remove('hidden');
    if (activeNavBtn) activeNavBtn.classList.add('active');

    if (targetView === viewLeaderboard) fetchSupabaseLeaderboard();
    if (targetView === viewProfile) updateProfileUI();
    if (targetView === viewHome) {
      document.getElementById('global-score-display').textContent = playerScore;
    }
  }

  navHome.addEventListener('click', () => switchView(viewHome, navHome));
  navLeaderboard.addEventListener('click', () => switchView(viewLeaderboard, navLeaderboard));
  navProfile.addEventListener('click', () => switchView(viewProfile, navProfile));

  // Quit / Close Button Logic (Returns to Home without saving extra points)
  document.querySelectorAll('.btn-close-box').forEach(btn => {
    btn.addEventListener('click', () => {
      switchView(viewHome, navHome);
    });
  });

  // --- GAME 1: ROCK PAPER SCISSORS (10 Rounds) ---
  let rpsRound = 1;
  let rpsMatchScore = 0;

  document.getElementById('btn-open-rps').addEventListener('click', () => {
    rpsRound = 1;
    rpsMatchScore = 0;
    document.getElementById('rps-round').textContent = `${rpsRound}/10`;
    document.getElementById('rps-match-score').textContent = rpsMatchScore;
    document.getElementById('rps-status').textContent = 'Choose your move to start';
    document.querySelectorAll('.rps-btn').forEach(b => b.disabled = false);
    switchView(viewRPS);
  });

  document.querySelectorAll('.rps-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const playerChoice = btn.getAttribute('data-choice');
      const choices = ['rock', 'paper', 'scissors'];
      const aiChoice = choices[Math.floor(Math.random() * 3)];
      const statusEl = document.getElementById('rps-status');

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

      document.getElementById('rps-match-score').textContent = rpsMatchScore;

      if (rpsRound >= 10) {
        statusEl.textContent = `Match Over! Scored ${rpsMatchScore} Pts. Returning...`;
        document.querySelectorAll('.rps-btn').forEach(b => b.disabled = true);

        playerScore += rpsMatchScore;
        localStorage.setItem('playerScore', playerScore);
        await saveScoreToSupabase();

        setTimeout(() => switchView(viewHome, navHome), 2200);
      } else {
        statusEl.textContent = result;
        rpsRound++;
        document.getElementById('rps-round').textContent = `${rpsRound}/10`;
      }
    });
  });

  // --- GAME 2: TIC TAC TOE (+5 PTS) ---
  let tttBoard = ["", "", "", "", "", "", "", "", ""];
  let tttActive = false;
  const boardEl = document.getElementById('ttt-board');
  const tttStatus = document.getElementById('ttt-status');

  document.getElementById('btn-open-ttt').addEventListener('click', () => {
    tttBoard = ["", "", "", "", "", "", "", "", ""];
    tttActive = true;
    tttStatus.textContent = "You are X. It's your turn!";
    boardEl.innerHTML = '';

    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('button');
      cell.classList.add('ttt-cell');
      cell.addEventListener('click', () => handleTttClick(i, cell));
      boardEl.appendChild(cell);
    }
    switchView(viewTTT);
  });

  async function handleTttClick(index, cell) {
    if (!tttActive || tttBoard[index] !== "") return;

    tttBoard[index] = "X";
    cell.textContent = "X";

    if (checkTttWin("X")) {
      tttActive = false;
      tttStatus.textContent = "You won! +5 Global Points.";
      playerScore += 5;
      localStorage.setItem('playerScore', playerScore);
      await saveScoreToSupabase();
      setTimeout(() => switchView(viewHome, navHome), 2000);
      return;
    }

    if (!tttBoard.includes("")) {
      tttActive = false;
      tttStatus.textContent = "It's a draw!";
      setTimeout(() => switchView(viewHome, navHome), 2000);
      return;
    }

    tttActive = false;
    tttStatus.textContent = "AI is thinking...";

    setTimeout(async () => {
      let emptyCells = tttBoard.map((v, i) => v === "" ? i : null).filter(v => v !== null);
      let aiPick = emptyCells[Math.floor(Math.random() * emptyCells.length)];

      tttBoard[aiPick] = "O";
      boardEl.children[aiPick].textContent = "O";

      if (checkTttWin("O")) {
        tttActive = false;
        tttStatus.textContent = "AI won! Returning...";
        setTimeout(() => switchView(viewHome, navHome), 2000);
      } else if (!tttBoard.includes("")) {
        tttActive = false;
        tttStatus.textContent = "It's a draw!";
        setTimeout(() => switchView(viewHome, navHome), 2000);
      } else {
        tttActive = true;
        tttStatus.textContent = "Your turn (X).";
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

  document.getElementById('btn-open-guess').addEventListener('click', () => {
    guessTarget = Math.floor(Math.random() * 50) + 1;
    guessLives = 5;
    document.getElementById('guess-lives').textContent = guessLives;
    document.getElementById('guess-status').textContent = 'Guess a number between 1 and 50';
    document.getElementById('guess-input').value = '';
    document.getElementById('guess-input').disabled = false;
    document.getElementById('btn-guess-submit').disabled = false;
    switchView(viewGuess);
  });

  document.getElementById('btn-guess-submit').addEventListener('click', async () => {
    const inputEl = document.getElementById('guess-input');
    const val = parseInt(inputEl.value, 10);
    const statusEl = document.getElementById('guess-status');

    if (isNaN(val) || val < 1 || val > 50) {
      statusEl.textContent = "Enter a number between 1 and 50.";
      return;
    }

    if (val === guessTarget) {
      statusEl.textContent = "Correct! +10 Global Points!";
      inputEl.disabled = true;
      document.getElementById('btn-guess-submit').disabled = true;

      playerScore += 10;
      localStorage.setItem('playerScore', playerScore);
      await saveScoreToSupabase();
      setTimeout(() => switchView(viewHome, navHome), 2000);
    } else {
      guessLives--;
      document.getElementById('guess-lives').textContent = guessLives;
      if (guessLives <= 0) {
        statusEl.textContent = `Out of lives! Number was ${guessTarget}.`;
        inputEl.disabled = true;
        document.getElementById('btn-guess-submit').disabled = true;
        setTimeout(() => switchView(viewHome, navHome), 2200);
      } else {
        statusEl.textContent = val > guessTarget ? "Too high!" : "Too low!";
      }
    }
  });

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
    document.getElementById('profile-display-name').textContent = userName || 'Guest Player';
    document.getElementById('profile-display-email').textContent = userEmail || 'Not Signed In';
    document.getElementById('profile-wins').textContent = playerScore;

    const btnLogout = document.getElementById('btn-logout');
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
