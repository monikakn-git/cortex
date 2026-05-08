// src/routes/conversationRoutes.ts — Stored conversation endpoints
import { Router } from 'express';
import * as fs from 'fs';
import * as yaml from 'yaml';

const router = Router();
const CONVERSATIONS_FILE = 'storage/conversations.yaml';

export interface StoredConversation {
  id: string;
  platform: string;
  title: string;
  extracted_at: string;
  preview: string;
  message_count: number;
  char_count: number;
  content: string;
}

interface ConversationsStore {
  conversations: StoredConversation[];
}

function loadStore(): ConversationsStore {
  if (!fs.existsSync(CONVERSATIONS_FILE)) return { conversations: [] };
  try {
    const raw = fs.readFileSync(CONVERSATIONS_FILE, 'utf-8');
    return yaml.parse(raw) || { conversations: [] };
  } catch {
    return { conversations: [] };
  }
}

function saveStore(store: ConversationsStore): void {
  fs.mkdirSync('storage', { recursive: true });
  fs.writeFileSync(CONVERSATIONS_FILE, yaml.stringify(store), 'utf-8');
}

/**
 * Simple hash function for deduplication.
 * Uses first 500 chars + message count to create a fingerprint.
 */
export function hashConversation(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const chr = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return 'conv_' + Math.abs(hash).toString(36);
}

/**
 * Save a conversation. Returns { saved: true } or { duplicate: true }.
 */
export function saveConversation(
  platform: string,
  content: string,
  title?: string
): { saved: boolean; duplicate: boolean; id: string } {
  const store = loadStore();
  const id = hashConversation(content);

  // Deduplication check
  if (store.conversations.some(c => c.id === id)) {
    console.log(`[Conversations] Duplicate detected: ${id}`);
    return { saved: false, duplicate: true, id };
  }

  // Count messages (lines starting with [User] or [PlatformName])
  const lines = content.split('\n').filter(l => l.trim().startsWith('['));
  const messageCount = lines.length;

  // Generate preview (first 200 chars, cleaned up)
  const preview = content
    .replace(/\n{2,}/g, ' | ')
    .replace(/\n/g, ' ')
    .slice(0, 200)
    .trim();

  const conversation: StoredConversation = {
    id,
    platform,
    title: title || `${platform} Chat`,
    extracted_at: new Date().toISOString(),
    preview,
    message_count: messageCount,
    char_count: content.length,
    content,
  };

  store.conversations.unshift(conversation);

  // Keep max 100 conversations
  if (store.conversations.length > 100) {
    store.conversations = store.conversations.slice(0, 100);
  }

  saveStore(store);
  console.log(`[Conversations] Saved conversation ${id} (${platform}, ${messageCount} msgs, ${content.length} chars)`);
  return { saved: true, duplicate: false, id };
}

// ── GET /api/conversations ──────────────────────────────────────────────────
// Returns all conversations (metadata only, no full content)
router.get('/', (req, res) => {
  try {
    const store = loadStore();
    const list = store.conversations.map(({ content, ...meta }) => meta);
    res.json({ ok: true, conversations: list, total: list.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/conversations/:id ──────────────────────────────────────────────
// Returns full conversation content
router.get('/:id', (req, res) => {
  try {
    const store = loadStore();
    const conv = store.conversations.find(c => c.id === req.params.id);
    if (!conv) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json({ ok: true, conversation: conv });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/conversations/:id ───────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const store = loadStore();
    const before = store.conversations.length;
    store.conversations = store.conversations.filter(c => c.id !== req.params.id);
    if (store.conversations.length === before) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    saveStore(store);
    res.json({ ok: true, deleted: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
