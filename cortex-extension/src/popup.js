// popup.js — CORTEX Popup (no ES module imports)

const BASE_URL = "http://localhost:5000";
const TIMEOUT_MS = 3000;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch { clearTimeout(timer); return null; }
}

async function checkHealth() {
  try { const r = await fetchWithTimeout(`${BASE_URL}/health`); return r?.ok ?? false; } catch { return false; }
}

async function exportVault() {
  try {
    const r = await fetchWithTimeout(`${BASE_URL}/vault/export`);
    return r?.ok ? await r.json() : null;
  } catch { return null; }
}

async function importVault(passport) {
  try {
    const r = await fetchWithTimeout(`${BASE_URL}/vault/import`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(passport)
    });
    return r?.ok ?? false;
  } catch { return false; }
}

function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── DOM refs ──────────────────────────────────────────────────────────────────
const serverDot     = document.getElementById("server-dot");
const serverStatus  = document.getElementById("server-status");
const platformBadge = document.getElementById("platform-badge");
const btnInject     = document.getElementById("btn-inject");
const btnExtract    = document.getElementById("btn-extract");
const btnExport     = document.getElementById("btn-export");
const btnImport     = document.getElementById("btn-import");
const importFile    = document.getElementById("import-file");
const toast         = document.getElementById("toast");

let currentPlatformId = null;
let currentTab = null;

async function init() {
  await Promise.all([checkBackend(), checkCurrentTab()]);
}

async function checkBackend() {
  const alive = await checkHealth();
  if (alive) {
    serverDot.className = "status-dot";
    serverStatus.innerHTML = `Backend <span>online</span> · localhost:5000`;
  } else {
    serverDot.className = "status-dot offline";
    serverStatus.innerHTML = `Backend <span style="color:#f87171">offline</span> — run npm run dev`;
    btnInject.disabled = btnExtract.disabled = btnExport.disabled = true;
  }
}

async function checkCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;
  const status = await chrome.runtime.sendMessage({ type: "CORTEX_STATUS_REQUEST" });
  if (status?.isAI) {
    currentPlatformId = status.platform;
    platformBadge.className = "platform-badge visible";
    platformBadge.innerHTML = `Active platform: <strong>${status.platformName}</strong>`;
  } else {
    platformBadge.className = "platform-badge visible";
    platformBadge.innerHTML = `Open Claude, ChatGPT, or Gemini to use CORTEX`;
    btnInject.disabled = btnExtract.disabled = true;
  }
}

btnInject.addEventListener("click", async () => {
  if (!currentPlatformId || !currentTab) return;
  btnInject.disabled = true; btnInject.textContent = "Injecting…";
  try {
    await chrome.tabs.sendMessage(currentTab.id, { type: "CORTEX_INJECT", platformId: currentPlatformId });
    showToast("✓ Context injected!");
  } catch { showToast("⚠ Injection failed — refresh the page"); }
  btnInject.textContent = "⬡  Inject Context Now"; btnInject.disabled = false;
});

btnExtract.addEventListener("click", async () => {
  if (!currentPlatformId || !currentTab) return;
  btnExtract.disabled = true; btnExtract.textContent = "Extracting…";
  try {
    await chrome.tabs.sendMessage(currentTab.id, { type: "CORTEX_EXTRACT", platformId: currentPlatformId });
    showToast("✓ Conversation extracted!");
  } catch { showToast("⚠ Extraction failed"); }
  btnExtract.textContent = "↑  Extract Current Conversation"; btnExtract.disabled = false;
});

btnExport.addEventListener("click", async () => {
  btnExport.disabled = true; btnExport.textContent = "Exporting…";
  const vault = await exportVault();
  if (vault) {
    const passport = { cortex_passport: true, version: "1.0.0", exported_at: new Date().toISOString(), vault };
    downloadJSON(passport, `cortex-passport-${new Date().toISOString().slice(0,10)}.cortex.json`);
    showToast("✓ Passport exported!");
  } else {
    showToast("⚠ Export failed — is backend running?");
  }
  btnExport.textContent = "↓  Export Passport (.cortex.json)"; btnExport.disabled = false;
});

btnImport.addEventListener("click", () => importFile.click());

importFile.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  btnImport.disabled = true; btnImport.textContent = "Importing…";
  try {
    const text = await file.text();
    const passport = JSON.parse(text);
    if (!passport?.cortex_passport) { showToast("⚠ Not a valid CORTEX passport"); return; }
    const ok = await importVault(passport.vault);
    showToast(ok ? "✓ Passport imported!" : "⚠ Import failed");
  } catch { showToast("⚠ Could not read file"); }
  btnImport.textContent = "↑  Import Passport"; btnImport.disabled = false; importFile.value = "";
});

function showToast(msg) {
  toast.textContent = msg; toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

init();
