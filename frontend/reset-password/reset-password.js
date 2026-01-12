const API_BASE = window.location.origin || '';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('resetForm');
  const verificationInput = document.getElementById('verification-code');
  const newPasswordInput = document.getElementById('new-password');
  const confirmInput = document.getElementById('confirm-password');

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (token) {
    if (verificationInput) verificationInput.parentElement.style.display = 'none';
  }

  const formMessage = document.getElementById('form-message');

  function setFieldError(input, msg) {
    const el = document.getElementById(`${input.id}-error`);
    if (el) el.textContent = msg || '';
    input.classList.toggle('input-invalid', !!msg);
  }
  function setFormMessage(msg, type) {
    if (!formMessage) return;
    formMessage.textContent = msg || '';
    formMessage.className = 'form-message' + (msg ? ' visible' : '') + (type ? ' ' + type : '');
  }

  function validatePassword(v) {
    if (!v) return 'Password is required';
    if (v.length < 8) return 'Password must be at least 8 characters';
    if (!/[a-z]/.test(v) || !/[A-Z]/.test(v) || !/\d/.test(v)) return 'Password must contain uppercase, lowercase and number';
    return '';
  }

  verificationInput && verificationInput.addEventListener('input', () => setFieldError(verificationInput, (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(verificationInput.value.trim()) ? '' : 'Email must be valid')));
  newPasswordInput.addEventListener('input', () => {
    setFieldError(newPasswordInput, validatePassword(newPasswordInput.value));
    setFieldError(confirmInput, newPasswordInput.value === confirmInput.value ? '' : 'Passwords do not match');
  });
  confirmInput.addEventListener('input', () => setFieldError(confirmInput, newPasswordInput.value === confirmInput.value ? '' : 'Passwords do not match'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setFormMessage('', '');

    if (token) {
      const newPassword = newPasswordInput.value;
      const confirm = confirmInput.value;
      const pwErr = validatePassword(newPassword);
      const confirmErr = newPassword === confirm ? '' : 'Passwords do not match';
      setFieldError(newPasswordInput, pwErr);
      setFieldError(confirmInput, confirmErr);
      if (pwErr || confirmErr) { setFormMessage('Please fix the errors above', 'error'); return; }

      setFormMessage('Resetting password...', '');
      try {
        const res = await fetch(`${API_BASE}/api/users/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword }),
        });
        const json = await res.json();
        if (!res.ok) { setFormMessage(json.message || 'Reset failed', 'error'); return; }
        setFormMessage('Password has been reset. Redirecting to login...', 'success');
        setTimeout(() => window.location.href = '/login/login.html', 900);
      } catch (err) {
        console.error(err);
        setFormMessage('Error processing request', 'error');
      }
    } else {
      const email = verificationInput.value.trim();
      const emailErr = (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ? '' : 'Email must be valid';
      setFieldError(verificationInput, emailErr);
      if (emailErr) { setFormMessage('Please fix the errors above', 'error'); return; }

      setFormMessage('Requesting reset link...', '');
      try {
        const res = await fetch(`${API_BASE}/api/users/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const json = await res.json();
        setFormMessage(json.message || 'If the email exists, a reset link was sent', 'success');
        if (json.resetToken) {
          alert('Reset token (dev): ' + json.resetToken);
        }
      } catch (err) {
        console.error(err);
        setFormMessage('Error processing request', 'error');
      }
    }
  });
});