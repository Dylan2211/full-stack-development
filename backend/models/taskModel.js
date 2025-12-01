const dbConfig = require("../dbConfig");
const sql = require("mssql");

async function createTask(task) {
  try {
    const {
      title,
      description,
      category = null, // Frontend, backend, DevOps, etc., Python, JavaScript, HTML etc.
      position = 0,
      status = "To Do", // To Do, In Progress, Done
      skills = [], // Required skills for the task
      assignedAgent, // Possible assigned AI agent
      boardId,
      estimatedDuration = null,
      agentMatchScore = null,
      agentProgress = 0,
      dependencies = [], // Other task IDs that this task depends on
      createdBy = null,
      createdAt = new Date(),
    } = task;

    const pool = await dbConfig;
    const result = await pool
      .request()
      .input("title", sql.NVarChar, title)
      .input("description", sql.NVarChar, description)
      .input("category", sql.NVarChar, category)
      .input("position", sql.Int, position)
      .input("status", sql.NVarChar, status)
      .input("assignedAgent", sql.NVarChar, assignedAgent)
      .input("boardId", sql.Int, boardId)
      .input("skills", sql.NVarChar, JSON.stringify(skills))
      .input("estimatedDuration", sql.NVarChar, estimatedDuration)
      .input("agentMatchScore", sql.Int, agentMatchScore)
      .input("agentProgress", sql.Int, agentProgress)
      .input("dependencies", sql.NVarChar, JSON.stringify(dependencies))
      .input("createdBy", sql.Int, createdBy)
      .input("createdAt", sql.DateTime, createdAt || new Date()).query(`
        INSERT INTO Tasks (
          Title, Description, Category, Position, Status, BoardId, Skills, EstimatedDuration,
          AssignedAgent, AgentMatchScore, AgentProgress, Dependencies, CreatedBy, CreatedAt
        )
        OUTPUT INSERTED.TaskId AS TaskId
        VALUES (
          @title, @description, @category, @position, @status, @boardId, @skills, @estimatedDuration,
          @assignedAgent, @agentMatchScore, @agentProgress, @dependencies, @createdBy, @createdAt
        )
      `);

    return result.recordset[0].TaskId;
  } catch (error) {
    console.error("Error in createTask:", error.message);
    throw new Error("Database query failed");
  }
}

async function getTasksByBoardId(boardId) {
  try {
    const pool = await dbConfig;
    const result = await pool
      .request()
      .input("boardId", sql.Int, boardId)
      .query(`SELECT * FROM Tasks WHERE BoardId = @boardId`);
    return result.recordset;
  } catch (err) {
    console.error("Error getting tasks by board id:", err.message);
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
      //
      boardId,
      position,
      //
      title,
      description,
      //
      createdBy,
      createdAt,
      assignedAgent,
      skills,
      category,
      status,
      estimatedDuration,
      agentMatchScore,
      agentProgress,
      dependencies,
    } = taskData;
    const pool = await dbConfig;
    const result = await pool
      .request()
      .input("boardId", sql.Int, boardId)
      .input("position", sql.Int, position)
      .input("title", sql.NVarChar, title)
      .input("description", sql.NVarChar, description)
      //
      .input("createdBy", sql.NVarChar, createdBy)
      .input("createdAt", sql.DateTime, createdAt)
      .input("updatedAt", sql.DateTime, new Date())
      .input("category", sql.NVarChar, category)
      .input("skills", sql.NVarChar, skills)
      .input("taskId", sql.Int, taskId)
      .input("status", sql.NVarChar, status)
      .input("estimatedDuration", sql.NVarChar, estimatedDuration)
      .input("assignedAgent", sql.NVarChar, assignedAgent)
      .input("agentMatchScore", sql.Int, agentMatchScore)
      .input("agentProgress", sql.Int, agentProgress)
      .input("dependencies", sql.NVarChar, JSON.stringify(dependencies))
      .query(
        `UPDATE Tasks 
        SET Title = @title, Description = @description, Category = @category, Position = @position, Skills = @skills, Status = @status, BoardId = @boardId, EstimatedDuration = @estimatedDuration,
            AssignedAgent = @assignedAgent, AgentMatchScore = @agentMatchScore, AgentProgress = @agentProgress,
            Dependencies = @dependencies, CreatedBy = @createdBy, CreatedAt = @createdAt, UpdatedAt = @updatedAt
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
  // getAllTasks,
  getTasksByBoardId,
  getTaskById,
  updateTask,
  deleteTask,
};
