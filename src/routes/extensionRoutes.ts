// src/routes/extensionRoutes.ts
import { Router } from 'express';
import * as fs from 'fs';
import * as yaml from 'yaml';
import { generateBriefing, Platform } from '../skills/context-injector';
import { runExtraction } from '../skills/context-extractor';
import { saveConversation } from './conversationRoutes';
import { resolveConflict as dbResolveConflict } from '../alert-logger';

import { runHeartbeatCycle } from '../heartbeat';

const router = Router();

// ── GET /health ──────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ ok: true, status: 'CORTEX Backend Online', timestamp: new Date().toISOString() });
});

// ── POST /extract ────────────────────────────────────────────────────────────
router.post('/extract', async (req, res) => {
  try {
    const { platform, conversation, title } = req.body;

    if (!platform || !conversation) {
      res.status(400).json({ error: 'Missing platform or conversation in body' });
      return;
    }

    // Save the raw conversation (with dedup and title)
    const convResult = saveConversation(platform, conversation, title);

    // Run signal extraction as before
    const signals = await runExtraction(conversation, platform);

    // Trigger immediate conflict detection cycle (non-blocking)
    runHeartbeatCycle().catch(err => console.error('[HEARTBEAT] Immediate cycle failed:', err));

    res.json({
      ok: true,
      signals,
      conversation_id: convResult.id,
      duplicate: convResult.duplicate,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /inject (Global Passport Injection) ──────────────────────────────────
router.get('/inject', async (req, res) => {
  try {
    const vault: Record<string, any> = {};
    const files = [
      'storage/soul.yaml',
      'storage/claude-contexts.yaml',
      'storage/chatgpt-contexts.yaml',
      'storage/gemini-contexts.yaml',
    ];

    for (const file of files) {
      if (fs.existsSync(file)) {
        const key = file.split('/')[1].replace('.yaml', '');
        vault[key] = yaml.parse(fs.readFileSync(file, 'utf-8'));
      }
    }

    const platform = (req.query.platform as string) || 'chatgpt';
    const briefing = await generateBriefing(platform as any);

    res.json({ ok: true, briefing });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /inject-conversation/:id (Selective Context Injection) ───────────────
router.get('/inject-conversation/:id', async (req, res) => {
  try {
    if (!fs.existsSync('storage/conversations.yaml')) {
       return res.status(404).json({ error: 'No conversations stored' });
    }
    const storeRaw = fs.readFileSync('storage/conversations.yaml', 'utf-8');
    const store = yaml.parse(storeRaw);
    const conv = store.conversations.find((c: any) => c.id === req.params.id);

    if (!conv) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const briefing = `[CORTEX CONTEXT RECALL]\nBelow is context from a previous ${conv.platform} session (${new Date(conv.extracted_at).toLocaleDateString()}). Please use this to maintain continuity:\n\n${conv.content}`;

    res.json({ ok: true, briefing });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /vault/export ────────────────────────────────────────────────────────
router.get('/vault/export', (req, res) => {
  try {
    const vault: Record<string, any> = {};
    const files = [
      'storage/soul.yaml',
      'storage/conflicts.yaml',
      'storage/claude-contexts.yaml',
      'storage/chatgpt-contexts.yaml',
      'storage/gemini-contexts.yaml',
      'storage/heartbeat-history.yaml',
    ];

    for (const filePath of files) {
      const key = filePath.replace('storage/', '').replace('.yaml', '');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        vault[key] = yaml.parse(content);
      }
    }

    res.json({ ok: true, vault });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/soul/update ──────────────────────────────────────────────────
router.post('/api/soul/update', (req, res) => {
  try {
    const { name } = req.body;
    const soulPath = 'storage/soul.yaml';
    let soul: any = { user: { name: 'User', role: 'Developer', goals: [] } };

    if (fs.existsSync(soulPath)) {
      soul = yaml.parse(fs.readFileSync(soulPath, 'utf-8'));
    }

    if (name) soul.user.name = name;

    if (!fs.existsSync('storage')) fs.mkdirSync('storage', { recursive: true });
    fs.writeFileSync(soulPath, yaml.stringify(soul), 'utf-8');

    res.json({ ok: true, name: soul.user.name });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /resolve ───────────────────────────────────────────────────────────
router.post('/resolve', async (req, res) => {
  try {
    const { id, value } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing conflict ID' });

    await dbResolveConflict(id, 'resolved', value);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /resolve-all ───────────────────────────────────────────────────────
router.post('/resolve-all', async (req, res) => {
  try {
    const { resolutions } = req.body; // Array of { id, value }
    if (!Array.isArray(resolutions)) return res.status(400).json({ error: 'Resolutions must be an array' });

    for (const { id, value } of resolutions) {
      await dbResolveConflict(id, 'resolved', value);
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
