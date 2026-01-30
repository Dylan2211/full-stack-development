const sql = require("mssql");
const dbConfig = require("../dbConfig");

/**
 * Get AI logs for a specific user filtered by dashboard
 * @param {number} userId - User ID
 * @param {number} dashboardId - Dashboard ID
 * @param {number} limit - Max rows to return (default 100)
 */
async function getAiUsageByUser(userId, dashboardId, limit = 100) {
  try {
    const pool = await dbConfig;
    const request = pool.request();
    request.input("userId", sql.Int, userId);
    request.input("dashboardId", sql.Int, dashboardId);
    request.input("limit", sql.Int, limit);

    const query = `
      SELECT TOP (@limit)
        Id, Timestamp, Provider, Model, RequestPath, ResponseTimeMs, Status, 
        ErrorMessage, TokensIn, TokensOut, TaskId
      FROM AiLogs
      WHERE UserId = @userId AND (DashboardId = @dashboardId OR @dashboardId IS NULL)
      ORDER BY Timestamp DESC
    `;

    const result = await request.query(query);

    return result.recordset || [];
  } catch (err) {
    console.error("[Analytics Model] Failed to fetch user AI usage:", err?.message || err);
    return [];
  }
}

/**
 * Get AI logs for entire dashboard (all team members)
 * @param {number} dashboardId - Dashboard ID
 * @param {number} limit - Max rows to return (default 100)
 */
async function getTeamActivityByDashboard(dashboardId, limit = 100) {
  try {
    const pool = await dbConfig;
    const request = pool.request();
    request.input("dashboardId", sql.Int, dashboardId);
    request.input("limit", sql.Int, limit);

    const query = `
      SELECT TOP (@limit)
        al.Id, al.Timestamp, al.UserId, u.FullName as UserName, al.Provider, al.Model, 
        al.RequestPath, al.ResponseTimeMs, al.Status, al.ErrorMessage, al.TokensIn, 
        al.TokensOut, al.TaskId
      FROM AiLogs al
      LEFT JOIN Users u ON al.UserId = u.UserId
      WHERE al.DashboardId = @dashboardId
      ORDER BY al.Timestamp DESC
    `;

    const result = await request.query(query);

    return result.recordset || [];
  } catch (err) {
    console.error("[Analytics Model] Failed to fetch team activity:", err?.message || err);
    return [];
  }
}

/**
 * Get AI usage stats for a dashboard (summary by provider, model, status)
 * @param {number} dashboardId - Dashboard ID
 */
async function getAiUsageStats(dashboardId, userId = null) {
  try {
    const pool = await dbConfig;
    const request = pool.request();
    request.input("dashboardId", sql.Int, dashboardId);
    request.input("userId", sql.Int, userId);

    const query = `
      SELECT 
        Provider, Model, Status,
        COUNT(*) as CallCount,
        AVG(ResponseTimeMs) as AvgLatencyMs,
        SUM(TokensIn) as TotalTokensIn,
        SUM(TokensOut) as TotalTokensOut
      FROM AiLogs
      WHERE DashboardId = @dashboardId AND (@userId IS NULL OR UserId = @userId)
      GROUP BY Provider, Model, Status
      ORDER BY CallCount DESC
    `;

    const result = await request.query(query);

    return result.recordset || [];
  } catch (err) {
    console.error("[Analytics Model] Failed to fetch AI usage stats:", err?.message || err);
    return [];
  }
}

/**
 * Get AI logs per provider for a dashboard
 * @param {number} dashboardId - Dashboard ID
 */
async function getProviderStats(dashboardId, userId = null) {
  try {
    const pool = await dbConfig;
    const request = pool.request();
    request.input("dashboardId", sql.Int, dashboardId);
    request.input("userId", sql.Int, userId);

    const query = `
      SELECT 
        Provider,
        COUNT(*) as CallCount,
        SUM(CASE WHEN Status = 'success' THEN 1 ELSE 0 END) as SuccessCount,
        SUM(CASE WHEN Status = 'error' THEN 1 ELSE 0 END) as ErrorCount,
        AVG(ResponseTimeMs) as AvgLatencyMs,
        SUM(TokensIn) as TotalTokensIn,
        SUM(TokensOut) as TotalTokensOut
      FROM AiLogs
      WHERE DashboardId = @dashboardId AND (@userId IS NULL OR UserId = @userId)
      GROUP BY Provider
      ORDER BY CallCount DESC
    `;

    const result = await request.query(query);

    return result.recordset || [];
  } catch (err) {
    console.error("[Analytics Model] Failed to fetch provider stats:", err?.message || err);
    return [];
  }
}

/**
 * Get AI logs by user for a dashboard
 * @param {number} dashboardId - Dashboard ID
 */
async function getUserStats(dashboardId, userId = null) {
  try {
    const pool = await dbConfig;
    const request = pool.request();
    request.input("dashboardId", sql.Int, dashboardId);
    request.input("userId", sql.Int, userId);

    const query = `
      SELECT 
        al.UserId,
        u.FullName as UserName,
        COUNT(*) as CallCount,
        SUM(CASE WHEN al.Status = 'success' THEN 1 ELSE 0 END) as SuccessCount,
        SUM(CASE WHEN al.Status = 'error' THEN 1 ELSE 0 END) as ErrorCount,
        AVG(al.ResponseTimeMs) as AvgLatencyMs
      FROM AiLogs al
      LEFT JOIN Users u ON al.UserId = u.UserId
      WHERE al.DashboardId = @dashboardId AND (@userId IS NULL OR al.UserId = @userId)
      GROUP BY al.UserId, u.FullName
      ORDER BY CallCount DESC
    `;

    const result = await request.query(query);

    return result.recordset || [];
  } catch (err) {
    console.error("[Analytics Model] Failed to fetch user stats:", err?.message || err);
    return [];
  }
}

/**
 * Get AI activity timeline for a dashboard (last N days)
 * @param {number} dashboardId - Dashboard ID
 * @param {number} days - Number of days to look back (default 7)
 */
async function getActivityTimeline(dashboardId, days = 7, userId = null) {
  try {
    const pool = await dbConfig;
    const request = pool.request();
    request.input("dashboardId", sql.Int, dashboardId);
    request.input("days", sql.Int, days);
    request.input("userId", sql.Int, userId);

    const query = `
      SELECT 
        CAST(Timestamp AS DATE) as Date,
        Provider,
        COUNT(*) as CallCount,
        SUM(CASE WHEN Status = 'success' THEN 1 ELSE 0 END) as SuccessCount,
        SUM(CASE WHEN Status = 'error' THEN 1 ELSE 0 END) as ErrorCount,
        AVG(ResponseTimeMs) as AvgLatencyMs
      FROM AiLogs
      WHERE DashboardId = @dashboardId AND (@userId IS NULL OR UserId = @userId)
        AND Timestamp >= DATEADD(DAY, -@days, CAST(GETDATE() AS DATE))
      GROUP BY CAST(Timestamp AS DATE), Provider
      ORDER BY Date DESC, Provider
    `;

    const result = await request.query(query);

    return result.recordset || [];
  } catch (err) {
    console.error("[Analytics Model] Failed to fetch activity timeline:", err?.message || err);
    return [];
  }
}

/**
 * Get AI logs for a specific user across all dashboards
 * @param {number} userId - User ID
 * @param {number} limit - Max rows to return (default 100)
 * @param {number} days - Only logs from last N days (default 30)
 */
async function getAiLogsByUser(userId, limit = 100, days = 30) {
  try {
    const pool = await dbConfig;
    const request = pool.request();
    request.input("userId", sql.Int, userId);
    request.input("limit", sql.Int, limit);
    request.input("days", sql.Int, days);

    const query = `
      SELECT TOP (@limit)
        al.Id, al.Timestamp, al.Provider, al.Model, al.RequestPath, al.ResponseTimeMs, 
        al.Status, al.ErrorMessage, al.TokensIn, al.TokensOut, al.TaskId, al.DashboardId,
        d.Name as DashboardName
      FROM AiLogs al
      LEFT JOIN Dashboards d ON al.DashboardId = d.DashboardId
      WHERE al.UserId = @userId AND al.Timestamp >= DATEADD(DAY, -@days, GETDATE())
      ORDER BY al.Timestamp DESC
    `;

    const result = await request.query(query);

    return result.recordset || [];
  } catch (err) {
    console.error("[Analytics Model] Failed to fetch user logs:", err?.message || err);
    return [];
  }
}

module.exports = {
  getAiUsageByUser,
  getTeamActivityByDashboard,
  getAiUsageStats,
  getProviderStats,
  getUserStats,
  getActivityTimeline,
  getAiLogsByUser
};
