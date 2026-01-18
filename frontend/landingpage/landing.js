import { isLoggedIn } from '../auth-utils.js';

document.addEventListener('DOMContentLoaded', () => {
  if (isLoggedIn()) {
    window.location.href = '/dashboard';
  } else {
    const ctaBtn = document.querySelector('.cta-button');
    if (ctaBtn) {
      ctaBtn.addEventListener('click', () => {
        window.location.href = '/signup/signup.html';
      });
    }
  }
});
