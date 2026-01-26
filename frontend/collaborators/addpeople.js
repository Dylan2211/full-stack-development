let selectedUsers = [];
let currentDashboardId = null;
let availableUsers = [];

// Initialize page on load
document.addEventListener('DOMContentLoaded', async () => {
    // Get dashboard ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentDashboardId = urlParams.get('dashboardId');
    
    if (!currentDashboardId) {
        alert('Dashboard ID not found');
        closeModal();
        return;
    }
    
    // Load available users
    await loadAvailableUsers();
});

async function loadAvailableUsers() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please login first');
            window.location.href = '/login';
            return;
        }
        
        // Fetch all users
        const usersResponse = await fetch('http://localhost:3000/api/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!usersResponse.ok) {
            throw new Error('Failed to fetch users');
        }
        
        const allUsers = await usersResponse.json();
        
        // Fetch current collaborators
        const collabResponse = await fetch(`http://localhost:3000/api/dashboards/${currentDashboardId}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!collabResponse.ok) {
            throw new Error('Failed to fetch collaborators');
        }
        
        const currentCollaborators = await collabResponse.json();
        const collaboratorIds = new Set(currentCollaborators.map(c => c.UserId));
        
        // Filter out users who are already collaborators
        availableUsers = allUsers.filter(user => !collaboratorIds.has(user.UserId));
        
        // Display available users
        displayAvailableUsers();
    } catch (error) {
        console.error('Error loading users:', error);
        alert('Failed to load available users');
    }
}

function displayAvailableUsers() {
    const suggestionsList = document.getElementById('suggestionsList');
    
    if (availableUsers.length === 0) {
        suggestionsList.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">No users available to add</p>';
        return;
    }
    
    suggestionsList.innerHTML = availableUsers.map(user => `
        <div class="suggestion-item" data-user-id="${user.UserId}" data-name="${user.FullName}" data-email="${user.Email}">
            <img src="" alt="${user.FullName}" class="suggestion-avatar">
            <div class="suggestion-info">
                <div class="suggestion-name">${user.FullName}</div>
                <div class="suggestion-email">${user.Email}</div>
            </div>
            <button class="add-btn" onclick="event.stopPropagation(); selectUser(${user.UserId}, '${user.FullName}', '${user.Email}', '', this)">Add</button>
        </div>
    `).join('');
}

function closeModal() {
    if (window.opener) {
        // Notify parent window to reload collaborators
        window.opener.postMessage({
            type: 'collaboratorsAdded'
        }, '*');
        window.close();
    } else {
        // Redirect back to collaborators page with dashboardId
        window.location.href = `collaborators.html?dashboardId=${currentDashboardId}`;
    }
}

function selectUser(userId, name, email, avatar, buttonElement) {
    const userExists = selectedUsers.find(user => user.userId === userId);
    
    if (userExists) {
        alert('This user has already been added!');
        return;
    }
    
    selectedUsers.push({ userId, name, email, avatar });
    updateSelectedList();
    
    const suggestionItem = buttonElement.closest('.suggestion-item');
    suggestionItem.style.opacity = '0.5';
    suggestionItem.style.pointerEvents = 'none';
    buttonElement.textContent = 'Added';
    buttonElement.style.backgroundColor = '#10b981';
}

function updateSelectedList() {
    const selectedSection = document.getElementById('selectedSection');
    const selectedList = document.getElementById('selectedList');
    
    if (selectedUsers.length > 0) {
        selectedSection.style.display = 'block';
        selectedList.innerHTML = '';
        
        selectedUsers.forEach((user, index) => {
            const selectedItem = document.createElement('div');
            selectedItem.className = 'selected-item';
            selectedItem.innerHTML = `
                <div class="selected-left">
                    <img src="${user.avatar}" alt="${user.name}" class="suggestion-avatar">
                    <div class="suggestion-info">
                        <div class="suggestion-name">${user.name}</div>
                        <div class="suggestion-email">${user.email}</div>
                    </div>
                </div>
                <button class="remove-selected-btn" onclick="removeUser(${index})">Remove</button>
            `;
            selectedList.appendChild(selectedItem);
        });
    } else {
        selectedSection.style.display = 'none';
    }
}

function removeUser(index) {
    const removedUser = selectedUsers[index];
    selectedUsers.splice(index, 1);
    updateSelectedList();
    
    const suggestionItems = document.querySelectorAll('.suggestion-item');
    suggestionItems.forEach(item => {
        const itemEmail = item.getAttribute('data-email');
        if (itemEmail === removedUser.email) {
            item.style.opacity = '1';
            item.style.pointerEvents = 'auto';
            const addBtn = item.querySelector('.add-btn');
            addBtn.textContent = 'Add';
            addBtn.style.backgroundColor = '#7c3aed';
        }
    });
}

function searchUsers(query) {
    const searchTerm = query.toLowerCase();
    const suggestionItems = document.querySelectorAll('.suggestion-item');
    
    suggestionItems.forEach(item => {
        const name = item.getAttribute('data-name').toLowerCase();
        const email = item.getAttribute('data-email').toLowerCase();
        
        if (name.includes(searchTerm) || email.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

async function sendInvites() {
    if (selectedUsers.length === 0) {
        alert('Please select at least one person to add.');
        return;
    }
    
    const roleSelect = document.getElementById('roleSelect').value;
    // Map frontend role values to backend role names
    const roleMapping = {
        'viewer': 'Viewer',
        'editor': 'Editor',
        'admin': 'Owner'
    };
    const role = roleMapping[roleSelect] || 'Viewer';
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please login first');
            window.location.href = '/login';
            return;
        }
        
        // Add collaborators by email
        const promises = selectedUsers.map(user => 
            fetch(`http://localhost:3000/api/dashboards/${currentDashboardId}/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: user.email,
                    role: role
                })
            })
        );
        
        const results = await Promise.all(promises);
        
        // Separate successful and failed requests
        const failedUsers = [];
        const successCount = results.length;
        
        for (let i = 0; i < results.length; i++) {
            if (!results[i].ok) {
                const error = await results[i].json();
                failedUsers.push(`${selectedUsers[i].name}: ${error.error}`);
            }
        }
        
        if (failedUsers.length > 0) {
            alert(`Some users could not be added:\n${failedUsers.join('\n')}`);
        }
        
        // Show success message for successfully added users
        const successUsers = successCount - failedUsers.length;
        if (successUsers > 0) {
            alert(`Successfully added ${successUsers} collaborator(s) as ${role}`);
            
            // Notify parent window to reload
            if (window.opener) {
                window.opener.postMessage({
                    type: 'collaboratorsAdded',
                    users: selectedUsers,
                    role: role
                }, '*');
            }
        }
        
        selectedUsers = [];
        closeModal();
    } catch (error) {
        console.error('Error adding collaborators:', error);
        alert('Failed to add collaborators. Please try again.');
    }
}

document.getElementById('roleSelect').addEventListener('change', function() {
    const role = this.value;
    const canEdit = document.getElementById('canEdit');
    const canDelete = document.getElementById('canDelete');
    const canInvite = document.getElementById('canInvite');
    
    if (role === 'viewer') {
        canEdit.checked = false;
        canDelete.checked = false;
        canInvite.checked = false;
        canEdit.disabled = true;
        canDelete.disabled = true;
        canInvite.disabled = true;
    } else if (role === 'editor') {
        canEdit.checked = true;
        canDelete.checked = false;
        canInvite.checked = false;
        canEdit.disabled = false;
        canDelete.disabled = false;
        canInvite.disabled = true;
    } else if (role === 'admin') {
        canEdit.checked = true;
        canDelete.checked = true;
        canInvite.checked = true;
        canEdit.disabled = false;
        canDelete.disabled = false;
        canInvite.disabled = false;
    }
});

document.getElementById('modalOverlay').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const roleSelect = document.getElementById('roleSelect');
    const canEdit = document.getElementById('canEdit');
    const canDelete = document.getElementById('canDelete');
    const canInvite = document.getElementById('canInvite');
    
    const currentRole = roleSelect.value;
    
    if (currentRole === 'viewer') {
        canEdit.checked = false;
        canDelete.checked = false;
        canInvite.checked = false;
        canEdit.disabled = true;
        canDelete.disabled = true;
        canInvite.disabled = true;
    } else if (currentRole === 'editor') {
        canEdit.checked = true;
        canDelete.checked = false;
        canInvite.checked = false;
        canEdit.disabled = false;
        canDelete.disabled = false;
        canInvite.disabled = true;
    } else if (currentRole === 'admin') {
        canEdit.checked = true;
        canDelete.checked = true;
        canInvite.checked = true;
        canEdit.disabled = false;
        canDelete.disabled = false;
        canInvite.disabled = false;
    }
});