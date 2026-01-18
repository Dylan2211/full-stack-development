const dashboardModel = require("../models/dashboardModel");


async function getDashboard(req, res) {
  try {
    const dashboardId = parseInt(req.params.dashboardId);
    const dashboard = await require("../models/dashboardModel").getDashboard(dashboardId);
    if (!dashboard) {
      return res.status(404).json({ error: "Dashboard not found" });
    }
    res.json(dashboard);
  } catch (error) {
    console.error(`Error getting dashboard by id: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
}
async function createDashboard(req, res) {
  try {
    const { name, description } = req.body;
    const userId = req.user.userId || req.user.id;
    
    const newDashboard = await dashboardModel.createDashboard(name, description);
    
    // Link the creator as Owner in UserDashboards
    await dashboardModel.addUserToDashboard(userId, newDashboard.DashboardId, 'Owner');
    
    res.status(201).json(newDashboard);
  } catch (error) {
    console.error(`Error creating dashboard: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
}
async function updateDashboard(req, res) {
  try {
    const dashboardId = parseInt(req.params.dashboardId);
    const { name, description, isPrivate } = req.body;
    const updatedDashboard = await require("../models/dashboardModel").updateDashboard(
      dashboardId,
      name,
      description,
      isPrivate
    );
    res.json(updatedDashboard);
  } catch (error) {
    console.error(`Error updating dashboard: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function deleteDashboard(req, res) {
  try {
    const dashboardId = parseInt(req.params.dashboardId);
    const result = await require("../models/dashboardModel").deleteDashboard(dashboardId);
    res.json(result);
  } catch (error) {
    console.error(`Error deleting dashboard: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getAllDashboards(req, res) {
  try {
    const userId = req.user.userId || req.user.id;
    const dashboards = await dashboardModel.getDashboardsByUserId(userId);
    res.status(200).json(dashboards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getUsersByDashboard(req, res) {
  try {
    const dashboardId = parseInt(req.params.id);
    const users = await dashboardModel.getUsersByDashboardId(dashboardId);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function addUserToDashboard(req, res) {
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
  getDashboard,
  createDashboard,
  updateDashboard,
  deleteDashboard,
  getAllDashboards,
  getUsersByDashboard,
  addUserToDashboard,
  removeUser,
};
