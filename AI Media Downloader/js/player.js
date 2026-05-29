/* ==========================================================================
   AURA Powerful Media Playback Engine (player.js)
   Dual Audio/Video Syncer, Web Audio Analyser, & Immersive Theater Overlay
   ========================================================================== */

class PlayerModule {
    constructor() {
        // Core Audio & Video elements
        this.audio = document.getElementById('html5-audio-node');
        this.video = document.getElementById('html5-video-node');
        this.activeMedia = this.audio; // Default active node
        
        // UI Handles - Mini Player
        this.miniArt = document.getElementById('current-track-art');
        this.miniTitle = document.getElementById('current-track-title');
        this.miniArtist = document.getElementById('current-track-artist');
        this.miniPlayBtn = document.getElementById('player-play-btn');
        this.miniPlayIcon = document.getElementById('play-icon-svg');
        this.miniVolume = document.getElementById('player-volume-slider');
        this.miniTimeCur = document.getElementById('player-time-current');
        this.miniTimeTot = document.getElementById('player-time-total');
        this.miniTimeline = document.getElementById('player-timeline-container');
        this.miniProgress = document.getElementById('player-progress-bar');
        this.miniPrevBtn = document.getElementById('player-prev-btn');
        this.miniNextBtn = document.getElementById('player-next-btn');
        this.expandBtn = document.getElementById('player-expand-btn');

        // UI Handles - Fullscreen Immersive Player
        this.overlay = document.getElementById('fullscreen-player-overlay');
        this.closeBtn = document.getElementById('fullscreen-close-btn');
        this.videoContainer = document.getElementById('video-player-container');
        this.vinylContainer = document.getElementById('music-vinyl-container');
        this.spinningDisc = document.getElementById('player-spinning-disc');
        this.fullArt = document.getElementById('fullscreen-track-art');
        this.fullTitle = document.getElementById('fullscreen-track-title');
        this.fullArtist = document.getElementById('fullscreen-track-artist');
        this.fullBadge = document.getElementById('fullscreen-media-badge');
        
        this.fsPlayBtn = document.getElementById('fs-play-btn');
        this.fsPlayIcon = document.getElementById('fs-play-icon-svg');
        this.fsPrevBtn = document.getElementById('fs-prev-btn');
        this.fsNextBtn = document.getElementById('fs-next-btn');
        this.fsShuffleBtn = document.getElementById('fs-shuffle-btn');
        this.fsLoopBtn = document.getElementById('fs-loop-btn');
        
        this.fsTimeCur = document.getElementById('fs-time-current');
        this.fsTimeTot = document.getElementById('fs-time-total');
        this.fsTimeline = document.getElementById('fs-timeline-scrub-bar');
        this.fsProgress = document.getElementById('fs-progress-fill');

        // State trackers
        this.isLooping = false;
        this.isShuffling = false;
        this.activePlaylist = [];
        this.currentIndex = -1;
        
        // Web Audio visualizer context
        this.audioContext = null;
        this.analyser = null;
        this.visualizerCanvas = document.getElementById('audio-visualizer-canvas');
        this.visualizerCtx = null;
        this.isVisualizerInit = false;

        this.init();
    }

    init() {
        // 1. Play / Pause Actions
        const togglePlay = () => this.togglePlayback();
        this.miniPlayBtn.addEventListener('click', togglePlay);
        if (this.fsPlayBtn) this.fsPlayBtn.addEventListener('click', togglePlay);

        // 2. Next / Previous Actions
        const playNext = () => this.playNextTrack();
        const playPrev = () => this.playPrevTrack();
        this.miniNextBtn.addEventListener('click', playNext);
        this.miniPrevBtn.addEventListener('click', playPrev);
        if (this.fsNextBtn) this.fsNextBtn.addEventListener('click', playNext);
        if (this.fsPrevBtn) this.fsPrevBtn.addEventListener('click', playPrev);

        // 3. Fullscreen Overlay Controls
        this.expandBtn.addEventListener('click', () => this.showFullscreenOverlay());
        this.closeBtn.addEventListener('click', () => this.hideFullscreenOverlay());

        // 4. Volume Adjustment
        this.miniVolume.addEventListener('input', (e) => {
            const vol = e.target.value / 100;
            this.audio.volume = vol;
            this.video.volume = vol;
            window.AURA.state.volume = e.target.value;
        });

        // 5. Timeline scrubbing (Scrubbing on Mini & Full Player)
        const scrubTimeline = (e, timelineNode) => {
            const rect = timelineNode.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const targetTime = percent * this.activeMedia.duration;
            if (!isNaN(targetTime)) {
                this.activeMedia.currentTime = targetTime;
            }
        };

        this.miniTimeline.addEventListener('click', (e) => scrubTimeline(e, this.miniTimeline));
        if (this.fsTimeline) this.fsTimeline.addEventListener('click', (e) => scrubTimeline(e, this.fsTimeline));

        // 6. Native playback update listeners
        const onTimeUpdate = () => this.updatePlaybackProgress();
        this.audio.addEventListener('timeupdate', onTimeUpdate);
        this.video.addEventListener('timeupdate', onTimeUpdate);

        const onEnded = () => {
            if (this.isLooping) {
                this.activeMedia.currentTime = 0;
                this.activeMedia.play();
            } else {
                this.playNextTrack();
            }
        };
        this.audio.addEventListener('ended', onEnded);
        this.video.addEventListener('ended', onEnded);

        // 7. Loop / Shuffle triggers
        if (this.fsLoopBtn) {
            this.fsLoopBtn.addEventListener('click', () => {
                this.isLooping = !this.isLooping;
                this.fsLoopBtn.classList.toggle('active', this.isLooping);
            });
        }
        if (this.fsShuffleBtn) {
            this.fsShuffleBtn.addEventListener('click', () => {
                this.isShuffling = !this.isShuffling;
                this.fsShuffleBtn.classList.toggle('active', this.isShuffling);
            });
        }

        // KEYBOARD SHORTCUTS FOR DESKTOP
        document.addEventListener('keydown', (e) => {
            // Ignore key events when typing inside inputs
            if (document.activeElement.tagName === 'INPUT') return;

            if (e.code === 'Space') {
                e.preventDefault();
                this.togglePlayback();
            } else if (e.code === 'ArrowRight') {
                this.activeMedia.currentTime += 5;
            } else if (e.code === 'ArrowLeft') {
                this.activeMedia.currentTime -= 5;
            } else if (e.code === 'KeyN') {
                this.playNextTrack();
            } else if (e.code === 'KeyP') {
                this.playPrevTrack();
            }
        });
    }

    async initWebAudio() {
        if (this.isVisualizerInit) return;
        
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass();
            
            // Connect both audio and video HTML nodes to Web Audio graph
            const sourceAudio = this.audioContext.createMediaElementSource(this.audio);
            const sourceVideo = this.audioContext.createMediaElementSource(this.video);
            
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            
            sourceAudio.connect(this.analyser);
            sourceVideo.connect(this.analyser);
            
            this.analyser.connect(this.audioContext.destination);
            
            this.visualizerCtx = this.visualizerCanvas.getContext('2d');
            this.isVisualizerInit = true;
            
            this.renderVisualizerFrame();
            console.log('[Web Audio] Node graph connected successfully!');
        } catch (e) {
            console.warn('[Web Audio] Context initialization failed (User gesture needed):', e);
        }
    }

    renderVisualizerFrame() {
        if (!this.isVisualizerInit) return;
        
        requestAnimationFrame(() => this.renderVisualizerFrame());
        
        const canvas = this.visualizerCanvas;
        const ctx = this.visualizerCtx;
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        this.analyser.getByteFrequencyData(dataArray);
        
        // Resize visualizer canvas according to size changes
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight || 150;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = (canvas.width / bufferLength) * 1.5;
        let barHeight;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] * (canvas.height / 255) * 0.75;
            
            // Generate glowing luxury gradients
            const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
            gradient.addColorStop(0, '#7000ff'); // Purple
            gradient.addColorStop(1, '#00e5ff'); // Cinematic Cyan
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
            
            x += barWidth;
        }
    }

    // --- Loading & Trigger Playback ---
    async loadAndPlay(item) {
        console.log('[Player] Loading item:', item.title);
        
        // Pause active tracks
        this.audio.pause();
        this.video.pause();

        window.AURA.state.currentTrack = item;
        
        // Set playlist arrays and index trackers
        if (window.AURA.state.queue.some(q => q.id === item.id)) {
            this.activePlaylist = window.AURA.state.queue;
        } else {
            // Default load from current search results or main catalog
            this.activePlaylist = [item];
        }
        this.currentIndex = this.activePlaylist.findIndex(t => t.id === item.id);

        // UI Text and thumbnails adjustments
        this.miniTitle.textContent = item.title;
        this.miniArtist.textContent = item.artist;
        this.miniArt.src = item.thumbnail;
        
        if (this.fullTitle) {
            this.fullTitle.textContent = item.title;
            this.fullArtist.textContent = item.artist;
            this.fullArt.src = item.thumbnail;
            this.fullBadge.textContent = item.media_type === 'music' ? `${item.category} Track` : `${item.category} Video Clip`;
        }

        // Configure stream source
        let streamPath = item.stream_url;
        // Check if file is already downloaded locally in Library.
        // Download status "completed" maps to local stream files `/media/{music|videos}/{filename}`
        const dlRecords = await window.AURA.apiFetch('/api/downloads');
        if (dlRecords) {
            const dl = dlRecords.find(d => d.url === item.stream_url && d.status === 'completed');
            if (dl && dl.file_path) {
                const category = item.media_type === 'music' ? 'Music' : 'Videos';
                const filename = dl.file_path.split(/[\\/]/).pop();
                streamPath = `/media/${category}/${encodeURIComponent(filename)}`;
                console.log('[Player] Intercepted stream! Playing offline local file:', streamPath);
            }
        }

        // Configure Dual-Player Audio vs Video Switcher
        if (item.media_type === 'music') {
            this.activeMedia = this.audio;
            this.audio.src = streamPath;
            this.audio.load();
            
            // UI Switcher: Hide Video, show spinning CD vinyl disc
            if (this.videoContainer) this.videoContainer.style.display = 'none';
            if (this.vinylContainer) this.vinylContainer.style.display = 'flex';
        } else {
            this.activeMedia = this.video;
            this.video.src = streamPath;
            this.video.load();
            
            // UI Switcher: Show Video, hide spinning CD vinyl disc
            if (this.videoContainer) this.videoContainer.style.display = 'flex';
            if (this.vinylContainer) this.vinylContainer.style.display = 'none';
        }

        // Attempt playback start
        try {
            await this.activeMedia.play();
            window.AURA.state.isPlaying = true;
            this.updatePlayerButtons(true);
            
            // Start Web Audio graph on first play interaction
            this.initWebAudio();
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            // Sync to Database history
            window.AURA.apiPost('/api/history', {
                track_id: item.id,
                title: item.title,
                artist: item.artist,
                duration: item.duration,
                media_type: item.media_type,
                thumbnail: item.thumbnail
            });

        } catch (e) {
            console.error('[Player] Error starting playback:', e);
            window.AURA.state.isPlaying = false;
            this.updatePlayerButtons(false);
        }
    }

    togglePlayback() {
        if (!window.AURA.state.currentTrack) return;
        
        if (window.AURA.state.isPlaying) {
            this.activeMedia.pause();
            window.AURA.state.isPlaying = false;
            this.updatePlayerButtons(false);
        } else {
            this.activeMedia.play();
            window.AURA.state.isPlaying = true;
            this.updatePlayerButtons(true);
            
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        }
    }

    playNextTrack() {
        if (this.activePlaylist.length <= 1) return;
        
        if (this.isShuffling) {
            this.currentIndex = Math.floor(Math.random() * this.activePlaylist.length);
        } else {
            this.currentIndex = (this.currentIndex + 1) % this.activePlaylist.length;
        }
        
        this.loadAndPlay(this.activePlaylist[this.currentIndex]);
    }

    playPrevTrack() {
        if (this.activePlaylist.length <= 1) return;
        
        this.currentIndex = (this.currentIndex - 1 + this.activePlaylist.length) % this.activePlaylist.length;
        this.loadAndPlay(this.activePlaylist[this.currentIndex]);
    }

    updatePlayerButtons(playing) {
        // Toggle SVGs on play/pause keys
        const playIcon = `<polygon points="5 3 19 12 5 21 5 3"/>`;
        const pauseIcon = `<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`;
        
        this.miniPlayIcon.innerHTML = playing ? pauseIcon : playIcon;
        if (this.fsPlayIcon) this.fsPlayIcon.innerHTML = playing ? pauseIcon : playIcon;

        // Toggle Spinning Vinyl animations
        if (this.spinningDisc) {
            if (playing) {
                this.spinningDisc.classList.remove('paused');
            } else {
                this.spinningDisc.classList.add('paused');
            }
        }
    }

    // --- Timeline Update Operations ---
    updatePlaybackProgress() {
        const cur = this.activeMedia.currentTime;
        const tot = this.activeMedia.duration;
        
        if (isNaN(tot)) return;

        const percent = (cur / tot) * 100;
        
        // Update progress fills
        this.miniProgress.style.width = `${percent}%`;
        if (this.fsProgress) this.fsProgress.style.width = `${percent}%`;

        // Update Timers
        const formatTime = (secs) => {
            const m = Math.floor(secs / 60).toString().padStart(2, '0');
            const s = Math.floor(secs % 60).toString().padStart(2, '0');
            return `${m}:${s}`;
        };

        this.miniTimeCur.textContent = formatTime(cur);
        this.miniTimeTot.textContent = formatTime(tot);
        if (this.fsTimeCur) this.fsTimeCur.textContent = formatTime(cur);
        if (this.fsTimeTot) this.fsTimeTot.textContent = formatTime(tot);
    }

    // --- Theater Overlay Overlay Panels ---
    showFullscreenOverlay() {
        this.overlay.classList.add('active');
        this.initWebAudio();
    }

    hideFullscreenOverlay() {
        this.overlay.classList.remove('active');
    }
}

// Assign to global stack
window.AURA.Player = new PlayerModule();

/* --- Dynamic styling specifically for Fullscreen Immersive overlay --- */
const playerStyleElement = document.createElement('style');
playerStyleElement.innerHTML = `
    #fullscreen-player-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: radial-gradient(circle at center, #11111a 0%, #040407 100%);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transform: translateY(100vh);
        pointer-events: none;
        transition: all 0.55s cubic-bezier(0.25, 0.8, 0.25, 1);
        padding: 50px;
    }
    #fullscreen-player-overlay.active {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
    }
    .close-overlay-trigger {
        position: absolute;
        top: 30px;
        right: 40px;
        color: var(--text-secondary);
        cursor: pointer;
        transition: var(--transition-smooth);
        padding: 8px;
        border-radius: 50%;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.05);
    }
    .close-overlay-trigger:hover {
        color: #fff;
        background: rgba(255,255,255,0.08);
        transform: rotate(180deg);
    }
    
    .fullscreen-player-content {
        width: 100%;
        max-width: 900px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 30px;
        text-align: center;
    }

    /* Video player */
    .cinematic-video-canvas {
        width: 100%;
        max-width: 700px;
        aspect-ratio: 16/9;
        background: #000;
        border-radius: 20px;
        overflow: hidden;
        border: 1px solid var(--color-border);
        box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(0,229,255,0.05);
        display: none;
    }
    .cinematic-video-canvas video {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    /* Music Vinyl Wrapper */
    .cinematic-music-cd-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 280px;
        height: 280px;
    }
    .vinyl-record {
        width: 250px;
        height: 250px;
        border-radius: 50%;
        background: #09090c;
        border: 10px solid #1a1a24;
        position: relative;
        box-shadow: 0 20px 45px rgba(0,0,0,0.8), 
                    inset 0 0 20px rgba(255,255,255,0.05),
                    0 0 40px rgba(0, 229, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .vinyl-record img {
        width: 110px;
        height: 110px;
        border-radius: 50%;
        object-fit: cover;
    }
    .vinyl-center-pin {
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #060609;
        border: 4px solid #fff;
    }

    /* Visualizer */
    .audio-visualizer-canvas-wrapper {
        width: 100%;
        max-width: 600px;
        height: 80px;
        margin-top: 10px;
    }
    #audio-visualizer-canvas {
        width: 100%;
        height: 100%;
    }

    /* Text Metas */
    .fullscreen-track-meta h1 {
        font-size: 32px;
        margin-bottom: 8px;
        background: linear-gradient(to right, #fff, var(--accent-blue));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .fullscreen-track-meta p {
        color: var(--text-secondary);
        font-size: 18px;
        margin-bottom: 12px;
    }
    .atmosphere-mode-badge {
        padding: 4px 12px;
        border-radius: 20px;
        background: rgba(0,229,255,0.08);
        border: 1px solid rgba(0,229,255,0.15);
        color: var(--accent-blue);
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    /* Scrubbing Timeline */
    .fullscreen-timeline-wrapper {
        width: 100%;
        max-width: 650px;
        display: flex;
        align-items: center;
        gap: 16px;
    }
    .fs-time {
        font-size: 12px;
        color: var(--text-secondary);
        font-weight: 600;
        width: 45px;
    }
    #fs-timeline-scrub-bar {
        flex: 1;
        height: 6px;
        background: rgba(255,255,255,0.06);
        border-radius: 10px;
        cursor: pointer;
        position: relative;
    }
    #fs-progress-fill {
        height: 100%;
        width: 0%;
        background: linear-gradient(to right, var(--accent-blue), var(--accent-pink));
        border-radius: 10px;
        position: relative;
    }
    #fs-progress-handle {
        position: absolute;
        right: -6px;
        top: 50%;
        transform: translateY(-50%);
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 0 10px var(--accent-blue);
    }
    
    /* Control Buttons */
    .fullscreen-control-buttons {
        display: flex;
        align-items: center;
        gap: 30px;
        margin-top: 10px;
    }
    .fs-play-pause-btn {
        background: #fff;
        color: #000;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        cursor: pointer;
        box-shadow: 0 10px 25px rgba(255,255,255,0.25), 0 0 40px rgba(0,229,255,0.2);
        transition: var(--transition-smooth);
    }
    .fs-play-pause-btn:hover {
        transform: scale(1.08);
        background: var(--accent-blue);
    }
    .fs-play-pause-btn svg {
        width: 26px;
        height: 26px;
        fill: currentColor;
    }
    .fs-prev-btn svg, .fs-next-btn svg {
        width: 24px;
        height: 24px;
        fill: currentColor;
    }
    .fs-secondary-btn {
        color: var(--text-muted);
    }
    .fs-secondary-btn.active {
        color: var(--accent-blue);
        filter: drop-shadow(0 0 5px var(--accent-blue));
    }
`;
document.head.appendChild(playerStyleElement);
