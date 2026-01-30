# Role-Based Access Control (RBAC) Implementation Summary

## Overview
Implemented a comprehensive Role-Based Access Control system following GeeksforGeeks RBAC best practices, with role hierarchy: **Admin > Editor > Viewer**. Added share token functionality allowing admins to generate time-limited, permission-scoped access links.

---

## Key Changes

### 1. **Role Naming Consistency: Owner → Admin**
Changed all role references from "Owner" to "Admin" for consistency and clarity across the entire system.

#### Files Updated:
- [schema.sql](backend/schema.sql) - UserDashboards and PendingInvitations tables
- [seed.sql](backend/seed.sql) - Default role assignments
- All middleware files
- All route files
- All controller files
- Frontend JavaScript files
- README.md

---

### 2. **Database Schema Updates**

#### New ShareTokens Table
```sql
CREATE TABLE ShareTokens (
    ShareTokenId INT IDENTITY(1,1) PRIMARY KEY,
    DashboardId INT NOT NULL FOREIGN KEY REFERENCES Dashboards(DashboardId) ON DELETE CASCADE,
    CreatedBy INT NOT NULL FOREIGN KEY REFERENCES Users(UserId),
    Token NVARCHAR(255) UNIQUE NOT NULL,      -- Unique share token
    Role NVARCHAR(50) DEFAULT 'Viewer',       -- 'Admin', 'Editor', 'Viewer'
    ExpiresAt DATETIME,                        -- NULL means no expiration
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    RevokedAt DATETIME NULL,
    AccessCount INT DEFAULT 0                  -- Track usage
);
```

---

### 3. **Backend Implementation**

#### **dashboardModel.js** - New Functions

1. **`createShareToken(dashboardId, createdBy, role, expirationDays)`**
   - Generates unique share tokens with crypto.randomBytes
   - Supports optional expiration (7 days by default)
   - Returns token metadata

2. **`getShareTokens(dashboardId)`**
   - Retrieves all share tokens for a dashboard
   - Shows active/revoked status

3. **`getShareTokenInfo(token)`**
   - Validates and retrieves token information
   - Increments access count on retrieval
   - Returns dashboard name and role

4. **`revokeShareToken(shareTokenId)`**
   - Deactivates tokens immediately
   - Sets RevokedAt timestamp

5. **`updateShareTokenRole(shareTokenId, newRole)`**
   - Allows admins to change token permissions
   - Supports role changes: Viewer, Editor, Admin

#### **dashboardController.js** - New Endpoints

- `createShareToken()` - POST `/api/dashboards/:dashboardId/share-tokens`
- `getShareTokens()` - GET `/api/dashboards/:dashboardId/share-tokens`
- `updateShareTokenRole()` - PUT `/api/dashboards/share-tokens/:shareTokenId/role`
- `revokeShareToken()` - DELETE `/api/dashboards/share-tokens/:shareTokenId/revoke`

#### **Permission Middleware Updates**

All middleware files updated to use 'Admin' instead of 'Owner':
- [permissionCheck.js](backend/middleware/permissionCheck.js)
- [boardPermissionCheck.js](backend/middleware/boardPermissionCheck.js)
- [taskPermissionCheck.js](backend/middleware/taskPermissionCheck.js)

#### **Route Files Updated**

- [dashboardRoutes.js](backend/routes/dashboardRoutes.js) - All admin-only endpoints check for 'Admin' role + new share token routes
- [taskRoutes.js](backend/routes/taskRoutes.js) - Board/Task creation/editing requires 'Admin' or 'Editor'

---

### 4. **Frontend Implementation**

#### **dashboard-settings.js** - New Functions

1. **`loadShareTokens()`** - Fetches active share tokens for display
2. **`renderShareTokens(tokens)`** - Renders token list with copy-to-clipboard
3. **`copyToClipboard(text, element)`** - Copies share link with visual feedback
4. **`createShareToken()`** - Generates new share token
5. **`updateShareTokenRole(shareTokenId, newRole)`** - Changes token permissions
6. **`revokeShareToken(shareTokenId)`** - Deactivates token with confirmation
7. **`checkAndShowViewingModeIfNeeded()`** - Checks user role and shows viewing mode
8. **`showViewingModeOverlay()`** - Displays yellow banner at top of page
9. **`disableEditingForViewers()`** - Disables all edit buttons and inputs for viewers

#### **dashboard-settings.html** - New UI Sections

1. **Share Links Tab** - New navigation item
2. **Share Token Creator** - Role selector + expiration input + generate button
3. **Active Share Links List** - Displays tokens with:
   - Full share link with click-to-copy
   - Role badge
   - Expiration date
   - Usage count
   - Role updater dropdown
   - Revoke button
4. **Viewing Mode Banner** - Yellow overlay banner for viewers showing:
   - 🔒 Icon
   - "You are in viewing mode" heading
   - "You are unable to make changes to this document." message

#### **dashboard-settings.css** - New Styles

Added comprehensive styling for:
- Share token creator form
- Share token list items with role badges
- Viewing mode overlay banner
- Responsive flex layout for token actions
- Dark theme support for viewing mode

#### **collaborators.js** - Updated

- Changed `currentUserRole === 'Owner'` to `currentUserRole === 'Admin'`
- Disabled UI elements for non-admin users
- Updated role dropdown options

#### **dashboard-settings.html** - Updated

- Changed "Owner" to "Admin" in role display
- Changed "Transfer ownership" to "Transfer admin role"
- Invite role selector includes 'admin' option

---

## RBAC Permission Matrix

| Action | Admin | Editor | Viewer |
|--------|-------|--------|--------|
| View Dashboard | ✅ | ✅ | ✅ |
| View Boards/Tasks | ✅ | ✅ | ✅ |
| Create/Edit Tasks | ✅ | ✅ | ❌ |
| Edit Dashboard Settings | ✅ | ❌ | ❌ |
| Manage Collaborators | ✅ | ❌ | ❌ |
| Change User Roles | ✅ | ❌ | ❌ |
| Create Share Tokens | ✅ | ❌ | ❌ |
| Modify Share Tokens | ✅ | ❌ | ❌ |
| Delete Dashboard | ✅ | ❌ | ❌ |

---

## Share Token Features

### Token Structure
```
/accept-share?token=<32-byte-hex-string>
```

### Capabilities
- **Time-Limited**: Optional expiration date (can be indefinite)
- **Revocable**: Admins can revoke tokens anytime
- **Usage Tracking**: Counts how many times token was accessed
- **Role-Scoped**: Tokens grant only the specified role's permissions
- **One-Per-Link**: Each token generates a unique shareable URL

### Security Features
- Unique 256-bit tokens (32 bytes of random data)
- Active/Revoked status tracking
- Expiration enforcement
- Access logging via AccessCount
- Only admins can create/manage tokens
- Token validation on each use

---

## Viewing Mode Protection

### User Experience for Viewers
1. When a viewer accesses dashboard settings, they see:
   - Yellow banner at top: "🔒 You are in viewing mode"
   - Subtitle: "You are unable to make changes to this document."
   
2. All edit controls are disabled:
   - Update name button (disabled)
   - Transfer admin role button (disabled)
   - Invite collaborator button (disabled)
   - Create share token button (disabled)
   - Delete dashboard button (disabled)
   - All text inputs (disabled)
   - All role selection dropdowns (disabled)
   - Visibility radio buttons (disabled)

### Implementation
- Checks current user's role against collaborators list
- Only viewers trigger the protection
- Non-intrusive banner (not modal/popup)
- Seamless integration with existing UI

---

## Compliance with RBAC Best Practices

### From GeeksforGeeks RBAC Standards:

✅ **Centralized Role Definition** - Admin, Editor, Viewer roles defined consistently
✅ **Granular Control** - Both page-level (dashboard access) and component-level (buttons/inputs)
✅ **Middleware-Based Enforcement** - Backend validates roles before processing requests
✅ **JWT Integration** - Roles embedded in user tokens
✅ **Scalable & Maintainable** - Easy to add new roles or modify permissions
✅ **Better UX** - Users only see features they can use
✅ **Consistency** - Enforced at frontend, middleware, and backend API levels
✅ **Enterprise-Ready** - Supports complex access patterns via share tokens

---

## Database Migration Instructions

1. Back up existing database
2. Run updated `schema.sql` to create ShareTokens table
3. Run `seed.sql` to update test data with 'Admin' role
4. Verify UserDashboards and PendingInvitations tables have role values of 'Admin', 'Editor', or 'Viewer'

---

## API Endpoints Summary

### Share Token Endpoints (Admin Only)
```
POST   /api/dashboards/:dashboardId/share-tokens          - Create share token
GET    /api/dashboards/:dashboardId/share-tokens          - List tokens
PUT    /api/dashboards/share-tokens/:shareTokenId/role    - Update token role
DELETE /api/dashboards/share-tokens/:shareTokenId/revoke  - Revoke token
```

### Existing Endpoints (Updated)
```
PUT    /api/dashboards/:dashboardId                  - Admin only
DELETE /api/dashboards/:dashboardId                  - Admin only
POST   /api/dashboards/:dashboardId/users            - Admin only
PUT    /api/dashboards/:dashboardId/users/:userId/role  - Admin only
DELETE /api/dashboards/:dashboardId/users/:userId    - Admin only
```

---

## Files Modified

**Backend:**
- schema.sql
- seed.sql
- models/dashboardModel.js
- controllers/dashboardController.js
- middleware/permissionCheck.js
- middleware/boardPermissionCheck.js
- middleware/taskPermissionCheck.js
- routes/dashboardRoutes.js
- routes/taskRoutes.js

**Frontend:**
- dashboard-settings/dashboard-settings.html
- dashboard-settings/dashboard-settings.js
- dashboard-settings/dashboard-settings.css
- collaborators/collaborators.js

**Documentation:**
- README.md

---

## Testing Recommendations

1. **Admin User**: Should be able to:
   - Create and manage share tokens
   - Change token permissions
   - Revoke tokens
   - See all management options

2. **Editor User**: Should be able to:
   - View dashboard and collaborate
   - Not see share token management
   - Edit/create tasks but not manage collaborators

3. **Viewer User**: Should be able to:
   - View dashboard content
   - See yellow "viewing mode" banner
   - All edit controls disabled
   - Cannot access management sections

4. **Share Token**: Should be able to:
   - Access dashboard with specified role
   - Increment access counter
   - Respect expiration date
   - Work after revocation (should fail)

---

## Future Enhancements

- Share token templates (pre-configured role + expiration sets)
- Bulk token operations (create multiple tokens at once)
- Token activity logs (detailed access history)
- Email notifications when tokens are created/revoked
- Custom token names and descriptions
- Conditional access (IP whitelist, device fingerprinting)
- Token refresh mechanism for extended access

---

## Notes

- All changes follow RBAC security best practices
- Role naming is consistent across frontend and backend
- Viewing mode protection prevents accidental modifications
- Share tokens provide flexible, time-limited access without email invitations
- System maintains backward compatibility with existing invitation system
