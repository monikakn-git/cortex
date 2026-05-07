// background.js — CORTEX Service Worker (no ES module imports)

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
  sendResponse({ ok: true });
});

chrome.tabs.onRemoved.addListener((tabId) => { delete tabPlatforms[tabId]; });
