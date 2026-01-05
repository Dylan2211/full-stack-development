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

async function getBoardByDashboardId(req, res) {
  try {
    const dashboardId = parseInt(req.params.dashboardId);
    const boards = await taskModel.getBoardByDashboardId(dashboardId);
    if (!boards) {
      console.write("No boards found for this dashboard");
    }
    res.json(boards);
  } catch (error) {
    console.error(`Error getting boards by dashboard id: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function createBoard(req, res) {
  try {
    const dashboardId = parseInt(req.params.dashboardId || req.body.dashboardId);
    const name = (req.body.name || "").trim();

    if (!dashboardId || Number.isNaN(dashboardId)) {
      return res.status(400).json({ error: "DashboardId is required" });
    }

    if (!name) {
      return res.status(400).json({ error: "Board name is required" });
    }

    const board = await taskModel.createBoard({ dashboardId, name });
    res.status(201).json(board);
  } catch (error) {
    console.error("Error creating board:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getBoardByBoardId(req, res) {
  try {
    const boardId = parseInt(req.params.boardId);
    const board = await taskModel.getBoardByBoardId(boardId);
    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }
    res.json(board);
  } catch (error) {
    console.error(`Error getting board by id: ${error}`);
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

async function getTaskById(req, res) {
  try {
    const taskId = parseInt(req.params.id);
    const task = await taskModel.getTaskById(taskId);
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
    const taskData = {
      title: req.body.title,
      description: req.body.description || "",
      category: req.body.category || "",
      priority: req.body.priority || "",
      skills: req.body.skills || "",
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

module.exports = {
  createTask,
  // getAllTasks,
  getBoardByDashboardId,
  getBoardByBoardId,
  createBoard,
  getTasksByBoardId,
  getTaskById,
  updateTask,
  deleteTask,
};
