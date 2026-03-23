let cards = [];
let editSetId = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;
    loadUser();

    document.getElementById('logout-btn').addEventListener('click', logout);

    const params = new URLSearchParams(window.location.search);
    editSetId = params.get('edit');
    if (editSetId) {
        document.getElementById('page-title').textContent = 'Edit Set';
        loadExistingSet(editSetId);
    }

    setupGeneration();
    setupFileUpload();

    document.getElementById('add-card-btn').addEventListener('click', () => {
        cards.push({ front: '', back: '' });
        renderCards();
    });

    document.getElementById('save-btn').addEventListener('click', saveSet);
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

async function loadExistingSet(id) {
    try {
        const resp = await api(`/sets/${id}`);
        if (!resp.ok) throw new Error();
        const set = await resp.json();
        document.getElementById('set-title').value = set.title;
        document.getElementById('set-desc').value = set.description || '';
        cards = set.cards.map(c => ({ front: c.front, back: c.back }));
        renderCards();
        document.getElementById('cards-preview').style.display = 'block';
    } catch {
        showToast('Failed to load set', 'error');
    }
}

function setupGeneration() {
    document.getElementById('generate-text-btn').addEventListener('click', async () => {
        const text = document.getElementById('text-input').value.trim();
        if (!text) {
            showToast('Please paste some text first', 'error');
            return;
        }

        const numCards = parseInt(document.getElementById('num-cards').value) || 10;
        const btn = document.getElementById('generate-text-btn');
        btn.disabled = true;
        showLoading('Generating flashcards with AI...');

        try {
            const resp = await api('/generate/text', {
                method: 'POST',
                body: JSON.stringify({ text, num_cards: numCards }),
            });

            const data = await resp.json();
            if (!resp.ok) {
                showToast(data.detail || 'Generation failed', 'error');
                return;
            }

            cards = data.cards.map(c => ({ front: c.front, back: c.back }));
            renderCards();
            document.getElementById('cards-preview').style.display = 'block';
            document.getElementById('cards-preview').scrollIntoView({ behavior: 'smooth' });
            showToast(`Generated ${cards.length} flashcards!`);
        } catch {
            showToast('Failed to generate. Please try again.', 'error');
        } finally {
            btn.disabled = false;
            hideLoading();
        }
    });
}

function setupFileUpload() {
    const dropZone = document.getElementById('file-drop');
    const fileInput = document.getElementById('file-input');
    const fileNameEl = document.getElementById('file-name');
    const fileBtn = document.getElementById('generate-file-btn');
    let selectedFile = null;

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            selectedFile = e.dataTransfer.files[0];
            fileNameEl.textContent = `Selected: ${selectedFile.name}`;
            fileBtn.style.display = 'inline-flex';
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            selectedFile = fileInput.files[0];
            fileNameEl.textContent = `Selected: ${selectedFile.name}`;
            fileBtn.style.display = 'inline-flex';
        }
    });

    fileBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        const numCards = parseInt(document.getElementById('num-cards').value) || 10;
        fileBtn.disabled = true;
        showLoading('Uploading file and generating flashcards...');

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('num_cards', numCards.toString());

            const resp = await api('/generate/file', {
                method: 'POST',
                body: formData,
            });

            const data = await resp.json();
            if (!resp.ok) {
                showToast(data.detail || 'Generation failed', 'error');
                return;
            }

            cards = data.cards.map(c => ({ front: c.front, back: c.back }));
            renderCards();
            document.getElementById('cards-preview').style.display = 'block';
            document.getElementById('cards-preview').scrollIntoView({ behavior: 'smooth' });
            showToast(`Generated ${cards.length} flashcards!`);
        } catch {
            showToast('Failed to generate. Please try again.', 'error');
        } finally {
            fileBtn.disabled = false;
            hideLoading();
        }
    });
}

function renderCards() {
    const list = document.getElementById('cards-list');
    list.innerHTML = cards.map((c, i) => `
        <div class="preview-card" data-index="${i}">
            <div class="card-num">${i + 1}</div>
            <div class="card-fields">
                <input type="text" placeholder="Front (term / question)" value="${escapeAttr(c.front)}" data-field="front" data-index="${i}">
                <input type="text" placeholder="Back (definition / answer)" value="${escapeAttr(c.back)}" data-field="back" data-index="${i}">
            </div>
            <button class="remove-card" data-index="${i}" title="Remove card">&times;</button>
        </div>
    `).join('');

    list.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', (e) => {
            const idx = parseInt(e.target.dataset.index);
            cards[idx][e.target.dataset.field] = e.target.value;
        });
    });

    list.querySelectorAll('.remove-card').forEach(btn => {
        btn.addEventListener('click', () => {
            cards.splice(parseInt(btn.dataset.index), 1);
            renderCards();
        });
    });

    document.getElementById('preview-heading').textContent = `Preview Cards (${cards.length})`;
}

async function saveSet() {
    const title = document.getElementById('set-title').value.trim();
    if (!title) {
        showToast('Please enter a set title', 'error');
        return;
    }

    const validCards = cards.filter(c => c.front.trim() && c.back.trim());
    if (validCards.length === 0) {
        showToast('Add at least one card with both front and back', 'error');
        return;
    }

    const description = document.getElementById('set-desc').value.trim();
    const btn = document.getElementById('save-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Saving...';

    try {
        let resp;
        if (editSetId) {
            await api(`/sets/${editSetId}`, {
                method: 'PUT',
                body: JSON.stringify({ title, description }),
            });
            resp = await api(`/sets/${editSetId}/cards`, {
                method: 'PUT',
                body: JSON.stringify({ cards: validCards }),
            });
        } else {
            resp = await api('/sets/', {
                method: 'POST',
                body: JSON.stringify({ title, description, cards: validCards }),
            });
        }

        if (!resp.ok) {
            const data = await resp.json();
            showToast(data.detail || 'Failed to save', 'error');
            return;
        }

        showToast(editSetId ? 'Set updated!' : 'Set created!');
        const data = await resp.json();
        setTimeout(() => {
            window.location.href = `/frontend/study.html?id=${data.id}`;
        }, 500);
    } catch {
        showToast('Failed to save. Please try again.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save Set';
    }
}

function escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
