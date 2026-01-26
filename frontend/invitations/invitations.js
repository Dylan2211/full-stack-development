// Check authentication
requireAuth();

const currentUser = getUserInfoFromToken();

// Load invitations on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadInvitations();
});

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
        alert('Failed to load invitations');
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
                <a href="/dashboard" class="back-link">Back to Dashboards</a>
            </div>
        `;
        return;
    }
    
    invitationsList.innerHTML = invitations.map(invite => {
        const isExpired = new Date(invite.ExpiresAt) < new Date();
        const createdDate = new Date(invite.CreatedAt).toLocaleDateString();
        const expiresDate = new Date(invite.ExpiresAt).toLocaleDateString();
        
        return `
            <div class="invitation-card">
                <div class="invitation-info">
                    <div class="invitation-dashboard">📊 ${invite.DashboardName}</div>
                    <div class="invitation-details">
                        Invited by <strong>${invite.InvitedByName}</strong>
                    </div>
                    ${invite.Description ? `<div class="invitation-details">${invite.Description}</div>` : ''}
                    <div class="invitation-details">
                        Invited on ${createdDate} • Expires ${expiresDate}
                    </div>
                    <span class="invitation-role">${invite.Role}</span>
                    ${isExpired ? '<span class="expired-badge">Expired</span>' : ''}
                </div>
                <div class="invitation-actions">
                    ${!isExpired ? `
                        <button class="btn btn-accept" onclick="acceptInvitation('${invite.Token}')">
                            Accept
                        </button>
                        <button class="btn btn-decline" onclick="declineInvitation('${invite.Token}')">
                            Decline
                        </button>
                    ` : `
                        <button class="btn" disabled style="opacity: 0.5; cursor: not-allowed;">
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
async function acceptInvitation(token) {
    try {
        const response = await authFetch(`/api/dashboards/invitations/${token}/accept`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error('Failed to accept invitation');
        }
        
        alert('Invitation accepted! Redirecting to dashboard...');
        // Reload invitations list
        await loadInvitations();
        // Redirect to dashboards
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 1000);
    } catch (error) {
        console.error('Error accepting invitation:', error);
        alert('Failed to accept invitation: ' + error.message);
    }
}

/**
 * Decline an invitation
 */
async function declineInvitation(token) {
    const confirmed = confirm('Are you sure you want to decline this invitation?');
    if (!confirmed) return;
    
    try {
        const response = await authFetch(`/api/dashboards/invitations/${token}/decline`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error('Failed to decline invitation');
        }
        
        alert('Invitation declined');
        await loadInvitations();
    } catch (error) {
        console.error('Error declining invitation:', error);
        alert('Failed to decline invitation');
    }
}
