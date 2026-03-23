document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;

    loadUser();
    loadSets();

    document.getElementById('logout-btn').addEventListener('click', logout);
});

async function loadUser() {
    try {
        const resp = await api('/auth/me');
        if (resp.ok) {
            const user = await resp.json();
            document.getElementById('nav-user').textContent = user.username;
        }
    } catch { /* ignore */ }
}

async function loadSets() {
    const grid = document.getElementById('sets-grid');
    const empty = document.getElementById('empty-state');

    try {
        const resp = await api('/sets/');
        if (!resp.ok) throw new Error();
        const sets = await resp.json();

        if (sets.length === 0) {
            empty.style.display = 'block';
            grid.style.display = 'none';
            return;
        }

        empty.style.display = 'none';
        grid.style.display = 'grid';
        grid.innerHTML = sets.map(s => `
            <div class="card set-card" data-id="${s.id}">
                <h3>${escapeHtml(s.title)}</h3>
                <p class="set-description">${escapeHtml(s.description || 'No description')}</p>
                <div class="set-meta">
                    <span>${s.card_count} card${s.card_count !== 1 ? 's' : ''}</span>
                    <span>${formatDate(s.updated_at)}</span>
                </div>
                <div class="set-actions">
                    <a href="/frontend/study.html?id=${s.id}" class="btn btn-primary btn-sm" onclick="event.stopPropagation()">Study</a>
                    <a href="/frontend/create.html?edit=${s.id}" class="btn btn-outline btn-sm" onclick="event.stopPropagation()">Edit</a>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${s.id}" onclick="event.stopPropagation()">Delete</button>
                </div>
            </div>
        `).join('');

        grid.querySelectorAll('.set-card').forEach(card => {
            card.addEventListener('click', () => {
                window.location.href = `/frontend/study.html?id=${card.dataset.id}`;
            });
        });

        grid.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Delete this flashcard set?')) return;
                const id = btn.dataset.id;
                const resp = await api(`/sets/${id}`, { method: 'DELETE' });
                if (resp.ok || resp.status === 204) {
                    showToast('Set deleted');
                    loadSets();
                } else {
                    showToast('Failed to delete', 'error');
                }
            });
        });

    } catch {
        showToast('Failed to load sets', 'error');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });
}
