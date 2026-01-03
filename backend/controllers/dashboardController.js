const dashboardModel = require("../models/dashboardModel");

// Get all dashboards
async function getAllDashboards(req, res) {
  try {
    const dashboards = await dashboardModel.getAllDashboards();
    res.status(200).json(dashboards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get all users in a dashboard
async function getUsersByDashboard(req, res) {
  try {
    const dashboardId = parseInt(req.params.id);
    const users = await dashboardModel.getUsersByDashboardId(dashboardId);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Add a user to a dashboard
async function addUser(req, res) {
  try {
    const { userId, dashboardId, role } = req.body;
    const result = await dashboardModel.addUserToDashboard(
      userId,
      dashboardId,
      role
    );
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Remove a user from a dashboard
async function removeUser(req, res) {
  try {
    const { userId, dashboardId } = req.body;
    const result = await dashboardModel.removeUserFromDashboard(
      userId,
      dashboardId
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllDashboards,
  getUsersByDashboard,
  addUser,
  removeUser,
};
