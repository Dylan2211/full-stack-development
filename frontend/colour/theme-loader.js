// Theme Loader - Runs immediately before page render
(function() {
  const THEME_KEY = 'selectedTheme';
  const DARK_THEME = 'dark';
  
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  
  // Apply dark theme immediately if saved
  if (savedTheme === DARK_THEME) {
    document.documentElement.classList.add(`${DARK_THEME}-theme`);
    document.body.classList.add(`${DARK_THEME}-theme`);
    
    // Load dark theme CSS immediately to prevent flash
    const link = document.createElement('link');
    link.id = 'theme-css';
    link.rel = 'stylesheet';
    link.href = '/colour/colour.css';
    document.head.insertBefore(link, document.head.firstChild);
  }
})();
