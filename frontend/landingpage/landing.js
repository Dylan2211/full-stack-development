document.addEventListener('DOMContentLoaded', () => {
  const ctaBtn = document.querySelector('.cta-button');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      window.location.href = '../login/login.html';
    });
  }
});
