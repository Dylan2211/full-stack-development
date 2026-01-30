const sql = require("mssql");
const dbConfig = require("../dbConfig");

/**
 * Create a new notification
 * @param {number} userId - The user to notify
 * @param {string} type - Type of notification
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {number} relatedId - ID of related entity (optional)
 * @param {string} relatedType - Type of related entity (optional)
 */
async function createNotification(userId, type, title, message, relatedId = null, relatedType = null) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("UserId", sql.Int, userId)
      .input("Type", sql.NVarChar, type)
      .input("Title", sql.NVarChar, title)
      .input("Message", sql.NVarChar, message)
      .input("RelatedId", sql.Int, relatedId)
      .input("RelatedType", sql.NVarChar, relatedType)
      .query(`
        INSERT INTO Notifications (UserId, Type, Title, Message, RelatedId, RelatedType)
        VALUES (@UserId, @Type, @Title, @Message, @RelatedId, @RelatedType);
        SELECT SCOPE_IDENTITY() AS NotificationId;
      `);
    
    return {
      NotificationId: result.recordset[0].NotificationId,
      UserId: userId,
      Type: type,
      Title: title,
      Message: message,
      RelatedId: relatedId,
      RelatedType: relatedType,
      IsRead: false,
      CreatedAt: new Date()
    };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw new Error(`Failed to create notification: ${error.message}`);
  }
}

/**
 * Get notifications for a user
 * @param {number} userId - User ID
 * @param {boolean} unreadOnly - Only return unread notifications
 */
async function getUserNotifications(userId, unreadOnly = false) {
  const pool = await sql.connect(dbConfig);
  let query = `
    SELECT NotificationId, Type, Title, Message, RelatedId, RelatedType, 
           IsRead, CreatedAt, ReadAt
    FROM Notifications 
    WHERE UserId = @UserId
  `;
  
  if (unreadOnly) {
    query += " AND IsRead = 0";
  }
  
  query += " ORDER BY CreatedAt DESC";
  
  const result = await pool.request()
    .input("UserId", sql.Int, userId)
    .query(query);
  
  return result.recordset;
}

/**
 * Mark notification as read
 * @param {number} notificationId - Notification ID
 * @param {number} userId - User ID (for security)
 */
async function markAsRead(notificationId, userId) {
  const pool = await sql.connect(dbConfig);
  await pool.request()
    .input("NotificationId", sql.Int, notificationId)
    .input("UserId", sql.Int, userId)
    .query(`
      UPDATE Notifications 
      SET IsRead = 1, ReadAt = GETDATE()
      WHERE NotificationId = @NotificationId AND UserId = @UserId
    `);
  
  return { message: "Notification marked as read" };
}

/**
 * Mark all notifications as read for a user
 * @param {number} userId - User ID
 */
async function markAllAsRead(userId) {
  const pool = await sql.connect(dbConfig);
  await pool.request()
    .input("UserId", sql.Int, userId)
    .query(`
      UPDATE Notifications 
      SET IsRead = 1, ReadAt = GETDATE()
      WHERE UserId = @UserId AND IsRead = 0
    `);
  
  return { message: "All notifications marked as read" };
}

/**
 * Get unread notification count
 * @param {number} userId - User ID
 */
async function getUnreadCount(userId) {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input("UserId", sql.Int, userId)
    .query(`
      SELECT COUNT(*) as UnreadCount
      FROM Notifications 
      WHERE UserId = @UserId AND IsRead = 0
    `);
  
  return result.recordset[0].UnreadCount;
}

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
};