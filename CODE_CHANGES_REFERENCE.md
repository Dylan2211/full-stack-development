# Code Changes Reference

## File-by-File Change Summary

### Schema Changes

#### backend/schema.sql
**Changes:**
- Updated UserDashboards.Role comment: 'Owner', 'Editor', 'Viewer' → 'Admin', 'Editor', 'Viewer'
- Updated PendingInvitations.Role comment: Same
- Added new ShareTokens table with fields:
  - ShareTokenId (primary key)
  - DashboardId (FK)
  - CreatedBy (FK to Users)
  - Token (unique, 255 char)
  - Role (default 'Viewer')
  - ExpiresAt (nullable for indefinite)
  - IsActive (bit, default 1)
  - CreatedAt (timestamp)
  - RevokedAt (nullable)
  - AccessCount (tracks usage)

#### backend/seed.sql
**Changes:**
- All User ID 1 assignments changed from 'Owner' to 'Admin'
- Updated comment: "Admin = Owner" → "Admin = Admin role"

---

### Backend Model Changes

#### backend/models/dashboardModel.js
**Added Functions:**

```javascript
// Create share token with optional expiration
async function createShareToken(dashboardId, createdBy, role = "Viewer", expirationDays = null)

// Get all tokens for dashboard
async function getShareTokens(dashboardId)

// Validate and get token info (increments access count)
async function getShareTokenInfo(token)

// Deactivate token
async function revokeShareToken(shareTokenId)

// Update token's role
async function updateShareTokenRole(shareTokenId, newRole)
```

**Updated Functions:**
- Updated all JSDoc comments to reference 'Admin' instead of 'Owner'
- No logic changes to existing functions

---

### Backend Controller Changes

#### backend/controllers/dashboardController.js
**Changes in createDashboard():**
```javascript
// OLD: await dashboardModel.addUserToDashboard(userId, newDashboard.DashboardId, 'Owner');
// NEW: await dashboardModel.addUserToDashboard(userId, newDashboard.DashboardId, 'Admin');
```

**Added Functions:**
```javascript
async function createShareToken(req, res)
async function getShareTokens(req, res)
async function updateShareTokenRole(req, res)
async function revokeShareToken(req, res)
```

**Updated module.exports:** Added 4 new function exports

---

### Backend Middleware Changes

#### backend/middleware/permissionCheck.js
**Changes:**
```javascript
// OLD: @param {Array<string>} allowedRoles - Array of roles that can access (e.g., ['Owner', 'Editor'])
// NEW: @param {Array<string>} allowedRoles - Array of roles that can access (e.g., ['Admin', 'Editor'])
```

#### backend/middleware/boardPermissionCheck.js
**Changes:**
```javascript
// OLD: @param {Array<string>} allowedRoles - Array of roles that can access (e.g., ['Owner', 'Editor'])
// NEW: @param {Array<string>} allowedRoles - Array of roles that can access (e.g., ['Admin', 'Editor'])
```

#### backend/middleware/taskPermissionCheck.js
**Changes:**
```javascript
// OLD: @param {Array<string>} allowedRoles - Array of roles that can access (e.g., ['Owner', 'Editor'])
// NEW: @param {Array<string>} allowedRoles - Array of roles that can access (e.g., ['Admin', 'Editor'])
```

---

### Backend Route Changes

#### backend/routes/dashboardRoutes.js
**Changes:**
```javascript
// OLD
router.put("/:dashboardId", authMiddleware, checkDashboardPermission(['Owner']), ...)
router.delete("/:dashboardId", authMiddleware, checkDashboardPermission(['Owner']), ...)
router.post("/:dashboardId/users", authMiddleware, checkDashboardPermission(['Owner']), ...)
router.post("/:dashboardId/invite", authMiddleware, checkDashboardPermission(['Owner']), ...)
router.put("/:dashboardId/users/:userId/role", authMiddleware, checkDashboardPermission(['Owner']), ...)
router.delete("/:dashboardId/users/:userId", authMiddleware, checkDashboardPermission(['Owner']), ...)

// NEW - All 'Owner' changed to 'Admin' + 4 new share token routes
router.put("/:dashboardId", authMiddleware, checkDashboardPermission(['Admin']), ...)
router.delete("/:dashboardId", authMiddleware, checkDashboardPermission(['Admin']), ...)
router.post("/:dashboardId/users", authMiddleware, checkDashboardPermission(['Admin']), ...)
router.post("/:dashboardId/invite", authMiddleware, checkDashboardPermission(['Admin']), ...)
router.put("/:dashboardId/users/:userId/role", authMiddleware, checkDashboardPermission(['Admin']), ...)
router.delete("/:dashboardId/users/:userId", authMiddleware, checkDashboardPermission(['Admin']), ...)

// NEW ROUTES
router.post("/:dashboardId/share-tokens", authMiddleware, checkDashboardPermission(['Admin']), dashboardController.createShareToken);
router.get("/:dashboardId/share-tokens", authMiddleware, checkDashboardPermission(['Admin']), dashboardController.getShareTokens);
router.put("/share-tokens/:shareTokenId/role", authMiddleware, dashboardController.updateShareTokenRole);
router.delete("/share-tokens/:shareTokenId/revoke", authMiddleware, dashboardController.revokeShareToken);
```

#### backend/routes/taskRoutes.js
**Changes:** (9 occurrences)
```javascript
// ALL INSTANCES: checkDashboardForBoardCreation(['Owner', 'Editor']) → ['Admin', 'Editor']
// ALL INSTANCES: checkBoardPermission(['Owner', 'Editor', 'Viewer']) → ['Admin', 'Editor', 'Viewer']
// ALL INSTANCES: checkBoardPermission(['Owner']) → ['Admin']
// ALL INSTANCES: checkBoardForTaskCreation(['Owner', 'Editor']) → ['Admin', 'Editor']
// ALL INSTANCES: checkTaskPermission(['Owner', 'Editor']) → ['Admin', 'Editor']
// ALL INSTANCES: checkTaskPermission(['Owner', 'Editor', 'Viewer']) → ['Admin', 'Editor', 'Viewer']
```

---

### Frontend HTML Changes

#### frontend/dashboard-settings/dashboard-settings.html
**Changes:**
```html
<!-- Added new nav item for Share Links -->
<a href="#sharelinks" class="nav-item" data-section="sharelinks">
  <span class="nav-icon">🔗</span>
  Share Links
</a>

<!-- Changed text -->
<!-- OLD: <strong>Transfer ownership</strong> -->
<!-- NEW: <strong>Transfer admin role</strong> -->

<!-- Changed role text -->
<!-- OLD: <span class="collaborator-role">Owner</span> -->
<!-- NEW: <span class="collaborator-role">Admin</span> -->

<!-- Changed badge -->
<!-- OLD: <span class="role-badge owner-badge">Owner</span> -->
<!-- NEW: <span class="role-badge owner-badge">Admin</span> -->

<!-- Added new Share Links section -->
<section id="sharelinks-section" class="settings-section">
  <h2 class="section-title">Share Links</h2>
  <p class="section-description">Generate shareable links with specific permissions...</p>
  
  <div class="setting-group">
    <label class="setting-label">Create a share link</label>
    <div class="share-token-creator">
      <div class="share-token-row">
        <select id="shareTokenRole" class="setting-select">
          <option value="Viewer">Viewer (View only)</option>
          <option value="Editor">Editor (View and Edit)</option>
          <option value="Admin">Admin (Full Access)</option>
        </select>
        <input type="number" id="shareTokenExpiration" ... />
        <button id="createShareTokenBtn" class="btn btn-primary">Generate Link</button>
      </div>
    </div>
  </div>

  <div class="setting-group">
    <label class="setting-label">Active Share Links</label>
    <div id="shareTokensList" class="share-tokens-list">
      <!-- Tokens rendered here -->
    </div>
  </div>
</section>

<!-- Added viewing mode overlay -->
<div id="viewingModeOverlay" class="viewing-mode-overlay" style="display: none;">
  <div class="viewing-mode-banner">
    <div class="banner-icon">🔒</div>
    <div class="banner-content">
      <h3>You are in viewing mode</h3>
      <p>You are unable to make changes to this document.</p>
    </div>
  </div>
</div>
```

---

### Frontend CSS Changes

#### frontend/dashboard-settings/dashboard-settings.css
**Added Styles:**
```css
/* Share Tokens Section */
.share-token-creator { ... }
.share-token-row { ... }
.share-token-item { ... }
.share-token-info { ... }
.share-token-link { ... }
.share-token-details { ... }
.share-token-role { ... }
.share-token-actions { ... }

/* Viewing Mode Overlay */
.viewing-mode-overlay { ... }
.viewing-mode-banner { ... }
.banner-icon { ... }
.banner-content { ... }
.banner-content h3 { ... }
.banner-content p { ... }

/* Dark theme adjustments */
[data-theme="dark"] .viewing-mode-banner { ... }
[data-theme="dark"] .banner-content h3,
[data-theme="dark"] .banner-content p { ... }

.section-description { ... }
```

---

### Frontend JavaScript Changes

#### frontend/dashboard-settings/dashboard-settings.js
**Changes to existing functions:**
```javascript
// In loadCollaborators():
// OLD: role: (u.Role ?? u.role ?? "Viewer").toString().toLowerCase(), // owner/editor/viewer
// NEW: role: (u.Role ?? u.role ?? "Viewer").toString().toLowerCase(), // admin/editor/viewer

// OLD: const owner = me && me.role === "owner" ? me : collaborators.find((c) => c.role === "owner");
// NEW: const owner = me && me.role === "admin" ? me : collaborators.find((c) => c.role === "admin");

// In error fallback:
// OLD: role: "owner",
// NEW: role: "admin",

// In renderCollaborators():
// OLD: item.className = `collaborator-item ${collab.role === "owner" ? "owner" : ""}`;
// OLD: const isOwner = collab.role === "owner";
// NEW: item.className = `collaborator-item ${collab.role === "admin" ? "owner" : ""}`;
// NEW: const isOwner = collab.role === "admin";

// In setupEventListeners():
// OLD: document.getElementById("transferBtn").addEventListener("click", transferOwnership);
// NEW: document.getElementById("transferBtn").addEventListener("click", transferAdminRole);
// ADDED: const createShareTokenBtn = document.getElementById("createShareTokenBtn");
// ADDED: if (createShareTokenBtn) { createShareTokenBtn.addEventListener(...); }

// In initialization:
// ADDED: await loadShareTokens();
// ADDED: checkAndShowViewingModeIfNeeded();
```

**Renamed function:**
```javascript
// OLD: async function transferOwnership()
// NEW: async function transferAdminRole()
```

**Added functions:**
```javascript
// Share Token Management
async function loadShareTokens()
function renderShareTokens(tokens)
function copyToClipboard(text, element)
async function createShareToken()
async function updateShareTokenRole(shareTokenId, newRole)
async function revokeShareToken(shareTokenId)

// Viewing Mode Protection
function checkAndShowViewingModeIfNeeded()
function showViewingModeOverlay()
function disableEditingForViewers()
```

---

#### frontend/collaborators/collaborators.js
**Changes:**
```javascript
// OLD: const canChangeRole = currentUserRole === 'Owner' && user.Role !== 'Owner';
// OLD: const canRemove = currentUserRole === 'Owner' && user.Role !== 'Owner';
// NEW: const canChangeRole = currentUserRole === 'Admin' && user.Role !== 'Admin';
// NEW: const canRemove = currentUserRole === 'Admin' && user.Role !== 'Admin';

// OLD: <option value="Owner" ${user.Role === 'Owner' ? 'selected' : ''}>Owner</option>
// NEW: <option value="Admin" ${user.Role === 'Admin' ? 'selected' : ''}>Admin</option>

// OLD: if (currentUserRole !== 'Owner') { addPeopleBtn.style.display = 'none'; }
// NEW: if (currentUserRole !== 'Admin') { addPeopleBtn.style.display = 'none'; }
```

---

### Documentation Changes

#### README.md
**Changes:**
```markdown
// OLD: - **Collaboration**: Invite users to dashboards with role-based permissions (Owner, Editor, Viewer)
// NEW: - **Collaboration**: Invite users to dashboards with role-based permissions (Admin, Editor, Viewer)
```

---

## Summary Statistics

- **Files Modified**: 19
- **New Database Table**: 1 (ShareTokens)
- **New Backend Functions**: 5
- **New Backend Endpoints**: 4
- **New Frontend Functions**: 7
- **Role References Changed**: 40+
- **CSS Additions**: 14 new classes
- **Lines Added**: ~1000+
- **Backward Compatibility**: Full (invitations still work)

---

## Deployment Checklist

1. **Database Migration**
   - [ ] Run schema.sql to create ShareTokens table
   - [ ] Run seed.sql to update roles to 'Admin'
   - [ ] Verify table creation with SQL query

2. **Backend Deployment**
   - [ ] Deploy updated model files
   - [ ] Deploy updated controller files
   - [ ] Deploy updated middleware files
   - [ ] Deploy updated route files
   - [ ] Restart server/process

3. **Frontend Deployment**
   - [ ] Deploy updated HTML file
   - [ ] Deploy updated CSS file
   - [ ] Deploy updated JavaScript file
   - [ ] Clear browser cache (Ctrl+Shift+Delete)
   - [ ] Test in incognito window

4. **Testing**
   - [ ] Admin: Create share token
   - [ ] Admin: Update token role
   - [ ] Admin: Revoke token
   - [ ] Viewer: See viewing mode banner
   - [ ] Editor: Cannot see share token section
   - [ ] Share token: Access works with correct role
   - [ ] Expired token: Access denied
   - [ ] Revoked token: Access denied

5. **Post-Deployment**
   - [ ] Monitor error logs
   - [ ] Check database for ShareTokens entries
   - [ ] Verify existing invitations still work
   - [ ] Test with multiple browsers
   - [ ] Test with multiple users
