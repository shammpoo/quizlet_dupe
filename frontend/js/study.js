let allCards = [];
let filteredCards = [];
let currentIndex = 0;
let cardStatus = {}; // cardId -> 'known' | 'learning' | undefined
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;
    loadUser();

    const params = new URLSearchParams(window.location.search);
    const setId = params.get('id');
    if (!setId) {
        window.location.href = '/frontend/dashboard.html';
        return;
    }

    document.getElementById('edit-link').href = `/frontend/create.html?edit=${setId}`;
    document.getElementById('logout-btn').addEventListener('click', logout);

    loadSet(setId);
    setupControls();
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

async function loadSet(id) {
    try {
        const resp = await api(`/sets/${id}`);
        if (!resp.ok) throw new Error();
        const set = await resp.json();

        document.getElementById('set-title').textContent = set.title;
        document.getElementById('set-desc').textContent = set.description || '';
        document.title = `${set.title} - FlashStudy`;

        allCards = set.cards;
        applyFilter();
    } catch {
        showToast('Failed to load set', 'error');
    }
}

function applyFilter() {
    if (currentFilter === 'all') {
        filteredCards = [...allCards];
    } else if (currentFilter === 'known') {
        filteredCards = allCards.filter(c => cardStatus[c.id] === 'known');
    } else {
        filteredCards = allCards.filter(c => cardStatus[c.id] === 'learning');
    }

    currentIndex = 0;
    showCard();
}

function showCard() {
    const flashcard = document.getElementById('flashcard');
    const completeMsg = document.getElementById('complete-msg');

    flashcard.classList.remove('flipped');

    if (filteredCards.length === 0) {
        flashcard.parentElement.style.display = 'none';
        document.getElementById('progress').textContent = '';
        completeMsg.style.display = 'block';
        return;
    }

    flashcard.parentElement.style.display = 'block';
    completeMsg.style.display = 'none';

    if (currentIndex >= filteredCards.length) currentIndex = 0;
    if (currentIndex < 0) currentIndex = filteredCards.length - 1;

    const card = filteredCards[currentIndex];
    document.getElementById('card-front').textContent = card.front;
    document.getElementById('card-back').textContent = card.back;

    document.getElementById('progress').textContent =
        `Card ${currentIndex + 1} of ${filteredCards.length}`;

    updateMarkButtons();
}

function updateMarkButtons() {
    if (filteredCards.length === 0) return;
    const card = filteredCards[currentIndex];
    const status = cardStatus[card.id];

    const learnBtn = document.getElementById('mark-learning');
    const knownBtn = document.getElementById('mark-known');

    learnBtn.style.background = status === 'learning' ? 'var(--danger)' : 'transparent';
    learnBtn.style.color = status === 'learning' ? 'white' : 'var(--danger)';

    knownBtn.style.background = status === 'known' ? 'var(--success)' : 'transparent';
    knownBtn.style.color = status === 'known' ? 'white' : 'var(--success)';
}

function setupControls() {
    const flashcard = document.getElementById('flashcard');

    flashcard.addEventListener('click', () => {
        flashcard.classList.toggle('flipped');
    });

    document.getElementById('prev-btn').addEventListener('click', () => {
        currentIndex--;
        showCard();
    });

    document.getElementById('next-btn').addEventListener('click', () => {
        currentIndex++;
        showCard();
    });

    document.getElementById('shuffle-btn').addEventListener('click', () => {
        for (let i = filteredCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [filteredCards[i], filteredCards[j]] = [filteredCards[j], filteredCards[i]];
        }
        currentIndex = 0;
        showCard();
        showToast('Cards shuffled!');
    });

    document.getElementById('mark-known').addEventListener('click', () => {
        if (filteredCards.length === 0) return;
        const card = filteredCards[currentIndex];
        cardStatus[card.id] = cardStatus[card.id] === 'known' ? undefined : 'known';
        updateMarkButtons();
    });

    document.getElementById('mark-learning').addEventListener('click', () => {
        if (filteredCards.length === 0) return;
        const card = filteredCards[currentIndex];
        cardStatus[card.id] = cardStatus[card.id] === 'learning' ? undefined : 'learning';
        updateMarkButtons();
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            applyFilter();
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.key) {
            case 'ArrowLeft':
                currentIndex--;
                showCard();
                break;
            case 'ArrowRight':
                currentIndex++;
                showCard();
                break;
            case ' ':
            case 'ArrowUp':
            case 'ArrowDown':
                e.preventDefault();
                flashcard.classList.toggle('flipped');
                break;
        }
    });
}
