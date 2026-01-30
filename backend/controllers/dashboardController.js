const dashboardModel = require("../models/dashboardModel");

async function getDashboard(req, res) {
  try {
    const dashboardId = parseInt(req.dashboardId || req.params.dashboardId || req.params.id);
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
    
    console.log(`Creating dashboard for user ${userId}: ${name}`);
    
    const newDashboard = await dashboardModel.createDashboard(name, description);
    console.log(`Dashboard created with ID: ${newDashboard.DashboardId}`);
    
    // Link the creator as Owner in UserDashboards
    await dashboardModel.addUserToDashboard(userId, newDashboard.DashboardId, 'Owner');
    console.log(`User ${userId} added as Owner to dashboard ${newDashboard.DashboardId}`);
    
    const boardModel = require("../models/boardModel");
    await boardModel.createBoard({ dashboardId: newDashboard.DashboardId, name: "To Do"})
    await boardModel.createBoard({ dashboardId: newDashboard.DashboardId, name: "In Progress"})
    await boardModel.createBoard({ dashboardId: newDashboard.DashboardId, name: "Completed"})
    await boardModel.createBoard({ dashboardId: newDashboard.DashboardId, name: "Error"})
    
    console.log(`Default boards created for dashboard ${newDashboard.DashboardId}`);
    
    res.status(201).json(newDashboard);
  } catch (error) {
    console.error(`Error creating dashboard: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function updateDashboard(req, res) {
  try {
    const dashboardId = parseInt(req.dashboardId || req.params.dashboardId || req.params.id);
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
    const dashboardId = parseInt(req.dashboardId || req.params.dashboardId || req.params.id);
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
    console.log(`Fetching users for dashboard: ${dashboardId}`);
    const users = await dashboardModel.getUsersByDashboardId(dashboardId);
    console.log(`Found ${users.length} users:`, users);
    res.status(200).json(users);
  } catch (error) {
    console.error('Error in getUsersByDashboard:', error);
    res.status(500).json({ error: error.message });
  }
}

async function addUserToDashboard(req, res) {
  try {
    const dashboardId = parseInt(req.params.dashboardId || req.body.dashboardId);
    const { userId, role } = req.body;
    
    if (!userId || !dashboardId) {
      return res.status(400).json({ error: "User ID and Dashboard ID are required" });
    }
    
    const result = await dashboardModel.addUserToDashboard(
      userId,
      dashboardId,
      role || 'Viewer'
    );
    res.status(201).json(result);
  } catch (error) {
    console.error('Error adding user to dashboard:', error);
    res.status(500).json({ error: error.message });
  }
}

async function removeUser(req, res) {
  try {
    const dashboardId = parseInt(req.params.dashboardId || req.params.id);
    const userId = parseInt(req.params.userId || req.body.userId);
    
    if (!userId || !dashboardId) {
      return res.status(400).json({ error: "User ID and Dashboard ID are required" });
    }
    
    const result = await dashboardModel.removeUserFromDashboard(
      userId,
      dashboardId
    );
    res.status(200).json(result);
  } catch (error) {
    console.error('Error removing user:', error);
    res.status(500).json({ error: error.message });
  }
}

async function getUserRole(req, res) {
  try {
    const dashboardId = parseInt(req.params.dashboardId || req.params.id);
    const userId = req.user.userId || req.user.id;
    const role = await dashboardModel.getUserRole(userId, dashboardId);
    
    if (!role) {
      return res.status(404).json({ error: "User not found in this dashboard" });
    }
    
    res.json({ role });
  } catch (error) {
    console.error('Error getting user role:', error);
    res.status(500).json({ error: error.message });
  }
}

async function updateUserRole(req, res) {
  try {
    const dashboardId = parseInt(req.params.dashboardId || req.params.id);
    const targetUserId = parseInt(req.params.userId);
    const { role } = req.body;
    
    // Validate role
    const validRoles = ['Owner', 'Editor', 'Viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role. Must be Owner, Editor, or Viewer" });
    }
    
    const result = await dashboardModel.updateUserRole(targetUserId, dashboardId, role);
    res.json(result);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Add collaborator by email (send invitation)
 */
async function addCollaboratorByEmail(req, res) {
  try {
    const dashboardId = parseInt(req.params.dashboardId || req.params.id);
    const { email, role } = req.body;
    const inviterId = req.user.userId || req.user.id;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    
    const validRoles = ['Owner', 'Editor', 'Viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    
    // Look up user by email
    const userModel = require("../models/userModel");
    const userResult = await userModel.findByEmail(email);
    
    if (!userResult || !userResult.recordset || userResult.recordset.length === 0) {
      return res.status(404).json({ error: "User not found with that email" });
    }
    
    const userId = userResult.recordset[0].UserId;
    
    // Check if user is already in dashboard
    const existingRole = await dashboardModel.getUserRole(userId, dashboardId);
    if (existingRole) {
      return res.status(400).json({ 
        error: "User is already a collaborator on this dashboard"
      });
    }
    
    // Check if there's already any invitation (pending, declined, or expired)
    const existingInvitation = await dashboardModel.getInvitationByDashboardAndEmail(dashboardId, email);
    
    let invitation;
    let action;
    
    if (existingInvitation) {
      if (existingInvitation.Status === 'Pending') {
        return res.status(400).json({ 
          error: "User already has a pending invitation to this dashboard"
        });
      }
      
      // Update existing invitation (for declined/expired invitations)
      invitation = await dashboardModel.updateInvitation(existingInvitation.InvitationId, role, inviterId);
      action = "re-invited";
    } else {
      // Create new invitation
      invitation = await dashboardModel.createInvitation(dashboardId, email, role, inviterId);
      action = "invited";
    }
    
    // Try to create notification (optional - don't fail if table doesn't exist)
    try {
      const dashboard = await dashboardModel.getDashboard(dashboardId);
      const inviter = await userModel.findById(inviterId);
      const inviterName = inviter.recordset[0]?.FullName || 'Someone';
      
      const notificationModel = require("../models/notificationModel");
      await notificationModel.createNotification(
        userId,
        'invitation',
        'Dashboard Invitation',
        `${inviterName} invited you to collaborate on "${dashboard.Name}" as ${role}`,
        invitation.InvitationId,
        'invitation'
      );
      console.log(`✅ Notification created successfully for user ${userId} about invitation ${invitation.InvitationId}`);
    } catch (notificationError) {
      console.error('❌ Notification creation failed:', notificationError.message);
      console.log('This is likely because the Notifications table does not exist in your database.');
      console.log('Run the SQL script: backend/add-notifications-table.sql to fix this.');
      // Continue without failing - notifications are optional
    }
    
    res.status(201).json({ 
      message: action === "re-invited" ? "Invitation updated and resent successfully" : "Invitation sent successfully",
      invitationId: invitation.InvitationId,
      email: email,
      role: role,
      action: action
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get pending invitations for current user
 */
async function getPendingInvitations(req, res) {
  try {
    const email = req.user.email;
    const invitations = await dashboardModel.getPendingInvitations(email);
    res.json(invitations);
  } catch (error) {
    console.error('Error getting invitations:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get dashboard invitations (for dashboard owners)
 */
async function getDashboardInvitations(req, res) {
  try {
    const dashboardId = parseInt(req.params.dashboardId || req.params.id);
    const invitations = await dashboardModel.getDashboardInvitations(dashboardId);
    res.json(invitations);
  } catch (error) {
    console.error('Error getting dashboard invitations:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Accept invitation
 */
async function acceptInvitationById(req, res) {
  try {
    const invitationId = parseInt(req.params.invitationId);
    const userId = req.user.userId || req.user.id;
    
    const result = await dashboardModel.acceptInvitationById(invitationId, userId);
    res.json(result);
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Decline invitation
 */
async function declineInvitationById(req, res) {
  try {
    const invitationId = parseInt(req.params.invitationId);
    const result = await dashboardModel.declineInvitationById(invitationId);
    res.json(result);
  } catch (error) {
    console.error('Error declining invitation:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Rescind invitation (owner only)
 */
async function rescindInvitation(req, res) {
  try {
    const invitationId = parseInt(req.params.invitationId);
    const result = await dashboardModel.rescindInvitation(invitationId);
    res.json(result);
  } catch (error) {
    console.error('Error rescinding invitation:', error);
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
  getUserRole,
  updateUserRole,
  addCollaboratorByEmail,
  getPendingInvitations,
  getDashboardInvitations,
  acceptInvitationById,
  declineInvitationById,
  rescindInvitation,
};
