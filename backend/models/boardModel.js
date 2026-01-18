const dbConfig = require("../dbConfig");
const sql = require("mssql");

/**
 * Creates a new board within a dashboard
 * @param {Object} params - Board parameters
 * @param {number} params.dashboardId - ID of the parent dashboard
 * @param {string} params.name - Name of the board
 * @returns {Promise<Object>} Created board object
 */
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

/**
 * Retrieves a single board by ID
 * @param {number} boardId - The board's ID
 * @returns {Promise<Object|null>} Board object or null if not found
 */
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
      .query(`SELECT * FROM Boards WHERE DashboardId = @dashboardId ORDER BY Position ASC`);
    return result.recordset;
  } catch (err) {
    console.error("Error getting board by dashboard id:", err.message);
    throw new Error("Database query failed");
  }
}

async function updateBoard({ boardId, name, position }) {
  try {
    const pool = await dbConfig;
    const request = pool.request().input("boardId", sql.Int, boardId);

    let query = `UPDATE Boards SET`;
    const updates = [];

    if (name !== undefined) {
      request.input("name", sql.NVarChar, name);
      updates.push(`Name = @name`);
    }

    if (position !== undefined) {
      request.input("position", sql.Int, position);
      updates.push(`Position = @position`);
    }

    if (updates.length === 0) {
      return false;
    }

    query += ` ${updates.join(", ")} WHERE BoardId = @boardId`;
    const result = await request.query(query);

    return result.rowsAffected[0] > 0;
  } catch (err) {
    console.error("Error updating board:", err.message);
    throw new Error("Database query failed");
  }
}

async function deleteBoard(boardId, targetBoardId = null) {
  try {
    const pool = await dbConfig;
    
    // If targetBoardId is provided, move tasks first
    if (targetBoardId) {
      await pool
        .request()
        .input("fromBoardId", sql.Int, boardId)
        .input("toBoardId", sql.Int, targetBoardId)
        .query(`UPDATE Tasks SET BoardId = @toBoardId WHERE BoardId = @fromBoardId`);
    } else {
      // Delete all tasks if no target board specified
      await pool
        .request()
        .input("boardId", sql.Int, boardId)
        .query(`DELETE FROM Tasks WHERE BoardId = @boardId`);
    }
    
    // Now delete the board
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