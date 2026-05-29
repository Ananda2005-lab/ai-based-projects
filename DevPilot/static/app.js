const fileInput = document.querySelector("#fileInput");
const dropzone = document.querySelector("#dropzone");
const selectedFile = document.querySelector("#selectedFile");
const uploadForm = document.querySelector("#uploadForm");
const startButton = document.querySelector("#startButton");
const progressBar = document.querySelector("#progressBar");
const progressText = document.querySelector("#progressText");
const overallStatus = document.querySelector("#overallStatus");
const logsPanel = document.querySelector("#logs");
const themeSelect = document.querySelector("#themeSelect");
const githubLink = document.querySelector("#githubLink");
const renderLink = document.querySelector("#renderLink");
const toast = document.querySelector("#toast");
const steps = [...document.querySelectorAll("#steps li")];
const repoNameInput = document.querySelector("#repoNameInput");
const serviceNameInput = document.querySelector("#serviceNameInput");
const privateRepoInput = document.querySelector("#privateRepoInput");
const projectSelectorBlock = document.querySelector("#projectSelectorBlock");
const projectSelector = document.querySelector("#projectSelector");
const projectSelectorNote = document.querySelector("#projectSelectorNote");
const projectTypeText = document.querySelector("#projectTypeText");
const buildCommandText = document.querySelector("#buildCommandText");
const startCommandText = document.querySelector("#startCommandText");
const historyList = document.querySelector("#historyList");
const clearHistoryButton = document.querySelector("#clearHistoryButton");
const healthGrid = document.querySelector("#healthGrid");
const userPill = document.querySelector("#userPill");
const heroStatus = document.querySelector("#heroStatus");
const heroStatusNote = document.querySelector("#heroStatusNote");
const deployHealth = document.querySelector("#deployHealth");
const deployHealthNote = document.querySelector("#deployHealthNote");
const heroLinkText = document.querySelector("#heroLinkText");
const heroLinkNote = document.querySelector("#heroLinkNote");
const openGithubButton = document.querySelector("#openGithubButton");
const openRenderButton = document.querySelector("#openRenderButton");
const copyLogsButton = document.querySelector("#copyLogsButton");
const toggleAutoscrollButton = document.querySelector("#toggleAutoscrollButton");
const logSearchInput = document.querySelector("#logSearchInput");

let currentProjectId = null;
let statusTimer = null;
let autoScrollLogs = true;
let latestLogs = ["Ready."];
let currentCandidates = [];
let pendingProjectSelection = false;

const pipelineOrder = ["Uploading", "Analyzing", "GitHub Push", "Deploying", "Done"];

themeSelect.addEventListener("change", () => {
  document.body.dataset.theme = themeSelect.value;
  localStorage.setItem("aiDevopsTheme", themeSelect.value);
});

const savedTheme = localStorage.getItem("aiDevopsTheme");
if (savedTheme) {
  themeSelect.value = savedTheme;
  document.body.dataset.theme = savedTheme;
}

renderHistory();
loadConfigStatus();

dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropzone.classList.add("dragging");
});

dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("dragging");
});

dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropzone.classList.remove("dragging");
  const file = event.dataTransfer.files[0];
  if (file) {
    resetPendingSelection();
    fileInput.files = event.dataTransfer.files;
    showSelectedFile(file);
  }
});

fileInput.addEventListener("change", () => {
  if (fileInput.files[0]) {
    resetPendingSelection();
    showSelectedFile(fileInput.files[0]);
  }
});

uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = fileInput.files[0];
  if (!file) {
    showToast("Choose a .zip file first.");
    return;
  }

  setBusy(true);
  if (!pendingProjectSelection) {
    resetUi();
  }

  try {
    if (!pendingProjectSelection) {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResult = await apiForm("/upload", formData);
      currentProjectId = uploadResult.project_id;
      syncProjectCandidates(uploadResult.status);
      startStatusPolling();

      if ((uploadResult.status.project_candidates || []).length > 1) {
        pendingProjectSelection = true;
        overallStatus.textContent = "Project Selection";
        showToast("Multiple project folders detected. Choose one and click Start again.");
        return;
      }
    }

    await apiJson("/analyze", {
      project_id: currentProjectId,
      selected_project_key: projectSelector.value || "",
    });
    await apiJson("/push-github", {
      project_id: currentProjectId,
      repo_name: repoNameInput.value.trim(),
      private: privateRepoInput.checked,
    });
    await apiJson("/deploy", {
      project_id: currentProjectId,
      service_name: serviceNameInput.value.trim(),
    });

    await refreshStatus();
    showToast("Render service created. Monitoring deploy status.");
  } catch (error) {
    showToast(error.message);
    await refreshStatus();
  } finally {
    setBusy(false);
  }
});

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const link = document.querySelector(`#${button.dataset.copy}`);
    const value = link.href && link.href !== window.location.href + "#" ? link.href : "";
    if (!value) {
      showToast("Nothing to copy yet.");
      return;
    }
    await navigator.clipboard.writeText(value);
    showToast("Copied link.");
  });
});

clearHistoryButton.addEventListener("click", () => {
  localStorage.removeItem("aiDevopsHistory");
  renderHistory();
  showToast("Deployment history cleared.");
});

openGithubButton.addEventListener("click", () => openLinkIfReady(githubLink.href, "GitHub link is not ready yet."));
openRenderButton.addEventListener("click", () => openLinkIfReady(renderLink.href, "Live link is not ready yet."));

copyLogsButton.addEventListener("click", async () => {
  await navigator.clipboard.writeText(latestLogs.join("\n"));
  showToast("Logs copied.");
});

toggleAutoscrollButton.addEventListener("click", () => {
  autoScrollLogs = !autoScrollLogs;
  toggleAutoscrollButton.textContent = autoScrollLogs ? "Auto-scroll On" : "Auto-scroll Off";
});

logSearchInput.addEventListener("input", () => {
  renderLogs();
});

function showSelectedFile(file) {
  selectedFile.textContent = `${file.name} (${formatBytes(file.size)})`;
  const baseName = file.name.replace(/\.zip$/i, "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  if (!repoNameInput.value) repoNameInput.placeholder = `${baseName || "project"}-auto`;
  if (!serviceNameInput.value) serviceNameInput.placeholder = `${baseName || "project"}-auto`;
}

async function apiForm(url, body) {
  const response = await fetch(url, { method: "POST", body });
  return parseResponse(response);
}

async function apiJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseResponse(response);
}

async function parseResponse(response) {
  const payload = await response.json();
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || "Request failed.");
  }
  return payload;
}

function startStatusPolling() {
  clearInterval(statusTimer);
  statusTimer = setInterval(refreshStatus, 1500);
  refreshStatus();
}

async function refreshStatus() {
  if (!currentProjectId) return;
  const response = await fetch(`/status?project_id=${encodeURIComponent(currentProjectId)}`);
  const payload = await response.json();
  if (payload.status) {
    renderStatus(payload.status);
    if (payload.status.status === "Done" || payload.status.status === "Error") {
      clearInterval(statusTimer);
    }
  }
}

function renderStatus(status) {
  const progress = status.progress || 0;
  progressBar.style.width = `${progress}%`;
  progressText.textContent = `${progress}%`;
  overallStatus.textContent = status.status || "Idle";
  latestLogs = status.logs || ["Ready."];
  renderLogs();
  updateSteps(status.status);
  renderInsights(status);
  renderHero(status);
  syncProjectCandidates(status);

  if (status.github_url) {
    githubLink.textContent = status.github_url;
    githubLink.href = status.github_url;
  }

  if (status.render_url) {
    renderLink.textContent = status.render_url;
    renderLink.href = status.render_url;
  }

  if (status.status === "Done") {
    saveDeployment(status);
  }
}

function updateSteps(activeStatus) {
  const normalizedStatus = activeStatus === "Render Service Created" || activeStatus === "Render Building"
    ? "Deploying"
    : activeStatus;
  const activeIndex = pipelineOrder.findIndex((step) => normalizedStatus && normalizedStatus.startsWith(step));
  steps.forEach((step, index) => {
    step.classList.toggle("done", activeIndex > index || normalizedStatus === "Done");
    step.classList.toggle("active", activeIndex === index);
  });
}

function resetUi() {
  githubLink.textContent = "Waiting for repo";
  githubLink.href = "#";
  renderLink.textContent = "Waiting for deploy";
  renderLink.href = "#";
  projectTypeText.textContent = "Not analyzed";
  buildCommandText.textContent = "Waiting";
  startCommandText.textContent = "Waiting";
  currentCandidates = [];
  pendingProjectSelection = false;
  projectSelector.innerHTML = "";
  projectSelectorBlock.hidden = true;
  latestLogs = ["Starting..."];
  renderLogs();
  renderStatus({ status: "Uploading", progress: 5, logs: ["Starting upload..."] });
}

function resetPendingSelection() {
  currentProjectId = null;
  currentCandidates = [];
  pendingProjectSelection = false;
  clearInterval(statusTimer);
}

function setBusy(isBusy) {
  startButton.disabled = isBusy;
  fileInput.disabled = isBusy;
  startButton.classList.toggle("is-loading", isBusy);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3200);
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${units[index]}`;
}

function renderInsights(status) {
  projectTypeText.textContent = status.project_type || "Not analyzed";
  buildCommandText.textContent = status.build_command || "Waiting";
  startCommandText.textContent = status.start_command || "Waiting";
}

function syncProjectCandidates(status) {
  const candidates = status.project_candidates || [];
  currentCandidates = candidates;
  if (!candidates.length) {
    projectSelector.innerHTML = "";
    projectSelectorBlock.hidden = true;
    return;
  }

  projectSelectorBlock.hidden = false;
  projectSelector.innerHTML = candidates.map((candidate) => `
    <option value="${escapeHtml(candidate.key)}">${escapeHtml(candidate.relative_path)}</option>
  `).join("");
  projectSelector.value = status.selected_project_key || candidates[0].key;
  projectSelectorNote.textContent = candidates.length > 1
    ? `Detected ${candidates.length} deployable folders. The whole zip will be pushed to GitHub, and this selected folder will be used for Render.`
    : "One deployable project folder was detected. GitHub gets the full zip contents and Render uses this folder.";
}

function renderHero(status) {
  heroStatus.textContent = status.status || "Idle";
  heroStatusNote.textContent = heroStatusDescription(status.status, status.progress || 0);
  deployHealth.textContent = status.error
    ? "Needs attention"
    : status.deploy_status
      ? status.deploy_status.replaceAll("_", " ")
      : status.status === "Done"
        ? "Healthy"
        : "Monitoring";
  deployHealthNote.textContent = status.error || status.render_poll_error || "Pipeline checks are healthy so far.";
  heroLinkText.textContent = status.render_url || "Not available yet";
  heroLinkNote.textContent = status.github_url ? "GitHub and Render links are attached below." : "Links will appear after push and deploy.";
}

function heroStatusDescription(status, progress) {
  if (!status) return "Waiting for your next upload.";
  if (status === "Done") return "Deployment completed and live checks passed.";
  if (status === "Error") return "The pipeline stopped. Check logs for the exact failure.";
  if (status === "Render Building" || status === "Render Service Created") return "Render accepted the service and is finishing the rollout.";
  return `Pipeline progress is at ${progress}%.`;
}

function renderLogs() {
  const query = logSearchInput.value.trim().toLowerCase();
  const visibleLogs = query
    ? latestLogs.filter((line) => line.toLowerCase().includes(query))
    : latestLogs;
  logsPanel.textContent = visibleLogs.join("\n") || "No logs match this search.";
  if (autoScrollLogs) {
    logsPanel.scrollTop = logsPanel.scrollHeight;
  }
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem("aiDevopsHistory") || "[]");
  } catch {
    return [];
  }
}

function saveDeployment(status) {
  if (!status.render_url && !status.github_url) return;
  const existing = getHistory();
  if (existing.some((item) => item.id === status.id)) return;

  const next = [
    {
      id: status.id,
      name: status.zip_name || "Project",
      projectType: status.project_type || "Unknown",
      githubUrl: status.github_url,
      renderUrl: status.render_url,
      createdAt: new Date().toLocaleString(),
    },
    ...existing,
  ].slice(0, 6);

  localStorage.setItem("aiDevopsHistory", JSON.stringify(next));
  renderHistory();
}

function renderHistory() {
  const items = getHistory();
  if (!items.length) {
    historyList.innerHTML = '<p class="empty-state">No deployments yet.</p>';
    return;
  }

  historyList.innerHTML = items.map((item) => `
    <article class="history-item ${item.renderUrl ? "is-clickable" : ""}" ${item.renderUrl ? `data-live-url="${escapeHtml(item.renderUrl)}"` : ""}>
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <small>${escapeHtml(item.projectType)} · ${escapeHtml(item.createdAt)}</small>
      </div>
      <div class="history-actions">
        ${item.githubUrl ? `<a href="${item.githubUrl}" target="_blank" rel="noreferrer">GitHub</a>` : ""}
        ${item.renderUrl ? `<a href="${item.renderUrl}" target="_blank" rel="noreferrer">Open Live</a>` : ""}
      </div>
    </article>
  `).join("");

  historyList.querySelectorAll(".history-item[data-live-url]").forEach((item) => {
    item.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        return;
      }
      window.open(item.dataset.liveUrl, "_blank", "noopener,noreferrer");
    });
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function openLinkIfReady(href, emptyMessage) {
  if (!href || href.endsWith("#")) {
    showToast(emptyMessage);
    return;
  }
  window.open(href, "_blank", "noopener,noreferrer");
}

async function loadConfigStatus() {
  try {
    const response = await fetch("/config-status");
    const payload = await response.json();
    if (!payload.ok) return;
    userPill.textContent = payload.username || "Admin";
    healthGrid.innerHTML = payload.checks.map((check) => `
      <span class="health-chip ${check.ready ? "ready" : "missing"}">
        ${escapeHtml(check.label)}: ${check.ready ? "Ready" : check.optional ? "Auto" : "Missing"}
      </span>
    `).join("");
  } catch {
    healthGrid.innerHTML = '<span class="health-chip missing">Config check unavailable</span>';
  }
}
