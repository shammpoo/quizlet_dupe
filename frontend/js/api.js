const API_BASE = '/api';

function getToken() {
    return localStorage.getItem('access_token');
}

function getRefreshToken() {
    return localStorage.getItem('refresh_token');
}

function setTokens(access, refresh) {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
}

function clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
}

function isLoggedIn() {
    return !!getToken();
}

function logout() {
    clearTokens();
    window.location.href = '/';
}

function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = '/';
        return false;
    }
    return true;
}

async function api(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = options.headers || {};

    if (getToken() && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${getToken()}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 && getRefreshToken()) {
        const refreshed = await tryRefresh();
        if (refreshed) {
            headers['Authorization'] = `Bearer ${getToken()}`;
            return fetch(url, { ...options, headers });
        } else {
            logout();
            throw new Error('Session expired');
        }
    }

    return response;
}

async function tryRefresh() {
    try {
        const resp = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: getRefreshToken() }),
        });
        if (resp.ok) {
            const data = await resp.json();
            setTokens(data.access_token, data.refresh_token);
            return true;
        }
    } catch { /* ignore */ }
    return false;
}

/* Toast notifications */
function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showLoading(message = 'Loading...') {
    let overlay = document.querySelector('.loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = `<div class="spinner"></div><p>${message}</p>`;
    overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) overlay.style.display = 'none';
}
