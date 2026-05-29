/* ==========================================================================
   AURA Download Controller (download.js)
   Sends API triggers for download actions
   ========================================================================== */

class DownloadModule {
    constructor() {}

    async action(downloadId, actionType) {
        console.log(`[Download] Triggering ${actionType} on ${downloadId}`);
        const res = await window.AURA.apiPost('/api/downloads/action', {
            action: actionType,
            download_id: downloadId
        });
        
        if (res && res.success) {
            // Force immediate render update if we are on the library tab
            if (window.AURA.state.activeView === 'library' && window.AURA.Library) {
                window.AURA.Library.renderActiveDownloads();
            }
        } else {
            alert(`Failed to ${actionType} download.`);
        }
    }
}

window.AURA.Download = new DownloadModule();
