const sql = require("mssql");
const dbConfig = require("../dbConfig");

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
 * Retrieves all dashboards for a specific user
 * @param {number} userId - The user's ID
 * @returns {Promise<Array>} Array of dashboard objects the user has access to
 */
async function getDashboardsByUserId(userId) {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input("UserId", sql.Int, userId)
    .query(`
      SELECT d.DashboardId, d.Name, d.Description, d.CreatedAt
      FROM Dashboards d
      JOIN UserDashboards ud ON ud.DashboardId = d.DashboardId
      WHERE ud.UserId = @UserId
      ORDER BY d.DashboardId DESC
    `);
  return result.recordset;
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
  const result = await pool.request().input("DashboardId", sql.Int, dashboardId)
    .query(`
      SELECT ud.UserDashboardId, u.UserId, u.FullName, u.Email, ud.Role, ud.JoinedAt
      FROM UserDashboards ud
      JOIN Users u ON ud.UserId = u.UserId
      WHERE ud.DashboardId = @DashboardId
    `);
  return result.recordset;
}

async function addUserToDashboard(userId, dashboardId, role = "Viewer") {
  
  const pool = await sql.connect(dbConfig);
  await pool
    .request()
    .input("UserId", sql.Int, userId)
    .input("DashboardId", sql.Int, dashboardId)
    .input("Role", sql.NVarChar, role).query(`
      INSERT INTO UserDashboards (UserId, DashboardId, Role)
      VALUES (@UserId, @DashboardId, @Role)
    `);
  return { message: "User added to dashboard successfully" };
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
};
