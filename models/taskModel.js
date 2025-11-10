const dbConfig = require("../dbConfig");
const sql = require("mssql");

async function createTask(task) {
  try {
    const {
      title,
      description,
      category, // Frontend, backend, DevOps, etc., Python, JavaScript, HTML etc.
      priority, // Low, Medium, High
      status, // To Do, In Progress, Done
      skills, // Required skills for the task
      assignedAgent, // Possible assigned AI agent
      boardId,
      estimatedDuration,
      agentMatchScore,
      agentProgress,
      dependencies,
      createdBy,
      createdAt,
    } = task;

    const pool = await dbConfig;
    const result = await pool
      .request()
      .input("title", sql.NVarChar, title)
      .input("description", sql.NVarChar, description)
      .input("category", sql.NVarChar, category)
      .input("priority", sql.NVarChar, priority)
      .input("status", sql.NVarChar, status)
      .input("assignedAgent", sql.NVarChar, assignedAgent)
      .input("boardId", sql.Int, boardId)
      .input("skills", sql.NVarChar, JSON.stringify(skills))
      .input("estimatedDuration", sql.NVarChar, estimatedDuration)
      .input("agentMatchScore", sql.Int, agentMatchScore)
      .input("agentProgress", sql.Int, agentProgress)
      .input("dependencies", sql.NVarChar, JSON.stringify(dependencies))
      .input("createdBy", sql.NVarChar, createdBy)
      .input("createdAt", sql.DateTime, createdAt || new Date()).query(`
        INSERT INTO Tasks (
          Title, Description, Category, Priority, Status, BoardId, Skills, EstimatedDuration,
          AssignedAgent, AgentMatchScore, AgentProgress, Dependencies, CreatedBy, CreatedAt
        )
        OUTPUT INSERTED.TaskId AS TaskId
        VALUES (
          @title, @description, @category, @priority, @status, @boardId, @skills, @estimatedDuration,
          @assignedAgent, @agentMatchScore, @agentProgress, @dependencies, @createdBy, @createdAt
        )
      `);

    return result.recordset[0].TaskId;
  } catch (error) {
    console.error("Error in createTask:", error.message);
    throw new Error("Database query failed");
  }
}

async function getAllTasks({ status, priority }) {
  try {
    const pool = await dbConfig;
    let query = `SELECT * FROM Tasks WHERE 1 = 1`;
    const request = pool.request();

    if (status) {
      query += " AND Status = @status";
      request.input("status", sql.NVarChar, status);
    }
    if (priority) {
      query += " AND Priority = @priority";
      request.input("priority", sql.NVarChar, priority);
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
    const {
      title,
      description,
      category,
      priority,
      status,
      boardId,
      estimatedDuration,
      assignedAgent,
      agentMatchScore,
      agentProgress,
      dependencies,
      createdBy,
      createdAt,
    } = taskData;
    const pool = await dbConfig;
    const result = await pool
      .request()
      .input("title", sql.NVarChar, title)
      .input("description", sql.NVarChar, description)
      .input("category", sql.NVarChar, category)
      .input("priority", sql.NVarChar, priority)
      .input("skills", sql.NVarChar, skills)
      .input("boardId", sql.Int, boardId)
      .input("taskId", sql.Int, taskId)
      .input("status", sql.NVarChar, status)
      .input("estimatedDuration", sql.NVarChar, estimatedDuration)
      .input("assignedAgent", sql.NVarChar, assignedAgent)
      .input("agentMatchScore", sql.Int, agentMatchScore)
      .input("agentProgress", sql.Int, agentProgress)
      .input("dependencies", sql.NVarChar, JSON.stringify(dependencies))
      .input("createdBy", sql.NVarChar, createdBy)
      .input("createdAt", sql.DateTime, createdAt)
      .query(
        `UPDATE Tasks 
        SET Title = @title, Description = @description, Category = @category, Priority = @priority, Skills = @skills, Status = @status, BoardId = @boardId, EstimatedDuration = @estimatedDuration,
            AssignedAgent = @assignedAgent, AgentMatchScore = @agentMatchScore, AgentProgress = @agentProgress,
            Dependencies = @dependencies, CreatedBy = @createdBy, CreatedAt = @createdAt
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
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
