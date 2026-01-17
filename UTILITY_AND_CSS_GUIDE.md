# Utility Functions & Global CSS - Beginner's Guide

## Part 2: Global CSS - What Your Friend Did

### What Is Global CSS?

Global CSS is a base stylesheet that applies to **all pages** in your app. It sets common styles like colors, fonts, and layout defaults.

---

### What Your Friend Created

Your friend created **`frontend/main/main.css`** - this is a **global theme file** with color variables.

**File:** [frontend/main/main.css](../main/main.css)

```css
/* Light Theme - Default */
:root {
  --bg-primary: #ffffff;        /* Main background */
  --bg-secondary: #f8f9fa;      /* Secondary background */
  --text-primary: #212529;      /* Main text color */
  --text-secondary: #6c757d;    /* Muted text color */
  --accent-primary: #007bff;    /* Main accent color (blue) */
  --accent-secondary: #0056b3;  /* Darker accent */
  --border-color: #dee2e6;      /* Border color */
  --shadow: rgba(0, 0, 0, 0.1); /* Shadow color */
}

body {
  background: var(--bg-primary);
  color: var(--text-primary);
}
```

### Understanding CSS Variables (`:root` and `--`)

**`:root`** = A special selector that means "the whole webpage"

**`--bg-primary`** = A CSS variable (starts with two dashes)

**`var(--bg-primary)`** = How you USE the variable

**Example:**
```css
:root {
  --blue: #007bff;        /* Define the variable */
}

button {
  background: var(--blue);  /* Use the variable */
}
```

**Why this is brilliant:**
- Want to change all buttons from blue to red? Change one line!
- Without this, you'd have to find and change every `#007bff` reference

---

### The Theme System

Your friend also set up a **theme switcher** in `frontend/main/main.js`:

```javascript
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
```

**What this does:**
1. Checks what theme you saved (`localStorage.getItem('selectedTheme')`)
2. If it's not "light", it loads a different CSS file (`colour.css`)
3. This lets users switch between light and dark themes

**In plain English:**
- User picks "dark theme" → save it to browser storage
- Next time they visit → load dark theme automatically
- They don't have to pick it again

---

### Current CSS File Structure

```
frontend/
  main/
    main.css        ← Global color variables (light theme)
    main.js         ← Theme switcher logic
  colour/
    colour.css      ← Dark theme colors (not shown)
  dashboard/
    dashboard.css   ← Dashboard-specific styles
  kanban/
    kanban.css      ← Kanban-specific styles
  analytics/
    analytics.css   ← Analytics-specific styles
  ... (other pages with their own CSS)
```

---

### How It Should Work (Best Practice)

**Current status:** ⚠️ Not fully connected

The `main.css` exists but **isn't being used** in your HTML files. To make it work:

**Step 1: Add to HTML files**

In [dashboard/dashboard.html](../dashboard/dashboard.html), [kanban/kanban.html](../kanban/kanban.html), etc., add to `<head>`:

```html
<head>
  <link rel="stylesheet" href="/main/main.css">  ← Global theme
  <link rel="stylesheet" href="dashboard.css">   ← Page-specific
  <script src="/main/main.js"></script>          ← Theme switcher
</head>
```

**Step 2: Use the variables in page CSS**

In [dashboard/dashboard.css](../dashboard/dashboard.css):

```css
/* Use global variables instead of hardcoding colors */
.topbar {
  background: var(--bg-primary);      ← Use global variable
  color: var(--text-primary);         ← Use global variable
  border-bottom: 1px solid var(--border-color);
}

.button {
  background: var(--accent-primary);  ← Will change with theme!
  color: var(--bg-primary);
}
```

---

## Summary: What to Do

### For Utility Functions
✅ **Create:** `frontend/utils/domHelpers.js`  
✅ **Move:** All 8 duplicate functions there  
✅ **Add:** `<script src="../../utils/domHelpers.js"></script>` to HTML  
✅ **Delete:** Duplicate functions from dashboard.js and analytics.js  

### For Global CSS  
✅ **Keep:** `frontend/main/main.css` (it's good!)  
✅ **Use:** Add to all HTML files' `<head>`  
✅ **Reference:** Use `var(--color-name)` in all page CSS files  
✅ **Benefit:** Change colors once, theme updates everywhere  

---

## Quick Reference: Why This Matters

| Problem | Solution | Benefit |
|---------|----------|---------|
| 8 same functions in 2 files | Create `utils/domHelpers.js` | Change once = works everywhere |
| Colors hardcoded as `#007bff` | Use CSS variables `var(--accent-primary)` | Dark mode support, easy rebranding |
| No shared styles | Use global `main.css` | Consistency across all pages |
| Theme not working | Load `main.js` + `main.css` in HTML | Light/dark theme switching works |

This is professional web development! 🎉

