const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const { getUserDetailedActivityLog, getUserAllActivitiesLog } = require("../models/userAnalyticsModel");

const { authMiddleware } = require("../middleware/jwtAuth"); 
const { validateRegistration } = require("../middleware/registerValidation");
const { validateLogin } = require("../middleware/loginValidation");
const { validateChangePassword, validateResetPassword } = require("../middleware/passwordValidation");


router.post("/register", validateRegistration, userController.registerUser);
router.post("/login", validateLogin, userController.loginUser);
router.post("/:id/change-password", authMiddleware, validateChangePassword, userController.changePassword);
router.post("/forgot-password", userController.forgotPassword);


router.post("/reset-password", validateResetPassword, userController.resetPassword);

router.get("/", authMiddleware, userController.getAllUsers);

router.get("/:id", authMiddleware, userController.getUserById);

router.put("/:id", authMiddleware, userController.updateUser);

router.delete("/:id", authMiddleware, userController.deleteUser);

// Get user activity history - only returns activities for the logged-in user
// GET /api/users/activity/timeline?dashboardId=X&days=Y
router.get("/activity/timeline/:dashboardId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const dashboardId = req.params.dashboardId;
    const days = req.query.days ? Number(req.query.days) : 30;
    const limit = req.query.limit ? Number(req.query.limit) : 500;

    if (!userId || !dashboardId) {
      return res.status(400).json({ error: "Missing userId or dashboardId" });
    }

    console.log(`[User Activity] Fetching activities for user ${userId} in dashboard ${dashboardId} (last ${days} days)`);
    
    const activities = await getUserDetailedActivityLog(dashboardId, userId, days, limit);
    
    res.json({
      success: true,
      userId,
      dashboardId,
      daysLookback: days,
      activityCount: activities.length,
      activities: activities || []
    });
  } catch (err) {
    console.error("[User Activity] Failed to fetch user activity timeline:", err?.message || err);
    res.status(500).json({ 
      error: "activity_fetch_failed", 
      details: err?.message || String(err) 
    });
  }
});

// Get user activity history across ALL dashboards - only returns activities for the logged-in user
// GET /api/users/activity/all?days=Y
router.get("/activity/all", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const days = req.query.days ? Number(req.query.days) : 30;
    const limit = req.query.limit ? Number(req.query.limit) : 500;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    console.log(`[User Activity] Fetching all activities for user ${userId} (last ${days} days)`);
    
    const activities = await getUserAllActivitiesLog(userId, days, limit);
    
    res.json({
      success: true,
      userId,
      daysLookback: days,
      activityCount: activities.length,
      activities: activities || []
    });
  } catch (err) {
    console.error("[User Activity] Failed to fetch user all activities:", err?.message || err);
    res.status(500).json({ 
      error: "activity_fetch_failed", 
      details: err?.message || String(err) 
    });
  }
});

module.exports = router;