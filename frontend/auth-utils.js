
function getAuthToken() {
  return localStorage.getItem('authToken');
}

function setAuthToken(token) {
  localStorage.setItem('authToken', token);
}

function clearAuthToken() {
  localStorage.removeItem('authToken');
}

function isLoggedIn() {
  return !!getAuthToken();
}

function requireAuth(redirectUrl = '/login/login.html') {
  if (!isLoggedIn()) {
    window.location.href = redirectUrl;
  }
}

function logout(redirectUrl = '/login/login.html') {
  clearAuthToken();
  window.location.href = redirectUrl;
}

function getUserInfoFromToken() {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const json = atob(b64);
    const payload = JSON.parse(json);
    return payload;
  } catch {
    return null;
  }
}

async function authFetch(url, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAuthToken();
    window.location.href = '/login/login.html';
    throw new Error('Authentication failed');
  }

  return response;
}
