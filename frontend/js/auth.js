document.addEventListener('DOMContentLoaded', () => {
    if (isLoggedIn()) {
        window.location.href = '/frontend/dashboard.html';
        return;
    }

    const tabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const errorEl = document.getElementById('auth-error');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            errorEl.style.display = 'none';

            if (tab.dataset.tab === 'login') {
                loginForm.classList.add('active');
                registerForm.classList.remove('active');
            } else {
                registerForm.classList.add('active');
                loginForm.classList.remove('active');
            }
        });
    });

    function showError(msg) {
        errorEl.textContent = msg;
        errorEl.style.display = 'block';
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = loginForm.querySelector('button');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span>';

        try {
            const resp = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: document.getElementById('login-username').value,
                    password: document.getElementById('login-password').value,
                }),
            });

            const data = await resp.json();
            if (!resp.ok) {
                showError(data.detail || 'Login failed');
                return;
            }

            setTokens(data.access_token, data.refresh_token);
            window.location.href = '/frontend/dashboard.html';
        } catch {
            showError('Network error. Please try again.');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Log In';
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = registerForm.querySelector('button');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span>';

        try {
            const resp = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: document.getElementById('reg-email').value,
                    username: document.getElementById('reg-username').value,
                    password: document.getElementById('reg-password').value,
                }),
            });

            const data = await resp.json();
            if (!resp.ok) {
                showError(data.detail || 'Registration failed');
                return;
            }

            setTokens(data.access_token, data.refresh_token);
            window.location.href = '/frontend/dashboard.html';
        } catch {
            showError('Network error. Please try again.');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Create Account';
        }
    });
});
