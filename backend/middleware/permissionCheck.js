const dashboardModel = require("../models/dashboardModel");

/**
 * Middleware to check if user has required role for a dashboard
 * @param {Array<string>} allowedRoles - Array of roles that can access (e.g., ['Owner', 'Editor'])
 */
function checkDashboardPermission(allowedRoles) {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId || req.user.id;
      const dashboardId = parseInt(req.params.dashboardId || req.params.id || req.body.dashboardId);

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

      // Attach role to request for use in controllers
      req.userRole = userRole;
      req.dashboardId = dashboardId;
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

/**
 * Middleware to check if user has access to a dashboard (any role)
 */
function checkDashboardAccess() {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId || req.user.id;
      const dashboardId = parseInt(req.params.dashboardId || req.params.id || req.body.dashboardId);

      if (!dashboardId) {
        return res.status(400).json({ error: "Dashboard ID is required" });
      }

      const userRole = await dashboardModel.getUserRole(userId, dashboardId);

      if (!userRole) {
        return res.status(403).json({ error: "You do not have access to this dashboard" });
      }

      req.userRole = userRole;
      req.dashboardId = dashboardId;
      next();
    } catch (error) {
      console.error("Access check error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

module.exports = {
  checkDashboardPermission,
  checkDashboardAccess
};
