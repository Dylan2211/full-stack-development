let currentUserRole = null;
let currentDashboardId = null;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    // Get dashboard ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentDashboardId = urlParams.get('dashboardId');
    
    if (!currentDashboardId) {
        alert('Dashboard ID not found');
        return;
    }
    
    // Initialize
    await fetchCurrentUserRole();
    await loadCollaborators();
    updateUIBasedOnRole();
    
    // Listen for collaborators added in popup
    window.addEventListener('message', (event) => {
        if (event.data.type === 'collaboratorsAdded') {
            loadCollaborators();
        }
    });
});

async function fetchCurrentUserRole() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/dashboards/${currentDashboardId}/my-role`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch role');
        }
        
        const data = await response.json();
        currentUserRole = data.role;
    } catch (error) {
        console.error('Error fetching role:', error);
        alert('Failed to load your permissions');
    }
}

async function loadCollaborators() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/dashboards/${currentDashboardId}/users`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store'  // Prevent caching
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch collaborators');
        }
        
        const users = await response.json();
        displayCollaborators(users);
    } catch (error) {
        console.error('Error loading collaborators:', error);
        alert('Failed to load collaborators');
    }
}

function displayCollaborators(users) {
    const list = document.getElementById('collaboratorsList');
    
    if (users.length === 0) {
        list.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">No collaborators yet</p>';
        return;
    }
    
    list.innerHTML = users.map(user => {
        const canChangeRole = currentUserRole === 'Owner' && user.Role !== 'Owner';
        const canRemove = currentUserRole === 'Owner' && user.Role !== 'Owner';
        
        return `
            <div class="collaborator-item" data-user-id="${user.UserId}" data-name="${user.FullName.toLowerCase()}">
                <div class="collaborator-left">
                    <input type="checkbox" class="collaborator-checkbox" onchange="updateSelectAllState()">
                    <img src="" alt="${user.FullName}" class="avatar">
                    <div class="collaborator-info">
                        <span class="collaborator-name">${user.FullName}</span>
                        <span class="collaborator-email" style="font-size: 0.85em; color: #666;">${user.Email}</span>
                    </div>
                </div>
                <div class="collaborator-right">
                    ${canChangeRole ? `
                        <select class="role-dropdown" onchange="updateRole(${user.UserId}, this.value)" style="margin-right: 10px;">
                            <option value="Viewer" ${user.Role === 'Viewer' ? 'selected' : ''}>Viewer</option>
                            <option value="Editor" ${user.Role === 'Editor' ? 'selected' : ''}>Editor</option>
                            <option value="Owner" ${user.Role === 'Owner' ? 'selected' : ''}>Owner</option>
                        </select>
                    ` : `<span class="role-badge" style="margin-right: 10px; padding: 4px 12px; background: #e5e7eb; border-radius: 12px; font-size: 0.85em;">${user.Role}</span>`}
                    ${canRemove ? `
                        <button class="remove-btn" onclick="removeCollaborator(this, ${user.UserId}, '${user.FullName}')">Remove</button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

async function updateRole(userId, newRole) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(
            `http://localhost:3000/api/dashboards/${currentDashboardId}/users/${userId}/role`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            }
        );
        
        if (response.ok) {
            alert('Role updated successfully');
            await loadCollaborators();
        } else {
            const error = await response.json();
            alert(`Failed to update role: ${error.error || 'Unknown error'}`);
            await loadCollaborators(); // Reload to reset dropdown
        }
    } catch (error) {
        console.error('Error updating role:', error);
        alert('Error updating role');
        await loadCollaborators();
    }
}

function updateUIBasedOnRole() {
    const addPeopleBtn = document.querySelector('.add-people-btn');
    const selectAllCheckbox = document.getElementById('selectAll');
    
    // Only Owners can add people
    if (currentUserRole !== 'Owner') {
        addPeopleBtn.style.display = 'none';
    }
    
    // Viewers can't select
    if (currentUserRole === 'Viewer') {
        selectAllCheckbox.disabled = true;
    }
}

function goBack() {
    window.location.href = `/kanban?dashboardId=${currentDashboardId}`;
}

function openSettings() {
    window.location.href = '../analytics/analytics.html';
}

function addPeople() {
    window.location.href = `../collaborators/addpeople.html?dashboardId=${currentDashboardId}`;
}

async function removeCollaborator(button, userId, userName) {
    if (!confirm(`Are you sure you want to remove ${userName}?`)) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(
            `http://localhost:3000/api/dashboards/${currentDashboardId}/users/${userId}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        
        if (response.ok) {
            const item = button.closest('.collaborator-item');
            item.style.opacity = '0';
            item.style.transform = 'translateX(20px)';
            item.style.transition = 'all 0.3s ease';
            
            setTimeout(async () => {
                await loadCollaborators();
                updateSelectAllState();
            }, 300);
        } else {
            const error = await response.json();
            alert(`Failed to remove user: ${error.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error removing collaborator:', error);
        alert('Error removing collaborator');
    }
}

function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.collaborator-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
    });
}

function updateSelectAllState() {
    const selectAll = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.collaborator-checkbox');
    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    
    selectAll.checked = checkboxes.length > 0 && checkedCount === checkboxes.length;
    selectAll.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.collaborator-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectAllState);
    });
});

function searchCollaborators(query) {
    const items = document.querySelectorAll('.collaborator-item');
    const searchTerm = query.toLowerCase();
    
    items.forEach(item => {
        const name = item.getAttribute('data-name');
        
        if (name && name.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}