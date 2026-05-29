const state = {
  selectedFiles: [],
  currentScan: null,
  currentView: "dashboard",
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const elements = {
  themeSelect: $("#themeSelect"),
  languageSelect: $("#languageSelect"),
  imageInput: $("#imageInput"),
  dropZone: $("#dropZone"),
  fileMeta: $("#fileMeta"),
  fileName: $("#fileName"),
  previewGrid: $("#previewGrid"),
  uploadProgress: $("#uploadProgress"),
  aiProgress: $("#aiProgress"),
  scanButton: $("#scanButton"),
  uploadMessage: $("#uploadMessage"),
  scanDot: $("#scanDot"),
  scanSteps: $("#scanSteps"),
  resultsPanel: $("#resultsPanel"),
  resultTitle: $("#resultTitle"),
  medicineName: $("#medicineName"),
  genericName: $("#genericName"),
  composition: $("#composition"),
  batchNumber: $("#batchNumber"),
  expiryBadge: $("#expiryBadge"),
  expiryMessage: $("#expiryMessage"),
  usageText: $("#usageText"),
  dosageText: $("#dosageText"),
  snapshotName: $("#snapshotName"),
  snapshotSummary: $("#snapshotSummary"),
  confidenceValue: $("#confidenceValue"),
  qualityValue: $("#qualityValue"),
  languageValue: $("#languageValue"),
  sideEffects: $("#sideEffects"),
  warnings: $("#warnings"),
  storageText: $("#storageText"),
  alternatives: $("#alternatives"),
  ocrText: $("#ocrText"),
  favoriteButton: $("#favoriteButton"),
  voiceButton: $("#voiceButton"),
  historyList: $("#historyList"),
  chatWindow: $("#chatWindow"),
  chatForm: $("#chatForm"),
  chatInput: $("#chatInput"),
  interactionInput: $("#interactionInput"),
  interactionResults: $("#interactionResults"),
  reminderForm: $("#reminderForm"),
  reminderList: $("#reminderList"),
  toast: $("#toast"),
};

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.setTimeout(() => elements.toast.classList.remove("show"), 3200);
}

function setTheme(theme) {
  document.body.dataset.theme = theme;
  elements.themeSelect.value = theme;
  localStorage.setItem("medicine-theme", theme);
}

function setLanguage(language) {
  elements.languageSelect.value = language;
  localStorage.setItem("medicine-language", language);
}

async function applyLanguageToCurrentScan(language) {
  if (!state.currentScan) return;
  showToast(`Preparing report in ${languageLabel(language)}...`);
  try {
    const data = await apiFetch("/api/translate-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scan: state.currentScan, language }),
    });
    state.currentScan = data.scan;
    renderScan(data.scan);
    showToast(`Report updated to ${languageLabel(language)}.`);
  } catch (error) {
    showToast(error.message);
  }
}

function languageLabel(code) {
  return {
    en: "English",
    hi: "Hindi",
    or: "Odia",
    bn: "Bengali",
  }[code] || "English";
}

function switchView(view) {
  state.currentView = view;
  $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.section === view));
  $$("[data-view]").forEach((panel) => {
    const views = panel.dataset.view.split(" ");
    panel.hidden = !views.includes(view);
  });
}

function setFiles(fileList) {
  const files = Array.from(fileList || []).slice(0, 6);
  if (!files.length) return;

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (files.some((file) => !["image/jpeg", "image/png"].includes(file.type))) {
    showToast("Please upload a jpg, jpeg, or png image.");
    return;
  }
  if (totalSize > 20 * 1024 * 1024) {
    showToast("Total upload is larger than 20 MB.");
    return;
  }

  state.selectedFiles = files;
  elements.fileName.textContent = `${files.length} photo${files.length > 1 ? "s" : ""} selected - ${(totalSize / 1024 / 1024).toFixed(2)} MB`;
  elements.previewGrid.innerHTML = "";
  files.forEach((file) => {
    const image = document.createElement("img");
    image.src = URL.createObjectURL(file);
    image.alt = file.name;
    elements.previewGrid.appendChild(image);
  });
  elements.fileMeta.hidden = false;
  elements.scanButton.disabled = false;
  elements.uploadProgress.style.width = "100%";
  elements.uploadMessage.textContent = "Ready to scan all selected medicine angles.";
}

function startScanAnimation() {
  elements.scanDot.classList.add("active");
  elements.aiProgress.style.width = "0";
  const steps = Array.from(elements.scanSteps.children);
  steps.forEach((step) => step.classList.remove("active"));

  steps.forEach((step, index) => {
    window.setTimeout(() => {
      steps.forEach((item) => item.classList.remove("active"));
      step.classList.add("active");
      elements.aiProgress.style.width = `${(index + 1) * 20}%`;
    }, index * 450);
  });
}

function stopScanAnimation() {
  elements.scanDot.classList.remove("active");
  elements.aiProgress.style.width = "100%";
}

async function apiFetch(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

async function uploadAndScan() {
  if (!state.selectedFiles.length) return;

  const formData = new FormData();
  state.selectedFiles.forEach((file) => formData.append("images", file));
  formData.append("language", elements.languageSelect.value);
  elements.scanButton.disabled = true;
  elements.uploadMessage.textContent = "Scanning image...";
  startScanAnimation();

  try {
    const data = await apiFetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    state.currentScan = data.scan;
    renderScan(data.scan);
    await loadHistory();
    showToast("Medicine scan completed.");
  } catch (error) {
    showToast(error.message);
    elements.uploadMessage.textContent = error.message;
  } finally {
    stopScanAnimation();
    elements.scanButton.disabled = false;
  }
}

function listItems(container, items) {
  container.innerHTML = "";
  (items || []).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    container.appendChild(li);
  });
}

function renderScan(scan) {
  const medicine = scan.medicine;
  const explanation = scan.explanation;

  elements.resultsPanel.hidden = false;
  elements.resultTitle.textContent = `${medicine.brand} - ${scan.confidence}% confidence`;
  elements.medicineName.textContent = medicine.brand;
  elements.genericName.textContent = medicine.generic;
  elements.composition.textContent = medicine.composition;
  elements.batchNumber.textContent = `Batch: ${medicine.batch || "Not detected"} - MFG: ${medicine.manufacturingDate || "Not detected"} - EXP: ${medicine.expiryDate || "Not detected"}`;
  elements.expiryBadge.textContent = scan.expiry.label === "Safe" ? "SAFE" : scan.expiry.label === "Expired" ? "EXPIRED" : scan.expiry.label === "Near Expiry" ? "NEAR EXPIRY" : "UNKNOWN";
  elements.expiryBadge.className = `badge ${scan.expiry.tone}`;
  elements.expiryMessage.textContent = scan.expiry.message;
  elements.usageText.textContent = explanation.uses;
  elements.dosageText.textContent = explanation.dosage || "Follow the label or a clinician's advice.";
  elements.storageText.textContent = explanation.storage;
  elements.snapshotName.textContent = medicine.brand;
  elements.snapshotSummary.textContent = explanation.simpleSummary || explanation.uses;
  elements.confidenceValue.textContent = `${scan.confidence}%`;
  elements.qualityValue.textContent = scan.quality?.label || "Unknown";
  elements.languageValue.textContent = languageLabel(scan.language || elements.languageSelect.value);
  elements.ocrText.textContent = [
    `OCR Engine: ${scan.ocrEngine || "Unknown"}`,
    `AI Engine: ${scan.aiEngine || "Unknown"}`,
    `Image Quality: ${scan.quality?.label || "Unknown"} - ${scan.quality?.message || ""}`,
    `AI Note: ${explanation.confidenceNote || ""}`,
    "",
    scan.rawText,
  ].join("\n");
  elements.favoriteButton.textContent = scan.favorite ? "*" : "+";

  listItems(elements.sideEffects, explanation.sideEffects);
  const warningItems = [...(explanation.warnings || [])];
  if (scan.quality?.label && scan.quality.label !== "Good") {
    warningItems.unshift(scan.quality.message);
  }
  if (explanation.confidenceNote) {
    warningItems.push(explanation.confidenceNote);
  }
  listItems(elements.warnings, warningItems);
  listItems(elements.alternatives, explanation.alternatives);
}

async function loadHistory() {
  const data = await apiFetch("/api/history");
  elements.historyList.innerHTML = "";

  if (!data.scans.length) {
    elements.historyList.innerHTML = "<p class='message'>No scans yet.</p>";
    return;
  }

  data.scans.forEach((scan) => {
    const item = document.createElement("article");
    item.className = "history-item";
    item.innerHTML = `
      <div>
        <strong>${scan.medicine.brand}</strong>
        <p>${scan.expiry.label} - ${scan.aiEngine || "AI"} - ${new Date(scan.createdAt).toLocaleString()}</p>
      </div>
      <button class="ghost-btn" type="button">Open</button>
    `;
    item.querySelector("button").addEventListener("click", () => {
      state.currentScan = scan;
      renderScan(scan);
      switchView("dashboard");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    elements.historyList.appendChild(item);
  });
}

async function toggleFavorite() {
  if (!state.currentScan) {
    showToast("Scan a medicine first.");
    return;
  }
  const favorite = !state.currentScan.favorite;
  await apiFetch("/api/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scanId: state.currentScan.id, favorite }),
  });
  state.currentScan.favorite = favorite;
  elements.favoriteButton.textContent = favorite ? "*" : "+";
  showToast(favorite ? "Saved to favorites." : "Removed from favorites.");
}

function speakExplanation() {
  if (!state.currentScan) {
    showToast("Scan a medicine first.");
    return;
  }
  const text = [
    state.currentScan.explanation.simpleSummary,
    `Expiry status: ${state.currentScan.expiry.label}. ${state.currentScan.expiry.message}`,
    `Warnings: ${state.currentScan.explanation.warnings.join(", ")}.`,
  ].join(" ");

  if (!("speechSynthesis" in window)) {
    showToast("Voice is not supported in this browser.");
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function addChatBubble(text, type) {
  const bubble = document.createElement("div");
  bubble.className = type === "user" ? "user-bubble" : "bot-bubble";
  bubble.textContent = text;
  elements.chatWindow.appendChild(bubble);
  elements.chatWindow.scrollTop = elements.chatWindow.scrollHeight;
  return bubble;
}

async function askChatbot(event) {
  event.preventDefault();
  const question = elements.chatInput.value.trim();
  if (!question) return;
  elements.chatInput.value = "";
  addChatBubble(question, "user");
  const loadingBubble = addChatBubble("Thinking...", "bot");
  const submitButton = elements.chatForm.querySelector("button");
  submitButton.disabled = true;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 18000);

  try {
    const data = await apiFetch("/api/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        question,
        medicineName: state.currentScan?.medicine?.brand || "",
        composition: state.currentScan?.medicine?.composition || "",
        summary: state.currentScan?.explanation?.simpleSummary || "",
        language: elements.languageSelect.value,
      }),
    });
    loadingBubble.textContent = data.answer;
  } catch (error) {
    loadingBubble.textContent = error.name === "AbortError"
      ? "AI Assistant took too long. Check if Ollama is running, or ask a shorter question."
      : error.message;
  } finally {
    window.clearTimeout(timeoutId);
    submitButton.disabled = false;
  }
}

async function checkInteractions() {
  const medicines = elements.interactionInput.value.split(",").map((item) => item.trim()).filter(Boolean);
  if (!medicines.length) {
    showToast("Enter at least two medicines.");
    return;
  }
  const data = await apiFetch("/api/check-interactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ medicines }),
  });
  elements.interactionResults.innerHTML = "";
  data.warnings.forEach((warning) => {
    const item = document.createElement("article");
    item.className = "interaction-item";
    item.innerHTML = `<strong>${warning.severity}</strong><p>${warning.message}</p>`;
    elements.interactionResults.appendChild(item);
  });
}

async function loadReminders() {
  const data = await apiFetch("/api/reminders");
  elements.reminderList.innerHTML = "";
  if (!data.reminders.length) {
    elements.reminderList.innerHTML = "<p class='message'>No reminders saved.</p>";
    return;
  }

  data.reminders.forEach((reminder) => {
    const item = document.createElement("article");
    item.className = "reminder-item";
    item.innerHTML = `
      <div>
        <strong>${reminder.medicine_name} - ${reminder.reminder_time}</strong>
        <p>${reminder.dosage || "Dose not specified"} ${reminder.notes ? `- ${reminder.notes}` : ""}</p>
      </div>
      <button class="ghost-btn" type="button">Delete</button>
    `;
    item.querySelector("button").addEventListener("click", async () => {
      await apiFetch(`/api/reminders/${reminder.id}`, { method: "DELETE" });
      await loadReminders();
      showToast("Reminder deleted.");
    });
    elements.reminderList.appendChild(item);
  });
}

async function saveReminder(event) {
  event.preventDefault();
  await apiFetch("/api/reminders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      medicineName: $("#reminderMedicine").value,
      dosage: $("#reminderDosage").value,
      reminderTime: $("#reminderTime").value,
      notes: $("#reminderNotes").value,
    }),
  });
  elements.reminderForm.reset();
  await loadReminders();
  showToast("Reminder saved. Browser notification scheduling can be added with a service worker.");
}

function bindEvents() {
  elements.themeSelect.addEventListener("change", (event) => setTheme(event.target.value));
  elements.languageSelect.addEventListener("change", (event) => {
    setLanguage(event.target.value);
    applyLanguageToCurrentScan(event.target.value);
  });
  elements.imageInput.addEventListener("change", (event) => setFiles(event.target.files));
  elements.scanButton.addEventListener("click", uploadAndScan);
  elements.favoriteButton.addEventListener("click", toggleFavorite);
  elements.voiceButton.addEventListener("click", speakExplanation);
  elements.chatForm.addEventListener("submit", askChatbot);
  elements.interactionInput.value = "ibuprofen, warfarin";
  $("#interactionButton").addEventListener("click", checkInteractions);
  $("#demoInteractionBtn").addEventListener("click", () => {
    switchView("assistant");
    checkInteractions();
  });
  $("#refreshHistory").addEventListener("click", loadHistory);
  $("#jumpToUpload").addEventListener("click", () => {
    switchView("scanner");
    $("#uploadPanel").scrollIntoView({ behavior: "smooth", block: "center" });
  });
  elements.reminderForm.addEventListener("submit", saveReminder);

  $$(".nav-item").forEach((item) => {
    item.addEventListener("click", () => switchView(item.dataset.section));
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    elements.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.dropZone.classList.add("dragging");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    elements.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.dropZone.classList.remove("dragging");
    });
  });

  elements.dropZone.addEventListener("drop", (event) => {
    setFiles(event.dataTransfer.files);
  });
}

function initNotifications() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}

async function init() {
  setTheme(localStorage.getItem("medicine-theme") || "light-medical");
  setLanguage(localStorage.getItem("medicine-language") || "en");
  bindEvents();
  switchView("dashboard");
  initNotifications();
  await Promise.allSettled([loadHistory(), loadReminders()]);
}

init();
