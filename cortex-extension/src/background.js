// background.js — CORTEX Service Worker (no ES module imports)

const BASE_URL = "http://localhost:5001";
const TIMEOUT_MS = 10000;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    return null;
  }
}

const PLATFORMS = {
  claude:   { id: "claude",   name: "Claude",            domains: ["claude.ai"] },
  chatgpt:  { id: "chatgpt",  name: "ChatGPT",           domains: ["chat.openai.com", "chatgpt.com"] },
  gemini:   { id: "gemini",   name: "Gemini",            domains: ["gemini.google.com"] },
  copilot:  { id: "copilot",  name: "Microsoft Copilot", domains: ["copilot.microsoft.com"] }
};

function detectPlatform(url) {
  if (!url) return null;
  let hostname;
  try { hostname = new URL(url).hostname.replace(/^www\./, ""); } catch { return null; }
  for (const p of Object.values(PLATFORMS)) {
    if (p.domains.some(d => hostname === d || hostname.endsWith("." + d))) return p;
  }
  return null;
}

// Track which tab is on which platform (for popup status only)
const tabPlatforms = {};

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId).catch(() => null);
  if (tab?.url) trackPlatform(tabId, tab.url);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && changeInfo.url) trackPlatform(tabId, changeInfo.url);
});

// Only tracks the platform — no auto-injection or auto-extraction
function trackPlatform(tabId, url) {
  const platform = detectPlatform(url);
  if (!platform) {
    delete tabPlatforms[tabId];
    return;
  }
  const prev = tabPlatforms[tabId];
  tabPlatforms[tabId] = platform.id;
  if (prev !== platform.id) {
    console.log(`[CORTEX BG] Detected platform: ${platform.name}`);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CORTEX_STATUS_REQUEST") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const platform = tabs[0]?.url ? detectPlatform(tabs[0].url) : null;
      sendResponse({ platform: platform?.id ?? null, platformName: platform?.name ?? null, isAI: !!platform });
    });
    return true;
  }

  if (message.type === "CORTEX_EXTRACT_API") {
    fetchWithTimeout(`${BASE_URL}/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message.payload)
    }).then(res => sendResponse({ ok: res?.ok ?? false }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message.type === "CORTEX_INJECT_API") {
    fetchWithTimeout(`${BASE_URL}/inject?platform=${encodeURIComponent(message.platform)}`)
      .then(res => res ? res.json() : null)
      .then(data => sendResponse({ ok: !!data, briefing: data?.briefing }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message.type === "CORTEX_INJECT_CONV_API") {
    fetchWithTimeout(`${BASE_URL}/inject-conversation/${message.id}`)
      .then(res => res ? res.json() : null)
      .then(data => sendResponse({ ok: !!data, briefing: data?.briefing }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message.type === "CORTEX_HEALTH_CHECK") {
    fetchWithTimeout(`${BASE_URL}/health`)
      .then(res => sendResponse({ ok: res?.ok ?? false }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message.type === "CORTEX_VAULT_EXPORT") {
    fetchWithTimeout(`${BASE_URL}/vault/export`)
      .then(res => res ? res.json() : null)
      .then(data => sendResponse({ ok: !!data, data }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message.type === "CORTEX_VAULT_IMPORT") {
    fetchWithTimeout(`${BASE_URL}/vault/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message.data)
    }).then(res => sendResponse({ ok: res?.ok ?? false }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message.type === "CORTEX_CONVERSATIONS_API") {
    fetchWithTimeout(`${BASE_URL}/api/conversations`)
      .then(res => res ? res.json() : null)
      .then(data => sendResponse({ ok: !!data, data }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message.type === "CORTEX_INJECT_CONV_API") {
    fetchWithTimeout(`${BASE_URL}/inject-conversation/${message.id}`)
      .then(res => res ? res.json() : null)
      .then(data => sendResponse({ ok: !!data, briefing: data?.briefing }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }

  sendResponse({ ok: true });
});

chrome.tabs.onRemoved.addListener((tabId) => { delete tabPlatforms[tabId]; });
