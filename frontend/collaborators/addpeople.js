let selectedUsers = [];

function closeModal() {
    if (window.opener) {
        window.close();
    } else {
        window.location.href = 'collaborators.html';
    }
}

function selectUser(name, email, avatar, buttonElement) {
    const userExists = selectedUsers.find(user => user.email === email);
    
    if (userExists) {
        alert('This user has already been added!');
        return;
    }
    
    selectedUsers.push({ name, email, avatar });
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

function sendInvites() {
    if (selectedUsers.length === 0) {
        alert('Please select at least one person to invite.');
        return;
    }
    
    const role = document.getElementById('roleSelect').value;
    const permissions = {
        canEdit: document.getElementById('canEdit').checked,
        canDelete: document.getElementById('canDelete').checked,
        canInvite: document.getElementById('canInvite').checked
    };
    
    console.log('Sending invites to:', selectedUsers);
    console.log('Role:', role);
    console.log('Permissions:', permissions);
    
    const names = selectedUsers.map(user => user.name).join(', ');
    alert(`Invitations sent successfully to: ${names}`);
    
    if (window.opener) {
        window.opener.postMessage({
            type: 'collaboratorsAdded',
            users: selectedUsers,
            role: role,
            permissions: permissions
        }, '*');
    }
    
    selectedUsers = [];
    closeModal();
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