const API_BASE = window.location.origin || '';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const forgotLink = document.querySelector('.forgot-password');
  const registerLink = document.querySelector('.signup-link a');
  const formMessage = document.getElementById('form-message');

  registerLink.setAttribute('href', '/signup/signup.html');

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

  emailInput.addEventListener('input', () => setFieldError(emailInput, emailRe.test(emailInput.value.trim()) ? '' : 'Email must be valid'));
  passwordInput.addEventListener('input', () => setFieldError(passwordInput, passwordInput.value ? '' : 'Password is required'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setFormMessage('', '');
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    const emailErr = emailRe.test(email) ? '' : 'Email must be valid';
    const pwErr = password ? '' : 'Password is required';
    setFieldError(emailInput, emailErr);
    setFieldError(passwordInput, pwErr);
    if (emailErr || pwErr) { setFormMessage('Please fix the errors above', 'error'); return; }

    setFormMessage('Logging in...', '');
    try {
      const res = await fetch(`${API_BASE}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormMessage(json.message || (json.errors && json.errors.join('\n')) || 'Login failed', 'error');
        return;
      }
      localStorage.setItem('authToken', json.token);
      window.location.href = '/kanban';
    } catch (err) {
      console.error(err);
      setFormMessage('Login error. See console for details.', 'error');
    }
  });

  forgotLink.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = prompt('Enter your email for password reset');
    if (!email) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (json.resetToken) alert('Reset token (dev): ' + json.resetToken);
      alert(json.message || 'If the email exists a reset link was sent.');
    } catch (err) {
      console.error(err);
      setFormMessage('Error sending reset request', 'error');
    }
  });
});
