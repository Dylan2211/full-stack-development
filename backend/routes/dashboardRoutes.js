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

// Update dashboard (Admin only)
router.put("/:dashboardId", authMiddleware, checkDashboardPermission(['Admin']), dashboardController.updateDashboard);

// Delete dashboard (Admin only)
router.delete("/:dashboardId", authMiddleware, checkDashboardPermission(['Admin']), dashboardController.deleteDashboard);

// Get current user's role in a dashboard
router.get("/:dashboardId/my-role", authMiddleware, dashboardController.getUserRole);

// Get all users/collaborators in a dashboard (any member can view)
router.get("/:id/users", authMiddleware, checkDashboardAccess(), dashboardController.getUsersByDashboard);

// Add user to dashboard (Admin only)
router.post("/:dashboardId/users", authMiddleware, checkDashboardPermission(['Admin']), dashboardController.addUserToDashboard);

// Add collaborator by email (Admin only)
router.post("/:dashboardId/invite", authMiddleware, checkDashboardPermission(['Admin']), dashboardController.addCollaboratorByEmail);


// Update user role in dashboard (Admin only)
router.put("/:dashboardId/users/:userId/role", authMiddleware, checkDashboardPermission(['Admin']), dashboardController.updateUserRole);

// Remove user from dashboard (Admin only)
router.delete("/:dashboardId/users/:userId", authMiddleware, checkDashboardPermission(['Admin']), dashboardController.removeUser);

// Share token endpoints (Admin only)
router.post("/:dashboardId/share-tokens", authMiddleware, checkDashboardPermission(['Admin']), dashboardController.createShareToken);
router.get("/:dashboardId/share-tokens", authMiddleware, checkDashboardPermission(['Admin']), dashboardController.getShareTokens);
router.put("/:dashboardId/share-tokens/:shareTokenId/role", authMiddleware, checkDashboardPermission(['Admin']), dashboardController.updateShareTokenRole);
router.delete("/:dashboardId/share-tokens/:shareTokenId/revoke", authMiddleware, checkDashboardPermission(['Admin']), dashboardController.revokeShareToken);

// Accept share token (authenticated user)
router.post("/share-tokens/accept", authMiddleware, dashboardController.acceptShareToken);

module.exports = router;
