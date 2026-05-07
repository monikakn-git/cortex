// content-script.js — CORTEX (self-contained, no ES module imports)

const BASE_URL = "http://localhost:5001";
const TIMEOUT_MS = 10000;

const PLATFORMS = {
  claude: {
    id: "claude", name: "Claude", domains: ["claude.ai"],
    inputSelectors: ['div[contenteditable="true"].ProseMirror', 'div[contenteditable="true"]', 'fieldset div[contenteditable]'],
    titleSelectors: ['div.font-medium.truncate', 'title'],
    messageSelectors: { user: '[data-testid="human-turn-content"]', ai: '[data-testid="ai-turn-content"]' }
  },
  chatgpt: {
    id: "chatgpt", name: "ChatGPT", domains: ["chat.openai.com", "chatgpt.com"],
    inputSelectors: ['#prompt-textarea', 'div[contenteditable="true"]', 'textarea'],
    titleSelectors: ['nav a.flex.py-3.px-3.items-center.gap-3.relative.rounded-md.bg-token-sidebar-surface-tertiary', 'title', 'div.font-semibold'],
    messageSelectors: { 
      user: '[data-message-author-role="user"], .user-message, .message-user', 
      ai: '[data-message-author-role="assistant"], .markdown.prose, .assistant-message, .message-assistant' 
    }
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

if (platform) {
  console.log(`[CORTEX] Active on ${platform.name} — waiting for user action`);
}

// ── Injection (only triggered by user clicking popup button) ─────────────────

async function tryInject(manualBriefing = null) {
  const currentPlatform = platform || detectPlatform(window.location.href);
  if (!currentPlatform) return false;

  const input = findInput(currentPlatform);
  if (!input) {
    console.warn("[CORTEX] No input field found on page");
    return false;
  }

  const briefing = manualBriefing || await getBriefing(currentPlatform.id);
  if (!briefing) {
    console.log("[CORTEX] Context is empty or server is down");
    showToast("⚠ Context is empty or server is down");
    return false;
  }

  const success = injectBriefing(input, briefing);
  if (success) {
    console.log("[CORTEX] Injected into", currentPlatform.name);
    showToast(`CORTEX context loaded for ${currentPlatform.name}`);
  }
  return success;
}

function findInput(p) {
  const currentP = p || platform || detectPlatform(window.location.href);
  if (!currentP) return null;
  for (const selector of currentP.inputSelectors) {
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

// ── Extraction (interleaved in DOM order) ────────────────────────────────────

async function extractConversation() {
  // Ensure platform is detected (in case of SPA navigation)
  const currentPlatform = platform || detectPlatform(window.location.href);
  if (!currentPlatform) {
    throw new Error("Platform not supported or not detected");
  }

  const { user: userSel, ai: aiSel } = currentPlatform.messageSelectors;

  // Build a combined selector
  const combinedSelector = `${userSel}, ${aiSel}`;
  const allNodes = document.querySelectorAll(combinedSelector);

  console.log(`[CORTEX] Extraction attempt on ${currentPlatform.name}: Found ${allNodes.length} nodes`);

  if (allNodes.length === 0) {
    console.warn("[CORTEX] Extraction aborted: No conversation messages found with current selectors.");
    return { ok: false, error: "No messages found. Try refreshing the page." };
  }

  const lines = [];
  for (const node of allNodes) {
    const content = node.innerText.trim();
    if (!content) continue;

    if (node.matches(userSel)) {
      lines.push(`[User]: ${content}`);
    } else {
      // If it's not a user node, it's an AI node (since we used a combined selector)
      lines.push(`[${currentPlatform.name}]: ${content}`);
    }
  }

  const text = lines.join("\n\n").trim();

  if (!text) {
    return { ok: false, error: "Messages found but they were empty." };
  }

  // Extract clean title from page
  let chatTitle = "";
  if (currentPlatform.titleSelectors) {
    for (const sel of currentPlatform.titleSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText.trim()) {
        chatTitle = el.innerText.trim();
        break;
      }
    }
  }

  if (!chatTitle) {
    chatTitle = document.title
      .replace(/^(ChatGPT|Claude|Gemini|Copilot)\s*-\s*/i, "")
      .replace(/\s*-\s*(ChatGPT|Claude|Gemini|Copilot)$/i, "")
      .trim();
  }
  
  if (chatTitle === "ChatGPT" || chatTitle === "Claude" || chatTitle === "Gemini" || !chatTitle || chatTitle === "New Chat") {
    chatTitle = `${currentPlatform.name} Chat (${new Date().toLocaleTimeString()})`;
  }

  const ok = await postExtract(currentPlatform.id, text, chatTitle);
  if (ok) {
    showToast(`✓ Extracted: ${chatTitle}`);
    return { ok: true, count: lines.length };
  } else {
    return { ok: false, error: "Server error. Is the backend running?" };
  }
}

// ── Message listener (robust error handling) ─────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CORTEX_INJECT") {
    tryInject(message.briefing)
      .then((ok) => sendResponse({ ok }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
  if (message.type === "CORTEX_EXTRACT") {
    extractConversation()
      .then((res) => sendResponse(res))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
});

// ── UI helpers ───────────────────────────────────────────────────────────────

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
