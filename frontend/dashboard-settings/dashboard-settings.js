// Check authentication
requireAuth();

// Get dashboard ID from URL
function getDashboardId() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id || isNaN(id)) return null;
  return Number(id);
}

const dashboardId = getDashboardId();

// State
let dashboardData = null;
let collaborators = [];

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  if (!dashboardId) {
    alert("Invalid dashboard ID");
    window.location.href = "/dashboard";
    return;
  }

  setupNavigation();
  setupBackButton();
  await loadDashboardData();
  setupEventListeners();
});

// Setup navigation between sections
function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".settings-section");

  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const sectionId = item.dataset.section;

      // Update active nav item
      navItems.forEach((nav) => nav.classList.remove("active"));
      item.classList.add("active");

      // Update active section
      sections.forEach((section) => section.classList.remove("active"));
      document.getElementById(`${sectionId}-section`).classList.add("active");
    });
  });
}

// Setup back button
function setupBackButton() {
  const backButton = document.getElementById("backButton");
  backButton.href = `/kanban?id=${dashboardId}`;
}

// Load dashboard data
async function loadDashboardData() {
  try {
    const response = await authFetch(`/api/dashboards/${dashboardId}`);
    if (!response.ok) {
      throw new Error("Failed to load dashboard");
    }
    dashboardData = await response.json();

    // Update UI with dashboard data
    document.getElementById("dashboardTitle").textContent = dashboardData.Name + " Settings";
    document.getElementById("dashboardName").value = dashboardData.Name;

    // Set visibility radio
    const isPrivate = dashboardData.IsPrivate === true || dashboardData.IsPrivate === 1;
    const visibilityValue = isPrivate ? "private" : "public";
    document.querySelector(`input[name="visibility"][value="${visibilityValue}"]`).checked = true;

    // Update visibility status in collaborators section
    document.getElementById("visibilityStatus").textContent = isPrivate ? "Private" : "Public";

    // Load collaborators (placeholder - replace with actual API call)
    await loadCollaborators();
  } catch (error) {
    console.error("Error loading dashboard:", error);
    alert("Failed to load dashboard settings");
  }
}

// Load collaborators (placeholder)
async function loadCollaborators() {
  // TODO: Replace with actual API call when backend endpoint is ready
  // const response = await authFetch(`/api/dashboards/${dashboardId}/users`);
  // collaborators = await response.json();

  // For now, just show the owner
  const currentUser = getUserInfoFromToken();
  collaborators = [
    {
      userId: currentUser?.userId || 1,
      name: currentUser?.username || "You",
      email: currentUser?.email || "",
      role: "owner",
    },
  ];

  renderCollaborators();
  
  // Set owner initials
  const ownerInitials = generateInitials(collaborators[0].name);
  const ownerAvatarEl = document.getElementById("ownerInitials");
  if (ownerAvatarEl) {
    ownerAvatarEl.textContent = ownerInitials;
  }
}

// Render collaborators list
function renderCollaborators() {
  const list = document.getElementById("collaboratorsList");
  list.innerHTML = "";

  collaborators.forEach((collab) => {
    const item = document.createElement("div");
    item.className = `collaborator-item ${collab.role === "owner" ? "owner" : ""}`;
    
    const isOwner = collab.role === "owner";
    const roleDisplay = collab.role.charAt(0).toUpperCase() + collab.role.slice(1);
    const initials = generateInitials(collab.name);

    item.innerHTML = `
      <div class="collaborator-info">
        <div class="collaborator-avatar">${initials}</div>
        <div class="collaborator-details">
          <strong class="collaborator-name">${collab.name}</strong>
          <span class="collaborator-role">${collab.email || roleDisplay}</span>
        </div>
      </div>
      <span class="role-badge ${isOwner ? 'owner-badge' : ''}">${roleDisplay}</span>
    `;

    list.appendChild(item);
  });
}

// Setup event listeners
function setupEventListeners() {
  // Update dashboard name
  document.getElementById("updateNameBtn").addEventListener("click", updateDashboardName);

  // Update visibility - add click handlers to radio buttons
  document.querySelectorAll('input[name="visibility"]').forEach(radio => {
    radio.addEventListener("change", handleVisibilityChange);
  });

  // Transfer ownership
  document.getElementById("transferBtn").addEventListener("click", transferOwnership);

  // Delete dashboard
  document.getElementById("deleteDashboardBtn").addEventListener("click", deleteDashboard);

  // Invite collaborator
  document.getElementById("inviteBtn").addEventListener("click", inviteCollaborator);

  // Enter key on dashboard name input
  document.getElementById("dashboardName").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      updateDashboardName();
    }
  });

  // Enter key on invite email input
  document.getElementById("inviteEmail").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      inviteCollaborator();
    }
  });
}

// Update dashboard name
async function updateDashboardName() {
  const nameInput = document.getElementById("dashboardName");
  const newName = nameInput.value.trim();

  if (!newName) {
    alert("Dashboard name cannot be empty");
    return;
  }

  if (newName === dashboardData.Name) {
    return;
  }

  try {
    const response = await authFetch(`/api/dashboards/${dashboardId}`, {
      method: "PUT",
      body: JSON.stringify({ name: newName }),
    });

    if (!response.ok) {
      throw new Error("Failed to update dashboard name");
    }

    dashboardData.Name = newName;
    document.getElementById("dashboardTitle").textContent = newName + " Settings";
    // Redirect to dashboard instead of showing popup
    window.location.href = "/dashboard";
  } catch (error) {
    console.error("Error updating dashboard name:", error);
    alert("Failed to update dashboard name");
    nameInput.value = dashboardData.Name;
  }
}

// Handle visibility change with confirmation
async function handleVisibilityChange(e) {
  const selectedVisibility = e.target.value;
  const isPrivate = selectedVisibility === "private";
  const currentIsPrivate = dashboardData.IsPrivate === true || dashboardData.IsPrivate === 1;

  // If no change, do nothing
  if (currentIsPrivate === isPrivate) {
    return;
  }

  // Show confirmation dialog
  const visibilityType = isPrivate ? "Private" : "Public";
  const message = isPrivate 
    ? "Only people you invite will be able to view this dashboard."
    : "Anyone with the link will be able to view this dashboard.";
  
  const confirmed = await showConfirmDialog(`Change to ${visibilityType}`, message);
  
  if (!confirmed) {
    // Reset radio to previous value
    const previousValue = currentIsPrivate ? "private" : "public";
    document.querySelector(`input[name="visibility"][value="${previousValue}"]`).checked = true;
    return;
  }

  try {
    const response = await authFetch(`/api/dashboards/${dashboardId}`, {
      method: "PUT",
      body: JSON.stringify({ isPrivate }),
    });

    if (!response.ok) {
      throw new Error("Failed to update visibility");
    }

    dashboardData.IsPrivate = isPrivate;
    document.getElementById("visibilityStatus").textContent = isPrivate ? "Private" : "Public";
  } catch (error) {
    console.error("Error updating visibility:", error);
    alert("Failed to update visibility");
    // Reset radio to previous value
    const previousValue = currentIsPrivate ? "private" : "public";
    document.querySelector(`input[name="visibility"][value="${previousValue}"]`).checked = true;
  }
}

// Transfer ownership
async function transferOwnership() {
  const confirmed = await showConfirmDialog(
    "Transfer ownership",
    "Transfer ownership functionality is not yet implemented. This will allow you to transfer this dashboard to another user."
  );

  if (confirmed) {
    alert("Transfer ownership feature coming soon!");
  }
}

// Delete dashboard
async function deleteDashboard() {
  const confirmed = await showConfirmDialog(
    "Delete dashboard",
    `Are you sure you want to delete "${dashboardData.Name}"? This action cannot be undone. All boards and tasks will be permanently deleted.`
  );

  if (!confirmed) return;

  try {
    const response = await authFetch(`/api/dashboards/${dashboardId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete dashboard");
    }

    alert("Dashboard deleted successfully");
    window.location.href = "/dashboard";
  } catch (error) {
    console.error("Error deleting dashboard:", error);
    alert("Failed to delete dashboard");
  }
}

// Invite collaborator
async function inviteCollaborator() {
  const emailInput = document.getElementById("inviteEmail");
  const roleSelect = document.getElementById("inviteRole");
  const email = emailInput.value.trim();
  const role = roleSelect.value;

  if (!email) {
    alert("Please enter an email address");
    return;
  }

  if (!isValidEmail(email)) {
    alert("Please enter a valid email address");
    return;
  }

  try {
    // Map frontend role values to backend role names
    const roleMapping = {
      'viewer': 'Viewer',
      'editor': 'Editor',
      'admin': 'Owner'
    };
    const backendRole = roleMapping[role] || 'Viewer';

    const response = await authFetch(`/api/dashboards/${dashboardId}/invite`, {
      method: "POST",
      body: JSON.stringify({ 
        email: email, 
        role: backendRole 
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Failed to send invitation");
    }

    showSuccess(`Invitation sent to ${email}`);
    emailInput.value = "";
    roleSelect.value = "viewer";

    // Reload collaborators list
    await loadCollaborators();
  } catch (error) {
    console.error("Error inviting collaborator:", error);
    alert("Failed to send invitation: " + error.message);
  }
}

// Utility functions
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showSuccess(message) {
  // Simple alert for now - could be replaced with a toast notification
  alert(message);
}

async function showConfirmDialog(title, message) {
  return new Promise((resolve) => {
    const dialog = document.getElementById("confirmDialog");
    const titleEl = document.getElementById("confirmTitle");
    const messageEl = document.getElementById("confirmMessage");
    const cancelBtn = document.getElementById("confirmCancel");
    const submitBtn = document.getElementById("confirmSubmit");

    titleEl.textContent = title;
    messageEl.textContent = message;

    const handleConfirm = () => {
      dialog.close();
      cleanup();
      resolve(true);
    };

    const handleCancel = () => {
      dialog.close();
      cleanup();
      resolve(false);
    };

    const cleanup = () => {
      cancelBtn.removeEventListener("click", handleCancel);
      submitBtn.removeEventListener("click", handleConfirm);
    };

    cancelBtn.addEventListener("click", handleCancel);
    submitBtn.addEventListener("click", handleConfirm);

    dialog.showModal();
  });
}
