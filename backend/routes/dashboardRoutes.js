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

// Debug endpoint to check user dashboard relationships
router.get("/:dashboardId/debug", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const dashboardId = parseInt(req.params.dashboardId);
    
    const dashboardModel = require("../models/dashboardModel");
    const userRole = await dashboardModel.getUserRole(userId, dashboardId);
    
    res.json({
      userId,
      dashboardId,
      userRole,
      hasAccess: !!userRole,
      isOwner: userRole === 'Owner'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users/collaborators in a dashboard (any member can view)
router.get("/:id/users", authMiddleware, checkDashboardAccess(), dashboardController.getUsersByDashboard);

// Add user to dashboard (Owner only)
router.post("/:dashboardId/users", authMiddleware, checkDashboardPermission(['Owner']), dashboardController.addUserToDashboard);

// Add collaborator by email (Owner only) - now sends invitation
router.post("/:dashboardId/invite", authMiddleware, checkDashboardPermission(['Owner']), dashboardController.addCollaboratorByEmail);

// Get pending invitations for current user
router.get("/invitations/pending", authMiddleware, dashboardController.getPendingInvitations);

// Get dashboard invitations (Owner only)
router.get("/:dashboardId/invitations", authMiddleware, checkDashboardPermission(['Owner']), dashboardController.getDashboardInvitations);

// Rescind invitation (Owner only)
router.delete("/invitations/:invitationId", authMiddleware, dashboardController.rescindInvitation);

// Accept invitation
router.post("/invitations/:invitationId/accept", authMiddleware, dashboardController.acceptInvitationById);

// Decline invitation
router.post("/invitations/:invitationId/decline", authMiddleware, dashboardController.declineInvitationById);


// Update user role in dashboard (Owner only)
router.put("/:dashboardId/users/:userId/role", authMiddleware, checkDashboardPermission(['Owner']), dashboardController.updateUserRole);

// Remove user from dashboard (Owner only)
router.delete("/:dashboardId/users/:userId", authMiddleware, checkDashboardPermission(['Owner']), dashboardController.removeUser);

module.exports = router;
