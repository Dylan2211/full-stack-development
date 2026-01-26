const taskModel = require("../models/taskModel");
const boardModel = require("../models/boardModel");
const dashboardModel = require("../models/dashboardModel");

/**
 * Middleware to check if user has required role for a task's dashboard
 * Extracts dashboardId from the task's board and checks permissions
 * @param {Array<string>} allowedRoles - Array of roles that can access (e.g., ['Owner', 'Editor'])
 */
function checkTaskPermission(allowedRoles) {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId || req.user.id;
      const taskId = parseInt(req.params.id || req.params.taskId);

      if (!taskId) {
        return res.status(400).json({ error: "Task ID is required" });
      }

      // Get the task to find its board
      const task = await taskModel.getTask(taskId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Get the board to find its dashboard
      const board = await boardModel.getBoard(task.BoardId);
      if (!board) {
        return res.status(404).json({ error: "Board not found" });
      }

      const dashboardId = board.DashboardId;
      const userRole = await dashboardModel.getUserRole(userId, dashboardId);

      if (!userRole) {
        return res.status(403).json({ error: "You do not have access to this dashboard" });
      }

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ 
          error: `Access denied. Required role: ${allowedRoles.join(" or ")}. Your role: ${userRole}` 
        });
      }

      req.userRole = userRole;
      req.dashboardId = dashboardId;
      next();
    } catch (error) {
      console.error("Task permission check error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

/**
 * Middleware for checking permissions when creating a task (boardId in body)
 */
function checkBoardForTaskCreation(allowedRoles) {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId || req.user.id;
      const boardId = parseInt(req.body.boardId);

      if (!boardId) {
        return res.status(400).json({ error: "Board ID is required" });
      }

      // Get the board to find its dashboard
      const board = await boardModel.getBoard(boardId);
      if (!board) {
        return res.status(404).json({ error: "Board not found" });
      }

      const dashboardId = board.DashboardId;
      const userRole = await dashboardModel.getUserRole(userId, dashboardId);

      if (!userRole) {
        return res.status(403).json({ error: "You do not have access to this dashboard" });
      }

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ 
          error: `Access denied. Required role: ${allowedRoles.join(" or ")}. Your role: ${userRole}` 
        });
      }

      req.userRole = userRole;
      req.dashboardId = dashboardId;
      next();
    } catch (error) {
      console.error("Task creation permission check error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

module.exports = {
  checkTaskPermission,
  checkBoardForTaskCreation
};
