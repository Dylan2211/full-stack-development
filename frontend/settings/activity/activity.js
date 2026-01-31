// Require authentication
requireAuth();

let allActivities = [];
let currentFilter = "all";
let dashboardId = null;

// Activity type labels and colors
const activityTypeMap = {
  "task_created": { label: "Task Created", icon: "✓", color: "#4CAF50" },
  "task_updated": { label: "Task Updated", icon: "✏", color: "#2196F3" },
  "task_deleted": { label: "Task Deleted", icon: "✗", color: "#f44336" },
  "task_moved": { label: "Task Moved", icon: "→", color: "#FF9800" },
  "task_completed": { label: "Task Completed", icon: "✓✓", color: "#4CAF50" },
  "board_created": { label: "Board Created", icon: "⊞", color: "#9C27B0" },
  "board_updated": { label: "Board Updated", icon: "✎", color: "#673AB7" },
  "board_deleted": { label: "Board Deleted", icon: "⊠", color: "#f44336" },
  "dashboard_shared": { label: "Dashboard Shared", icon: "↗", color: "#FF5722" },
  "collaborator_added": { label: "Collaborator Added", icon: "👤", color: "#00BCD4" },
  "collaborator_removed": { label: "Collaborator Removed", icon: "👥", color: "#00BCD4" }
};

document.addEventListener('DOMContentLoaded', function() {
  // Setup logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to logout?')) {
        logout('/login');
      }
    });
  }
  
  // Get dashboard ID from URL or use default (not required for all activities)
  const urlParams = new URLSearchParams(window.location.search);
  dashboardId = urlParams.get('dashboardId') || localStorage.getItem('activeDashboardId');
  
  // Note: dashboardId is optional now - we'll show activities across all dashboards
  
  // Setup filter tabs
  setupFilterTabs();
  
  // Load activities
  loadUserActivities();
  
  // Refresh every 30 seconds
  setInterval(loadUserActivities, 30000);
  
  console.log('Activity page loaded (showing all user activities)');
});

function setupFilterTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      tabButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      const filterType = this.textContent.trim().toLowerCase().replace(' ', '_');
      currentFilter = filterType === 'all_activity' ? 'all' : filterType;
      
      displayActivities();
    });
  });
}

async function loadUserActivities() {
  try {
    console.log('📋 Loading user activities across all dashboards');
    
    const response = await authFetch(`/api/users/activity/all?days=90&limit=500`);
    console.log('📡 API Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Failed to load activities:', error);
      showEmptyState('Failed to load activities: ' + (error.details || 'Unknown error'));
      return;
    }
    
    const data = await response.json();
    console.log('✅ Loaded activities data:', data);
    console.log('📊 Activities count:', data.activities?.length || 0);
    
    allActivities = data.activities || [];
    
    if (allActivities.length === 0) {
      showEmptyState('No activities yet. Create some tasks or boards to see your activity here!');
      return;
    }
    
    displayActivities();
  } catch (error) {
    console.error('Error loading user activities:', error);
    showEmptyState('Error loading activities: ' + error.message);
  }
}

function displayActivities() {
  const container = document.querySelector('.activity-container');
  const activityList = document.getElementById('activity-list');
  
  if (!activityList) {
    console.error('Activity list element not found');
    return;
  }
  
  // Filter activities
  let filtered = allActivities;
  
  if (currentFilter === 'today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    filtered = allActivities.filter(a => {
      const actDate = new Date(a.Timestamp);
      actDate.setHours(0, 0, 0, 0);
      return actDate.getTime() === today.getTime();
    });
  } else if (currentFilter === 'past_week') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    filtered = allActivities.filter(a => new Date(a.Timestamp) >= weekAgo);
  } else if (currentFilter === 'older') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    filtered = allActivities.filter(a => new Date(a.Timestamp) < weekAgo);
  }
  
  if (filtered.length === 0) {
    showEmptyState(`No activities in "${currentFilter}"`);
    activityList.innerHTML = '';
    return;
  }
  
  // Group by date
  const grouped = {};
  filtered.forEach(activity => {
    const date = new Date(activity.Timestamp);
    const dateKey = date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(activity);
  });
  
  // Build HTML
  let html = '';
  Object.keys(grouped).forEach(dateKey => {
    const activities = grouped[dateKey];
    html += `<div class="activity-date-group">
      <h4 class="activity-date">${dateKey}</h4>`;
    
    activities.forEach(activity => {
      const typeInfo = activityTypeMap[activity.ActivityType] || {
        label: activity.ActivityType || 'Unknown',
        icon: '•',
        color: '#999'
      };
      
      const time = new Date(activity.Timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const taskInfo = activity.TaskTitle ? ` - <strong>${activity.TaskTitle}</strong>` : '';
      const boardInfo = activity.BoardName ? ` (${activity.BoardName})` : '';
      const dashboardInfo = activity.DashboardName ? ` in <em>${activity.DashboardName}</em>` : '';
      
      html += `
        <div class="activity-item" style="border-left: 4px solid ${typeInfo.color}">
          <div class="activity-icon" style="background-color: ${typeInfo.color}; color: white">
            ${typeInfo.icon}
          </div>
          <div class="activity-content">
            <div class="activity-type">${typeInfo.label}</div>
            <div class="activity-description">
              ${activity.Description || 'No description'}${taskInfo}${boardInfo}${dashboardInfo}
            </div>
            <div class="activity-time">${time}</div>
          </div>
        </div>`;
    });
    
    html += `</div>`;
  });
  
  // Remove empty state and display activities
  if (container) {
    container.innerHTML = '';
    container.classList.remove('empty-state');
  }
  
  activityList.innerHTML = html;
  console.log(`📊 Displayed ${filtered.length} activities`);
}

function showEmptyState(message = 'No activities yet. Create some tasks or boards to see your activity here!') {
  const container = document.querySelector('.activity-container');
  const activityList = document.getElementById('activity-list');
  
  if (container) {
    container.innerHTML = `<p>${message}</p>`;
    container.classList.add('empty-state');
  }
  
  if (activityList) {
    activityList.innerHTML = '';
  }
}