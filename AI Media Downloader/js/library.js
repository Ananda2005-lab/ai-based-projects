/* ==========================================================================
   AURA Media Library Manager (library.js)
   Renders Downloaded Content, History, and Favorites
   ========================================================================== */

class LibraryModule {
    constructor() {
        this.grid = document.getElementById('library-results-grid');
        this.title = document.getElementById('library-section-title');
        this.activeTab = 'music'; // 'music', 'videos', 'favorites', 'history'
        
        this.init();
    }

    init() {
        const tabs = document.querySelectorAll('.lib-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.switchLibTab(tab.getAttribute('data-lib'));
            });
        });

        // Event for download status updates
        setInterval(() => {
            if (window.AURA.state.activeView === 'library' && (this.activeTab === 'music' || this.activeTab === 'videos')) {
                this.renderActiveDownloads();
            }
        }, 1500);
    }

    async switchLibTab(tabName) {
        this.activeTab = tabName;
        this.renderAll();
    }

    async renderAll() {
        if (!this.grid) return;
        this.grid.innerHTML = '';
        
        const titles = {
            'music': 'Downloaded Music',
            'videos': 'Downloaded Videos',
            'favorites': 'My Favorites',
            'history': 'Listening History'
        };
        if (this.title) this.title.textContent = titles[this.activeTab];

        if (this.activeTab === 'favorites') {
            this.renderFavorites();
        } else if (this.activeTab === 'history') {
            this.renderHistory();
        } else {
            this.renderActiveDownloads();
        }
    }

    async renderFavorites() {
        const list = window.AURA.state.favorites || [];
        if (list.length === 0) {
            this.showEmpty('No favorites yet. Click the heart icon on any track!');
            return;
        }
        
        this.grid.innerHTML = '';
        list.forEach(item => {
            this.grid.appendChild(window.AURA.createMediaCard(item));
        });
    }

    async renderHistory() {
        const list = await window.AURA.apiFetch('/api/history');
        if (!list || list.length === 0) {
            this.showEmpty('History is empty. Play some tracks!');
            return;
        }
        
        this.grid.innerHTML = '';
        list.forEach(item => {
            const mappedItem = {
                id: item.track_id,
                title: item.title,
                artist: item.artist,
                duration: item.duration,
                media_type: item.media_type,
                thumbnail: item.thumbnail,
                stream_url: item.stream_url || ""
            };
            this.grid.appendChild(window.AURA.createMediaCard(mappedItem));
        });
    }

    async renderActiveDownloads() {
        const list = await window.AURA.apiFetch('/api/downloads');
        if (!list) return;
        
        const type = this.activeTab === 'music' ? 'music' : 'video';
        const filtered = list.filter(d => d.file_type === type);
        
        if (filtered.length === 0) {
            this.showEmpty(`No downloaded ${type} found.`);
            return;
        }
        
        // Retain scroll position while re-rendering live updates
        const activeIds = new Set(filtered.map(f => f.id));
        
        // Remove old nodes
        Array.from(this.grid.children).forEach(child => {
            if (!activeIds.has(child.dataset.dlid)) {
                child.remove();
            }
        });
        
        filtered.forEach(item => {
            let card = this.grid.querySelector(`.dl-card[data-dlid="${item.id}"]`);
            if (!card) {
                card = document.createElement('div');
                card.className = 'dl-card';
                card.dataset.dlid = item.id;
                this.grid.appendChild(card);
            }
            
            const isCompleted = item.status === 'completed';
            const statusColor = item.status === 'failed' ? '#ff3366' : 
                              item.status === 'downloading' ? 'var(--accent-blue)' :
                              item.status === 'paused' ? '#ffcc00' : '#00cc66';
            
            card.innerHTML = `
                <div class="dl-info">
                    <div class="dl-title">${item.title}</div>
                    <div class="dl-artist">${item.artist}</div>
                    <div class="dl-status" style="color: ${statusColor}">
                        ${item.status.toUpperCase()} ${isCompleted ? '' : '- ' + item.progress + '%'}
                    </div>
                </div>
                ${!isCompleted ? `
                <div class="dl-progress-wrapper">
                    <div class="dl-progress-bar progress-shimmer-bg" style="width: ${item.progress}%"></div>
                </div>
                ` : ''}
                <div class="dl-actions">
                    ${item.status === 'downloading' ? `<button class="dl-btn" onclick="window.AURA.Download.action('${item.id}', 'pause')">Pause</button>` : ''}
                    ${item.status === 'paused' || item.status === 'failed' ? `<button class="dl-btn" onclick="window.AURA.Download.action('${item.id}', 'resume')">Resume</button>` : ''}
                    ${!isCompleted ? `<button class="dl-btn cancel" onclick="window.AURA.Download.action('${item.id}', 'cancel')">Cancel</button>` : ''}
                    ${isCompleted && item.file_path ? `<div style="font-size: 11px; color: var(--text-muted); padding-top:4px;">Saved Locally</div>` : ''}
                </div>
            `;
        });
    }

    showEmpty(msg) {
        this.grid.innerHTML = `
            <div class="empty-state-card" style="grid-column: 1 / -1;">
                <p>${msg}</p>
            </div>
        `;
    }
}

window.AURA.Library = new LibraryModule();

// --- Library CSS ---
const libStyle = document.createElement('style');
libStyle.innerHTML = `
    .library-tabs-navigation {
        display: flex; gap: 20px; border-bottom: 1px solid var(--color-border); margin-bottom: 30px;
    }
    .lib-tab {
        padding: 10px 0; color: var(--text-secondary); cursor: pointer;
        border-bottom: 2px solid transparent; font-weight: 500; transition: var(--transition-smooth);
    }
    .lib-tab:hover { color: #fff; }
    .lib-tab.active { color: var(--accent-blue); border-bottom-color: var(--accent-blue); }
    
    .dl-card {
        background: var(--color-bg-card);
        border: 1px solid var(--color-border);
        border-radius: 12px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    .dl-title { font-weight: 600; font-size: 15px; margin-bottom: 2px; }
    .dl-artist { font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; }
    .dl-status { font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }
    .dl-progress-wrapper { height: 6px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; }
    .dl-progress-bar { height: 100%; border-radius: 4px; background-color: var(--accent-blue); transition: width 0.3s; }
    .dl-actions { display: flex; gap: 8px; margin-top: auto; }
    .dl-btn {
        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
        color: #fff; border-radius: 6px; padding: 6px 12px; font-size: 11px;
        cursor: pointer; transition: var(--transition-smooth); flex: 1;
    }
    .dl-btn:hover { background: rgba(255,255,255,0.1); }
    .dl-btn.cancel:hover { background: rgba(255,51,102,0.2); color: #ff3366; border-color: #ff3366; }
`;
document.head.appendChild(libStyle);
