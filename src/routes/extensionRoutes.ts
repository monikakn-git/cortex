import { Router } from 'express';
import * as fs from 'fs';
import * as yaml from 'yaml';
import { generateBriefing, Platform } from '../skills/context-injector';
import { runExtraction } from '../skills/context-extractor';

const router = Router();

// ── GET /health ─────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'CORTEX', version: '1.0.0' });
});

// ── GET /inject?platform=<id> ────────────────────────────────────────────────
router.get('/inject', async (req, res) => {
  const platformId = req.query.platform as Platform | null;

  if (!platformId || !['claude', 'chatgpt', 'gemini', 'copilot'].includes(platformId)) {
    res.status(400).json({ error: 'Missing or invalid ?platform= parameter' });
    return;
  }

  try {
    const briefing = await generateBriefing(platformId as Platform, {
      includeConflicts: true,
      includeHistory: true,
      maxHistoryItems: 5,
    });
    res.json({ ok: true, briefing, platform: platformId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /extract ────────────────────────────────────────────────────────────
router.post('/extract', async (req, res) => {
  try {
    const { platform, conversation } = req.body;

    if (!platform || !conversation) {
      res.status(400).json({ error: 'Missing platform or conversation in body' });
      return;
    }

    const signals = await runExtraction(conversation, platform);
    res.json({ ok: true, signals });
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

// ── POST /vault/import ───────────────────────────────────────────────────────
router.post('/vault/import', (req, res) => {
  try {
    const payload = req.body as Record<string, any>;

    if (!fs.existsSync('storage')) fs.mkdirSync('storage');

    for (const [key, value] of Object.entries(payload)) {
      const filePath = `storage/${key}.yaml`;
      fs.writeFileSync(filePath, yaml.stringify(value), 'utf-8');
    }

    res.json({ ok: true, imported: Object.keys(payload) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
