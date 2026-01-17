# Visual Guide: Utilities and CSS Structure

## How Utilities Should Be Organized

### ❌ BEFORE (What You Have Now)

```
frontend/
├── dashboard/
│   └── dashboard.js
│       ├── clampPercent()      ← Function 1
│       ├── setText()            ← Function 2
│       ├── setPercentBar()      ← Function 3
│       ├── badgeFromAcceptance() ← Function 4
│       └── ... (more functions)
│
└── analytics/
    └── analytics.js
        ├── clampPercent()       ← SAME Function 1 (DUPLICATE!)
        ├── setText()             ← SAME Function 2 (DUPLICATE!)
        ├── setPercentBar()       ← SAME Function 3 (DUPLICATE!)
        ├── badgeFromAcceptance() ← SAME Function 4 (DUPLICATE!)
        └── ... (more functions)

Problem: Same code in 2 places!
If you need to fix a bug, you have to fix it in BOTH files.
```

---

### ✅ AFTER (What You Should Have)

```
frontend/
├── utils/                    ← NEW FOLDER
│   └── domHelpers.js        ← ALL shared functions here
│       ├── clampPercent()
│       ├── setText()
│       ├── setPercentBar()
│       ├── badgeFromAcceptance()
│       ├── badgeFromError()
│       ├── tagFromLoad()
│       ├── statusClassFromText()
│       └── clearChildren()
│
├── dashboard/
│   ├── dashboard.html       ← Loads: <script src="../../utils/domHelpers.js"></script>
│   └── dashboard.js         ← Uses: clampPercent(), setText(), etc.
│
└── analytics/
    ├── analytics.html       ← Loads: <script src="../../utils/domHelpers.js"></script>
    └── analytics.js         ← Uses: clampPercent(), setText(), etc.

Benefit: Single copy of each function!
Change once = works in both dashboard.js AND analytics.js
```

---

## How CSS Theme System Works

### The Flow

```
Step 1: User opens dashboard.html
        ↓
Step 2: Browser loads HTML <head> section
        ├─ Loads <script src="/main/main.js"></script>
        │          ↓
        │          main.js checks localStorage.getItem('selectedTheme')
        │          → Returns 'light' (default)
        │          → Loads light theme (main.css)
        │
        └─ Loads <link rel="stylesheet" href="/main/main.css">
                   ↓
                   Sets CSS variables:
                   ├─ --bg-primary: #ffffff
                   ├─ --text-primary: #212529
                   ├─ --accent-primary: #007bff
                   └─ etc.
        
        ↓
Step 3: Browser loads dashboard.css
        └─ Uses variables from main.css:
           button {
             background: var(--accent-primary);  ← #007bff
           }
        
        ↓
Step 4: Page appears with light theme colors
```

---

### Theme Switching Example

```
┌─────────────────────────────────────────────────────────────────┐
│ USER CLICKS "DARK THEME" BUTTON                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                     localStorage.setItem(
                       'selectedTheme', 
                       'dark'
                     )
                            ↓
        ┌───────────────────────────────────────┐
        │ User refreshes page / visits again    │
        └───────────────────────────────────────┘
                            ↓
                  main.js checks: localStorage
                    .getItem('selectedTheme')
                            ↓
                       Returns 'dark'
                            ↓
        Creates <link> tag to load:
        <script>colour/colour.css</script>
                            ↓
        Sets CSS variables to dark theme:
        ├─ --bg-primary: #1e1e1e (dark)
        ├─ --text-primary: #ffffff (light text)
        ├─ --accent-primary: #0077ff (lighter blue for dark)
        └─ etc.
                            ↓
    All elements using var(--bg-primary) etc.
    automatically show dark colors!
```

---

## CSS Variables Explained

### Simple Example

```css
/* In main.css */
:root {
  --primary-color: #007bff;
}

/* In dashboard.css */
button {
  background: var(--primary-color);  /* Will be #007bff */
}

/* In analytics.css */
.title {
  color: var(--primary-color);  /* Will be #007bff */
}
```

### Why This is Powerful

```css
/* Traditional way (BAD) */
button { background: #007bff; }
.title { color: #007bff; }
.badge { background: #007bff; }
/* If you want to change color: search and replace in EVERY file! */

/* Modern way with variables (GOOD) */
:root { --primary-color: #007bff; }
button { background: var(--primary-color); }
.title { color: var(--primary-color); }
.badge { background: var(--primary-color); }
/* Change color: edit ONE line in main.css! */
```

---

## File Organization Recommendation

```
frontend/
│
├── utils/                          ← Shared code
│   ├── domHelpers.js              ← DOM manipulation functions
│   ├── authHelpers.js             ← (already have this)
│   └── formHelpers.js             ← (future: form validation, etc.)
│
├── main/                           ← Global configuration
│   ├── main.css                   ← Global theme variables
│   ├── main.js                    ← Theme switcher
│   └── README.md                  ← Explain how to use theme
│
├── dashboard/
│   ├── dashboard.html
│   ├── dashboard.css
│   └── dashboard.js
│
├── analytics/
│   ├── analytics.html
│   ├── analytics.css
│   └── analytics.js
│
├── auth-utils.js                  ← (global auth)
├── colour/                        ← Dark theme CSS
│   └── colour.css
│
└── ... (other pages)
```

---

## Step-by-Step: What to Do

### 1. Create the utils folder

In your file explorer or terminal:
```bash
mkdir frontend/utils
```

### 2. Create domHelpers.js

Create new file: `frontend/utils/domHelpers.js`

Copy all 8 functions into it (see UTILITY_AND_CSS_GUIDE.md for the code)

### 3. Update HTML files

In each HTML file that needs these functions:

```html
<!-- Add this to <head> -->
<script src="../../utils/domHelpers.js"></script>
```

Example files to update:
- `dashboard/dashboard.html`
- `analytics/analytics.html`

### 4. Clean up JavaScript files

In `dashboard/dashboard.js` and `analytics/analytics.js`:

**Find and DELETE these function definitions:**
- `function clampPercent() { ... }`
- `function setText() { ... }`
- `function setPercentBar() { ... }`
- `function badgeFromAcceptance() { ... }`
- `function badgeFromError() { ... }`
- `function tagFromLoad() { ... }`
- `function statusClassFromText() { ... }`
- `function clearChildren() { ... }`

**KEEP everything else in those files!**

### 5. Test

Open dashboard page → should work the same
Open analytics page → should work the same
(If it doesn't, the functions didn't load - check file paths)

---

## Understanding Your Friend's CSS Setup

Your friend created:

```
main.css (Light Theme)
├─ :root (CSS variables)
│  ├─ --bg-primary: white
│  ├─ --text-primary: dark gray
│  ├─ --accent-primary: blue
│  └─ --border-color: light gray
│
└─ Rules that USE those variables
   ├─ body { background: var(--bg-primary); }
   ├─ .sidebar { background: var(--bg-secondary); }
   └─ button { background: var(--accent-primary); }

colour.css (Dark Theme)
├─ :root (CSS variables - different colors)
│  ├─ --bg-primary: dark gray
│  ├─ --text-primary: white
│  ├─ --accent-primary: light blue
│  └─ --border-color: dark border
│
└─ (Same rules as above, but uses different color values)

main.js (Theme Switcher)
└─ Chooses which CSS file to load based on user preference
```

### Why This Design is Smart

✅ **Light theme:** Easy to read in daytime  
✅ **Dark theme:** Easy on eyes at night  
✅ **One CSS file:** Same structure, different colors  
✅ **User preference saved:** Remembers theme choice  
✅ **No code changes needed:** Just swap CSS file  

---

## Real-World Example

### Your Current Code (Duplicated)

**dashboard.js:**
```javascript
function clampPercent(value) {
  if (typeof value !== "number" || isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}
```

**analytics.js:**
```javascript
function clampPercent(value) {  // SAME FUNCTION COPIED!
  if (typeof value !== "number" || isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}
```

### After Organization (Shared)

**utils/domHelpers.js:**
```javascript
function clampPercent(value) {  // Defined ONCE
  if (typeof value !== "number" || isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}
```

**dashboard.js:**
```javascript
// Uses clampPercent() from utils/domHelpers.js
const clamped = clampPercent(50);  // Just use it!
```

**analytics.js:**
```javascript
// Uses clampPercent() from utils/domHelpers.js
const clamped = clampPercent(75);  // Same function!
```

**Benefit:** Fix a bug in clampPercent()? Change it once, both files use the fix!

---

## Summary Table

| Aspect | What Your Friend Did | What You Should Do |
|--------|----------------------|-------------------|
| **Colors** | Created main.css with CSS variables | Use it! (Add to all HTML files) |
| **Themes** | Built light/dark theme switcher | Connect all pages to use it |
| **Utilities** | - | Create utils/ folder + domHelpers.js |
| **Duplication** | - | Remove duplicate functions from dashboard.js & analytics.js |
| **Global Styles** | Started with main.css | Expand: add more variables for consistency |

Your friend did the hard part (CSS system). You just need to:
1. ✅ Connect it to your pages
2. ✅ Create the utilities folder
3. ✅ Move duplicate functions there
4. ✅ Clean up your files

All professional!

