const sql = require("mssql");
const dbConfig = require("../dbConfig");

// Get all dashboards
async function getAllDashboards() {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request().query(`
    SELECT DashboardId, Name, Description, CreatedAt
    FROM Dashboards
  `);
  return result.recordset;
}

// Get all users linked to a dashboard
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

// Add user to dashboard
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

// Remove user from dashboard
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

module.exports = {
  getAllDashboards,
  getUsersByDashboardId,
  addUserToDashboard,
  removeUserFromDashboard,
};
