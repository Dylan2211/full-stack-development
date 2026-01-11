// Immediate theme loader - runs before page render
(function() {
  const themes = {
    light: 'light.css',
    dark: 'colour.css'
  };

  const savedTheme = localStorage.getItem('selectedTheme') || 'light';

  if (savedTheme !== 'light') {
    const link = document.createElement('link');
    link.id = 'theme-css';
    link.rel = 'stylesheet';
    link.href = `colour/${themes[savedTheme]}`;
    document.head.appendChild(link);
  }

  // Add theme class to body
  if (savedTheme !== 'light') {
    document.documentElement.classList.add(`${savedTheme}-theme`);
  }
})();