// src/server.ts
// CORTEX Local HTTP Server — exposes endpoints for the browser extension.
// Runs on http://localhost:3141 (alongside the HEARTBEAT daemon).
//
// This file is written by P2 for P1 to integrate.
// P1 adds: import { startServer } from './server'; + await startServer();
// in their main() in index.ts.
//
// All paths are relative to the project root (where P1 runs from).

import * as http from 'http';
import * as fs   from 'fs';
import * as yaml from 'yaml';
import { generateBriefing, Platform } from './skills/context-injector';
import { runExtraction }              from './skills/context-extractor';

const PORT = 3141;

// ─── CORS headers (extension origin is chrome-extension://) ──────────────────
function setCORS(res: http.ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res: http.ServerResponse, statusCode: number, data: object) {
  setCORS(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end',  ()    => resolve(body));
    req.on('error', reject);
  });
}

// ─── Route handler ────────────────────────────────────────────────────────────
async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse
) {
  const url    = new URL(req.url!, `http://localhost:${PORT}`);
  const method = req.method?.toUpperCase();

  // Preflight for CORS
  if (method === 'OPTIONS') {
    setCORS(res);
    res.writeHead(204);
    res.end();
    return;
  }

  // ── GET /health ─────────────────────────────────────────────────────────────
  if (method === 'GET' && url.pathname === '/health') {
    json(res, 200, { ok: true, service: 'CORTEX', version: '1.0.0' });
    return;
  }

  // ── GET /inject?platform=<id> ────────────────────────────────────────────────
  if (method === 'GET' && url.pathname === '/inject') {
    const platformId = url.searchParams.get('platform') as Platform | null;

    if (!platformId || !['claude', 'chatgpt', 'gemini', 'copilot'].includes(platformId)) {
      json(res, 400, { error: 'Missing or invalid ?platform= parameter' });
      return;
    }

    try {
      const briefing = await generateBriefing(platformId as Platform, {
        includeConflicts: true,
        includeHistory:   true,
        maxHistoryItems:  5,
      });
      json(res, 200, { ok: true, briefing, platform: platformId });
    } catch (err: any) {
      json(res, 500, { error: err.message });
    }
    return;
  }

  // ── POST /extract ────────────────────────────────────────────────────────────
  if (method === 'POST' && url.pathname === '/extract') {
    try {
      const body    = await readBody(req);
      const payload = JSON.parse(body) as {
        platform: string;
        conversation: string;
        captured_at?: string;
      };

      if (!payload.platform || !payload.conversation) {
        json(res, 400, { error: 'Missing platform or conversation in body' });
        return;
      }

      const signals = await runExtraction(payload.conversation, payload.platform);
      json(res, 200, { ok: true, signals });
    } catch (err: any) {
      json(res, 500, { error: err.message });
    }
    return;
  }

  // ── GET /vault/export ────────────────────────────────────────────────────────
  if (method === 'GET' && url.pathname === '/vault/export') {
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

      json(res, 200, { ok: true, vault });
    } catch (err: any) {
      json(res, 500, { error: err.message });
    }
    return;
  }

  // ── POST /vault/import ───────────────────────────────────────────────────────
  if (method === 'POST' && url.pathname === '/vault/import') {
    try {
      const body    = await readBody(req);
      const payload = JSON.parse(body) as Record<string, any>;

      if (!fs.existsSync('storage')) fs.mkdirSync('storage');

      for (const [key, value] of Object.entries(payload)) {
        const filePath = `storage/${key}.yaml`;
        fs.writeFileSync(filePath, yaml.stringify(value), 'utf-8');
      }

      json(res, 200, { ok: true, imported: Object.keys(payload) });
    } catch (err: any) {
      json(res, 500, { error: err.message });
    }
    return;
  }

  // ── 404 ──────────────────────────────────────────────────────────────────────
  json(res, 404, { error: `Unknown route: ${url.pathname}` });
}

// ─── Start the server ─────────────────────────────────────────────────────────
export function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handleRequest);

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[SERVER] Port ${PORT} in use — server may already be running.`);
        resolve(); // Non-fatal
      } else {
        reject(err);
      }
    });

    server.listen(PORT, '127.0.0.1', () => {
      console.log(`[SERVER] CORTEX API listening on http://localhost:${PORT}`);
      resolve();
    });
  });
}

// ─── Standalone run ───────────────────────────────────────────────────────────
if (require.main === module) {
  startServer().catch(console.error);
}
