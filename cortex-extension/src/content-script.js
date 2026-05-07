// content-script.js — CORTEX (self-contained, no ES module imports)

const BASE_URL = "http://localhost:5000";
const TIMEOUT_MS = 3000;

const PLATFORMS = {
  claude: {
    id: "claude", name: "Claude", domains: ["claude.ai"],
    inputSelectors: ['div[contenteditable="true"].ProseMirror', 'div[contenteditable="true"]', 'fieldset div[contenteditable]'],
    messageSelectors: { user: '[data-testid="human-turn-content"]', ai: '[data-testid="ai-turn-content"]' }
  },
  chatgpt: {
    id: "chatgpt", name: "ChatGPT", domains: ["chat.openai.com", "chatgpt.com"],
    inputSelectors: ['#prompt-textarea', 'div[contenteditable="true"]', 'textarea'],
    messageSelectors: { user: '[data-message-author-role="user"]', ai: '[data-message-author-role="assistant"]' }
  },
  gemini: {
    id: "gemini", name: "Gemini", domains: ["gemini.google.com"],
    inputSelectors: ['div[contenteditable="true"].ql-editor', 'rich-textarea div[contenteditable="true"]', 'div[contenteditable="true"]'],
    messageSelectors: { user: 'user-query .query-text', ai: 'model-response .response-content' }
  },
  copilot: {
    id: "copilot", name: "Microsoft Copilot", domains: ["copilot.microsoft.com"],
    inputSelectors: ['textarea#userInput', 'div[contenteditable="true"]', 'textarea'],
    messageSelectors: { user: 'cib-chat-turn[type="user"]', ai: 'cib-chat-turn[type="bot"]' }
  }
};

function detectPlatform(url) {
  if (!url) return null;
  let hostname;
  try { hostname = new URL(url).hostname.replace(/^www\./, ""); } catch { return null; }
  for (const platform of Object.values(PLATFORMS)) {
    if (platform.domains.some(d => hostname === d || hostname.endsWith("." + d))) return platform;
  }
  return null;
}

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

async function getBriefing(platformId) {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/inject?platform=${encodeURIComponent(platformId)}`);
    if (!res || !res.ok) return null;
    const data = await res.json();
    return data.briefing ?? null;
  } catch { return null; }
}

async function postExtract(platformId, conversationText) {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: platformId, conversation: conversationText, captured_at: new Date().toISOString() })
    });
    return res?.ok ?? false;
  } catch { return false; }
}

// ── Main ──────────────────────────────────────────────────────────────────────
const platform = detectPlatform(window.location.href);
let injected = false;

if (platform) {
  console.log(`[CORTEX] Active on ${platform.name}`);
  init();
}

async function init() {
  if (document.readyState !== "complete") {
    await new Promise(r => window.addEventListener("load", r, { once: true }));
  }
  await sleep(800);
  await tryInject();
  startSPAObserver();
}

async function tryInject() {
  if (injected) return;
  const input = findInput();
  if (!input) return;
  const briefing = await getBriefing(platform.id);
  if (!briefing) { console.log("[CORTEX] Vault is empty or server is down"); return; }
  const success = injectBriefing(input, briefing);
  if (success) {
    injected = true;
    console.log("[CORTEX] Injected into", platform.name);
    showToast(`CORTEX context loaded for ${platform.name}`);
    chrome.runtime.sendMessage({ type: "CORTEX_INJECT_DONE", platformId: platform.id });
  }
}

function findInput() {
  for (const selector of platform.inputSelectors) {
    const el = document.querySelector(selector);
    if (el) return el;
  }
  return null;
}

function injectBriefing(inputEl, briefing) {
  try {
    const tag = inputEl.tagName.toLowerCase();
    if (tag === "textarea") {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      setter.call(inputEl, briefing);
      inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    } else if (inputEl.getAttribute("contenteditable") === "true") {
      inputEl.focus();
      document.execCommand("selectAll", false, null);
      document.execCommand("insertText", false, briefing);
      if (!inputEl.innerText.includes(briefing.slice(0, 20))) {
        inputEl.innerText = briefing;
        inputEl.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
    return true;
  } catch (err) { console.error("[CORTEX] Injection failed:", err); return false; }
}

function startSPAObserver() {
  let lastUrl = window.location.href;
  setInterval(() => {
    const cur = window.location.href;
    if (cur !== lastUrl) {
      lastUrl = cur;
      injected = false;
      sleep(1000).then(tryInject);
    }
  }, 500);

  new MutationObserver(async () => {
    if (injected) return;
    const input = findInput();
    if (input) { await sleep(300); await tryInject(); }
  }).observe(document.body, { childList: true, subtree: true });
}

async function extractConversation() {
  const { user: userSel, ai: aiSel } = platform.messageSelectors;
  const userMsgs = [...document.querySelectorAll(userSel)].map(el => `[User]: ${el.innerText.trim()}`).join("\n\n");
  const aiMsgs   = [...document.querySelectorAll(aiSel)].map(el => `[${platform.name}]: ${el.innerText.trim()}`).join("\n\n");
  const text = `${userMsgs}\n\n${aiMsgs}`.trim();
  if (!text) { console.log("[CORTEX] No conversation found"); return; }
  const ok = await postExtract(platform.id, text);
  console.log(`[CORTEX] Extraction ${ok ? "succeeded" : "failed"}`);
  chrome.runtime.sendMessage({ type: "CORTEX_EXTRACTION_DONE", platformId: platform.id, charCount: text.length });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CORTEX_INJECT")   { injected = false; tryInject().then(() => sendResponse({ ok: true })); return true; }
  if (message.type === "CORTEX_EXTRACT")  { extractConversation().then(() => sendResponse({ ok: true })); return true; }
});

function showToast(message) {
  const toast = document.createElement("div");
  toast.textContent = "⬡ " + message;
  Object.assign(toast.style, {
    position: "fixed", bottom: "24px", right: "24px",
    background: "#1a1a2e", color: "#e0e0ff", padding: "10px 18px",
    borderRadius: "8px", fontSize: "13px", fontFamily: "system-ui, sans-serif",
    zIndex: "999999", opacity: "0", transition: "opacity 0.3s ease",
    pointerEvents: "none", border: "1px solid rgba(255,255,255,0.1)"
  });
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = "1"; });
  setTimeout(() => { toast.style.opacity = "0"; setTimeout(() => toast.remove(), 400); }, 2500);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
