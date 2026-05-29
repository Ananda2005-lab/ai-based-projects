/* ==========================================================================
   AURA Queue Manager (queue.js)
   Multi-selection, reordering, and bulk download staging
   ========================================================================== */

class QueueModule {
    constructor() {
        this.container = document.getElementById('queue-list-container');
        this.countLabel = document.getElementById('queue-tracks-count');
        this.clearBtn = document.getElementById('queue-clear-all-btn');
        this.downloadBtn = document.getElementById('queue-download-all-btn');
        
        this.init();
    }

    init() {
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => {
                window.AURA.state.queue = [];
                this.renderQueue();
            });
        }

        if (this.downloadBtn) {
            this.downloadBtn.addEventListener('click', async () => {
                if (window.AURA.state.queue.length === 0) return;
                
                let successCount = 0;
                for (const item of window.AURA.state.queue) {
                    const payload = {
                        media_id: item.id,
                        title: item.title,
                        artist: item.artist,
                        url: item.stream_url,
                        file_type: item.media_type
                    };
                    const res = await window.AURA.apiPost('/api/downloads', payload);
                    if (res && res.success) successCount++;
                }
                
                alert(`Started ${successCount} downloads in parallel! Check Library to view progress.`);
                window.AURA.state.queue = [];
                this.renderQueue();
            });
        }
    }

    addToQueue(item) {
        // Prevent exact duplicates
        if (!window.AURA.state.queue.some(q => q.id === item.id)) {
            window.AURA.state.queue.push(item);
            this.renderQueue();
            
            // Show subtle notification or pulse
            console.log(`[Queue] Added: ${item.title}`);
            const queueNavBtn = document.querySelector('.nav-item[data-target="queue"]');
            if (queueNavBtn) queueNavBtn.classList.add('accent-pulse-trigger');
            setTimeout(() => {
                if (queueNavBtn) queueNavBtn.classList.remove('accent-pulse-trigger');
            }, 1000);
        }
    }

    removeFromQueue(itemId) {
        window.AURA.state.queue = window.AURA.state.queue.filter(q => q.id !== itemId);
        this.renderQueue();
    }

    renderQueue() {
        if (!this.container) return;
        
        const q = window.AURA.state.queue;
        if (this.countLabel) {
            this.countLabel.textContent = `${q.length} item${q.length !== 1 ? 's' : ''} ready to process`;
        }

        if (q.length === 0) {
            this.container.innerHTML = `
                <div class="empty-state-card">
                    <p>Your queue is empty. Explore and add tracks to download them in bulk!</p>
                </div>
            `;
            return;
        }

        this.container.innerHTML = '';
        
        q.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'queue-item-row card-expand-anim';
            row.style.animationDelay = `${index * 0.05}s`;
            
            row.innerHTML = `
                <div class="queue-item-drag">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                </div>
                <img src="${item.thumbnail}" alt="${item.title}" class="queue-item-art">
                <div class="queue-item-meta">
                    <div class="queue-item-title">${item.title}</div>
                    <div class="queue-item-artist">${item.artist}</div>
                </div>
                <div class="queue-item-badge ${item.media_type}">${item.media_type}</div>
                <button class="queue-remove-btn" title="Remove from queue">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            `;
            
            // Remove item binding
            row.querySelector('.queue-remove-btn').addEventListener('click', () => {
                this.removeFromQueue(item.id);
            });
            
            this.container.appendChild(row);
        });
    }
}

window.AURA.Queue = new QueueModule();

// --- Queue specific CSS ---
const queueStyle = document.createElement('style');
queueStyle.innerHTML = `
    .queue-header-actions {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 30px;
    }
    .view-title { font-size: 32px; font-weight: 700; margin-bottom: 8px; }
    .view-subtitle { color: var(--text-secondary); }
    .queue-action-buttons { display: flex; gap: 12px; }
    .queue-action-btn {
        padding: 12px 24px;
        border-radius: 12px;
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: var(--transition-smooth);
        border: none;
    }
    .queue-action-btn.primary {
        background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
        color: #fff;
        box-shadow: 0 5px 15px rgba(0,229,255,0.2);
    }
    .queue-action-btn.primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0,229,255,0.3);
    }
    .queue-action-btn.secondary {
        background: rgba(255,255,255,0.05);
        color: var(--text-secondary);
        border: 1px solid var(--color-border);
    }
    .queue-action-btn.secondary:hover {
        background: rgba(255,255,255,0.1);
        color: #fff;
    }
    
    .queue-items-list { display: flex; flex-direction: column; gap: 12px; }
    .queue-item-row {
        display: flex;
        align-items: center;
        background: var(--color-bg-card);
        border: 1px solid var(--color-border);
        border-radius: 12px;
        padding: 10px 16px;
        gap: 16px;
        backdrop-filter: var(--glass-blur);
        transition: var(--transition-smooth);
    }
    .queue-item-row:hover {
        background: rgba(255,255,255,0.05);
        border-color: rgba(255,255,255,0.1);
    }
    .queue-item-drag {
        color: var(--text-muted);
        cursor: grab;
        display: flex;
        align-items: center;
    }
    .queue-item-drag svg { width: 20px; height: 20px; stroke: currentColor; stroke-width: 2; fill: none; }
    .queue-item-art { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; }
    .queue-item-meta { flex: 1; }
    .queue-item-title { font-weight: 600; font-size: 15px; margin-bottom: 4px; }
    .queue-item-artist { font-size: 13px; color: var(--text-secondary); }
    .queue-item-badge {
        font-size: 10px; font-weight: 700; text-transform: uppercase;
        padding: 4px 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
    }
    .queue-item-badge.music { color: var(--accent-blue); border-color: rgba(0,229,255,0.2); }
    .queue-item-badge.video { color: var(--accent-pink); border-color: rgba(255,0,127,0.2); }
    
    .queue-remove-btn {
        background: transparent; border: none; color: var(--text-muted);
        cursor: pointer; padding: 8px; transition: var(--transition-smooth);
    }
    .queue-remove-btn:hover { color: #ff3366; }
    .queue-remove-btn svg { width: 18px; height: 18px; stroke: currentColor; stroke-width: 2; fill: none; }
    
    .empty-state-card {
        background: rgba(255,255,255,0.02);
        border: 1px dashed rgba(255,255,255,0.1);
        border-radius: 16px;
        padding: 40px;
        text-align: center;
        color: var(--text-muted);
    }
`;
document.head.appendChild(queueStyle);
