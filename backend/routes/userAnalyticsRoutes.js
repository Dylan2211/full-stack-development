const express = require("express");
const router = express.Router();
const userAnalyticsController = require("../controllers/userAnalyticsController");
const { authMiddleware } = require("../middleware/jwtAuth");

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/user-analytics/stats
 * Returns comprehensive user analytics stats for a dashboard
 */
router.get("/stats", userAnalyticsController.getComprehensiveStats);

/**
 * GET /api/user-analytics/overview
 * Returns dashboard overview statistics
 */
router.get("/overview", userAnalyticsController.getDashboardOverview);

/**
 * GET /api/user-analytics/productivity
 * Returns user productivity statistics for a dashboard
 */
router.get("/productivity", userAnalyticsController.getUserProductivity);

/**
 * GET /api/user-analytics/ownership
 * Returns task ownership distribution for a dashboard
 */
router.get("/ownership", userAnalyticsController.getTaskOwnership);

/**
 * GET /api/user-analytics/timeline
 * Returns user activity timeline for a dashboard
 */
router.get("/timeline", userAnalyticsController.getActivityTimeline);

/**
 * GET /api/user-analytics/team-activity
 * Returns recent team activity for a dashboard
 */
router.get("/team-activity", userAnalyticsController.getTeamActivity);

/**
 * GET /api/user-analytics/top-contributors
 * Returns top contributors for a dashboard
 */
router.get("/top-contributors", userAnalyticsController.getTopContributors);

module.exports = router;
