/* ==========================================================================
   AURA Main Client Orchestrator (app.js)
   SPA Routing, Global State Management, & Immersive Particle Backdrop
   ========================================================================== */

// --- Global Application State ---
window.AURA = {
    state: {
        activeView: 'home',
        currentTrack: null,
        isPlaying: false,
        volume: 80,
        queue: [],
        favorites: [],
        downloads: [],
        history: [],
        settings: {
            theme: 'obsidian',
            particleSpeed: 50,
            quality: '320',
            maxDownloads: 3
        }
    },
    
    // Core Modules (Assigned during their module instantiation)
    Player: null,
    Search: null,
    Queue: null,
    Library: null,
    Download: null,
    Settings: null,

    // --- Core API Networking Utilities ---
    async apiFetch(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (e) {
            console.error(`[API] GET Failure: ${url}`, e);
            return null;
        }
    },

    async apiPost(url, payload = {}) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (e) {
            console.error(`[API] POST Failure: ${url}`, e);
            return null;
        }
    },

    // --- Cinematic SPA Router View Controller ---
    switchView(viewId) {
        if (this.state.activeView === viewId) return;
        
        console.log(`[Router] Navigating: ${this.state.activeView} -> ${viewId}`);
        this.state.activeView = viewId;

        // Toggle active view panels in DOM
        const panels = document.querySelectorAll('.view-panel');
        panels.forEach(panel => {
            panel.classList.remove('active');
            if (panel.id === `view-${viewId}`) {
                panel.classList.add('active');
            }
        });

        // Toggle Navigation highlight selections
        const navItems = document.querySelectorAll('.nav-item, .mobile-nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-target') === viewId) {
                item.classList.add('active');
            }
        });

        // Trigger individual view render updates
        if (viewId === 'library' && this.Library) this.Library.renderAll();
        if (viewId === 'queue' && this.Queue) this.Queue.renderQueue();
        if (viewId === 'home') this.loadHomeData();
    },

    // Load trending scorecards on Home view startup
    async loadHomeData() {
        const featured = await this.apiFetch('/api/search?q=');
        if (!featured) return;
        
        // Populate Featured grid
        const featuredGrid = document.getElementById('home-featured-grid');
        if (featuredGrid) {
            featuredGrid.innerHTML = '';
            featured.slice(0, 4).forEach(item => {
                featuredGrid.appendChild(this.createMediaCard(item));
            });
        }

        // Populate Recent grid (Listening History)
        const recentHistory = await this.apiFetch('/api/history');
        const recentGrid = document.getElementById('home-recent-grid');
        if (recentGrid) {
            recentGrid.innerHTML = '';
            if (recentHistory && recentHistory.length > 0) {
                recentHistory.slice(0, 4).forEach(item => {
                    // Adapt fields
                    const mediaItem = {
                        id: item.track_id,
                        title: item.title,
                        artist: item.artist,
                        duration: item.duration,
                        media_type: item.media_type,
                        thumbnail: item.thumbnail,
                        // If it is in our main database, we can find its stream_url later
                        stream_url: item.stream_url || ""
                    };
                    recentGrid.appendChild(this.createMediaCard(mediaItem));
                });
            } else {
                // If history is empty, show general favorites or popular items
                featured.slice(4, 8).forEach(item => {
                    recentGrid.appendChild(this.createMediaCard(item));
                });
            }
        }
    },

    // --- Common Dynamic Card Component Creator ---
    createMediaCard(item) {
        const card = document.createElement('div');
        card.className = 'media-card card-expand-anim';
        
        const isFav = this.state.favorites.some(f => f.id === item.id);
        
        card.innerHTML = `
            <div class="card-art-container">
                <img src="${item.thumbnail}" alt="${item.title}" class="card-art" loading="lazy">
                <span class="media-badge ${item.media_type}">${item.media_type}</span>
                <div class="card-play-overlay">
                    <button class="card-play-btn" title="Stream Preview">
                        <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </button>
                </div>
            </div>
            <h3 class="card-title">${item.title}</h3>
            <p class="card-artist">${item.artist}</p>
            <div class="card-actions">
                <span class="card-duration">${item.duration}</span>
                <div class="card-action-btns">
                    <button class="card-icon-btn queue-add-btn" title="Add to Queue">
                        <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                    <button class="card-icon-btn fav-btn ${isFav ? 'active' : ''}" title="Favorite Track">
                        <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    </button>
                    <button class="card-icon-btn download-direct-btn" title="Download to PC">
                        <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </button>
                </div>
            </div>
        `;

        // BIND EVENT HANDLERS
        // 1. Play track
        card.querySelector('.card-play-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.Player) this.Player.loadAndPlay(item);
        });

        card.addEventListener('click', () => {
            if (this.Player) this.Player.loadAndPlay(item);
        });

        // 2. Add to collection queue
        card.querySelector('.queue-add-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.Queue) this.Queue.addToQueue(item);
        });

        // 3. Toggle favorite
        const favBtn = card.querySelector('.fav-btn');
        favBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const action = favBtn.classList.contains('active') ? 'remove' : 'add';
            
            const payload = {
                action: action,
                track_id: item.id,
                title: item.title,
                artist: item.artist,
                duration: item.duration,
                media_type: item.media_type,
                thumbnail: item.thumbnail,
                stream_url: item.stream_url
            };
            
            const res = await this.apiPost('/api/favorites', payload);
            if (res && res.success) {
                favBtn.classList.toggle('active');
                // Refresh favorites state cache
                this.state.favorites = await this.apiFetch('/api/favorites') || [];
                if (this.Library) this.Library.renderFavorites();
            }
        });

        // 4. Download directly
        card.querySelector('.download-direct-btn').addEventListener('click', async (e) => {
            e.stopPropagation();
            const payload = {
                media_id: item.id,
                title: item.title,
                artist: item.artist,
                url: item.stream_url,
                file_type: item.media_type
            };
            const res = await this.apiPost('/api/downloads', payload);
            if (res && res.success) {
                alert(`Added "${item.title}" to Parallel Downloader.`);
                this.switchView('library');
                if (this.Library) this.Library.switchLibTab('music');
            }
        });

        return card;
    }
};

// --- Immersive Backdrop Particle System ---
function initAmbientCanvasParticles() {
    const canvas = document.getElementById('ambient-particles-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let particles = [];
    
    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2.5 + 0.5;
            this.speedX = Math.random() * 0.4 - 0.2;
            this.speedY = Math.random() * 0.4 - 0.2;
            this.color = Math.random() > 0.5 ? 'rgba(0, 229, 255, 0.4)' : 'rgba(112, 0, 255, 0.3)';
        }

        update(speedModifier) {
            this.x += this.speedX * (speedModifier / 50);
            this.y += this.speedY * (speedModifier / 50);

            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Populate particles
    for (let i = 0; i < 40; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const speed = window.AURA.state.settings.particleSpeed || 50;
        
        particles.forEach(p => {
            p.update(speed);
            p.draw();
        });
        
        requestAnimationFrame(animate);
    }
    animate();
}

// --- Initialize Shell Event Listeners ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Sync cache states from database APIs
    window.AURA.state.favorites = await window.AURA.apiFetch('/api/favorites') || [];
    window.AURA.state.settings = await window.AURA.apiFetch('/api/settings') || window.AURA.state.settings;

    // 2. Bind Navigation click triggers
    const navItems = document.querySelectorAll('.nav-item, .mobile-nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');
            window.AURA.switchView(target);
        });
    });

    // 3. Initialize background particles
    initAmbientCanvasParticles();

    // 4. Load initial home trending grids
    window.AURA.loadHomeData();

    // Bind Home Page Hero Button Event
    const heroBtn = document.getElementById('hero-action-play');
    if (heroBtn) {
        heroBtn.addEventListener('click', async () => {
            const list = await window.AURA.apiFetch('/api/search?q=Neon Horizon');
            if (list && list.length > 0 && window.AURA.Player) {
                window.AURA.Player.loadAndPlay(list[0]);
            }
        });
    }
});
