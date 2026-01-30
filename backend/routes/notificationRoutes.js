const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { authMiddleware } = require("../middleware/jwtAuth");

// Get notifications for current user
router.get("/", authMiddleware, notificationController.getNotifications);

// Debug endpoint to test notifications
router.get("/debug", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const userEmail = req.user.email;
    
    res.json({
      message: "Notifications debug info",
      userId: userId,
      userEmail: userEmail,
      timestamp: new Date().toISOString(),
      tablesExist: {
        // We'll check if tables exist
        notifications: "checking...",
        pendingInvitations: "checking..."
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread notification count
router.get("/unread-count", authMiddleware, notificationController.getUnreadCount);

// Mark notification as read
router.put("/:notificationId/read", authMiddleware, notificationController.markAsRead);

// Mark all notifications as read
router.put("/mark-all-read", authMiddleware, notificationController.markAllAsRead);

module.exports = router;