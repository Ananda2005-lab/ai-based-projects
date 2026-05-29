/* ==========================================================================
   AURA Settings Manager (settings.js)
   Controls theme toggles, storage clearing, and UI preferences
   ========================================================================== */

class SettingsModule {
    constructor() {
        this.particleSpeed = document.getElementById('pref-particle-speed');
        this.themeSelect = document.getElementById('pref-theme-select');
        this.maxDownloads = document.getElementById('pref-max-downloads');
        this.qualitySelect = document.getElementById('pref-quality-select');
        
        this.clearHistoryBtn = document.getElementById('util-clear-history');
        this.clearSearchBtn = document.getElementById('util-clear-search');
        this.clearCacheBtn = document.getElementById('util-clear-pwa-cache');

        this.init();
    }

    init() {
        // Init UI with current state values
        setTimeout(() => {
            const s = window.AURA.state.settings;
            if (this.particleSpeed) this.particleSpeed.value = s.particleSpeed || 50;
            if (this.themeSelect) this.themeSelect.value = s.theme || 'obsidian';
            if (this.maxDownloads) this.maxDownloads.value = s.maxDownloads || 3;
            if (this.qualitySelect) this.qualitySelect.value = s.quality || '320';
            
            this.applyTheme(s.theme);
        }, 500);

        // Bind events
        const saveSetting = (key, value) => {
            window.AURA.state.settings[key] = value;
            window.AURA.apiPost('/api/settings', { [key]: value });
        };

        if (this.particleSpeed) {
            this.particleSpeed.addEventListener('change', (e) => saveSetting('particleSpeed', e.target.value));
        }
        
        if (this.themeSelect) {
            this.themeSelect.addEventListener('change', (e) => {
                const t = e.target.value;
                saveSetting('theme', t);
                this.applyTheme(t);
            });
        }
        
        if (this.maxDownloads) {
            this.maxDownloads.addEventListener('change', (e) => saveSetting('maxDownloads', e.target.value));
        }
        
        if (this.qualitySelect) {
            this.qualitySelect.addEventListener('change', (e) => saveSetting('quality', e.target.value));
        }

        // Database Utilities
        if (this.clearHistoryBtn) {
            this.clearHistoryBtn.addEventListener('click', async () => {
                if (confirm("Are you sure you want to delete all playback history?")) {
                    await window.AURA.apiPost('/api/history/clear');
                    alert("History cleared.");
                }
            });
        }
        
        if (this.clearSearchBtn) {
            this.clearSearchBtn.addEventListener('click', async () => {
                if (confirm("Are you sure you want to clear search cache?")) {
                    await window.AURA.apiPost('/api/recent-searches/clear');
                    alert("Search cache cleared.");
                }
            });
        }
        
        if (this.clearCacheBtn) {
            this.clearCacheBtn.addEventListener('click', () => {
                if (confirm("Clear Browser PWA Cache? This will reload the app.")) {
                    if ('caches' in window) {
                        caches.keys().then(names => {
                            for (let name of names) caches.delete(name);
                            window.location.reload();
                        });
                    }
                }
            });
        }
    }

    applyTheme(theme) {
        const root = document.documentElement;
        if (theme === 'pitch') {
            root.style.setProperty('--color-bg-base', '#000000');
            root.style.setProperty('--color-bg-panel', 'rgba(5, 5, 5, 0.9)');
            root.style.setProperty('--color-bg-card', 'rgba(10, 10, 10, 0.8)');
        } else if (theme === 'cyber') {
            root.style.setProperty('--color-bg-base', '#020210');
            root.style.setProperty('--color-bg-panel', 'rgba(0, 5, 20, 0.8)');
            root.style.setProperty('--color-bg-card', 'rgba(10, 20, 40, 0.6)');
        } else {
            // Default Obsidian
            root.style.setProperty('--color-bg-base', '#060609');
            root.style.setProperty('--color-bg-panel', 'rgba(12, 12, 18, 0.65)');
            root.style.setProperty('--color-bg-card', 'rgba(22, 22, 30, 0.45)');
        }
    }
}

window.AURA.Settings = new SettingsModule();

// --- Settings specific CSS ---
const settingsStyle = document.createElement('style');
settingsStyle.innerHTML = `
    .settings-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 24px;
        max-width: 1000px;
    }
    .settings-card {
        background: var(--color-bg-card);
        border: 1px solid var(--color-border);
        border-radius: 16px;
        padding: 24px;
        backdrop-filter: var(--glass-blur);
    }
    .settings-card-title { font-size: 18px; margin-bottom: 20px; color: var(--accent-blue); }
    .settings-card-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 20px; line-height: 1.5; }
    .setting-row { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
    .setting-row label { font-size: 13px; font-weight: 500; color: var(--text-secondary); }
    
    .setting-slider {
        -webkit-appearance: none; width: 100%; height: 6px; border-radius: 4px;
        background: rgba(255,255,255,0.1); outline: none; transition: var(--transition-smooth);
    }
    .setting-slider::-webkit-slider-thumb {
        -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%;
        background: #fff; cursor: pointer;
    }
    
    .setting-dropdown {
        background: rgba(8, 8, 12, 0.8); color: #fff; border: 1px solid var(--color-border);
        padding: 12px; border-radius: 10px; font-family: inherit; font-size: 14px; outline: none;
    }
    .setting-number-input {
        background: rgba(8, 8, 12, 0.8); color: #fff; border: 1px solid var(--color-border);
        padding: 12px; border-radius: 10px; font-family: inherit; font-size: 14px; outline: none; width: 100px;
    }
    
    .settings-utility-buttons { display: flex; flex-direction: column; gap: 12px; }
    .settings-utility-btn {
        background: transparent; color: var(--text-secondary); border: 1px solid var(--color-border);
        padding: 12px; border-radius: 10px; cursor: pointer; transition: var(--transition-smooth);
        font-family: inherit; font-weight: 500; text-align: left;
    }
    .settings-utility-btn:hover { background: rgba(255,51,102,0.1); color: #ff3366; border-color: rgba(255,51,102,0.3); }
`;
document.head.appendChild(settingsStyle);
