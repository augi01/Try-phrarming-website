// 2. FORM & SIGN UP LOGIC (form.html)
// ==========================================
} else {
  document.addEventListener('DOMContentLoaded', () => {
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
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
    }
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

    // Next Button Click Handler
    if (btnNext) {
      btnNext.addEventListener('click', (e) => {
        e.preventDefault();
        const emailValue = emailInput ? emailInput.value.trim() : '';
  // Next Button Handler
  if (btnNext) {
    btnNext.addEventListener('click', (e) => {
      e.preventDefault();
      const emailValue = emailInput ? emailInput.value.trim() : '';

        if (emailError) emailError.style.display = 'none';
      if (emailError) emailError.style.display = 'none';

        if (!emailValue || !isValidEmail(emailValue)) {
          if (emailError) {
            emailError.textContent = 'Please enter a valid email address.';
            emailError.style.display = 'block';
          }
          return;
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
      if (displayUserEmail) displayUserEmail.textContent = emailValue;
      if (emailStep) emailStep.classList.add('hidden');
      if (passwordStep) passwordStep.classList.remove('hidden');
    });
  }

    // Back Button Handler
    if (btnBack) {
      btnBack.addEventListener('click', (e) => {
  // Handle "Enter" key on email field
  if (emailInput) {
    emailInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
e.preventDefault();
        if (authError) authError.style.display = 'none';
        if (passwordStep) passwordStep.classList.add('hidden');
        if (emailStep) emailStep.classList.remove('hidden');
      });
    }
        btnNext.click();
      }
    });
  }

    // Toggle Password Visibility
    if (togglePass && passwordInput) {
      togglePass.addEventListener('change', () => {
        passwordInput.type = togglePass.checked ? 'text' : 'password';
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

    // Toggle Between Sign Up / Sign In
    if (linkToggleMode) {
      linkToggleMode.addEventListener('click', (e) => {
        e.preventDefault();
        isSignUpMode = !isSignUpMode;
        if (btnSubmit) btnSubmit.textContent = isSignUpMode ? 'Sign Up' : 'Sign In';
        linkToggleMode.textContent = isSignUpMode ? 'Sign In' : 'Sign Up';
      });
    }
  // Toggle Password Visibility
  if (togglePass && passwordInput) {
    togglePass.addEventListener('change', () => {
      passwordInput.type = togglePass.checked ? 'text' : 'password';
    });
  }

    // Supabase Authentication Submission
    if (authForm) {
      authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput ? emailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';
  // Toggle Between Sign Up / Sign In
  if (linkToggleMode) {
    linkToggleMode.addEventListener('click', (e) => {
      e.preventDefault();
      isSignUpMode = !isSignUpMode;
      if (btnSubmit) btnSubmit.textContent = isSignUpMode ? 'Sign Up' : 'Sign In';
      linkToggleMode.textContent = isSignUpMode ? 'Sign In' : 'Sign Up';
    });
  }

        if (authError) authError.style.display = 'none';
  // Form Submission
  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

        if (!password || password.length < 6) {
          if (authError) {
            authError.textContent = 'Password must be at least 6 characters.';
            authError.style.display = 'block';
          }
          return;
        }
      if (authError) authError.style.display = 'none';

        if (!_supabase) {
          if (authError) {
            authError.textContent = 'Supabase client not initialized.';
            authError.style.display = 'block';
          }
          return;
      if (!password || password.length < 6) {
        if (authError) {
          authError.textContent = 'Password must be at least 6 characters.';
          authError.style.display = 'block';
}
        return;
      }

        if (btnSubmit) {
          btnSubmit.disabled = true;
          btnSubmit.textContent = 'Processing...';
      if (!_supabase) {
        if (authError) {
          authError.textContent = 'Supabase client not initialized.';
          authError.style.display = 'block';
}
        return;
      }

        try {
          let res;
          if (isSignUpMode) {
            res = await _supabase.auth.signUp({ email, password });
          } else {
            res = await _supabase.auth.signInWithPassword({ email, password });
          }
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Processing...';
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
      try {
        let res;
        if (isSignUpMode) {
          res = await _supabase.auth.signUp({ email, password });
        } else {
          res = await _supabase.auth.signInWithPassword({ email, password });
        }

        if (res.error) {
if (authError) {
            authError.textContent = 'An unexpected error occurred.';
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
      });
    }
  });
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
