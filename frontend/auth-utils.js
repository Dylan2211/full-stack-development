
export function getAuthToken() {
  return localStorage.getItem('authToken');
}

export function setAuthToken(token) {
  localStorage.setItem('authToken', token);
}

export function clearAuthToken() {
  localStorage.removeItem('authToken');
}

export function isLoggedIn() {
  return !!getAuthToken();
}

export function requireAuth(redirectUrl = '/login/login.html') {
  if (!isLoggedIn()) {
    window.location.href = redirectUrl;
  }
}

export function logout(redirectUrl = '/login/login.html') {
  clearAuthToken();
  window.location.href = redirectUrl;
}

export function getUserInfoFromToken() {
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
