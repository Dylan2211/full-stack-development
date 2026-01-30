# RBAC Quick Reference Guide

## Role Hierarchy
```
Admin > Editor > Viewer
  ↓       ↓        ↓
Full   Create/   View
Access  Edit    Only
```

## Share Token Workflow

### Generate a Share Link (Admin Only)
1. Go to Dashboard Settings → Share Links tab
2. Select role: Viewer, Editor, or Admin
3. Optionally set expiration (days)
4. Click "Generate Link"
5. Link appears in "Active Share Links" list
6. Click link field to copy to clipboard

### Share Token Link Format
```
http://localhost:3000/accept-share?token=<32-byte-hex>
```

### Manage Tokens (Admin Only)
- **Change Permission**: Use role dropdown
- **Revoke**: Click "Revoke" button
- **Copy Link**: Click the link field
- **View Usage**: See access count

---

## Viewing Mode Banner

### When It Appears
- User accesses Dashboard Settings
- User has "Viewer" role on that dashboard

### What It Shows
```
🔒 You are in viewing mode
   You are unable to make changes to this document.
```

### Disabled Elements for Viewers
- Dashboard name update
- Visibility settings
- Transfer admin role
- Delete dashboard
- Add collaborators
- Create/manage share tokens

---

## Permission Checks

### Database Level
```javascript
// Get user's role for dashboard
const role = await dashboardModel.getUserRole(userId, dashboardId);
// Returns: "Admin" | "Editor" | "Viewer" | null
```

### Middleware Level
```javascript
// Only allow Admin and Editor to edit
router.put("/tasks/:id", 
  checkTaskPermission(['Admin', 'Editor']),  // Middleware checks role
  taskController.updateTask
);
```

### Frontend Level
```javascript
// Hide buttons for non-admins
if (currentUserRole !== 'Admin') {
  addPeopleBtn.style.display = 'none';
}
```

---

## Role Permissions Details

### ADMIN (Full Access)
✅ Create/View/Edit/Delete dashboards
✅ Create/View/Edit/Delete boards
✅ Create/View/Edit/Delete tasks
✅ Invite users (any role)
✅ Change user roles
✅ Remove collaborators
✅ **Create share tokens**
✅ **Modify share tokens**
✅ **Revoke tokens**
✅ Change visibility (private/public)
✅ Transfer admin role

### EDITOR (Modify Access)
✅ View dashboards
✅ View/Edit/Delete own boards
✅ Create/View/Edit/Delete tasks
✅ View collaborators list
❌ Cannot invite users
❌ Cannot change roles
❌ Cannot create share tokens
❌ Cannot modify settings

### VIEWER (Read-Only)
✅ View dashboards
✅ View boards
✅ View tasks
❌ Cannot create/edit content
❌ Cannot manage collaborators
❌ Cannot create tokens
❌ Cannot modify settings
⚠️ Shows yellow "viewing mode" banner

---

## API Endpoints Quick Reference

### Create Share Token
```bash
POST /api/dashboards/1/share-tokens
Content-Type: application/json
Authorization: Bearer <token>

{
  "role": "Editor",
  "expirationDays": 7
}

Response:
{
  "ShareTokenId": 1,
  "Token": "abc123...",
  "Role": "Editor",
  "CreatedAt": "2024-01-30T...",
  "ExpiresAt": "2024-02-06T..."
}
```

### List Share Tokens
```bash
GET /api/dashboards/1/share-tokens
Authorization: Bearer <token>

Response:
[
  {
    "ShareTokenId": 1,
    "Token": "abc123...",
    "Role": "Editor",
    "ExpiresAt": "2024-02-06T...",
    "IsActive": 1,
    "AccessCount": 5
  }
]
```

### Update Token Role
```bash
PUT /api/dashboards/share-tokens/1/role
Content-Type: application/json
Authorization: Bearer <token>

{
  "newRole": "Viewer"
}
```

### Revoke Token
```bash
DELETE /api/dashboards/share-tokens/1/revoke
Authorization: Bearer <token>
```

---

## Common Issues & Solutions

### Issue: Viewer can't see dashboard
**Solution**: Check that user has role assigned in UserDashboards table

### Issue: Share token not working
**Solution**: Check expiration date and IsActive status in ShareTokens table

### Issue: Admin button still shows for editor
**Solution**: Check frontend role comparison (case-sensitive: 'Admin' not 'admin')

### Issue: Viewing mode banner doesn't appear
**Solution**: Ensure collaborators are loaded before checking role

---

## Database Queries

### Check User's Role
```sql
SELECT Role FROM UserDashboards 
WHERE UserId = 1 AND DashboardId = 1;
```

### List All Admin Users on Dashboard
```sql
SELECT u.FullName, u.Email 
FROM UserDashboards ud
JOIN Users u ON ud.UserId = u.UserId
WHERE ud.DashboardId = 1 AND ud.Role = 'Admin';
```

### Check Active Share Tokens
```sql
SELECT * FROM ShareTokens
WHERE DashboardId = 1 
  AND IsActive = 1 
  AND (ExpiresAt IS NULL OR ExpiresAt > GETDATE());
```

### Revoke All Tokens for Dashboard
```sql
UPDATE ShareTokens
SET IsActive = 0, RevokedAt = GETDATE()
WHERE DashboardId = 1 AND IsActive = 1;
```

---

## Security Checklist

- [x] Only Admins can create share tokens
- [x] Tokens are 256-bit (32 bytes) random
- [x] Tokens cannot be guessed
- [x] Tokens can expire
- [x] Tokens can be revoked
- [x] Access is logged (count)
- [x] Viewers cannot modify content
- [x] Role checks at middleware + backend
- [x] Frontend shows appropriate UI per role
- [x] Database enforces role constraints

---

## Migration Checklist

Before deploying:
- [ ] Backup existing database
- [ ] Run schema.sql migration
- [ ] Run seed.sql with new role values
- [ ] Verify all "Owner" role values changed to "Admin"
- [ ] Test admin user can create tokens
- [ ] Test viewer sees protection banner
- [ ] Test editor cannot manage tokens
- [ ] Test share token access works
- [ ] Clear browser cache (old role values)
- [ ] Test in incognito mode

---

## Configuration

### Token Expiration Default
```javascript
// In dashboardModel.js, line ~207
const expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000);
```
Default: 7 days if expirationDays is null

### Viewing Mode Colors
```css
/* dashboard-settings.css */
.viewing-mode-banner {
  background: #fef3c7;    /* Light yellow */
  border: 1px solid #f59e0b; /* Amber */
}
```

### Role Case Sensitivity
- Database: 'Admin', 'Editor', 'Viewer' (capital first letter)
- JavaScript: 'admin', 'editor', 'viewer' (lowercase - watch for inconsistencies!)
- Middleware: 'Admin', 'Editor', 'Viewer' (use capital)

---

## Troubleshooting Commands

### Test Share Token Creation
```javascript
// Run in browser console
fetch('/api/dashboards/1/share-tokens', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({
    role: 'Editor',
    expirationDays: 7
  })
}).then(r => r.json()).then(console.log);
```

### Verify Current User Role
```javascript
// In dashboard-settings.js console
console.log('Current collaborators:', collaborators);
console.log('Current role:', collaborators.find(c => c.email === getUserInfoFromToken().email)?.role);
```

---

## Performance Notes

- Share tokens are validated on each use (AccessCount incremented)
- Consider caching token info if high-volume access expected
- Index on ShareTokens.Token for fast lookups recommended
- Expiration check happens at database level for efficiency
