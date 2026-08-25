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

// Validate Email & Go to Password Step
document.getElementById('btn-next').addEventListener('click', () => {
  const value = emailInput.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(value)) {
    emailError.style.display = 'block';
    return;
  }

  emailError.style.display = 'none';
  userEmail = value;

  // Change heading and switch privacy notice phrase to the email chip
  sideTitle.textContent = "Welcome";
  privacyNotice.classList.add('hidden');
  emailChip.classList.remove('hidden');
  document.getElementById('user-display-email').textContent = userEmail;

  stepEmail.classList.add('hidden');
  stepPassword.classList.remove('hidden');
});

// Toggle Password Visibility
const togglePassword = document.getElementById('toggle-password');
togglePassword.addEventListener('change', () => {
  passInput.type = togglePassword.checked ? 'text' : 'password';
});

// Validate Password & Trigger Loading State
document.getElementById('btn-login').addEventListener('click', () => {
  if (!passInput.value.trim()) {
    passError.style.display = 'block';
    return;
  }

  passError.style.display = 'none';

  stepPassword.classList.add('hidden');
  stepLoading.classList.remove('hidden');

  setTimeout(() => {
    loginView.classList.add('hidden');
    homeView.classList.remove('hidden');
  }, 1500);
});