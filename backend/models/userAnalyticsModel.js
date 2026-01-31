const sql = require("mssql");
const dbConfig = require("../dbConfig");

/**
 * Get user productivity stats for a dashboard
 * @param {number} dashboardId - Dashboard ID
 * @param {number} userId - Optional user ID to filter by specific user
 */
async function getUserProductivityStats(dashboardId, userId = null) {
  try {
    const pool = await dbConfig;
    const request = pool.request();
    request.input("dashboardId", sql.Int, dashboardId);
    request.input("userId", sql.Int, userId);

    const query = `
      SELECT 
        t.CreatedBy as UserId,
        u.FullName as UserName,
        u.Email as UserEmail,
        COUNT(*) as TasksCreated,
        SUM(CASE WHEN t.Status = 'completed' THEN 1 ELSE 0 END) as TasksCompleted,
        SUM(CASE WHEN t.Status = 'in_progress' THEN 1 ELSE 0 END) as TasksInProgress,
        SUM(CASE WHEN t.Status = 'todo' OR t.Status IS NULL THEN 1 ELSE 0 END) as TasksTodo,
        ROUND(
          CAST(SUM(CASE WHEN t.Status = 'completed' THEN 1 ELSE 0 END) AS FLOAT) / 
          NULLIF(COUNT(*), 0) * 100, 1
        ) as CompletionRate,
        MAX(t.CreatedAt) as LastActivity,
        MIN(t.CreatedAt) as FirstActivity
      FROM Tasks t
      LEFT JOIN Users u ON t.CreatedBy = u.UserId
      LEFT JOIN Boards b ON t.BoardId = b.BoardId
      WHERE b.DashboardId = @dashboardId 
        AND t.CreatedBy IS NOT NULL
        AND (@userId IS NULL OR t.CreatedBy = @userId)
      GROUP BY t.CreatedBy, u.FullName, u.Email
      ORDER BY TasksCreated DESC
    `;

    const result = await request.query(query);
    return result.recordset || [];
  } catch (err) {
    console.error("[UserAnalytics Model] Failed to fetch user productivity stats:", err?.message || err);
    return [];
  }
}

/**
 * Get user activity timeline for a dashboard
 * @param {number} dashboardId - Dashboard ID
 * @param {number} userId - Optional user ID to filter by specific user
 * @param {number} days - Number of days to look back (default 7)
 */
async function getUserActivityTimeline(dashboardId, userId = null, days = 7) {
  try {
    const pool = await dbConfig;
    const request = pool.request();
    request.input("dashboardId", sql.Int, dashboardId);
    request.input("userId", sql.Int, userId);
    request.input("days", sql.Int, days);

    const query = `
      SELECT 
        CAST(ual.Timestamp AS DATE) as Date,
        ual.ActivityType,
        COUNT(*) as ActivityCount,
        u.FullName as UserName
      FROM UserActivityLogs ual
      LEFT JOIN Users u ON ual.UserId = u.UserId
      WHERE ual.DashboardId = @dashboardId 
        AND (@userId IS NULL OR ual.UserId = @userId)
        AND ual.Timestamp >= DATEADD(DAY, -@days, CAST(GETDATE() AS DATE))
      GROUP BY CAST(ual.Timestamp AS DATE), ual.ActivityType, u.FullName
      ORDER BY Date DESC, ActivityType
    `;

    const result = await request.query(query);
    return result.recordset || [];
  } catch (err) {
    console.error("[UserAnalytics Model] Failed to fetch activity timeline:", err?.message || err);
    return [];
  }
}

/**
 * Get task ownership distribution
 * @param {number} dashboardId - Dashboard ID
 */
async function getTaskOwnershipStats(dashboardId) {
  try {
    const pool = await dbConfig;
    const request = pool.request();
    request.input("dashboardId", sql.Int, dashboardId);

    const query = `
      SELECT 
        t.CreatedBy as UserId,
        u.FullName as UserName,
        COUNT(*) as TotalTasks,
        SUM(CASE WHEN t.Status = 'completed' THEN 1 ELSE 0 END) as CompletedTasks,
        SUM(CASE WHEN t.Status = 'in_progress' THEN 1 ELSE 0 END) as InProgressTasks,
        SUM(CASE WHEN t.Status = 'todo' OR t.Status IS NULL THEN 1 ELSE 0 END) as TodoTasks,
        ROUND(
          CAST(SUM(CASE WHEN t.Status = 'completed' THEN 1 ELSE 0 END) AS FLOAT) / 
          NULLIF(COUNT(*), 0) * 100, 1
        ) as CompletionRate,
        ROUND(
          CAST(COUNT(*) AS FLOAT) / 
          NULLIF((SELECT COUNT(*) FROM Tasks t2 
                  LEFT JOIN Boards b2 ON t2.BoardId = b2.BoardId 
                  WHERE b2.DashboardId = @dashboardId AND t2.CreatedBy IS NOT NULL), 0) * 100, 1
        ) as ContributionPercentage
      FROM Tasks t
      LEFT JOIN Users u ON t.CreatedBy = u.UserId
      LEFT JOIN Boards b ON t.BoardId = b.BoardId
      WHERE b.DashboardId = @dashboardId AND t.CreatedBy IS NOT NULL
      GROUP BY t.CreatedBy, u.FullName
      ORDER BY TotalTasks DESC
    `;

    const result = await request.query(query);
    return result.recordset || [];
  } catch (err) {
    console.error("[UserAnalytics Model] Failed to fetch task ownership stats:", err?.message || err);
    return [];
  }
}

/**
 * Get recent team activity for a dashboard
 * @param {number} dashboardId - Dashboard ID
 * @param {number} limit - Max number of activities to return (default 50)
 */
async function getRecentTeamActivity(dashboardId, limit = 50) {
  try {
    const pool = await dbConfig;
    const request = pool.request();
    request.input("dashboardId", sql.Int, dashboardId);
    request.input("limit", sql.Int, limit);

    const query = `
      SELECT TOP (@limit)
        ual.ActivityId,
        ual.UserId,
        u.FullName as UserName,
        ual.ActivityType,
        ual.Description,
        ual.Timestamp,
        ual.TaskId,
        t.Title as TaskTitle
      FROM UserActivityLogs ual
      LEFT JOIN Users u ON ual.UserId = u.UserId
      LEFT JOIN Tasks t ON ual.TaskId = t.TaskId
      WHERE ual.DashboardId = @dashboardId
      ORDER BY ual.Timestamp DESC
    `;

    const result = await request.query(query);
    return result.recordset || [];
  } catch (err) {
    console.error("[UserAnalytics Model] Failed to fetch recent team activity:", err?.message || err);
    return [];
  }
}

/**
 * Get dashboard overview statistics
 * @param {number} dashboardId - Dashboard ID
 */
async function getDashboardOverview(dashboardId) {
  try {
    const pool = await dbConfig;
    const request = pool.request();
    request.input("dashboardId", sql.Int, dashboardId);

    const query = `
      SELECT 
        COUNT(DISTINCT t.TaskId) as TotalTasks,
        SUM(CASE WHEN t.Status = 'completed' THEN 1 ELSE 0 END) as CompletedTasks,
        SUM(CASE WHEN t.Status = 'in_progress' THEN 1 ELSE 0 END) as InProgressTasks,
        SUM(CASE WHEN t.Status = 'todo' OR t.Status IS NULL THEN 1 ELSE 0 END) as TodoTasks,
        COUNT(DISTINCT t.CreatedBy) as ActiveUsers,
        COUNT(DISTINCT b.BoardId) as TotalBoards,
        ROUND(
          CAST(SUM(CASE WHEN t.Status = 'completed' THEN 1 ELSE 0 END) AS FLOAT) / 
          NULLIF(COUNT(*), 0) * 100, 1
        ) as OverallCompletionRate
      FROM Boards b
      LEFT JOIN Tasks t ON b.BoardId = t.BoardId
      WHERE b.DashboardId = @dashboardId
    `;

    const result = await request.query(query);
    return result.recordset[0] || {};
  } catch (err) {
    console.error("[UserAnalytics Model] Failed to fetch dashboard overview:", err?.message || err);
    return {};
  }
}

/**
 * Log user activity
 * @param {number} userId - User ID
 * @param {number} dashboardId - Dashboard ID
 * @param {string} activityType - Type of activity
 * @param {string} description - Activity description
 * @param {number} taskId - Optional task ID
 * @param {number} boardId - Optional board ID
 * @param {string} oldValue - Optional old value
 * @param {string} newValue - Optional new value
 */
async function logUserActivity(userId, dashboardId, activityType, description, taskId = null, boardId = null, oldValue = null, newValue = null) {
  try {
    const pool = await dbConfig;
    const request = pool.request();
    request.input("userId", sql.Int, userId);
    request.input("dashboardId", sql.Int, dashboardId);
    request.input("activityType", sql.NVarChar, activityType);
    request.input("description", sql.NVarChar, description);
    request.input("taskId", sql.Int, taskId);
    request.input("boardId", sql.Int, boardId);
    request.input("oldValue", sql.NVarChar, oldValue);
    request.input("newValue", sql.NVarChar, newValue);

    const query = `
      INSERT INTO UserActivityLogs (UserId, DashboardId, ActivityType, Description, TaskId, BoardId, OldValue, NewValue)
      VALUES (@userId, @dashboardId, @activityType, @description, @taskId, @boardId, @oldValue, @newValue)
    `;

    await request.query(query);
    return { success: true };
  } catch (err) {
    console.error("[UserAnalytics Model] Failed to log user activity:", err?.message || err);
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Get top contributors for a dashboard
 * Returns users with most tasks completed
 */
async function getTopContributors(dashboardId, limit = 10) {
  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input('dashboardId', sql.Int, dashboardId)
      .input('limit', sql.Int, limit)
      .query(`
        SELECT TOP (@limit)
          u.UserId,
          u.FullName,
          u.Email,
          COUNT(t.TaskId) as totalTasks,
          SUM(CASE WHEN t.Status = 'completed' THEN 1 ELSE 0 END) as completedTasks
        FROM Users u
        INNER JOIN Tasks t ON u.UserId = t.CreatedBy
        INNER JOIN Boards b ON t.BoardId = b.BoardId
        INNER JOIN Dashboards d ON b.DashboardId = d.DashboardId
        WHERE d.DashboardId = @dashboardId
        GROUP BY u.UserId, u.FullName, u.Email
        ORDER BY completedTasks DESC, totalTasks DESC
      `);

    return result.recordset;
  } catch (error) {
    console.error('[UserAnalytics Model] getTopContributors error:', error?.message || error);
    throw error;
  }
}

/**
 * Get detailed user activity log (individual activities, not grouped)
 * @param {number} dashboardId - Dashboard ID
 * @param {number} userId - User ID to filter by specific user
 * @param {number} days - Number of days to look back (default 30)
 * @param {number} limit - Max number of activities to return (default 500)
 */
async function getUserDetailedActivityLog(dashboardId, userId, days = 30, limit = 500) {
  try {
    const pool = await dbConfig;
    const request = pool.request();
    request.input("dashboardId", sql.Int, dashboardId);
    request.input("userId", sql.Int, userId);
    request.input("days", sql.Int, days);
    request.input("limit", sql.Int, limit);

    const query = `
      SELECT TOP (@limit)
        ual.ActivityId,
        ual.UserId,
        u.FullName as UserName,
        u.Email as UserEmail,
        ual.ActivityType,
        ual.Description,
        ual.Timestamp,
        ual.TaskId,
        t.Title as TaskTitle,
        ual.BoardId,
        b.Name as BoardName,
        ual.OldValue,
        ual.NewValue
      FROM UserActivityLogs ual
      LEFT JOIN Users u ON ual.UserId = u.UserId
      LEFT JOIN Tasks t ON ual.TaskId = t.TaskId
      LEFT JOIN Boards b ON ual.BoardId = b.BoardId
      WHERE ual.DashboardId = @dashboardId 
        AND ual.UserId = @userId
        AND ual.Timestamp >= DATEADD(DAY, -@days, CAST(GETDATE() AS DATE))
      ORDER BY ual.Timestamp DESC
    `;

    const result = await request.query(query);
    return result.recordset || [];
  } catch (err) {
    console.error("[UserAnalytics Model] Failed to fetch detailed activity log:", err?.message || err);
    return [];
  }
}

/**
 * Get detailed user activity log across ALL dashboards (individual activities, not grouped)
 * @param {number} userId - User ID to filter by specific user
 * @param {number} days - Number of days to look back (default 30)
 * @param {number} limit - Max number of activities to return (default 500)
 */
async function getUserAllActivitiesLog(userId, days = 30, limit = 500) {
  try {
    const pool = await dbConfig;
    const request = pool.request();
    request.input("userId", sql.Int, userId);
    request.input("days", sql.Int, days);
    request.input("limit", sql.Int, limit);

    const query = `
      SELECT TOP (@limit)
        ual.ActivityId,
        ual.UserId,
        u.FullName as UserName,
        u.Email as UserEmail,
        ual.ActivityType,
        ual.Description,
        ual.Timestamp,
        ual.TaskId,
        t.Title as TaskTitle,
        ual.BoardId,
        b.Name as BoardName,
        ual.DashboardId,
        d.Name as DashboardName,
        ual.OldValue,
        ual.NewValue
      FROM UserActivityLogs ual
      LEFT JOIN Users u ON ual.UserId = u.UserId
      LEFT JOIN Tasks t ON ual.TaskId = t.TaskId
      LEFT JOIN Boards b ON ual.BoardId = b.BoardId
      LEFT JOIN Dashboards d ON ual.DashboardId = d.DashboardId
      WHERE ual.UserId = @userId
        AND ual.Timestamp >= DATEADD(DAY, -@days, GETDATE())
      ORDER BY ual.Timestamp DESC
    `;

    const result = await request.query(query);
    return result.recordset || [];
  } catch (error) {
    console.error('Error fetching user all activities log:', error);
    throw error;
  }
}

module.exports = {
  getUserProductivityStats,
  getUserActivityTimeline,
  getTaskOwnershipStats,
  getRecentTeamActivity,
  getDashboardOverview,
  getTopContributors,
  logUserActivity,
  getUserDetailedActivityLog,
  getUserAllActivitiesLog
};
