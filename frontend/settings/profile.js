/*document.addEventListener("DOMContentLoaded", () => {
  // Retrieve stored user ID from localStorage
  const userId = localStorage.getItem("loggedInUserId");

  if (userId) {
    document.getElementById("userId").textContent = userId;

    // Optional: dynamically set name or avatar based on userId
    document.getElementById("name").textContent = "Employee " + userId;
    document.getElementById("avatar").textContent = userId
      .slice(-2)
      .toUpperCase(); // last 2 digits
  } else {
    // If no user ID found, redirect to login
    window.location.href = "../login/login.html";
  }

  // Logout function
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("loggedInUserId"); // clear saved user
    window.location.href = "login.html";
  });
});*/

function saveProfile(event) {
    event.preventDefault();
    
    const bio = document.getElementById('bio').value;
    
    if (!bio.trim()) {
        alert('Please enter a bio!');
        return;
    }
    
    localStorage.setItem('userBio', bio);
    
    console.log('Profile saved:', bio);
    alert('Profile saved successfully!');
}

function toggleVisibility(type) {
    const checkbox = event.target;
    const isChecked = checkbox.checked;
    
    let message = '';
    
    switch(type) {
        case 'public':
            message = isChecked ? 'Profile is now public' : 'Profile is now private';
            localStorage.setItem('profileVisibility', isChecked);
            break;
        case 'tasks':
            message = isChecked ? 'Tasks are now visible to network' : 'Tasks are now hidden from network';
            localStorage.setItem('taskVisibility', isChecked);
            break;
        case 'email':
            message = isChecked ? 'Email notifications enabled' : 'Email notifications disabled';
            localStorage.setItem('emailNotifications', isChecked);
            break;
    }
    
    console.log(message);
    
    showToast(message);
}

function deleteAccount() {
    const confirmation = confirm('WARNING: This action cannot be undone!\n\nAre you absolutely sure you want to delete your account?\n\nAll your data, tasks, and settings will be permanently deleted.');
    
    if (confirmation) {
        const doubleCheck = prompt('Type "DELETE" to confirm account deletion:');
        
        if (doubleCheck === 'DELETE') {
            console.log('Account deletion confirmed');
            alert('Account deletion initiated. You will receive a confirmation email.');
        } else {
            alert('Account deletion cancelled.');
        }
    }
}

function showToast(message) {
    let toast = document.getElementById('toast');
    
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background-color: #1f2937;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s ease;
            font-size: 14px;
        `;
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.style.opacity = '1';
    
    setTimeout(() => {
        toast.style.opacity = '0';
    }, 2500);
}

document.addEventListener('DOMContentLoaded', function() {
    const savedBio = localStorage.getItem('userBio');
    if (savedBio) {
        document.getElementById('bio').value = savedBio;
    }
    
    const profileVisibility = localStorage.getItem('profileVisibility');
    if (profileVisibility !== null) {
        document.getElementById('publicProfile').checked = profileVisibility === 'true';
    }
    
    const taskVisibility = localStorage.getItem('taskVisibility');
    if (taskVisibility !== null) {
        document.getElementById('taskVisibility').checked = taskVisibility === 'true';
    }
    
    const emailNotifications = localStorage.getItem('emailNotifications');
    if (emailNotifications !== null) {
        document.getElementById('emailNotif').checked = emailNotifications === 'true';
    }
});