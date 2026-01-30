const analyticsModel = require("../models/analyticsModel");

/**
 * GET /api/analytics/ai-usage
 * Returns AI logs for the logged-in user, filtered by dashboard
 * Query params: ?dashboardId=X&limit=100
 */
async function getAiUsage(req, res) {
  try {
    const userId = req.user?.userId || req.user?.id;
    const dashboardId = parseInt(req.query.dashboardId);
    const limit = parseInt(req.query.limit) || 100;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!dashboardId || isNaN(dashboardId)) {
      return res.status(400).json({ error: "dashboardId query parameter required" });
    }

    const logs = await analyticsModel.getAiUsageByUser(userId, dashboardId, limit);
    res.json({
      userId,
      dashboardId,
      logs,
      count: logs.length
    });
  } catch (error) {
    console.error("[Analytics Controller] getAiUsage error:", error?.message || error);
    res.status(500).json({ error: "Failed to fetch AI usage data", details: error?.message || String(error) });
  }
}

/**
 * GET /api/analytics/team-activity
 * Returns AI logs for all team members on a dashboard
 * Query params: ?dashboardId=X&limit=100
 */
async function getTeamActivity(req, res) {
  try {
    const userId = req.user?.userId || req.user?.id;
    const dashboardId = parseInt(req.query.dashboardId);
    const limit = parseInt(req.query.limit) || 100;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!dashboardId || isNaN(dashboardId)) {
      return res.status(400).json({ error: "dashboardId query parameter required" });
    }

    // TODO: Add permission check to ensure user is part of this dashboard

    const logs = await analyticsModel.getTeamActivityByDashboard(dashboardId, limit);
    res.json({
      dashboardId,
      logs,
      count: logs.length
    });
  } catch (error) {
    console.error("[Analytics Controller] getTeamActivity error:", error?.message || error);
    res.status(500).json({ error: "Failed to fetch team activity", details: error?.message || String(error) });
  }
}

/**
 * GET /api/analytics/stats
 * Returns aggregated AI usage statistics for a dashboard
 * Query params: ?dashboardId=X
 */
async function getStats(req, res) {
  try {
    const userId = req.user?.userId || req.user?.id;
    const dashboardId = parseInt(req.query.dashboardId);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!dashboardId || isNaN(dashboardId)) {
      return res.status(400).json({ error: "dashboardId query parameter required" });
    }

    const [usageStats, providerStats, userStats, timeline] = await Promise.all([
      analyticsModel.getAiUsageStats(dashboardId, userId),
      analyticsModel.getProviderStats(dashboardId, userId),
      analyticsModel.getUserStats(dashboardId, userId),
      analyticsModel.getActivityTimeline(dashboardId, 7, userId)
    ]);

    res.json({
      dashboardId,
      usageStats,
      providerStats,
      userStats,
      timeline
    });
  } catch (error) {
    console.error("[Analytics Controller] getStats error:", error?.message || error);
    res.status(500).json({ error: "Failed to fetch analytics stats", details: error?.message || String(error) });
  }
}

/**
 * GET /api/analytics/providers
 * Returns provider performance summary for a dashboard
 * Query params: ?dashboardId=X
 */
async function getProviders(req, res) {
  try {
    const userId = req.user?.userId || req.user?.id;
    const dashboardId = parseInt(req.query.dashboardId);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!dashboardId || isNaN(dashboardId)) {
      return res.status(400).json({ error: "dashboardId query parameter required" });
    }

    const providers = await analyticsModel.getProviderStats(dashboardId, userId);
    res.json({
      dashboardId,
      providers
    });
  } catch (error) {
    console.error("[Analytics Controller] getProviders error:", error?.message || error);
    res.status(500).json({ error: "Failed to fetch provider stats", details: error?.message || String(error) });
  }
}

/**
 * GET /api/analytics/users
 * Returns per-user AI usage for a dashboard
 * Query params: ?dashboardId=X
 */
async function getUsers(req, res) {
  try {
    const userId = req.user?.userId || req.user?.id;
    const dashboardId = parseInt(req.query.dashboardId);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!dashboardId || isNaN(dashboardId)) {
      return res.status(400).json({ error: "dashboardId query parameter required" });
    }

    const users = await analyticsModel.getUserStats(dashboardId, userId);
    res.json({
      dashboardId,
      users
    });
  } catch (error) {
    console.error("[Analytics Controller] getUsers error:", error?.message || error);
    res.status(500).json({ error: "Failed to fetch user stats", details: error?.message || String(error) });
  }
}

/**
 * GET /api/analytics/user-activity
 * Returns AI logs for logged-in user across all dashboards
 * Query params: ?limit=100&days=30
 */
async function getUserActivity(req, res) {
  try {
    const userId = req.user?.userId || req.user?.id;
    const limit = parseInt(req.query.limit) || 100;
    const days = parseInt(req.query.days) || 30;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const logs = await analyticsModel.getAiLogsByUser(userId, limit, days);
    res.json({
      userId,
      logs,
      count: logs.length
    });
  } catch (error) {
    console.error("[Analytics Controller] getUserActivity error:", error?.message || error);
    res.status(500).json({ error: "Failed to fetch user activity data", details: error?.message || String(error) });
  }
}

module.exports = {
  getAiUsage,
  getTeamActivity,
  getStats,
  getProviders,
  getUsers,
  getUserActivity
};
