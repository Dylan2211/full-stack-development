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
  await loadShareTokens();
  setupEventListeners();
  checkAndShowViewingModeIfNeeded();
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
  try {
    const response = await authFetch(`/api/dashboards/${dashboardId}/users`);
    if (!response.ok) {
      throw new Error("Failed to load collaborators");
    }

    const users = await response.json();

    // Map backend fields to local state format
    collaborators = (users || []).map((u) => ({
      userId: u.UserId ?? u.userId ?? u.id,
      name: u.FullName ?? u.Name ?? u.username ?? "Unknown",
      email: u.Email ?? u.email ?? "",
      role: (u.Role ?? u.role ?? "Viewer").toString().toLowerCase(), // admin/editor/viewer
    }));

    renderCollaborators();

    // Set admin initials (prefer current user if admin, else first admin)
    const ownerAvatarEl = document.getElementById("ownerInitials");
    if (ownerAvatarEl) {
      const currentUser = getUserInfoFromToken();
      const me = currentUser?.email
        ? collaborators.find((c) => c.email === currentUser.email)
        : null;
      const owner = me && me.role === "admin" ? me : collaborators.find((c) => c.role === "admin");
      const ownerName = owner?.name || currentUser?.username || "You";
      ownerAvatarEl.textContent = generateInitials(ownerName);
    }
  } catch (error) {
    console.error("Error loading collaborators:", error);
    // Keep previous list if present; otherwise show current user as admin as fallback
    if (!Array.isArray(collaborators) || collaborators.length === 0) {
      const currentUser = getUserInfoFromToken();
      collaborators = [
        {
          userId: currentUser?.userId || 1,
          name: currentUser?.username || "You",
          email: currentUser?.email || "",
          role: "admin",
        },
      ];
      renderCollaborators();

      const ownerAvatarEl = document.getElementById("ownerInitials");
      if (ownerAvatarEl) {
        ownerAvatarEl.textContent = generateInitials(collaborators[0].name);
      }
    }
  }
}

// Render collaborators list
function renderCollaborators() {
  const list = document.getElementById("collaboratorsList");
  list.innerHTML = "";

  collaborators.forEach((collab) => {
    const item = document.createElement("div");
    item.className = `collaborator-item ${collab.role === "admin" ? "owner" : ""}`;
    
    const isOwner = collab.role === "admin";
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

  // Transfer admin role
  document.getElementById("transferBtn").addEventListener("click", transferAdminRole);

  // Delete dashboard
  document.getElementById("deleteDashboardBtn").addEventListener("click", deleteDashboard);

  // Add collaborator
  document.getElementById("inviteBtn").addEventListener("click", inviteCollaborator);

  // Create share token
  const createShareTokenBtn = document.getElementById("createShareTokenBtn");
  if (createShareTokenBtn) {
    createShareTokenBtn.addEventListener("click", createShareToken);
  }

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
    ? "Only people you add will be able to view this dashboard."
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

// Transfer admin role
async function transferAdminRole() {
  const confirmed = await showConfirmDialog(
    "Transfer admin role",
    "Transfer admin role functionality is not yet implemented. This will allow you to transfer this dashboard to another user."
  );

  if (confirmed) {
    alert("Transfer admin role feature coming soon!");
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
      const errorBody = await response.text();
      throw new Error(errorBody || "Failed to add collaborator");
    }

    // Parse response to determine action (added/updated/unchanged)
    const result = await response.json();
    const action = result.action || "added";
    const successMessage =
      action === "added"
        ? `Collaborator added: ${email}`
        : action === "updated"
        ? `Collaborator role updated: ${email} → ${backendRole}`
        : `User is already a collaborator: ${email}`;

    showSuccess(successMessage);
    emailInput.value = "";
    roleSelect.value = "viewer";

    // Reload collaborators list
    await loadCollaborators();
  } catch (error) {
    console.error("Error adding collaborator:", error);
    alert("Failed to add collaborator: " + error.message);
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

// ============ SHARE TOKEN FUNCTIONS ============

async function loadShareTokens() {
  try {
    const response = await authFetch(`/api/dashboards/${dashboardId}/share-tokens`);
    if (!response.ok) {
      console.warn("Failed to load share tokens");
      return [];
    }
    const tokens = await response.json();
    renderShareTokens(tokens);
    return tokens;
  } catch (error) {
    console.error("Error loading share tokens:", error);
    return [];
  }
}

function renderShareTokens(tokens) {
  const list = document.getElementById("shareTokensList");
  
  if (!tokens || tokens.length === 0) {
    list.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No share links yet</p>';
    return;
  }

  list.innerHTML = tokens.map(token => {
    const expiresAt = token.ExpiresAt ? new Date(token.ExpiresAt).toLocaleDateString() : "Never";
    const isExpired = token.ExpiresAt && new Date(token.ExpiresAt) < new Date();
    const status = !token.IsActive ? "Revoked" : isExpired ? "Expired" : "Active";
    
    return `
      <div class="share-token-item">
        <div class="share-token-info">
          <div class="share-token-link" onclick="copyToClipboard('${window.location.origin}/accept-share?token=${token.Token}', this)">
            ${window.location.origin}/accept-share?token=${token.Token}
          </div>
          <div class="share-token-details">
            <span class="share-token-role">${token.Role}</span>
            <span>Expires: ${expiresAt}</span>
            <span>Used: ${token.AccessCount} times</span>
            <span style="color: ${status === 'Active' ? '#22c55e' : '#ef4444'};">${status}</span>
          </div>
        </div>
        <div class="share-token-actions">
          ${token.IsActive && !isExpired ? `
            <select class="setting-select" style="padding: 6px 8px; font-size: 0.85em;" onchange="updateShareTokenRole(${token.ShareTokenId}, this.value)">
              <option value="Viewer" ${token.Role === 'Viewer' ? 'selected' : ''}>Viewer</option>
              <option value="Editor" ${token.Role === 'Editor' ? 'selected' : ''}>Editor</option>
              <option value="Admin" ${token.Role === 'Admin' ? 'selected' : ''}>Admin</option>
            </select>
          ` : ''}
          <button class="btn btn-danger-outline" onclick="revokeShareToken(${token.ShareTokenId})">Revoke</button>
        </div>
      </div>
    `;
  }).join('');
}

function copyToClipboard(text, element) {
  navigator.clipboard.writeText(text).then(() => {
    const originalText = element.textContent;
    element.textContent = "✓ Copied!";
    element.style.background = "#d1fae5";
    element.style.color = "#065f46";
    setTimeout(() => {
      element.textContent = originalText;
      element.style.background = "";
      element.style.color = "";
    }, 2000);
  }).catch(err => {
    console.error("Failed to copy:", err);
    alert("Failed to copy link");
  });
}

async function createShareToken() {
  try {
    const role = document.getElementById("shareTokenRole").value;
    const expirationDays = document.getElementById("shareTokenExpiration").value || null;

    const response = await authFetch(`/api/dashboards/${dashboardId}/share-tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role,
        expirationDays: expirationDays ? parseInt(expirationDays) : null
      })
    });

    if (!response.ok) {
      const error = await response.json();
      alert(`Failed to create share token: ${error.error}`);
      return;
    }

    alert("Share link created! Copy the link above to share.");
    document.getElementById("shareTokenExpiration").value = "";
    await loadShareTokens();
  } catch (error) {
    console.error("Error creating share token:", error);
    alert("Failed to create share link");
  }
}

async function updateShareTokenRole(shareTokenId, newRole) {
  try {
    const response = await authFetch(`/api/dashboards/${dashboardId}/share-tokens/${shareTokenId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newRole })
    });

    if (!response.ok) {
      alert("Failed to update share link role");
      return;
    }

    alert("Share link role updated!");
    await loadShareTokens();
  } catch (error) {
    console.error("Error updating share token role:", error);
    alert("Failed to update share link");
  }
}

async function revokeShareToken(shareTokenId) {
  if (!confirm("Are you sure you want to revoke this share link?")) return;

  try {
    const response = await authFetch(`/api/dashboards/${dashboardId}/share-tokens/${shareTokenId}/revoke`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      alert("Failed to revoke share link");
      return;
    }

    alert("Share link revoked!");
    await loadShareTokens();
  } catch (error) {
    console.error("Error revoking share token:", error);
    alert("Failed to revoke share link");
  }
}

// ============ VIEWING MODE PROTECTION ============

function checkAndShowViewingModeIfNeeded() {
  // Check if current user is a Viewer
  if (collaborators && collaborators.length > 0) {
    const currentUser = getUserInfoFromToken();
    const currentCollab = collaborators.find(c => c.email === currentUser?.email);
    
    if (currentCollab && currentCollab.role === "viewer") {
      showViewingModeOverlay();
      disableEditingForViewers();
    }
  }
}

function showViewingModeOverlay() {
  const overlay = document.getElementById("viewingModeOverlay");
  if (overlay) {
    overlay.style.display = "block";
  }
}

function disableEditingForViewers() {
  // Disable edit buttons for viewers
  const editableButtons = document.querySelectorAll(
    "#updateNameBtn, #transferBtn, #inviteBtn, #createShareTokenBtn, #deleteDashboardBtn"
  );
  
  editableButtons.forEach(btn => {
    btn.disabled = true;
    btn.style.opacity = "0.5";
    btn.style.cursor = "not-allowed";
  });

  // Disable input fields
  const editableInputs = document.querySelectorAll(
    "#dashboardName, #inviteEmail, #inviteRole, #shareTokenRole, #shareTokenExpiration"
  );
  
  editableInputs.forEach(input => {
    input.disabled = true;
    input.style.opacity = "0.5";
  });

  // Disable radio buttons
  const radioButtons = document.querySelectorAll('input[name="visibility"]');
  radioButtons.forEach(radio => {
    radio.disabled = true;
  });
}
