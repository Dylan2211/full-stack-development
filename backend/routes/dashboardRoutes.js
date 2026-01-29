const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { authMiddleware } = require("../middleware/jwtAuth");
const { checkDashboardPermission, checkDashboardAccess } = require("../middleware/permissionCheck");

// Get all dashboards for current user
router.get("/", authMiddleware, dashboardController.getAllDashboards);

// Get specific dashboard
router.get("/:dashboardId", authMiddleware, checkDashboardAccess(), dashboardController.getDashboard);

// Create new dashboard (authenticated users only)
router.post("/", authMiddleware, dashboardController.createDashboard);

// Update dashboard (Owner only)
router.put("/:dashboardId", authMiddleware, checkDashboardPermission(['Owner']), dashboardController.updateDashboard);

// Delete dashboard (Owner only)
router.delete("/:dashboardId", authMiddleware, checkDashboardPermission(['Owner']), dashboardController.deleteDashboard);

// Get current user's role in a dashboard
router.get("/:dashboardId/my-role", authMiddleware, dashboardController.getUserRole);

// Get all users/collaborators in a dashboard (any member can view)
router.get("/:id/users", authMiddleware, checkDashboardAccess(), dashboardController.getUsersByDashboard);

// Add user to dashboard (Owner only)
router.post("/:dashboardId/users", authMiddleware, checkDashboardPermission(['Owner']), dashboardController.addUserToDashboard);

// Add collaborator by email (Owner only)
router.post("/:dashboardId/invite", authMiddleware, checkDashboardPermission(['Owner']), dashboardController.addCollaboratorByEmail);


// Update user role in dashboard (Owner only)
router.put("/:dashboardId/users/:userId/role", authMiddleware, checkDashboardPermission(['Owner']), dashboardController.updateUserRole);

// Remove user from dashboard (Owner only)
router.delete("/:dashboardId/users/:userId", authMiddleware, checkDashboardPermission(['Owner']), dashboardController.removeUser);

module.exports = router;
