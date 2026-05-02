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

const tabPlatforms = {};
const lastExtractTime = {};
const EXTRACT_DEBOUNCE_MS = 5 * 60 * 1000;

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId).catch(() => null);
  if (tab?.url) await handleNavigation(tabId, tab.url);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && changeInfo.url) await handleNavigation(tabId, changeInfo.url);
});

async function handleNavigation(tabId, url) {
  const platform = detectPlatform(url);
  if (!platform) { delete tabPlatforms[tabId]; return; }
  const prev = tabPlatforms[tabId];
  tabPlatforms[tabId] = platform.id;
  if (prev !== platform.id) {
    console.log(`[CORTEX BG] Switch → ${platform.name}`);
    chrome.tabs.sendMessage(tabId, { type: "CORTEX_INJECT", platformId: platform.id }).catch(() => {});
    if (prev && prev !== platform.id) triggerExtraction(tabId, prev);
  }
}

function triggerExtraction(tabId, platformId) {
  const now = Date.now();
  if (now - (lastExtractTime[platformId] ?? 0) < EXTRACT_DEBOUNCE_MS) return;
  lastExtractTime[platformId] = now;
  chrome.tabs.sendMessage(tabId, { type: "CORTEX_EXTRACT", platformId }).catch(() => {});
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
