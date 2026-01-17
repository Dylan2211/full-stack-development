const sql = require("mssql");
const dbConfig = require("../dbConfig");
const { create } = require("node:domain");

async function getAllDashboards() {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request().query(`
    SELECT DashboardId, Name, Description, CreatedAt
    FROM Dashboards
    ORDER BY DashboardId DESC
  `);
  return result.recordset;
}

async function getDashboard(dashboardId) {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input("DashboardId", sql.Int, dashboardId)
    .query(`
      SELECT DashboardId, Name, Description, CreatedAt
      FROM Dashboards
      WHERE DashboardId = @DashboardId
    `);
  return result.recordset[0];
}
// Not implemented yet
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
// Not implemented yet
async function updateDashboard(dashboardId, name, description) {
  const pool = await sql.connect(dbConfig);
  await pool 
    .request()
    .input("DashboardId", sql.Int, dashboardId)
    .input("Name", sql.NVarChar, name)
    .input("Description", sql.NVarChar, description)
    .query(`
      UPDATE Dashboards
      SET Name = @Name, Description = @Description
      WHERE DashboardId = @DashboardId
    `);
  return { message: "Dashboard updated successfully" };
}
// Not implemented yet
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

module.exports = {
  getDashboard,
  createDashboard,
  updateDashboard,
  deleteDashboard,
  getAllDashboards,
  getUsersByDashboardId,
  addUserToDashboard,
  removeUserFromDashboard,
};
