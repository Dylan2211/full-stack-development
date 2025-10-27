const dbConfig = require("../dbConfig");
const sql = require("mssql");

async function createTask(task) {
  try {
    const { title, description, dueDate, isDone } = task;
    const pool = await dbConfig;
    const result = await pool
      .request()
      .input("title", sql.NVarChar, title)
      .input("description", sql.NVarChar, description)
      .input("dueDate", sql.DateTime, dueDate)
      .input("isDone", sql.Bit, isDone)
      .query(`INSERT INTO Tasks (Title, Description, DueDate, IsDone)
            OUTPUT INSERTED.TaskId AS TaskId
            VALUES (@title, @description, @dueDate, @imageUrl, @isDone)`);

    return result.recordset[0].TaskId;
  } catch (error) {
    console.error("Error in createTask:", error.message);
    throw new Error("Database query failed");
  }
}

async function createSubtask({ taskId, subtask }) {
  try {
    const { title, isDone } = subtask;
    const pool = await dbConfig;
    const result = await pool
      .request()
      .input("taskId", sql.Int, taskId)
      .input("title", sql.NVarChar, title)
      .input("isDone", sql.Bit, isDone)
      .query(`INSERT INTO Subtasks (TaskId, Title, IsDone)
            OUTPUT INSERTED.TaskId AS TaskId
            VALUES (@taskId, @title, @isDone)`);

    return result.recordset[0].TaskId;
  } catch (error) {
    console.error("Error in createSubtask:", error.message);
    throw new Error("Database query failed");
  }
}
// Filter by date rather than single date

async function getAllTasks({ sortDate, isDone }) {
  try {
    const pool = await dbConfig;
    let query = `SELECT * FROM Tasks WHERE 1 = 1`;
    const request = pool.request();
    if (isDone == "true") {
      query += " AND IsDone = @isDone";
      request.input("isDone", sql.Bit, isDone);
    }
    if (sortDate == "DESC") {
      query += " ORDER BY DueDate DESC";
    } else if (sortDate == "ASC") {
      query += " ORDER BY DueDate ASC";
    }
    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error("Error in getAllTasks:", error.message);
    throw new Error("Database query failed");
  }
}

async function getTaskById(taskId) {
  try {
    const pool = await dbConfig;
    const result = await pool
      .request()
      .input("taskId", sql.Int, taskId)
      .query(`SELECT * FROM Tasks WHERE TaskId = @taskId`);
    return result.recordset[0] || null;
  } catch (err) {
    console.error("Error getting task by id:", err.message);
    throw new Error("Database query failed");
  }
}

async function updateTask({ taskId, taskData }) {
  try {
    const { title, description, dueDate, imageUrl, isDone } = taskData;
    const pool = await dbConfig;
    const result = await pool
      .request()
      .input("title", sql.NVarChar, title)
      .input("description", sql.NVarChar, description)
      .input("dueDate", sql.DateTime, dueDate)
      .input("imageUrl", sql.NVarChar, imageUrl)
      .input("isDone", sql.Bit, isDone)
      .input("taskId", sql.Int, taskId)
      .query(
        `UPDATE Tasks 
        SET Title = @title, Description = @description, DueDate = @dueDate, ImageUrl = @imageUrl, isDone = @isDone 
        WHERE TaskId = @taskId`
      );

    const updated = result.rowsAffected[0] > 0;
    return { updated };
  } catch (error) {
    console.error("Error in updateTask:", error.message);
    throw new Error("Database query failed");
  }
}

async function deleteTask(taskId) {
  try {
    const pool = await dbConfig;
    const result = await pool
      .request()
      .input("taskId", sql.Int, taskId)
      .query(`DELETE FROM Tasks WHERE TaskId = @taskId`);
    const deleted = result.rowsAffected[0] > 0;
    return deleted;
  } catch (error) {
    console.error("Error in deleteTask:", error.message);
    throw new Error("Database query failed");
  }
}

module.exports = {
  createTask,
  createSubtask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
