/* ==================== Global Variables ==================== */

let currentDeploymentId = null;
let currentFile = null;
let deploymentHistory = {};
let savedSettings = {
    githubToken: localStorage.getItem('github_token') || '',
    renderKey: localStorage.getItem('render_key') || '',
    autoTheme: localStorage.getItem('auto_theme') === 'true',
    notifications: localStorage.getItem('notifications') !== 'false'
};

const API_BASE = 'http://localhost:5000';

/* ==================== Theme System ==================== */

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.getElementById('theme-dropdown').value = savedTheme;
}

function setTheme(theme) {
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-neon', 'theme-purple', 'theme-whatsapp');
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem('theme', theme);
}

document.getElementById('theme-dropdown').addEventListener('change', (e) => {
    setTheme(e.target.value);
    showToast('Theme changed successfully', 'success');
});

/* ==================== Page Navigation ==================== */

function switchPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const page = document.getElementById(`${pageName}-page`);
    if (page) {
        page.classList.add('active');
    }

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        upload: 'Upload & Deploy',
        deployments: 'All Deployments',
        settings: 'Settings'
    };
    document.querySelector('.page-title').textContent = titles[pageName] || 'DevOps AI';
}

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const page = item.getAttribute('data-page');
        switchPage(page);
        if (page === 'deployments') loadAllDeployments();
    });
});

/* ==================== File Upload ==================== */

const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');

browseBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        selectFile(e.target.files[0]);
    }
});

uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        selectFile(e.dataTransfer.files[0]);
    }
});

function selectFile(file) {
    if (!file.name.endsWith('.zip')) {
        showToast('Only ZIP files are allowed', 'error');
        return;
    }

    if (file.size > 50 * 1024 * 1024) {
        showToast('File is too large (max 50MB)', 'error');
        return;
    }

    currentFile = file;

    // Hide upload zone, show selected file
    uploadZone.style.display = 'none';
    document.getElementById('file-selected').classList.remove('hidden');

    // Show config form
    document.getElementById('config-form').classList.remove('hidden');

    // Update file info
    document.getElementById('selected-filename').textContent = file.name;
    document.getElementById('selected-filesize').textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;

    // Pre-fill repo name from filename
    const repoName = file.name.replace('.zip', '').replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
    document.getElementById('repo-name').value = repoName;
}

document.getElementById('remove-file').addEventListener('click', () => {
    currentFile = null;
    uploadZone.style.display = 'block';
    document.getElementById('file-selected').classList.add('hidden');
    document.getElementById('config-form').classList.add('hidden');
    document.getElementById('progress-section').classList.add('hidden');
    document.getElementById('result-section').classList.add('hidden');
    fileInput.value = '';
});

document.getElementById('reset-form-btn').addEventListener('click', () => {
    document.getElementById('remove-file').click();
});

/* ==================== Deployment Flow ==================== */

document.getElementById('start-deploy-btn').addEventListener('click', startDeployment);

async function startDeployment() {
    if (!currentFile) {
        showToast('Please select a file first', 'warning');
        return;
    }

    const githubToken = document.getElementById('github-token').value || savedSettings.githubToken;
    const renderKey = document.getElementById('render-key').value || savedSettings.renderKey;

    if (!githubToken) {
        showToast('GitHub token is required', 'error');
        return;
    }

    // Hide form, show progress
    document.getElementById('config-form').classList.add('hidden');
    document.getElementById('progress-section').classList.remove('hidden');

    try {
        // Step 1: Upload file
        updateProgress(1, 'Uploading file...', 10);
        const uploadResult = await uploadFile(currentFile);
        if (!uploadResult.success) {
            showToast(`Upload failed: ${uploadResult.error}`, 'error');
            return;
        }

        currentDeploymentId = uploadResult.deployment_id;
        addLog(`✅ File uploaded (ID: ${uploadResult.deployment_id.substring(0, 8)})`, 'success');
        updateProgress(1, 'Upload complete', 50);

        // Step 2: Analyze project
        updateProgress(2, 'Analyzing project...', 60);
        const analyzeResult = await analyzeProject(currentDeploymentId);
        if (!analyzeResult.success) {
            showToast(`Analysis failed: ${analyzeResult.error}`, 'error');
            return;
        }
        addLog(`✅ Project type: ${analyzeResult.project_info.type}`, 'success');
        updateProgress(2, 'Analysis complete', 75);

        // Step 3: Push to GitHub
        updateProgress(3, 'Pushing to GitHub...', 80);
        const repoName = document.getElementById('repo-name').value || `ai-devops-${currentDeploymentId.substring(0, 8)}`;
        const githubResult = await pushGitHub(currentDeploymentId, githubToken, repoName);
        if (!githubResult.success) {
            showToast(`GitHub push failed: ${githubResult.error}`, 'error');
            return;
        }
        addLog(`✅ Pushed to GitHub: ${githubResult.github_url}`, 'success');
        updateProgress(3, 'GitHub complete', 90);

        // Step 4: Deploy to Render
        updateProgress(4, 'Deploying to Render...', 95);
        const deployResult = await deployRender(currentDeploymentId, renderKey);
        if (!deployResult.success) {
            showToast(`Deployment failed: ${deployResult.error}`, 'error');
            return;
        }
        addLog(`✅ Deployment URL: ${deployResult.deploy_url}`, 'success');
        updateProgress(4, 'Deployment complete', 100);

        // Show results
        showResults(githubResult.github_url, deployResult.deploy_url, analyzeResult.project_info);

    } catch (error) {
        addLog(`❌ Error: ${error.message}`, 'error');
        showToast(`Deployment failed: ${error.message}`, 'error');
    }
}

/* ==================== API Calls ==================== */

async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE}/api/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.error };
        }

        return await response.json();
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function analyzeProject(deploymentId) {
    try {
        const response = await fetch(`${API_BASE}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deployment_id: deploymentId })
        });

        if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.error };
        }

        return await response.json();
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function pushGitHub(deploymentId, githubToken, repoName) {
    try {
        const response = await fetch(`${API_BASE}/api/push-github`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                deployment_id: deploymentId,
                github_token: githubToken,
                repo_name: repoName
            })
        });

        if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.error };
        }

        return await response.json();
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function deployRender(deploymentId, renderKey) {
    try {
        const response = await fetch(`${API_BASE}/api/deploy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                deployment_id: deploymentId,
                render_api_key: renderKey
            })
        });

        if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.error };
        }

        return await response.json();
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getDeploymentStatus(deploymentId) {
    try {
        const response = await fetch(`${API_BASE}/api/status/${deploymentId}`);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        return null;
    }
}

async function getAllDeployments() {
    try {
        const response = await fetch(`${API_BASE}/api/all-deployments`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.deployments;
    } catch (error) {
        return [];
    }
}

/* ==================== Progress & Logs ==================== */

function updateProgress(step, message, percent) {
    // Update step
    const steps = document.querySelectorAll('.step');
    steps.forEach((s, index) => {
        s.classList.remove('active', 'completed');
        if (index < step) s.classList.add('completed');
        if (index === step - 1) s.classList.add('active');
    });

    // Update progress bar
    document.getElementById('progress-fill').style.width = `${percent}%`;
    document.getElementById('progress-percent').textContent = `${percent}%`;
    document.getElementById('progress-message').textContent = message;
}

function addLog(message, type = 'info') {
    const logsContent = document.getElementById('logs-content');
    const logEntry = document.createElement('p');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
    logsContent.appendChild(logEntry);
    logsContent.scrollTop = logsContent.scrollHeight;
}

/* ==================== Results Display ==================== */

function showResults(githubUrl, deployUrl, projectInfo) {
    document.getElementById('progress-section').classList.add('hidden');
    document.getElementById('result-section').classList.remove('hidden');

    // Set links
    document.getElementById('github-link').href = githubUrl;
    document.getElementById('github-link').textContent = githubUrl;
    document.getElementById('deploy-link').href = deployUrl;
    document.getElementById('deploy-link').textContent = deployUrl;

    // Set project info
    const infoContent = document.getElementById('result-info-content');
    infoContent.innerHTML = `
        <div class="info-item">
            <div class="info-label">Project Type</div>
            <div class="info-value">${projectInfo.type}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Build Command</div>
            <div class="info-value">${projectInfo.build_command}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Start Command</div>
            <div class="info-value">${projectInfo.run_command}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Deployment Time</div>
            <div class="info-value">${new Date().toLocaleString()}</div>
        </div>
    `;

    // Store in history
    deploymentHistory[currentDeploymentId] = {
        githubUrl,
        deployUrl,
        projectInfo,
        timestamp: new Date().toISOString()
    };

    showToast('🎉 Deployment completed successfully!', 'success');
}

/* ==================== Copy to Clipboard ==================== */

document.getElementById('copy-github').addEventListener('click', () => {
    const url = document.getElementById('github-link').href;
    copyToClipboard(url, 'GitHub link');
});

document.getElementById('copy-deploy').addEventListener('click', () => {
    const url = document.getElementById('deploy-link').href;
    copyToClipboard(url, 'Deployment link');
});

function copyToClipboard(text, label) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(`📋 ${label} copied to clipboard`, 'success');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

/* ==================== Result Page Actions ==================== */

document.getElementById('new-deploy-btn').addEventListener('click', () => {
    // Reset and go back to upload page
    document.getElementById('remove-file').click();
    switchPage('upload');
});

document.getElementById('view-github-btn').addEventListener('click', () => {
    const url = document.getElementById('github-link').href;
    window.open(url, '_blank');
});

/* ==================== Deployments Page ==================== */

async function loadAllDeployments() {
    const deploymentsList = document.getElementById('deployments-list');
    deploymentsList.innerHTML = '<p class="empty-state">Loading...</p>';

    const deployments = await getAllDeployments();

    if (Object.keys(deployments).length === 0) {
        deploymentsList.innerHTML = '<p class="empty-state">No deployments yet</p>';
        return;
    }

    deploymentsList.innerHTML = '';

    Object.entries(deployments).forEach(([id, deployment]) => {
        const card = document.createElement('div');
        card.className = 'deployment-card';

        const statusClass = deployment.status.includes('error') ? 'error' :
                          deployment.status === 'completed' ? 'completed' : 'pending';

        card.innerHTML = `
            <div class="deployment-header">
                <span class="deployment-status ${statusClass}">${deployment.status}</span>
                <span class="deployment-time">${new Date(deployment.timestamp).toLocaleString()}</span>
            </div>
            <div class="deployment-info">
                <div class="info-row">
                    <label>ID:</label>
                    <value>${id.substring(0, 8)}</value>
                </div>
                <div class="info-row">
                    <label>Progress:</label>
                    <value>${deployment.progress}%</value>
                </div>
                <div class="info-row">
                    <label>Message:</label>
                    <value>${deployment.message}</value>
                </div>
                ${deployment.github_url ? `
                <div class="info-row">
                    <label>GitHub:</label>
                    <a href="${deployment.github_url}" target="_blank" class="result-link">View Repo</a>
                </div>
                ` : ''}
                ${deployment.deploy_url ? `
                <div class="info-row">
                    <label>Live:</label>
                    <a href="${deployment.deploy_url}" target="_blank" class="result-link">Visit Site</a>
                </div>
                ` : ''}
            </div>
        `;

        deploymentsList.appendChild(card);
    });
}

document.getElementById('refresh-deployments').addEventListener('click', loadAllDeployments);

/* ==================== Settings Page ==================== */

document.getElementById('setting-github-token').value = savedSettings.githubToken;
document.getElementById('setting-render-key').value = savedSettings.renderKey;
document.getElementById('setting-auto-theme').checked = savedSettings.autoTheme;
document.getElementById('setting-notifications').checked = savedSettings.notifications;

document.getElementById('save-settings').addEventListener('click', () => {
    const githubToken = document.getElementById('setting-github-token').value;
    const renderKey = document.getElementById('setting-render-key').value;
    const autoTheme = document.getElementById('setting-auto-theme').checked;
    const notifications = document.getElementById('setting-notifications').checked;

    localStorage.setItem('github_token', githubToken);
    localStorage.setItem('render_key', renderKey);
    localStorage.setItem('auto_theme', autoTheme);
    localStorage.setItem('notifications', notifications);

    savedSettings = { githubToken, renderKey, autoTheme, notifications };

    showToast('⚙️ Settings saved successfully', 'success');
});

document.getElementById('clear-history').addEventListener('click', () => {
    if (confirm('Are you sure? This will clear all deployment history.')) {
        deploymentHistory = {};
        localStorage.removeItem('deployment_history');
        showToast('History cleared', 'success');
    }
});

/* ==================== Toast Notifications ==================== */

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <div class="toast-content">
            <p class="toast-message">${message}</p>
        </div>
        <button class="toast-close">×</button>
    `;

    toastContainer.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.remove();
    });

    setTimeout(() => {
        toast.remove();
    }, 4000);
}

/* ==================== Dashboard Stats ==================== */

function updateDashboardStats() {
    const stats = {
        uploads: Object.keys(deploymentHistory).length,
        deployments: Object.values(deploymentHistory).filter(d => d.status === 'completed').length,
        errors: Object.values(deploymentHistory).filter(d => d.status?.includes('error')).length
    };

    document.getElementById('stat-uploads').textContent = stats.uploads;
    document.getElementById('stat-deployments').textContent = stats.deployments;
    document.getElementById('stat-errors').textContent = stats.errors;
}

/* ==================== Initialize App ==================== */

function initApp() {
    console.log('Initializing AI DevOps App...');
    initTheme();
    updateDashboardStats();
    switchPage('dashboard');

    // Add welcome log
    addLog('Welcome to AI DevOps! Ready to deploy.', 'success');

    showToast('👋 Welcome to AI DevOps!', 'info');
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

/* ==================== Keyboard Shortcuts ==================== */

document.addEventListener('keydown', (e) => {
    // Ctrl+U for upload
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        switchPage('upload');
    }
    // Ctrl+D for dashboard
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        switchPage('dashboard');
    }
});

/* ==================== Error Handling ==================== */

window.addEventListener('error', (e) => {
    console.error('Error:', e.error);
    addLog(`System error: ${e.error.message}`, 'error');
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled rejection:', e.reason);
    addLog(`Unhandled error: ${e.reason}`, 'error');
});
