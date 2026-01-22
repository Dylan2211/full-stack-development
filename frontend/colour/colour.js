// Theme Switcher Module
const ThemeSwitcher = (() => {
  const THEME_KEY = 'selectedTheme';
  const DARK_THEME = 'dark';
  const LIGHT_THEME = 'light';

  // Initialize theme on page load
  const init = () => {
    loadTheme();
    attachEventListeners();
  };

  // Load saved theme or default to light
  const loadTheme = () => {
    const savedTheme = localStorage.getItem(THEME_KEY) || LIGHT_THEME;
    applyTheme(savedTheme);
  };

  // Apply theme to the document
  const applyTheme = (theme) => {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;

    if (theme === DARK_THEME) {
      htmlElement.classList.add(`${DARK_THEME}-theme`);
      bodyElement.classList.add(`${DARK_THEME}-theme`);
      
      // Load dark theme CSS if not already loaded
      if (!document.getElementById('theme-css')) {
        const link = document.createElement('link');
        link.id = 'theme-css';
        link.rel = 'stylesheet';
        link.href = '/colour/colour.css';
        document.head.appendChild(link);
      }
    } else {
      htmlElement.classList.remove(`${DARK_THEME}-theme`);
      bodyElement.classList.remove(`${DARK_THEME}-theme`);
      
      // Remove dark theme CSS
      const themeLink = document.getElementById('theme-css');
      if (themeLink) {
        themeLink.remove();
      }
    }

    localStorage.setItem(THEME_KEY, theme);
  };

  // Attach event listeners to all dark mode toggles
  const attachEventListeners = () => {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
      // Set initial state based on saved theme
      const savedTheme = localStorage.getItem(THEME_KEY) || LIGHT_THEME;
      darkModeToggle.checked = savedTheme === DARK_THEME;

      darkModeToggle.addEventListener('change', (e) => {
        const theme = e.target.checked ? DARK_THEME : LIGHT_THEME;
        applyTheme(theme);
        showThemeNotification(theme);
      });
    }
  };

  // Show notification when theme changes
  const showThemeNotification = (theme) => {
    const message = theme === DARK_THEME ? 'Dark mode enabled' : 'Light mode enabled';
    
    let toast = document.getElementById('theme-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'theme-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background-color: #1f2937;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s ease;
        font-size: 14px;
      `;
      document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.style.opacity = '1';
    
    setTimeout(() => {
      toast.style.opacity = '0';
    }, 2500);
  };

  // Public API
  return {
    init,
    toggleTheme: () => {
      const currentTheme = localStorage.getItem(THEME_KEY) || LIGHT_THEME;
      const newTheme = currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
      applyTheme(newTheme);
    },
    setTheme: (theme) => applyTheme(theme),
    getTheme: () => localStorage.getItem(THEME_KEY) || LIGHT_THEME
  };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ThemeSwitcher.init());
} else {
  ThemeSwitcher.init();
}
