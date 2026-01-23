const API_BASE = (window.CONFIG && window.CONFIG.API_BASE) || 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signupForm');
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirm-password');
  const loginLink = document.querySelector('.login-link a');
  const formMessage = document.getElementById('form-message');

  loginLink.setAttribute('href', '/login');

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  function validateUsername(v) {
    if (!v || v.trim().length < 3) return 'Full name must be at least 3 characters';
    return '';
  }
  function validatePassword(v) {
    if (!v) return 'Password is required';
    if (v.length < 8) return 'Password must be at least 8 characters';
    if (!/[a-z]/.test(v) || !/[A-Z]/.test(v) || !/\d/.test(v)) return 'Password must contain uppercase, lowercase and number';
    return '';
  }

  usernameInput.addEventListener('input', () => setFieldError(usernameInput, validateUsername(usernameInput.value)));
  emailInput.addEventListener('input', () => setFieldError(emailInput, emailRe.test(emailInput.value.trim().toLowerCase()) ? '' : 'Email must be valid'));
  passwordInput.addEventListener('input', () => {
    setFieldError(passwordInput, validatePassword(passwordInput.value));
    setFieldError(confirmInput, passwordInput.value === confirmInput.value ? '' : 'Passwords do not match');
  });
  confirmInput.addEventListener('input', () => setFieldError(confirmInput, passwordInput.value === confirmInput.value ? '' : 'Passwords do not match'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setFormMessage('', '');

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const confirm = confirmInput.value;

    const usernameErr = validateUsername(username);
    const emailErr = emailRe.test(email) ? '' : 'Email must be valid';
    const pwErr = validatePassword(password);
    const confirmErr = password === confirm ? '' : 'Passwords do not match';

    setFieldError(usernameInput, usernameErr);
    setFieldError(emailInput, emailErr);
    setFieldError(passwordInput, pwErr);
    setFieldError(confirmInput, confirmErr);

    if (usernameErr || emailErr || pwErr || confirmErr) {
      setFormMessage('Please fix the errors above', 'error');
      return;
    }

    setFormMessage('Registering...', '');
    try {
      console.log('Sending registration request', { fullName: username, email });
      const res = await fetch(`${API_BASE}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: username, email, password }),
      });

      let bodyText = null;
      let json = null;
      try {
        bodyText = await res.text();
        try {
          json = bodyText ? JSON.parse(bodyText) : null;
        } catch (parseErr) {
          json = null;
        }
      } catch (readErr) {
        console.error('Error reading registration response body:', readErr);
      }

      console.log('Registration response:', res.status, res.statusText, json || bodyText);

      if (!res.ok) {
        const serverMessage = (json && (json.message || (json.errors && json.errors.join('\n')))) || bodyText || `Registration failed (${res.status})`;
        setFormMessage(serverMessage, 'error');

        if (json && Array.isArray(json.errors)) {
          json.errors.forEach((errMsg) => {
            if (/full name|fullName|name/i.test(errMsg)) setFieldError(usernameInput, errMsg);
            if (/email/i.test(errMsg)) setFieldError(emailInput, errMsg);
            if (/password/i.test(errMsg)) setFieldError(passwordInput, errMsg);
          });
        }

        return;
      }

      setFormMessage('Registration succeeded. Redirecting to login...', 'success');
      setTimeout(() => window.location.href = '/login', 900);
    } catch (err) {
      console.error('Network or other error during registration:', err);
      setFormMessage(`Registration error: ${err.message || err}`, 'error');
    }
  });
});