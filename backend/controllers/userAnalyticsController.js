const userAnalyticsModel = require("../models/userAnalyticsModel");
const dashboardModel = require("../models/dashboardModel");

/**
 * GET /api/user-analytics/productivity
 * Returns user productivity statistics for a dashboard
 * Query params: ?dashboardId=X
 */
async function getUserProductivity(req, res) {
  try {
    const userId = req.user?.userId || req.user?.id;
    const dashboardId = parseInt(req.query.dashboardId);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!dashboardId || isNaN(dashboardId)) {
      return res.status(400).json({ error: "dashboardId query parameter required" });
    }

    // Check if user has access to this dashboard
    const userRole = await dashboardModel.getUserRole(userId, dashboardId);
    if (!userRole) {
      return res.status(403).json({ error: "You do not have access to this dashboard" });
    }

    const stats = await userAnalyticsModel.getUserProductivityStats(dashboardId);
    const userProductivity = stats.map(user => ({
      fullName: user.UserName || 'Unknown',
      email: user.UserEmail || '',
      totalTasks: user.TasksCreated || 0,
      completedTasks: user.TasksCompleted || 0
    }));
    res.json({
      dashboardId,
      userProductivity
    });
  } catch (error) {
    console.error("[UserAnalytics Controller] getUserProductivity error:", error?.message || error);
    res.status(500).json({ error: "Failed to fetch user productivity data", details: error?.message || String(error) });
  }
}

/**
 * GET /api/user-analytics/ownership
 * Returns task ownership distribution for a dashboard
 * Query params: ?dashboardId=X
 */
async function getTaskOwnership(req, res) {
  try {
    const userId = req.user?.userId || req.user?.id;
    const dashboardId = parseInt(req.query.dashboardId);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!dashboardId || isNaN(dashboardId)) {
      return res.status(400).json({ error: "dashboardId query parameter required" });
    }

    // Check if user has access to this dashboard
    const userRole = await dashboardModel.getUserRole(userId, dashboardId);
    if (!userRole) {
      return res.status(403).json({ error: "You do not have access to this dashboard" });
    }

    const ownership = await userAnalyticsModel.getTaskOwnershipStats(dashboardId);
    const taskOwnership = ownership.map(item => ({
      fullName: item.UserName || 'Unknown',
      taskCount: item.TotalTasks || 0
    }));
    res.json({
      dashboardId,
      taskOwnership
    });
  } catch (error) {
    console.error("[UserAnalytics Controller] getTaskOwnership error:", error?.message || error);
    res.status(500).json({ error: "Failed to fetch task ownership data", details: error?.message || String(error) });
  }
}

/**
 * GET /api/user-analytics/timeline
 * Returns user activity timeline for a dashboard
 * Query params: ?dashboardId=X&days=7
 */
async function getActivityTimeline(req, res) {
  try {
    const userId = req.user?.userId || req.user?.id;
    const dashboardId = parseInt(req.query.dashboardId);
    const days = parseInt(req.query.days) || 7;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!dashboardId || isNaN(dashboardId)) {
      return res.status(400).json({ error: "dashboardId query parameter required" });
    }

    // Check if user has access to this dashboard
    const userRole = await dashboardModel.getUserRole(userId, dashboardId);
    if (!userRole) {
      return res.status(403).json({ error: "You do not have access to this dashboard" });
    }

    const timeline = await userAnalyticsModel.getUserActivityTimeline(dashboardId, null, days);
    res.json({
      dashboardId,
      days,
      timeline
    });
  } catch (error) {
    console.error("[UserAnalytics Controller] getActivityTimeline error:", error?.message || error);
    res.status(500).json({ error: "Failed to fetch activity timeline", details: error?.message || String(error) });
  }
}

/**
 * GET /api/user-analytics/team-activity
 * Returns recent team activity for a dashboard
 * Query params: ?dashboardId=X&limit=50
 */
async function getTeamActivity(req, res) {
  try {
    const userId = req.user?.userId || req.user?.id;
    const dashboardId = parseInt(req.query.dashboardId);
    const limit = parseInt(req.query.limit) || 50;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!dashboardId || isNaN(dashboardId)) {
      return res.status(400).json({ error: "dashboardId query parameter required" });
    }

    // Check if user has access to this dashboard
    const userRole = await dashboardModel.getUserRole(userId, dashboardId);
    if (!userRole) {
      return res.status(403).json({ error: "You do not have access to this dashboard" });
    }

    const activities = await userAnalyticsModel.getRecentTeamActivity(dashboardId, limit);
    const transformedActivities = activities.map(activity => ({
      description: activity.Description || 'Unknown activity',
      userName: activity.UserName || 'Unknown user',
      timestamp: activity.Timestamp
    }));
    res.json({
      dashboardId,
      activities: transformedActivities,
      count: transformedActivities.length
    });
  } catch (error) {
    console.error("[UserAnalytics Controller] getTeamActivity error:", error?.message || error);
    res.status(500).json({ error: "Failed to fetch team activity", details: error?.message || String(error) });
  }
}

/**
 * GET /api/user-analytics/overview
 * Returns dashboard overview statistics
 * Query params: ?dashboardId=X
 */
async function getDashboardOverview(req, res) {
  try {
    const userId = req.user?.userId || req.user?.id;
    const dashboardId = parseInt(req.query.dashboardId);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!dashboardId || isNaN(dashboardId)) {
      return res.status(400).json({ error: "dashboardId query parameter required" });
    }

    // Check if user has access to this dashboard
    const userRole = await dashboardModel.getUserRole(userId, dashboardId);
    if (!userRole) {
      return res.status(403).json({ error: "You do not have access to this dashboard" });
    }

    const overview = await userAnalyticsModel.getDashboardOverview(dashboardId);
    res.json({
      totalTasks: overview.TotalTasks || 0,
      completedTasks: overview.CompletedTasks || 0,
      activeUsers: overview.ActiveUsers || 0,
      completionRate: overview.OverallCompletionRate || 0
    });
  } catch (error) {
    console.error("[UserAnalytics Controller] getDashboardOverview error:", error?.message || error);
    res.status(500).json({ error: "Failed to fetch dashboard overview", details: error?.message || String(error) });
  }
}

/**
 * GET /api/user-analytics/stats
 * Returns comprehensive user analytics stats for a dashboard
 * Query params: ?dashboardId=X
 */
async function getComprehensiveStats(req, res) {
  try {
    const userId = req.user?.userId || req.user?.id;
    const dashboardId = parseInt(req.query.dashboardId);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!dashboardId || isNaN(dashboardId)) {
      return res.status(400).json({ error: "dashboardId query parameter required" });
    }

    // Check if user has access to this dashboard
    const userRole = await dashboardModel.getUserRole(userId, dashboardId);
    if (!userRole) {
      return res.status(403).json({ error: "You do not have access to this dashboard" });
    }

    // Fetch all stats in parallel
    const [overview, productivity, ownership, recentActivity] = await Promise.all([
      userAnalyticsModel.getDashboardOverview(dashboardId),
      userAnalyticsModel.getUserProductivityStats(dashboardId),
      userAnalyticsModel.getTaskOwnershipStats(dashboardId),
      userAnalyticsModel.getRecentTeamActivity(dashboardId, 20)
    ]);

    res.json({
      dashboardId,
      overview,
      productivity,
      ownership,
      recentActivity
    });
  } catch (error) {
    console.error("[UserAnalytics Controller] getComprehensiveStats error:", error?.message || error);
    res.status(500).json({ error: "Failed to fetch comprehensive stats", details: error?.message || String(error) });
  }
}

/**
 * GET /api/user-analytics/top-contributors
 * Returns top contributors for a dashboard
 * Query params: ?dashboardId=X&limit=Y
 */
async function getTopContributors(req, res) {
  try {
    const userId = req.user?.userId || req.user?.id;
    const dashboardId = parseInt(req.query.dashboardId);
    const limit = parseInt(req.query.limit) || 10;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!dashboardId || isNaN(dashboardId)) {
      return res.status(400).json({ error: "dashboardId query parameter required" });
    }

    // Check if user has access to this dashboard
    const userRole = await dashboardModel.getUserRole(userId, dashboardId);
    if (!userRole) {
      return res.status(403).json({ error: "You do not have access to this dashboard" });
    }

    const contributors = await userAnalyticsModel.getTopContributors(dashboardId, limit);
    const transformedContributors = contributors.map(contributor => ({
      fullName: contributor.FullName || 'Unknown',
      totalTasks: contributor.totalTasks || 0,
      completedTasks: contributor.completedTasks || 0
    }));
    res.json({
      dashboardId,
      contributors: transformedContributors
    });
  } catch (error) {
    console.error("[UserAnalytics Controller] getTopContributors error:", error?.message || error);
    res.status(500).json({ error: "Failed to fetch top contributors", details: error?.message || String(error) });
  }
}

module.exports = {
  getUserProductivity,
  getTaskOwnership,
  getActivityTimeline,
  getTeamActivity,
  getDashboardOverview,
  getTopContributors,
  getComprehensiveStats
};
