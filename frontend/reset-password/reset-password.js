const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  const step1 = document.getElementById('step-1-forgot-password');
  const step2 = document.getElementById('step-2-reset-password');
  const forgotForm = document.getElementById('forgotForm');
  const resetForm = document.getElementById('resetForm');
  const forgotMessage = document.getElementById('forgot-message');
  const resetMessage = document.getElementById('reset-message');

  const emailInput = document.getElementById('email');
  const newPasswordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');

  // Show the right step based on whether a token is present (simulated link)
  if (token) {
    step1.style.display = 'none';
    step2.style.display = 'block';
  } else {
    step1.style.display = 'block';
    step2.style.display = 'none';
  }

  function setFieldError(input, msg) {
    if (!input) return;
    const errorEl = document.getElementById(`${input.id}-error`);
    if (errorEl) errorEl.textContent = msg || '';
    input.classList.toggle('input-invalid', !!msg);
  }

  function setMessage(el, msg, type) {
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'form-message';
    if (msg) el.classList.add('visible', type || 'info');
  }

  function validatePassword(password) {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    return '';
  }

  // Step 1: pretend to send a reset link
  forgotForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    setMessage(forgotMessage, '', '');

    const email = emailInput.value.trim();
    const emailErr = emailRe.test(email) ? '' : 'Please enter a valid email';
    setFieldError(emailInput, emailErr);

    if (emailErr) {
      setMessage(forgotMessage, 'Please correct your email.', 'error');
      return;
    }

    setMessage(forgotMessage, 'If this email exists, a reset link has been sent.', 'success');

    // Simulate email verified + redirect with a mock token
    setTimeout(() => {
      window.location.href = `${window.location.pathname}?token=mock-token`;
    }, 800);
  });

  // Step 2: set the new password
  resetForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    setMessage(resetMessage, '', '');

    const password = newPasswordInput.value;
    const confirm = confirmPasswordInput.value;

    const pwErr = validatePassword(password);
    const confirmErr = password === confirm ? '' : 'Passwords do not match';

    setFieldError(newPasswordInput, pwErr);
    setFieldError(confirmPasswordInput, confirmErr);

    if (pwErr || confirmErr) {
      setMessage(resetMessage, 'Please fix the errors above.', 'error');
      return;
    }

    setMessage(resetMessage, 'Password reset successfully.', 'success');

    // Clear fields and messages shortly after success
    setTimeout(() => {
      newPasswordInput.value = '';
      confirmPasswordInput.value = '';
      setMessage(resetMessage, '', '');
    }, 1500);
  });

  // Clear messages on input changes
  emailInput?.addEventListener('input', () => {
    setFieldError(emailInput, '');
    setMessage(forgotMessage, '', '');
  });

  newPasswordInput?.addEventListener('input', () => {
    setFieldError(newPasswordInput, '');
    setMessage(resetMessage, '', '');
  });

  confirmPasswordInput?.addEventListener('input', () => {
    setFieldError(confirmPasswordInput, '');
    setMessage(resetMessage, '', '');
  });
});