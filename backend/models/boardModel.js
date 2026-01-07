const dbConfig = require("../dbConfig");
const sql = require("mssql");


async function createBoard({ dashboardId, name }) {
  try {
    const pool = await dbConfig;
    const result = await pool
      .request()
      .input("dashboardId", sql.Int, dashboardId)
      .input("name", sql.NVarChar, name)
      .input("createdAt", sql.DateTime, new Date())
      .query(
        `INSERT INTO Boards (DashboardId, Name, CreatedAt)
         OUTPUT INSERTED.BoardId, INSERTED.DashboardId, INSERTED.Name, INSERTED.CreatedAt
         VALUES (@dashboardId, @name, @createdAt)`
      );

    return result.recordset[0];
  } catch (err) {
    console.error("Error creating board:", err.message);
    throw new Error("Database query failed");
  }
}

async function getBoard(boardId) {
  try {
    const pool = await dbConfig;
    const result = await pool
      .request()
      .input("boardId", sql.Int, boardId)
      .query(`SELECT * FROM Boards WHERE BoardId = @boardId`);
    return result.recordset[0] || null;
  } catch (err) {
    console.error("Error getting board by id:", err.message);
    throw new Error("Database query failed");
  }
}

async function getBoardByDashboardId(dashboardId) {
  try {
    const pool = await dbConfig;
    const result = await pool
      .request()
      .input("dashboardId", sql.Int, dashboardId)
      .query(`SELECT * FROM Boards WHERE DashboardId = @dashboardId`);
    return result.recordset;
  } catch (err) {
    console.error("Error getting board by dashboard id:", err.message);
    throw new Error("Database query failed");
  }
}

async function updateBoard({ boardId, name }) {
  try {
    const pool = await dbConfig;
    const result = await pool
        .request()
        .input("boardId", sql.Int, boardId)
        .input("name", sql.NVarChar, name)
        .query(
            `UPDATE Boards
                SET Name = @name
                WHERE BoardId = @boardId`
        );

    return result.rowsAffected[0] > 0;
  } catch (err) {
    console.error("Error updating board:", err.message);
    throw new Error("Database query failed");
  }
}

async function deleteBoard(boardId) {
  try {
    const pool = await dbConfig;
    const result = await pool
      .request()
      .input("boardId", sql.Int, boardId)
      .query(`DELETE FROM Boards WHERE BoardId = @boardId`);
    return result.rowsAffected[0] > 0;
  } catch (err) {
    console.error("Error deleting board:", err.message);
    throw new Error("Database query failed");
  } 
}

module.exports = {
    createBoard,
    getBoard,
    getBoardByDashboardId,
    updateBoard,
    deleteBoard,
}