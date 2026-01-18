const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const API_BASE = 'http://localhost:3000';

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

  // Step 1: send reset request to backend
  forgotForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMessage(forgotMessage, '', '');

    const email = emailInput.value.trim();
    const emailErr = emailRe.test(email) ? '' : 'Please enter a valid email';
    setFieldError(emailInput, emailErr);

    if (emailErr) {
      setMessage(forgotMessage, 'Please correct your email.', 'error');
      return;
    }

    setMessage(forgotMessage, 'Sending reset request...', 'info');

    try {
      const res = await fetch(`${API_BASE}/api/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok) {
        setMessage(forgotMessage, 'If this email exists, a reset link has been sent.', 'success');

        // In development, backend returns resetToken; use it to redirect
        const token = json.resetToken || 'mock-token';
        setTimeout(() => {
          window.location.href = `${window.location.pathname}?token=${token}`;
        }, 800);
      } else {
        setMessage(forgotMessage, json.message || 'Error sending reset request.', 'error');
      }
    } catch (err) {
      console.error(err);
      setMessage(forgotMessage, 'Something went wrong. Please try again.', 'error');
    }
  });

  // Step 2: set the new password
  resetForm?.addEventListener('submit', async (e) => {
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

    setMessage(resetMessage, 'Resetting password...', 'info');

    try {
      const res = await fetch(`${API_BASE}/api/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok) {
        setMessage(resetMessage, 'Password reset successfully.', 'success');

        // Clear fields and messages shortly after success, then redirect to login
        setTimeout(() => {
          newPasswordInput.value = '';
          confirmPasswordInput.value = '';
          setMessage(resetMessage, '', '');
          window.location.href = '../login/login.html';
        }, 1500);
      } else {
        setMessage(resetMessage, json.message || 'Failed to reset password.', 'error');
      }
    } catch (err) {
      console.error(err);
      setMessage(resetMessage, 'Something went wrong. Please try again.', 'error');
    }
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