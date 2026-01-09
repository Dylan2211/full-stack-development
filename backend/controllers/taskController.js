const taskModel = require("../models/taskModel");
const ai = require("../ai/aiAssignAgent");

async function createTask(req, res) {
  try {
    if (!req.body.boardId) {
      return res.status(400).json({ error: "BoardId is required" });
    }
    if (req.body.position == undefined) {
      return res.status(400).json({ error: "Position is required" });
    }
    const aiData = await ai.aiAssignAgent(req.body);
    const task = { ...req.body, ...aiData };
    const taskId = await taskModel.createTask(task);

    res.status(201).json({ message: "Task created", taskId }); //, subtaskIds
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Internal server error" });
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
      if (Array.isArray(req.body.skills)) return JSON.stringify(req.body.skills);
      if (typeof req.body.skills === "string") return req.body.skills;
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
    };

    const { updated } = await taskModel.updateTask({ taskId, taskData });

    if (!updated) {
      return res.json({ error: "Task not found" });
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
    const deleted = await taskModel.deleteTask(taskId);
    if (!deleted) {
      return res.status(404).json({ error: "Task not found" });
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
