const notificationModel = require("../models/notificationModel");

/**
 * Get notifications for current user
 */
async function getNotifications(req, res) {
  try {
    const userId = req.user.userId || req.user.id;
    const unreadOnly = req.query.unreadOnly === 'true';
    
    const notifications = await notificationModel.getUserNotifications(userId, unreadOnly);
    res.json(notifications);
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get unread notification count
 */
async function getUnreadCount(req, res) {
  try {
    const userId = req.user.userId || req.user.id;
    const count = await notificationModel.getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Mark notification as read
 */
async function markAsRead(req, res) {
  try {
    const userId = req.user.userId || req.user.id;
    const notificationId = parseInt(req.params.notificationId);
    
    await notificationModel.markAsRead(notificationId, userId);
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Mark all notifications as read
 */
async function markAllAsRead(req, res) {
  try {
    const userId = req.user.userId || req.user.id;
    await notificationModel.markAllAsRead(userId);
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};