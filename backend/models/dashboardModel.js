const sql = require("mssql");
const dbConfig = require("../dbConfig");
const crypto = require("crypto");

/**
 * Retrieves all dashboards from the database
 * @returns {Promise<Array>} Array of dashboard objects
 */
async function getAllDashboards() {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request().query(`
    SELECT DashboardId, Name, Description, IsPrivate, CreatedAt
    FROM Dashboards
    ORDER BY DashboardId DESC
  `);
  return result.recordset;
}

/**
 * Retrieves all dashboards for a specific user with collaborator information
 * @param {number} userId - The user's ID
 * @returns {Promise<Array>} Array of dashboard objects the user has access to
 */
async function getDashboardsByUserId(userId) {
  const pool = await sql.connect(dbConfig);
  
  // First get the dashboards
  const dashboardsResult = await pool.request()
    .input("UserId", sql.Int, userId)
    .query(`
      SELECT d.DashboardId, d.Name, d.Description, d.CreatedAt
      FROM Dashboards d
      JOIN UserDashboards ud ON ud.DashboardId = d.DashboardId
      WHERE ud.UserId = @UserId
      ORDER BY d.DashboardId DESC
    `);
  
  // Then get collaborators for each dashboard
  const dashboards = [];
  for (const dashboard of dashboardsResult.recordset) {
    const collaboratorsResult = await pool.request()
      .input("DashboardId", sql.Int, dashboard.DashboardId)
      .query(`
        SELECT 
          u.FullName as Name,
          u.Email,
          ud.Role,
          'accepted' as Status
        FROM UserDashboards ud
        JOIN Users u ON u.UserId = ud.UserId
        WHERE ud.DashboardId = @DashboardId
      `);
    
    dashboards.push({
      ...dashboard,
      Collaborators: collaboratorsResult.recordset
    });
  }
  
  return dashboards;
}

/**
 * Retrieves a single dashboard by ID
 * @param {number} dashboardId - The dashboard's ID
 * @returns {Promise<Object>} Dashboard object
 */
async function getDashboard(dashboardId) {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input("DashboardId", sql.Int, dashboardId)
    .query(`
      SELECT DashboardId, Name, Description, IsPrivate, CreatedAt
      FROM Dashboards
      WHERE DashboardId = @DashboardId
    `);
  return result.recordset[0];
}

/**
 * Creates a new dashboard
 * @param {string} name - Dashboard name
 * @param {string} description - Dashboard description
 * @returns {Promise<Object>} Created dashboard object with ID
 */
async function createDashboard(name, description) {
  const pool = await sql.connect(dbConfig);
  const result = await pool
    .request()
    .input("Name", sql.NVarChar, name)
    .input("Description", sql.NVarChar, description)
    .query(`
      INSERT INTO Dashboards (Name, Description)
      VALUES (@Name, @Description);
      SELECT SCOPE_IDENTITY() AS DashboardId;
    `);
  
  const dashboardId = result.recordset[0].DashboardId;
  return {
    DashboardId: dashboardId,
    Name: name,
    Description: description
  };
}
async function updateDashboard(dashboardId, name, description, isPrivate) {
  const pool = await sql.connect(dbConfig);
  const request = pool.request().input("DashboardId", sql.Int, dashboardId);
  
  const updates = [];
  if (name !== undefined) {
    request.input("Name", sql.NVarChar, name);
    updates.push("Name = @Name");
  }
  if (description !== undefined) {
    request.input("Description", sql.NVarChar, description);
    updates.push("Description = @Description");
  }
  if (isPrivate !== undefined) {
    request.input("IsPrivate", sql.Bit, isPrivate);
    updates.push("IsPrivate = @IsPrivate");
  }
  
  if (updates.length === 0) {
    return { message: "No fields to update" };
  }
  
  await request.query(`
    UPDATE Dashboards
    SET ${updates.join(", ")}
    WHERE DashboardId = @DashboardId
  `);
  return { message: "Dashboard updated successfully" };
}

async function deleteDashboard(dashboardId) {
  const pool = await sql.connect(dbConfig);
  await pool
    .request()
    .input("DashboardId", sql.Int, dashboardId)
    .query(`
      DELETE FROM Dashboards WHERE DashboardId = @DashboardId
    `);
  return { message: "Dashboard deleted successfully" };
}

async function getUsersByDashboardId(dashboardId) {
  const pool = await sql.connect(dbConfig);
  console.log(`Query: Getting users for dashboard ${dashboardId}`);
  const result = await pool.request().input("DashboardId", sql.Int, dashboardId)
    .query(`
      SELECT ud.UserDashboardId, u.UserId, u.FullName, u.Email, ud.Role, ud.JoinedAt
      FROM UserDashboards ud
      JOIN Users u ON ud.UserId = u.UserId
      WHERE ud.DashboardId = @DashboardId
    `);
  console.log(`Result: Found ${result.recordset.length} users for dashboard ${dashboardId}`);
  return result.recordset;
}

async function addUserToDashboard(userId, dashboardId, role = "Viewer") {
  console.log(`Adding user ${userId} to dashboard ${dashboardId} with role ${role}`);
  
  const pool = await sql.connect(dbConfig);
  try {
    await pool
      .request()
      .input("UserId", sql.Int, userId)
      .input("DashboardId", sql.Int, dashboardId)
      .input("Role", sql.NVarChar, role).query(`
        INSERT INTO UserDashboards (UserId, DashboardId, Role)
        VALUES (@UserId, @DashboardId, @Role)
      `);
    console.log(`Successfully added user ${userId} to dashboard ${dashboardId} as ${role}`);
    return { message: "User added to dashboard successfully" };
  } catch (error) {
    console.error(`Error adding user to dashboard:`, error);
    throw error;
  }
}

async function removeUserFromDashboard(userId, dashboardId) {
  const pool = await sql.connect(dbConfig);
  await pool
    .request()
    .input("UserId", sql.Int, userId)
    .input("DashboardId", sql.Int, dashboardId).query(`
      DELETE FROM UserDashboards WHERE UserId = @UserId AND DashboardId = @DashboardId
    `);
  return { message: "User removed from dashboard successfully" };
}

async function getUserRole(userId, dashboardId) {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input("UserId", sql.Int, userId)
    .input("DashboardId", sql.Int, dashboardId)
    .query(`
      SELECT Role FROM UserDashboards 
      WHERE UserId = @UserId AND DashboardId = @DashboardId
    `);
  return result.recordset[0]?.Role || null;
}

async function updateUserRole(userId, dashboardId, role) {
  const pool = await sql.connect(dbConfig);
  await pool.request()
    .input("UserId", sql.Int, userId)
    .input("DashboardId", sql.Int, dashboardId)
    .input("Role", sql.NVarChar, role)
    .query(`
      UPDATE UserDashboards 
      SET Role = @Role 
      WHERE UserId = @UserId AND DashboardId = @DashboardId
    `);
  return { message: "Role updated successfully" };
}

/**
 * Sends an invitation to an email for a dashboard
 * @param {number} dashboardId - The dashboard ID
 * @param {string} email - Email of invitee
 * @param {number} invitedBy - User ID of inviter
 * @param {string} role - Role (Owner, Editor, Viewer)
 * @returns {Promise<Object>} Invitation object with token
 */
async function sendInvitation(dashboardId, email, invitedBy, role = "Viewer") {
  const pool = await sql.connect(dbConfig);
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  const result = await pool.request()
    .input("DashboardId", sql.Int, dashboardId)
    .input("Email", sql.NVarChar, email)
    .input("Role", sql.NVarChar, role)
    .input("InvitedBy", sql.Int, invitedBy)
    .input("Token", sql.NVarChar, token)
    .input("ExpiresAt", sql.DateTime, expiresAt)
    .query(`
      INSERT INTO PendingInvitations (DashboardId, Email, Role, InvitedBy, Token, ExpiresAt)
      OUTPUT INSERTED.InvitationId, INSERTED.Token, INSERTED.CreatedAt, INSERTED.ExpiresAt
      VALUES (@DashboardId, @Email, @Role, @InvitedBy, @Token, @ExpiresAt)
    `);
  
  return result.recordset[0];
}

/**
 * Gets all pending invitations for a user email
 * @param {string} email - Email to check
 * @returns {Promise<Array>} Array of pending invitations
 */
async function getPendingInvitations(email) {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input("Email", sql.NVarChar, email)
    .query(`
      SELECT i.InvitationId, i.DashboardId, d.Name as DashboardName, d.Description,
             i.Role, i.InvitedBy, u.FullName as InvitedByName, i.CreatedAt, i.ExpiresAt, i.Token, i.Status
      FROM PendingInvitations i
      JOIN Dashboards d ON i.DashboardId = d.DashboardId
      JOIN Users u ON i.InvitedBy = u.UserId
      WHERE i.Email = @Email AND i.Status = 'Pending' AND i.ExpiresAt > GETDATE()
      ORDER BY i.CreatedAt DESC
    `);
  return result.recordset;
}

/**
 * Accepts an invitation and adds user to dashboard
 * @param {string} token - Invitation token
 * @param {number} userId - User ID accepting
 * @returns {Promise<Object>} Result
 */
async function acceptInvitation(token, userId) {
  const pool = await sql.connect(dbConfig);
  
  // Get invitation
  const invitationResult = await pool.request()
    .input("Token", sql.NVarChar, token)
    .query(`
      SELECT * FROM PendingInvitations 
      WHERE Token = @Token AND Status = 'Pending' AND ExpiresAt > GETDATE()
    `);
  
  const invitation = invitationResult.recordset[0];
  if (!invitation) {
    throw new Error("Invalid or expired invitation");
  }
  
  // Check if user email matches
  const userResult = await pool.request()
    .input("UserId", sql.Int, userId)
    .query(`SELECT Email FROM Users WHERE UserId = @UserId`);
  
  const user = userResult.recordset[0];
  if (!user || user.Email !== invitation.Email) {
    throw new Error("Invitation email does not match your account");
  }
  
  // Add user to dashboard
  await pool.request()
    .input("UserId", sql.Int, userId)
    .input("DashboardId", sql.Int, invitation.DashboardId)
    .input("Role", sql.NVarChar, invitation.Role)
    .query(`
      INSERT INTO UserDashboards (UserId, DashboardId, Role)
      VALUES (@UserId, @DashboardId, @Role)
    `);
  
  // Update invitation status
  await pool.request()
    .input("Token", sql.NVarChar, token)
    .query(`
      UPDATE PendingInvitations 
      SET Status = 'Accepted' 
      WHERE Token = @Token
    `);
  
  return { message: "Invitation accepted successfully" };
}

/**
 * Declines an invitation
 * @param {string} token - Invitation token
 * @returns {Promise<Object>} Result
 */
async function declineInvitation(token) {
  const pool = await sql.connect(dbConfig);
  await pool.request()
    .input("Token", sql.NVarChar, token)
    .query(`
      UPDATE PendingInvitations 
      SET Status = 'Declined' 
      WHERE Token = @Token
    `);
  return { message: "Invitation declined" };
}

/**
 * Create a new invitation
 */
async function createInvitation(dashboardId, email, role, invitedBy) {
  const pool = await sql.connect(dbConfig);
  const token = require("crypto").randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  
  const result = await pool.request()
    .input("DashboardId", sql.Int, dashboardId)
    .input("Email", sql.NVarChar, email)
    .input("Role", sql.NVarChar, role)
    .input("InvitedBy", sql.Int, invitedBy)
    .input("Token", sql.NVarChar, token)
    .input("ExpiresAt", sql.DateTime, expiresAt)
    .query(`
      INSERT INTO PendingInvitations (DashboardId, Email, Role, InvitedBy, Token, ExpiresAt)
      VALUES (@DashboardId, @Email, @Role, @InvitedBy, @Token, @ExpiresAt);
      SELECT SCOPE_IDENTITY() AS InvitationId;
    `);
  
  return {
    InvitationId: result.recordset[0].InvitationId,
    DashboardId: dashboardId,
    Email: email,
    Role: role,
    Token: token,
    Status: 'Pending'
  };
}

/**
 * Get any invitation by dashboard and email (regardless of status)
 */
async function getInvitationByDashboardAndEmail(dashboardId, email) {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input("DashboardId", sql.Int, dashboardId)
    .input("Email", sql.NVarChar, email)
    .query(`
      SELECT * FROM PendingInvitations 
      WHERE DashboardId = @DashboardId AND Email = @Email
    `);
  
  return result.recordset[0] || null;
}

/**
 * Update existing invitation
 */
async function updateInvitation(invitationId, role, invitedBy) {
  const pool = await sql.connect(dbConfig);
  const token = require("crypto").randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  
  const result = await pool.request()
    .input("InvitationId", sql.Int, invitationId)
    .input("Role", sql.NVarChar, role)
    .input("InvitedBy", sql.Int, invitedBy)
    .input("Token", sql.NVarChar, token)
    .input("ExpiresAt", sql.DateTime, expiresAt)
    .query(`
      UPDATE PendingInvitations 
      SET Role = @Role, InvitedBy = @InvitedBy, Token = @Token, 
          Status = 'Pending', ExpiresAt = @ExpiresAt, CreatedAt = GETDATE()
      WHERE InvitationId = @InvitationId;
      
      SELECT * FROM PendingInvitations WHERE InvitationId = @InvitationId;
    `);
  
  return result.recordset[0];
}

/**
 * Get pending invitation by dashboard and email
 */
async function getPendingInvitation(dashboardId, email) {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input("DashboardId", sql.Int, dashboardId)
    .input("Email", sql.NVarChar, email)
    .query(`
      SELECT * FROM PendingInvitations 
      WHERE DashboardId = @DashboardId AND Email = @Email AND Status = 'Pending'
    `);
  
  return result.recordset[0] || null;
}

/**
 * Get all pending invitations for a dashboard
 */
async function getDashboardInvitations(dashboardId) {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input("DashboardId", sql.Int, dashboardId)
    .query(`
      SELECT pi.*, u.FullName as InviterName
      FROM PendingInvitations pi
      JOIN Users u ON u.UserId = pi.InvitedBy
      WHERE pi.DashboardId = @DashboardId AND pi.Status = 'Pending'
      ORDER BY pi.CreatedAt DESC
    `);
  
  return result.recordset;
}

/**
 * Accept an invitation
 */
async function acceptInvitationById(invitationId, userId) {
  const pool = await sql.connect(dbConfig);
  
  // Get invitation details
  const invitationResult = await pool.request()
    .input("InvitationId", sql.Int, invitationId)
    .query(`
      SELECT * FROM PendingInvitations 
      WHERE InvitationId = @InvitationId AND Status = 'Pending'
    `);
  
  if (!invitationResult.recordset.length) {
    throw new Error("Invitation not found or already processed");
  }
  
  const invitation = invitationResult.recordset[0];
  
  // Check if invitation has expired
  if (invitation.ExpiresAt && new Date() > new Date(invitation.ExpiresAt)) {
    throw new Error("Invitation has expired");
  }
  
  // Add user to dashboard
  await addUserToDashboard(userId, invitation.DashboardId, invitation.Role);
  
  // Mark invitation as accepted
  await pool.request()
    .input("InvitationId", sql.Int, invitationId)
    .query(`
      UPDATE PendingInvitations 
      SET Status = 'Accepted' 
      WHERE InvitationId = @InvitationId
    `);
  
  return { message: "Invitation accepted successfully" };
}

/**
 * Decline an invitation by ID
 */
async function declineInvitationById(invitationId) {
  const pool = await sql.connect(dbConfig);
  
  await pool.request()
    .input("InvitationId", sql.Int, invitationId)
    .query(`
      UPDATE PendingInvitations 
      SET Status = 'Declined' 
      WHERE InvitationId = @InvitationId AND Status = 'Pending'
    `);
  
  return { message: "Invitation declined" };
}

/**
 * Rescind an invitation (owner only)
 */
async function rescindInvitation(invitationId) {
  const pool = await sql.connect(dbConfig);
  
  await pool.request()
    .input("InvitationId", sql.Int, invitationId)
    .query(`
      DELETE FROM PendingInvitations 
      WHERE InvitationId = @InvitationId AND Status = 'Pending'
    `);
  
  return { message: "Invitation rescinded" };
}

module.exports = {
  getDashboard,
  createDashboard,
  updateDashboard,
  deleteDashboard,
  getAllDashboards,
  getDashboardsByUserId,
  getUsersByDashboardId,
  addUserToDashboard,
  removeUserFromDashboard,
  getUserRole,
  updateUserRole,
  sendInvitation,
  getPendingInvitations,
  acceptInvitation,
  declineInvitation,
  createInvitation,
  updateInvitation,
  getPendingInvitation,
  getInvitationByDashboardAndEmail,
  getDashboardInvitations,
  acceptInvitationById,
  declineInvitationById,
  rescindInvitation,
};
