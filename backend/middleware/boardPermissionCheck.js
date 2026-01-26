const boardModel = require("../models/boardModel");
const dashboardModel = require("../models/dashboardModel");

/**
 * Middleware to check if user has required role for a board's dashboard
 * Extracts dashboardId from the board and checks permissions
 * @param {Array<string>} allowedRoles - Array of roles that can access (e.g., ['Owner', 'Editor'])
 */
function checkBoardPermission(allowedRoles) {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId || req.user.id;
      const boardId = parseInt(req.params.boardId || req.body.boardId);

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
      console.error("Board permission check error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

/**
 * Middleware for checking permissions when creating a board (dashboardId in params)
 */
function checkDashboardForBoardCreation(allowedRoles) {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId || req.user.id;
      const dashboardId = parseInt(req.params.dashboardId || req.body.dashboardId);

      if (!dashboardId) {
        return res.status(400).json({ error: "Dashboard ID is required" });
      }

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
      console.error("Dashboard permission check error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

module.exports = {
  checkBoardPermission,
  checkDashboardForBoardCreation
};
