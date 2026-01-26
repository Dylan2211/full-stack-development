# Collaborators & Invitations - Complete User & Backend Guide

## TABLE OF CONTENTS
1. [Frontend User Guide](#frontend-user-guide)
2. [Backend Implementation](#backend-implementation)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)

---

## FRONTEND USER GUIDE

### PART 1: VIEWING COLLABORATORS

#### Step 1: Access the Collaborators Page
1. Open the application and log in to your account
2. Navigate to a Dashboard you own or have access to
3. Click on the **Dashboard Settings** or **Collaborators** menu
4. You'll be directed to the **Collaborators and Teams** page

**Page Location:** `/frontend/collaborators/collaborators.html`

#### Step 2: View Current Collaborators
The page displays all current collaborators in a list with the following information:
- **Avatar** - User profile picture
- **Full Name** - Collaborator's name
- **Email** - Collaborator's email address
- **Role** - Their access level (Viewer, Editor, or Owner)
- **Status** - Active/Inactive (visual indicator)

#### Step 3: Search for Collaborators
- Use the **"Search for a collaborator"** input field
- Type the collaborator's name or partial name
- Results filter in real-time as you type
- Search is case-insensitive

#### Step 4: Understanding Roles

**Three role levels are available:**

| Role | Permissions | Can Edit | Can Delete | Can Invite |
|------|-------------|----------|-----------|-----------|
| **Viewer** | View-only access | ❌ No | ❌ No | ❌ No |
| **Editor** | View and edit content | ✅ Yes | ❌ No | ❌ No |
| **Owner** | Full administrative access | ✅ Yes | ✅ Yes | ✅ Yes |

#### Step 5: Role Indicators
- **Owners and Editors** can see a dropdown menu for roles
- **Viewers** see their role as a static badge (they cannot change it)
- The role dropdown is **disabled for the dashboard creator** (you cannot remove yourself as Owner)

---

### PART 2: EDITING COLLABORATOR ROLES

#### Step 1: Locate the Collaborator
1. Go to the **Collaborators and Teams** page
2. Find the collaborator whose role you want to change
3. Use the search function if needed

#### Step 2: Change the Role
1. Click the **role dropdown** next to the collaborator's name
2. Select the new role:
   - Select **"Viewer"** for read-only access
   - Select **"Editor"** for editing permissions
   - Select **"Owner"** for full administrative access
3. The role updates immediately

#### Step 3: Confirm the Change
- An **"Role updated successfully"** message appears
- The collaborator's role badge updates in real-time
- The change is effective immediately

**Important Notes:**
- Only **Owners** can change role permissions
- You **cannot remove** the original dashboard creator as Owner
- Role changes take effect immediately without page refresh

---

### PART 3: REMOVING COLLABORATORS

#### Step 1: Access the Collaborators Page
1. Navigate to the **Collaborators and Teams** page
2. Find the collaborator you want to remove

#### Step 2: Remove a Collaborator
1. Click the **"Remove"** button next to the collaborator's name
2. A confirmation dialog appears asking: **"Are you sure you want to remove [Name]?"**
3. Click **"OK"** to confirm or **"Cancel"** to abort

#### Step 3: Confirmation
- A fade-out animation shows the collaborator being removed
- The list automatically refreshes
- A success message confirms removal
- The user is immediately removed from all dashboard access

**Important Notes:**
- Only **Owners** can remove collaborators
- You **cannot remove yourself** if you're the only Owner
- Removed users lose all access to the dashboard immediately

---

### PART 4: INVITING NEW COLLABORATORS

#### Step 1: Open the Add People Modal
1. Go to the **Collaborators and Teams** page
2. Click the **"Add People"** button (top-right corner)
3. The **"Add People"** modal dialog opens

**Note:** Only Owners see the "Add People" button

#### Step 2: Search for Users to Invite
1. In the **"Search by name or email"** field, type:
   - The user's **full name**, or
   - The user's **email address**
2. Available users appear in the **"Available Users"** section
3. Results update in real-time as you type

#### Step 3: Select Role for Invitees
1. Open the **"Select Role"** dropdown
2. Choose the role:
   - **"Viewer - Can view only"** - read-only access
   - **"Editor - Can view and edit"** - editing permissions
   - **"Admin - Full access"** - Owner-level permissions (maps to "Owner" in backend)

**Role Permissions Breakdown:**
- **Viewer**: No permissions checked
- **Editor**: "Can edit tasks" ✅ checked, others disabled
- **Admin**: All permissions ✅ checked

#### Step 4: Set Additional Permissions (Optional)
Three permission checkboxes are available:
- ☑️ **Can edit tasks** - Allow task creation/editing
- ☑️ **Can delete tasks** - Allow task deletion
- ☑️ **Can invite others** - Allow adding more collaborators

**Permissions are auto-set based on role:**
- **Viewer**: All unchecked
- **Editor**: Only "Can edit tasks" checked
- **Admin**: All checked

#### Step 5: Add Users to Selection
1. Find the user you want to invite in the **"Available Users"** list
2. Click the **"Add"** button next to their name
3. The user appears in the **"Selected People"** section (at bottom)
4. The button changes to **"Added"** (green) and grayed out
5. Repeat steps 1-4 to invite multiple users

#### Step 6: Review Selected Users
In the **"Selected People"** section, you'll see:
- User's avatar
- Full name
- Email address
- **"Remove"** button (if you change your mind)

#### Step 7: Send Invitations
1. Click the **"Send Invites"** button (bottom-right)
2. A confirmation message appears: **"Invitations sent to X user(s)!"**
3. The modal closes automatically
4. Selected users receive invitations via email

#### Step 8: Invitations Expire
- Invitations are valid for **7 days**
- After 7 days, the invitation link expires
- Users must accept within this window

**Important Notes:**
- **Users already in the dashboard** are filtered out of the available list
- You **cannot invite the same user twice**
- Invitations are sent immediately upon clicking "Send Invites"
- Multiple users can be invited in a single action

---

### PART 5: ACCEPTING/DECLINING INVITATIONS

#### Step 1: Check Your Invitations
1. Log in to your account
2. Navigate to the **"Invitations"** page or dashboard section
3. You see all pending invitations sent to you

#### Step 2: View Invitation Details
Each invitation card shows:
- **Dashboard icon & name** - Which dashboard invited you
- **Invited by** - Name of the person who sent the invite
- **Dates** - When invited and when it expires
- **Role** - Your assigned role (Viewer, Editor, Owner)
- **Status** - "Pending" or "Expired" badge

#### Step 3: Accept an Invitation
1. Click the **"Accept"** button on the invitation card
2. You're added to the dashboard immediately
3. A success message: **"Invitation accepted! Redirecting to dashboard..."**
4. You're redirected to the dashboard (1 second delay)
5. The invitation is marked as "Accepted"

#### Step 4: Decline an Invitation
1. Click the **"Decline"** button on the invitation card
2. A confirmation dialog: **"Are you sure you want to decline this invitation?"**
3. Click **"OK"** to confirm
4. The invitation is marked as "Declined"
5. You do **not** gain access to the dashboard

#### Step 5: Expired Invitations
- If the invitation has **expired** (past the 7-day window):
  - Both "Accept" and "Decline" buttons are disabled
  - An **"Expired"** badge appears
  - Contact the inviter to send a new invitation

**Important Notes:**
- Your **email** must match the invitation email
- If you have multiple accounts, use the **same email** to accept
- Expired invitations cannot be recovered
- Once accepted, you can access the dashboard immediately

---

## BACKEND IMPLEMENTATION

### Architecture Overview

The collaborators system uses a role-based access control (RBAC) model with JWT authentication. The system includes:
- User authentication via JWT tokens
- Dashboard ownership and role management
- Email-based invitations with expiring tokens
- Real-time permission checks

---

### KEY DATABASE TABLES

#### 1. Users Table
```sql
CREATE TABLE Users (
    UserId INT PRIMARY KEY IDENTITY(1,1),
    FullName NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    Role NVARCHAR(50) DEFAULT 'User',
    CreatedAt DATETIME DEFAULT GETDATE()
)
```

#### 2. Dashboards Table
```sql
CREATE TABLE Dashboards (
    DashboardId INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    IsPrivate BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE()
)
```

#### 3. UserDashboards Table (Many-to-Many Relationship)
```sql
CREATE TABLE UserDashboards (
    UserDashboardId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,
    DashboardId INT NOT NULL,
    Role NVARCHAR(50) NOT NULL DEFAULT 'Viewer', -- 'Viewer', 'Editor', 'Owner'
    JoinedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
    FOREIGN KEY (DashboardId) REFERENCES Dashboards(DashboardId) ON DELETE CASCADE,
    UNIQUE(UserId, DashboardId)
)
```

#### 4. PendingInvitations Table
```sql
CREATE TABLE PendingInvitations (
    InvitationId INT PRIMARY KEY IDENTITY(1,1),
    DashboardId INT NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    Role NVARCHAR(50) NOT NULL DEFAULT 'Viewer', -- 'Viewer', 'Editor', 'Owner'
    InvitedBy INT NOT NULL,
    Token NVARCHAR(MAX) NOT NULL UNIQUE, -- 64-character hex token
    Status NVARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Accepted', 'Declined'
    CreatedAt DATETIME DEFAULT GETDATE(),
    ExpiresAt DATETIME NOT NULL, -- 7 days from creation
    FOREIGN KEY (DashboardId) REFERENCES Dashboards(DashboardId) ON DELETE CASCADE,
    FOREIGN KEY (InvitedBy) REFERENCES Users(UserId) ON DELETE NO ACTION
)
```

---

### API ENDPOINTS

#### Authentication
All endpoints requiring authentication use **JWT Bearer tokens** in the Authorization header:
```
Authorization: Bearer <token>
```

---

#### 1. Get Dashboard Collaborators

**GET** `/api/dashboards/:dashboardId/users`

**Authentication:** Required (any role)

**Parameters:**
- `dashboardId` (path, required): The dashboard ID

**Response (200 OK):**
```json
[
  {
    "UserDashboardId": 1,
    "UserId": 2,
    "FullName": "John Doe",
    "Email": "john@example.com",
    "Role": "Editor",
    "JoinedAt": "2026-01-15T10:30:00Z"
  },
  {
    "UserDashboardId": 2,
    "UserId": 3,
    "FullName": "Jane Smith",
    "Email": "jane@example.com",
    "Role": "Viewer",
    "JoinedAt": "2026-01-20T14:45:00Z"
  }
]
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - No access to dashboard
- `404 Not Found` - Dashboard doesn't exist
- `500 Internal Server Error` - Server error

---

#### 2. Get Current User's Role

**GET** `/api/dashboards/:dashboardId/my-role`

**Authentication:** Required

**Parameters:**
- `dashboardId` (path, required): The dashboard ID

**Response (200 OK):**
```json
{
  "role": "Owner"
}
```

**Possible Roles:**
- `"Owner"` - Full administrative access
- `"Editor"` - Can create/edit content
- `"Viewer"` - Read-only access

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - User not in dashboard

---

#### 3. Update Collaborator Role

**PUT** `/api/dashboards/:dashboardId/users/:userId/role`

**Authentication:** Required (Owner only)

**Parameters:**
- `dashboardId` (path, required): The dashboard ID
- `userId` (path, required): The user ID to update

**Request Body:**
```json
{
  "role": "Editor"
}
```

**Valid Roles:** `"Owner"`, `"Editor"`, `"Viewer"`

**Response (200 OK):**
```json
{
  "message": "Role updated successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid role
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Only Owner can update roles
- `500 Internal Server Error` - Server error

---

#### 4. Remove Collaborator

**DELETE** `/api/dashboards/:dashboardId/users/:userId`

**Authentication:** Required (Owner only)

**Parameters:**
- `dashboardId` (path, required): The dashboard ID
- `userId` (path, required): The user ID to remove

**Response (200 OK):**
```json
{
  "message": "User removed from dashboard successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Missing parameters
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Only Owner can remove users
- `500 Internal Server Error` - Server error

---

#### 5. Send Invitation

**POST** `/api/dashboards/:dashboardId/invite`

**Authentication:** Required (Owner only)

**Parameters:**
- `dashboardId` (path, required): The dashboard ID

**Request Body:**
```json
{
  "email": "user@example.com",
  "role": "Editor"
}
```

**Valid Roles:** `"Owner"`, `"Editor"`, `"Viewer"`

**Response (201 Created):**
```json
{
  "InvitationId": 5,
  "Token": "a3f5d8b2c9e1f4a7b6c2d8e9f1a4b7c8d9e1f2a3b4c5d6e7f8a9b0c1d2e3f4",
  "CreatedAt": "2026-01-26T10:00:00Z",
  "ExpiresAt": "2026-02-02T10:00:00Z"
}
```

**Token Details:**
- 64-character random hex string
- Valid for 7 days from creation
- Used to accept/decline invitations

**Error Responses:**
- `400 Bad Request` - Missing email or invalid role
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Only Owner can send invitations
- `409 Conflict` - User already in dashboard
- `500 Internal Server Error` - Server error

---

#### 6. Get Pending Invitations

**GET** `/api/dashboards/invitations/pending`

**Authentication:** Required

**Parameters:** None

**Response (200 OK):**
```json
[
  {
    "InvitationId": 3,
    "DashboardId": 1,
    "DashboardName": "Project Alpha",
    "Description": "Q1 Project Planning",
    "Role": "Editor",
    "InvitedBy": 1,
    "InvitedByName": "Admin User",
    "CreatedAt": "2026-01-20T08:00:00Z",
    "ExpiresAt": "2026-01-27T08:00:00Z",
    "Token": "a3f5d8b2c9e1f4a7b6c2d8e9f1a4b7c8...",
    "Status": "Pending"
  }
]
```

**Important:** Only includes invitations:
- Addressed to the **current user's email**
- With status `"Pending"`
- That have **not expired** (ExpiresAt > current time)

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Server error

---

#### 7. Accept Invitation

**POST** `/api/dashboards/invitations/:token/accept`

**Authentication:** Required

**Parameters:**
- `token` (path, required): The invitation token (64-character hex)

**Request Body:** Empty `{}`

**Response (200 OK):**
```json
{
  "message": "Invitation accepted successfully"
}
```

**Behind the Scenes:**
1. Token validation - Must be valid and not expired
2. Email verification - User's email must match invitation email
3. User addition - User added to UserDashboards table with assigned role
4. Status update - Invitation status changed to "Accepted"

**Error Responses:**
- `400 Bad Request` - Invalid or expired invitation
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Invitation email doesn't match user's email
- `500 Internal Server Error` - Server error

---

#### 8. Decline Invitation

**POST** `/api/dashboards/invitations/:token/decline`

**Authentication:** Optional (can decline without being logged in)

**Parameters:**
- `token` (path, required): The invitation token (64-character hex)

**Request Body:** Empty `{}`

**Response (200 OK):**
```json
{
  "message": "Invitation declined"
}
```

**Behind the Scenes:**
1. Token lookup - Find invitation by token
2. Status update - Invitation status changed to "Declined"
3. No access granted - User does not gain dashboard access

**Error Responses:**
- `400 Bad Request` - Invalid token
- `500 Internal Server Error` - Server error

---

### CONTROLLER FUNCTIONS

#### File: `backend/controllers/dashboardController.js`

```javascript
// Get all users in a dashboard
async function getUsersByDashboard(req, res)
- Retrieves all collaborators with their roles
- Includes join dates and user info

// Get current user's role
async function getUserRole(req, res)
- Returns the authenticated user's role in the dashboard
- Used for permission checks

// Update collaborator role
async function updateUserRole(req, res)
- Changes a user's role (Owner only)
- Validates role is one of: Owner, Editor, Viewer

// Remove collaborator
async function removeUser(req, res)
- Removes user access to dashboard (Owner only)
- Deletes UserDashboard relationship

// Send invitation
async function sendInvitation(req, res)
- Creates a new PendingInvitations record
- Generates secure random token
- Sets 7-day expiration

// Get pending invitations
async function getPendingInvitations(req, res)
- Gets all pending invitations for user's email
- Only non-expired invitations
- Includes dashboard info and inviter details

// Accept invitation
async function acceptInvitation(req, res)
- Validates token and expiration
- Adds user to UserDashboards table
- Updates invitation status to "Accepted"

// Decline invitation
async function declineInvitation(req, res)
- Updates invitation status to "Declined"
- Does not grant access
```

---

### MODEL FUNCTIONS

#### File: `backend/models/dashboardModel.js`

```javascript
// Get users by dashboard
async function getUsersByDashboardId(dashboardId)
- Joins UserDashboards with Users table
- Returns all users in dashboard with roles

// Add user to dashboard
async function addUserToDashboard(userId, dashboardId, role = "Viewer")
- Inserts into UserDashboards table
- Defaults to Viewer role

// Remove user from dashboard
async function removeUserFromDashboard(userId, dashboardId)
- Deletes from UserDashboards table
- Cascade delete behavior enabled

// Get user role
async function getUserRole(userId, dashboardId)
- Returns single role value: Owner, Editor, or Viewer
- Returns null if user not in dashboard

// Update user role
async function updateUserRole(userId, dashboardId, role)
- Updates the Role column in UserDashboards
- Validates against valid roles

// Send invitation
async function sendInvitation(dashboardId, email, invitedBy, role = "Viewer")
- Creates PendingInvitations record
- Generates 64-character random hex token
- Sets expiration to 7 days from now
- Returns token and invitation details

// Get pending invitations
async function getPendingInvitations(email)
- Queries for user's pending invitations
- Joins with Dashboards and Users tables
- Filters: Status = 'Pending' AND ExpiresAt > NOW()
- Returns dashboard info, inviter name, dates

// Accept invitation
async function acceptInvitation(token, userId)
- Validates token exists and hasn't expired
- Verifies user email matches invitation email
- Adds user to UserDashboards with invitation role
- Updates invitation status to 'Accepted'

// Decline invitation
async function declineInvitation(token)
- Updates invitation status to 'Declined'
- Simple update operation
```

---

### MIDDLEWARE

#### JWT Authentication
**File:** `backend/middleware/jwtAuth.js`

```javascript
authMiddleware
- Validates JWT token in Authorization header
- Extracts user info: id, email, fullName, role
- Attaches to req.user object
- Returns 401 if missing/invalid token
```

#### Permission Check
**File:** `backend/middleware/permissionCheck.js`

```javascript
checkDashboardPermission(allowedRoles)
- Validates user has required role in dashboard
- Common usage: checkDashboardPermission(['Owner'])
- Only Owners can: invite, remove, update roles
- Returns 403 if insufficient permissions

checkDashboardAccess()
- Checks if user is in UserDashboards table
- Allows Owners, Editors, Viewers
- Returns 403 if no access
```

---

### SECURITY FEATURES

1. **JWT Authentication**
   - Tokens include user ID, email, full name, role
   - Validated on every protected endpoint
   - Expired tokens rejected automatically

2. **Role-Based Access Control (RBAC)**
   - Only Owners can manage collaborators
   - Viewers cannot modify anything
   - Editors can edit but not manage users

3. **Token-Based Invitations**
   - Invitations use 64-character random hex tokens
   - Tokens expire after 7 days
   - Cannot reuse expired tokens

4. **Email Verification**
   - Invitation must be accepted by correct email
   - Prevents token misuse across accounts

5. **Database Constraints**
   - Unique constraint on (UserId, DashboardId) prevents duplicates
   - Foreign key constraints ensure referential integrity
   - CASCADE delete for automatic cleanup

---

### ROUTES CONFIGURATION

**File:** `backend/routes/dashboardRoutes.js`

```javascript
// View collaborators - any member
GET /api/dashboards/:id/users
  • Requires: authMiddleware, checkDashboardAccess

// Check current user role - any member
GET /api/dashboards/:dashboardId/my-role
  • Requires: authMiddleware

// Get/update/delete collaborators - Owner only
PUT /api/dashboards/:dashboardId/users/:userId/role
  • Requires: authMiddleware, checkDashboardPermission(['Owner'])

DELETE /api/dashboards/:dashboardId/users/:userId
  • Requires: authMiddleware, checkDashboardPermission(['Owner'])

// Invitation endpoints - Owner only
POST /api/dashboards/:dashboardId/invite
  • Requires: authMiddleware, checkDashboardPermission(['Owner'])

// Invitation endpoints - any user
GET /api/dashboards/invitations/pending
  • Requires: authMiddleware

POST /api/dashboards/invitations/:token/accept
  • Requires: authMiddleware

POST /api/dashboards/invitations/:token/decline
  • Requires: authMiddleware
```

---

### EXAMPLE WORKFLOW

#### Scenario: Owner invites and manages a collaborator

**Step 1: Owner sends invitation**
```
POST /api/dashboards/1/invite
Authorization: Bearer ownerToken
{
  "email": "editor@example.com",
  "role": "Editor"
}

Response:
{
  "InvitationId": 5,
  "Token": "a3f5d8b2c9e1f4a7b6c2d8e9f1a4b7c8...",
  "ExpiresAt": "2026-02-02T10:00:00Z"
}
```

**Step 2: Backend creates PendingInvitations record**
- Email: editor@example.com
- Role: Editor
- Token: Secure random 64-char hex
- ExpiresAt: 7 days from now

**Step 3: Editor receives invitation, accepts it**
```
POST /api/dashboards/invitations/a3f5d8b2c9e1f4a7b6c2d8e9f1a4b7c8.../accept
Authorization: Bearer editorToken
{}

Response:
{
  "message": "Invitation accepted successfully"
}
```

**Step 4: Backend processes acceptance**
1. Validates token exists and not expired
2. Checks editor's email matches invitation
3. Adds editor to UserDashboards (role=Editor)
4. Updates invitation status to "Accepted"

**Step 5: Owner changes editor's role to Owner**
```
PUT /api/dashboards/1/users/2/role
Authorization: Bearer ownerToken
{
  "role": "Owner"
}

Response:
{
  "message": "Role updated successfully"
}
```

**Step 6: Backend updates role**
- Updates UserDashboards record
- Changes role from Editor to Owner

---

## SUMMARY TABLE

| Feature | User Interface | Backend Logic | Security |
|---------|-----------------|---------------|----------|
| **View Collaborators** | List with search | Query UserDashboards + Users | Any member |
| **Edit Roles** | Dropdown selector | Update UserDashboards role | Owner only |
| **Remove User** | Delete button | Delete from UserDashboards | Owner only |
| **Invite Users** | Modal form + search | Create PendingInvitations | Owner only |
| **Accept Invitation** | Click button | Validate token, add to dashboard | Email match |
| **Decline Invitation** | Click button | Mark as declined | None |
| **Manage Permissions** | Role-based UI | RBAC middleware checks | JWT + Role |

---

## TROUBLESHOOTING

### Invitation Not Appearing
- Check email matches account email
- Verify invitation hasn't expired (7 days)
- Check spam folder
- Ensure user is logged in

### Cannot Edit Collaborator Roles
- Verify you are an Owner
- Refresh page to ensure latest state
- Check browser console for errors

### Invitation Token Invalid
- Token may be expired (7-day limit)
- Copy token carefully (case-sensitive)
- Request new invitation from Owner

### Permission Denied Errors
- Ensure you have Owner role for that action
- Log out and log back in to refresh token
- Check Authorization header includes token

---

**Document Version:** 1.0  
**Last Updated:** January 26, 2026  
**Status:** Complete & Production Ready
