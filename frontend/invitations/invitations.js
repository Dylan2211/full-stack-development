// Check authentication
requireAuth();

const currentUser = getUserInfoFromToken();

// Update user initials
if (currentUser && currentUser.email) {
    const initials = currentUser.email.substring(0, 2).toUpperCase();
    const userPills = document.querySelectorAll('.user-initials');
    userPills.forEach(pill => {
        pill.textContent = initials;
    });
}

// Load invitations on page load
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    await loadInvitations();
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logout('/login');
        });
    }
}

/**
 * Load all pending invitations for the current user
 */
async function loadInvitations() {
    try {
        const response = await authFetch('/api/dashboards/invitations/pending');
        
        if (!response.ok) {
            throw new Error('Failed to load invitations');
        }
        
        const invitations = await response.json();
        displayInvitations(invitations);
    } catch (error) {
        console.error('Error loading invitations:', error);
        const invitationsList = document.getElementById('invitationsList');
        invitationsList.innerHTML = `
            <div class="no-invitations">
                <div class="no-invitations-icon">⚠️</div>
                <p>Failed to load invitations</p>
                <p style="font-size: 12px; color: #9ca3af;">Please try refreshing the page.</p>
            </div>
        `;
    }
}

/**
 * Display invitations in the UI
 */
function displayInvitations(invitations) {
    const invitationsList = document.getElementById('invitationsList');
    
    if (!invitations || invitations.length === 0) {
        invitationsList.innerHTML = `
            <div class="no-invitations">
                <div class="no-invitations-icon">📬</div>
                <p>No pending invitations</p>
                <p style="font-size: 14px; color: #9ca3af; margin: 0 0 20px 0;">You don't have any pending dashboard invitations at the moment.</p>
                <a href="/dashboard" class="back-link">← Back to Dashboards</a>
            </div>
        `;
        return;
    }
    
    invitationsList.innerHTML = invitations.map(invite => {
        const isExpired = new Date(invite.ExpiresAt) < new Date();
        const createdDate = new Date(invite.CreatedAt).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: new Date(invite.CreatedAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
        const expiresDate = new Date(invite.ExpiresAt).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: new Date(invite.ExpiresAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
        
        return `
            <div class="invitation-card">
                <div class="invitation-info">
                    <div class="invitation-dashboard">
                        <span class="dashboard-icon">📊</span>
                        ${escapeHtml(invite.DashboardName)}
                    </div>
                    <div class="invitation-details">
                        <strong>Invited by:</strong> ${escapeHtml(invite.InvitedByName)}
                    </div>
                    ${invite.Description ? `<div class="invitation-details"><strong>Description:</strong> ${escapeHtml(invite.Description)}</div>` : ''}
                    <div class="invitation-meta">
                        <span class="invitation-role">${escapeHtml(invite.Role)}</span>
                        ${isExpired ? '<span class="expired-badge">Expired</span>' : ''}
                    </div>
                    <div class="invitation-details" style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
                        Invited on ${createdDate} • Expires ${expiresDate}
                    </div>
                </div>
                <div class="invitation-actions">
                    ${!isExpired ? `
                        <button class="btn btn-accept" onclick="acceptInvitation(${invite.InvitationId}, this)">
                            Accept
                        </button>
                        <button class="btn btn-decline" onclick="declineInvitation(${invite.InvitationId}, this)">
                            Decline
                        </button>
                    ` : `
                        <button class="btn" disabled>
                            Expired
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Accept an invitation
 */
async function acceptInvitation(invitationId, button) {
    button.disabled = true;
    button.textContent = 'Accepting...';
    
    try {
        const response = await authFetch(`/api/dashboards/invitations/${invitationId}/accept`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to accept invitation');
        }
        
        button.textContent = '✓ Accepted';
        button.style.backgroundColor = '#10b981';
        
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 1500);
    } catch (error) {
        console.error('Error accepting invitation:', error);
        button.disabled = false;
        button.textContent = 'Accept';
        alert('Failed to accept invitation: ' + error.message);
    }
}

/**
 * Decline an invitation
 */
async function declineInvitation(invitationId, button) {
    if (!confirm('Are you sure you want to decline this invitation? This action cannot be undone.')) {
        return;
    }
    
    button.disabled = true;
    button.textContent = 'Declining...';
    
    try {
        const response = await authFetch(`/api/dashboards/invitations/${invitationId}/decline`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to decline invitation');
        }
        
        button.textContent = '✓ Declined';
        button.style.backgroundColor = '#ef4444';
        
        setTimeout(() => {
            loadInvitations();
        }, 800);
    } catch (error) {
        console.error('Error declining invitation:', error);
        button.disabled = false;
        button.textContent = 'Decline';
        alert('Failed to decline invitation: ' + error.message);
    }
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
