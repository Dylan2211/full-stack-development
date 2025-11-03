const taskModel = require("../models/taskModel");

async function createTask(req, res) {
  try {
    if (!req.body.title) {
      return res.json({ error: "No title!" });
    }
    const task = {
      title: req.body.title,
      description: req.body.description || "",
      category: req.body.category || "",
      priority: req.body.priority || "",
      skills: req.body.skills || "",
    };
    const taskId = await taskModel.createTask(task);

    res.status(201).json({ message: "Task created", taskId }); //, subtaskIds
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getAllTasks(req, res) {
  try {
    const { status, priority } = req.query;

    const tasks = await taskModel.getAllTasks({ status, priority });
    res.json(tasks);
  } catch (error) {
    console.error(`Error getting tasks:${error}`);
    res.status(500).json({ message: "Internal server error" });
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
      dueDate: req.body.dueDate,
      imageUrl: req.file ? `/images/${req.file.filename}` : null,
      isDone: req.body.isDone ? 1 : 0,
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
  createSubtask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
