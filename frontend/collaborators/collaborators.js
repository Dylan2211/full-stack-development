function goBack() {
    window.location.href = '../kanban/kanban.html';
}

function openSettings() {
    window.location.href = '../analytics/analytics.html';
}

function addPeople() {
    window.location.href = '../collaborators/addpeople.html';
}

function removeCollaborator(button) {
    const item = button.closest('.collaborator-item');
    const name = item.querySelector('.collaborator-name').textContent;
    
    if (confirm(`Are you sure you want to remove ${name}?`)) {
        item.style.opacity = '0';
        item.style.transform = 'translateX(20px)';
        item.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            item.remove();
            updateSelectAllState();
        }, 300);
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
        const name = item.getAttribute('data-name').toLowerCase();
        
        if (name.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}