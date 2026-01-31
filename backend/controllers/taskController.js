const taskModel = require("../models/taskModel");
const boardModel = require("../models/boardModel");
const aiAssignAgent = require("../ai/aiAssignAgent");
const userAnalyticsModel = require("../models/userAnalyticsModel");

async function createTask(req, res) {
  try {
    console.log("[createTask] Starting task creation with body:", JSON.stringify(req.body));
    
    if (!req.body.boardId) {
      console.error("[createTask] Missing boardId");
      return res.status(400).json({ error: "BoardId is required" });
    }
    if (req.body.position == undefined) {
      console.error("[createTask] Missing position");
      return res.status(400).json({ error: "Position is required" });
    }

    // Get dashboardId from boardId for logging
    const board = await boardModel.getBoard(req.body.boardId);
    if (!board) {
      console.error("[createTask] Invalid boardId:", req.body.boardId);
      return res.status(400).json({ error: "Invalid boardId" });
    }

    const userId = req.user?.userId || req.user?.id;
    const dashboardId = board.DashboardId;
    
    console.log(`[createTask] User ${userId} creating task in board ${req.body.boardId}, dashboard ${dashboardId}`);

    try {
      console.log("[createTask] Calling aiAssignAgent...");
      const aiData = await aiAssignAgent.aiAssignAgent(req.body, userId, dashboardId, null);
      console.log("[createTask] AI agent assignment returned:", JSON.stringify(aiData));
      
      const task = { 
        ...req.body, 
        ...aiData,
        // Map requiredSkills to skills if provided
        skills: req.body.requiredSkills || req.body.skills || [],
        // Map assignedAgents to assignedAgent if provided and no aiData assignment
        assignedAgent: aiData.assignedAgent || (req.body.assignedAgents ? req.body.assignedAgents.join(',') : undefined),
        // Ensure createdBy is set to the authenticated user
        createdBy: userId
      };
      // Remove the plural form so it doesn't conflict
      delete task.assignedAgents;
      console.log("[createTask] Final task object:", JSON.stringify(task));
      
      const taskId = await taskModel.createTask(task);
      console.log("[createTask] Task created successfully with ID:", taskId);

      // Log user activity
      await userAnalyticsModel.logUserActivity(
        userId,
        dashboardId,
        'task_created',
        `Created task "${req.body.title || 'Untitled'}"`,
        taskId,
        req.body.boardId
      );

      res.status(201).json({ message: "Task created", taskId });
    } catch (aiError) {
      console.error("[createTask] AI assignment failed:", aiError.message, aiError);
      // Continue without AI assignment if it fails
      const task = { 
        ...req.body, 
        assignedAgent: "Manual", 
        agentMatchScore: 0,
        // Map requiredSkills to skills if provided
        skills: req.body.requiredSkills || req.body.skills || []
      };
      // Remove the plural form so it doesn't conflict
      delete task.assignedAgents;
      const taskId = await taskModel.createTask(task);
      console.log("[createTask] Task created with manual fallback, ID:", taskId);
      
      // Log user activity
      await userAnalyticsModel.logUserActivity(
        userId,
        dashboardId,
        'task_created',
        `Created task "${req.body.title || 'Untitled'}" (manual assignment)`,
        taskId,
        req.body.boardId
      );
      
      res.status(201).json({ message: "Task created", taskId });
    }
  } catch (error) {
    console.error("[createTask] Fatal error:", error.message, error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
}

async function getTask(req, res) {
  try {
    const taskId = parseInt(req.params.id);
    const task = await taskModel.getTask(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(task);
  } catch (error) {
    console.error(`Error getting task by id: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function updateTask(req, res) {
  try {
    const taskId = parseInt(req.params.id);
    const existing = await taskModel.getTask(taskId);
    if (!existing) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Allow partial updates by merging incoming values with the existing task.
    const mergedDependencies = (() => {
      if (Array.isArray(req.body.dependencies)) return req.body.dependencies;
      if (typeof req.body.dependencies === "string") {
        try {
          return JSON.parse(req.body.dependencies);
        } catch (_) {
          return [];
        }
      }
      if (typeof existing.Dependencies === "string") {
        try {
          return JSON.parse(existing.Dependencies);
        } catch (_) {
          return [];
        }
      }
      return existing.Dependencies || [];
    })();

    const mergedSkills = (() => {
      // Check for either requiredSkills or skills from request
      const skillsFromRequest = req.body.requiredSkills || req.body.skills;
      if (Array.isArray(skillsFromRequest)) return JSON.stringify(skillsFromRequest);
      if (typeof skillsFromRequest === "string") return skillsFromRequest;
      return existing.Skills || "[]";
    })();

    const taskData = {
      title: req.body.title ?? existing.Title,
      description: req.body.description ?? existing.Description,
      category: req.body.category ?? existing.Category,
      status: req.body.status ?? existing.Status,
      boardId: req.body.boardId ?? existing.BoardId,
      position: req.body.position ?? existing.Position,
      skills: mergedSkills,
      estimatedDuration: req.body.estimatedDuration ?? existing.EstimatedDuration,
      assignedAgent: req.body.assignedAgent ?? existing.AssignedAgent,
      agentMatchScore: req.body.agentMatchScore ?? existing.AgentMatchScore,
      agentProgress: req.body.agentProgress ?? existing.AgentProgress,
      dependencies: mergedDependencies,
      createdBy: existing.CreatedBy,
      createdAt: existing.CreatedAt,
      aiModel: req.body.aiModel ?? existing.AIModel,
      aiOutput: req.body.aiOutput ?? existing.AIOutput,
    };

    const { updated } = await taskModel.updateTask({ taskId, taskData });

    if (!updated) {
      return res.json({ error: "Task not found" });
    }

    // Log user activity
    const userId = req.user?.userId || req.user?.id;
    const board = await boardModel.getBoard(taskData.boardId);
    if (board) {
      await userAnalyticsModel.logUserActivity(
        userId,
        board.DashboardId,
        'task_updated',
        `Updated task "${taskData.title || 'Untitled'}"`,
        taskId,
        taskData.boardId
      );
    }

    res.json({ message: "Task updated successfully", taskId });
  } catch (error) {
    console.error("Error in updateTask:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function deleteTask(req, res) {
  try {
    const taskId = parseInt(req.params.id);
    const existing = await taskModel.getTask(taskId);
    
    const deleted = await taskModel.deleteTask(taskId);
    if (!deleted) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Log user activity
    const userId = req.user?.userId || req.user?.id;
    if (existing) {
      const board = await boardModel.getBoard(existing.BoardId);
      if (board) {
        await userAnalyticsModel.logUserActivity(
          userId,
          board.DashboardId,
          'task_deleted',
          `Deleted task "${existing.Title || 'Untitled'}"`,
          taskId,
          existing.BoardId
        );
      }
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error(`Error deleting task: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getTasksByBoardId(req, res) {
  try {
    const boardId = parseInt(req.params.boardId);
    const tasks = await taskModel.getTasksByBoardId(boardId);
    if (!boardId) {
      return res.status(404).json({ error: "No tasks found for this board" });
    }
    res.json(tasks);
  } catch (error) {
    console.error(`Error getting tasks by board id: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  createTask,
  getTask,
  updateTask,
  deleteTask,
  getTasksByBoardId,
};
