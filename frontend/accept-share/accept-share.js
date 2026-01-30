requireAuth();

function getTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}

async function acceptShareToken() {
  const statusMessage = document.getElementById("statusMessage");
  const actions = document.getElementById("actions");
  const retryBtn = document.getElementById("retryBtn");

  const token = getTokenFromUrl();
  if (!token) {
    statusMessage.textContent = "Share token not found in the URL.";
    actions.style.display = "flex";
    return;
  }

  if (retryBtn) {
    retryBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.reload();
    });
  }

  try {
    const response = await authFetch("/api/dashboards/share-tokens/accept", {
      method: "POST",
      body: JSON.stringify({ token })
    });

    if (!response.ok) {
      const error = await response.json();
      statusMessage.textContent = error?.error || "Failed to accept share token.";
      actions.style.display = "flex";
      return;
    }

    const result = await response.json();
    statusMessage.textContent = "Access granted. Redirecting to your dashboard...";

    const dashboardId = result.DashboardId;
    if (dashboardId) {
      setTimeout(() => {
        window.location.href = `/kanban?id=${dashboardId}`;
      }, 1200);
    } else {
      actions.style.display = "flex";
    }
  } catch (error) {
    console.error("Error accepting share token:", error);
    statusMessage.textContent = "Unexpected error. Please try again.";
    actions.style.display = "flex";
  }
}

acceptShareToken();
