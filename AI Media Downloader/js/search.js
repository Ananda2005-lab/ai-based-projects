/* ==========================================================================
   AURA Cinematic Search Engine Interface (search.js)
   Typo-tolerant Auto-Complete, Predictive Search, & Web Speech Voice Search
   ========================================================================== */

class SearchModule {
    constructor() {
        this.input = document.getElementById('search-input-field');
        this.dropdown = document.getElementById('autocomplete-dropdown');
        this.grid = document.getElementById('search-results-grid');
        this.voiceBtn = document.getElementById('voice-search-btn');
        this.resultsTitle = document.getElementById('search-results-title');
        
        this.activeType = 'all'; // 'all', 'music', 'video'
        this.debounceTimeout = null;

        this.init();
    }

    init() {
        if (!this.input) return;

        // BIND FILTER TABS
        const tabs = document.querySelectorAll('.filter-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.activeType = tab.getAttribute('data-type');
                this.triggerSearch(this.input.value);
            });
        });

        // BIND TYPING INPUT KEY EVENTS
        this.input.addEventListener('input', () => {
            const query = this.input.value;
            
            // Debounce keyboard typing for smoother suggestions updates
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = setTimeout(() => {
                this.updateSuggestions(query);
            }, 250);
        });

        this.input.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.triggerSearch(this.input.value);
                this.hideDropdown();
            }
        });

        // HIDE DROPDOWN CLICK OUTSIDE
        document.addEventListener('click', (e) => {
            if (!this.input.contains(e.target) && !this.dropdown.contains(e.target)) {
                this.hideDropdown();
            }
        });

        this.input.addEventListener('focus', () => {
            if (this.input.value.trim().length > 0) {
                this.dropdown.classList.add('active');
            }
        });

        // BIND VOICE SEARCH BUTTON
        if (this.voiceBtn) {
            this.voiceBtn.addEventListener('click', () => this.startVoiceRecognition());
        }

        // Initial popular load
        this.triggerSearch("");
    }

    async updateSuggestions(query) {
        if (!query || query.trim().length === 0) {
            this.hideDropdown();
            return;
        }

        const list = await window.AURA.apiFetch(`/api/suggestions?q=${encodeURIComponent(query)}`);
        if (!list || list.length === 0) {
            this.hideDropdown();
            return;
        }

        this.dropdown.innerHTML = '';
        list.forEach(item => {
            const row = document.createElement('div');
            row.className = 'autocomplete-row';
            row.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span>${item}</span>
            `;
            
            row.addEventListener('click', () => {
                this.input.value = item;
                this.triggerSearch(item);
                this.hideDropdown();
            });
            
            this.dropdown.appendChild(row);
        });

        this.dropdown.classList.add('active');
    }

    hideDropdown() {
        this.dropdown.classList.remove('active');
    }

    async triggerSearch(query) {
        console.log(`[Search] Query: "${query}" Type: ${this.activeType}`);
        
        let url = `/api/search?q=${encodeURIComponent(query)}&type=${this.activeType}`;
        const results = await window.AURA.apiFetch(url);

        if (this.resultsTitle) {
            this.resultsTitle.textContent = query.trim() === "" ? "Trending Tracks" : `Search Results for "${query}"`;
        }

        if (!this.grid) return;
        this.grid.innerHTML = '';

        if (!results || results.length === 0) {
            this.grid.innerHTML = `
                <div class="empty-state-card" style="grid-column: 1 / -1;">
                    <p>No cinematic matches found for "${query}". Try typing another keyword like "Neon" or "Cosmic"!</p>
                </div>
            `;
            return;
        }

        results.forEach(item => {
            this.grid.appendChild(window.AURA.createMediaCard(item));
        });
    }

    // --- HTML5 SpeechRecognition Voice Search integration ---
    startVoiceRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Voice Search is not supported in your current browser. Try Chrome or Edge!");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        // Glowing mic animation state
        this.voiceBtn.classList.add('active');
        this.input.placeholder = "Listening atmospheric vibes...";
        this.input.classList.add('accent-pulse-trigger');

        recognition.start();

        recognition.onresult = (event) => {
            const speechToText = event.results[0][0].transcript;
            console.log(`[Speech API] Captured: "${speechToText}"`);
            this.input.value = speechToText;
            this.triggerSearch(speechToText);
        };

        recognition.onerror = (event) => {
            console.error('[Speech API] Error occurred in recognition:', event.error);
            this.input.placeholder = "Voice error. Try typing!";
        };

        recognition.onend = () => {
            this.voiceBtn.classList.remove('active');
            this.input.placeholder = "Search song, video, artist, album...";
            this.input.classList.remove('accent-pulse-trigger');
        };
    }
}

// Assign to global stack
window.AURA.Search = new SearchModule();

/* --- Dynamic styling properties specifically for Autocomplete Dropdown --- */
const styleElement = document.createElement('style');
styleElement.innerHTML = `
    .search-experience-container {
        display: flex;
        flex-direction: column;
        gap: 30px;
    }
    .search-bar-wrapper {
        position: relative;
        width: 100%;
        max-width: 700px;
        margin: 0 auto;
    }
    .search-input-box {
        display: flex;
        align-items: center;
        background: var(--color-bg-input);
        border: 1px solid var(--color-border);
        border-radius: 16px;
        padding: 14px 20px;
        gap: 16px;
        transition: var(--transition-smooth);
        box-shadow: var(--shadow-premium);
    }
    .search-input-box:focus-within {
        border-color: var(--accent-blue);
        box-shadow: 0 0 25px rgba(0, 229, 255, 0.15);
    }
    .search-icon {
        width: 22px;
        height: 22px;
        stroke: var(--text-secondary);
        stroke-width: 2.5;
        fill: none;
    }
    #search-input-field {
        background: transparent;
        border: none;
        outline: none;
        color: #fff;
        font-size: 16px;
        font-family: inherit;
        flex: 1;
    }
    #search-input-field::placeholder {
        color: var(--text-muted);
    }
    .voice-btn {
        background: transparent;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 6px;
        border-radius: 10px;
        transition: var(--transition-smooth);
    }
    .voice-btn:hover, .voice-btn.active {
        color: var(--accent-blue);
        background: rgba(0, 229, 255, 0.08);
    }
    .voice-btn svg {
        width: 20px;
        height: 20px;
        stroke: currentColor;
        stroke-width: 2;
        fill: none;
    }
    
    /* Autocomplete Panel */
    .autocomplete-panel {
        position: absolute;
        top: calc(100% + 10px);
        left: 0;
        width: 100%;
        background: rgba(12, 12, 18, 0.95);
        border: 1px solid var(--color-border);
        border-radius: 16px;
        box-shadow: var(--shadow-premium);
        backdrop-filter: var(--glass-blur);
        z-index: 100;
        display: flex;
        flex-direction: column;
        opacity: 0;
        transform: translateY(-10px);
        pointer-events: none;
        transition: var(--transition-smooth);
        overflow: hidden;
    }
    .autocomplete-panel.active {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
    }
    .autocomplete-row {
        display: flex;
        align-items: center;
        padding: 14px 20px;
        gap: 16px;
        cursor: pointer;
        color: var(--text-secondary);
        transition: var(--transition-smooth);
        border-bottom: 1px solid rgba(255,255,255,0.03);
    }
    .autocomplete-row:last-child {
        border-bottom: none;
    }
    .autocomplete-row:hover {
        background: rgba(0, 229, 255, 0.08);
        color: #fff;
    }
    .autocomplete-row svg {
        stroke: var(--text-muted);
        stroke-width: 2;
        fill: none;
    }
    
    /* Filter Tabs */
    .filter-tabs-container {
        display: flex;
        gap: 16px;
        justify-content: center;
        margin-bottom: 10px;
    }
    .filter-tab {
        padding: 10px 20px;
        background: rgba(255,255,255,0.03);
        border: 1px solid var(--color-border);
        border-radius: 12px;
        cursor: pointer;
        font-weight: 500;
        font-size: 14px;
        transition: var(--transition-smooth);
    }
    .filter-tab:hover {
        background: rgba(255,255,255,0.06);
        color: #fff;
    }
    .filter-tab.active {
        background: rgba(0, 229, 255, 0.08);
        border-color: rgba(0, 229, 255, 0.2);
        color: var(--accent-blue);
        box-shadow: 0 5px 15px rgba(0, 229, 255, 0.1);
    }
`;
document.head.appendChild(styleElement);
