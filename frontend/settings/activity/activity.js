// Require authentication
requireAuth();

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
  
  // Activity functionality can be added here
  console.log('Activity page loaded');
});