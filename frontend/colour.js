function switchToColorCSS(isDarkMode) {
    let colorCSSLink = document.getElementById('colour-theme-css');
    
    if (isDarkMode) {
        if (!colorCSSLink) {
            colorCSSLink = document.createElement('link');
            colorCSSLink.id = 'colour-theme-css';
            colorCSSLink.rel = 'stylesheet';
            colorCSSLink.href = '../colour.css';
            document.head.appendChild(colorCSSLink);
            console.log('✓ colour.css loaded from parent directory');
        }
    } else {
        if (colorCSSLink) {
            colorCSSLink.remove();
            console.log('✓ colour.css removed');
        }
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
        switchToColorCSS(true);
        console.log('Dark mode: ON');
    } else {
        localStorage.setItem('darkMode', 'disabled');
        switchToColorCSS(false);
        console.log('Dark mode: OFF');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing dark mode...');
    
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    if (darkModeToggle) {
        const savedMode = localStorage.getItem('darkMode');
        console.log('Saved dark mode:', savedMode);
        
        if (savedMode === 'enabled') {
            document.body.classList.add('dark-mode');
            darkModeToggle.checked = true;
            switchToColorCSS(true);
        }
        
        darkModeToggle.addEventListener('change', toggleDarkMode);
        console.log('Dark mode toggle initialized');
    } else {
        console.error('darkModeToggle element not found!');
        
        const savedMode = localStorage.getItem('darkMode');
        if (savedMode === 'enabled') {
            document.body.classList.add('dark-mode');
            switchToColorCSS(true);
        }
    }
});