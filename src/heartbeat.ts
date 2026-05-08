// src/heartbeat.ts — Main HEARTBEAT loop
import { loadRecentContexts } from './context-loader';
import { extractBeliefs } from './belief-extractor';
import { detectConflicts } from './skills/conflict-detector';
import { alertAndLog } from './alert-logger';
import { detectPoisoning } from './skills/context-poisoning-detector';
import { detectPersonaDrift } from './skills/persona-drift-detector';
import * as fs from 'fs';
import * as yaml from 'yaml';

const HEARTBEAT_INTERVAL = 10 * 60 * 1000; // 10 minutes

interface Config {
  heartbeat: {
    interval_minutes: number;
    severity_threshold: number;
    max_contexts_per_ai: number;
    enabled: boolean;
  };
}

function loadConfig(): Config {
  const configPath = 'config/heartbeat.yaml';
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf-8');
    return yaml.parse(content);
  }
  // Default config
  return {
    heartbeat: {
      interval_minutes: 10,
      severity_threshold: 0.5,
      max_contexts_per_ai: 10,
      enabled: true,
    },
  };
}

export async function startHeartbeat(): Promise<void> {
  const config = loadConfig();
  
  if (!config.heartbeat.enabled) {
    console.log('[HEARTBEAT] Disabled in config.');
    return;
  }

  const intervalMs = config.heartbeat.interval_minutes * 60 * 1000;
  console.log(`[HEARTBEAT] Starting ${config.heartbeat.interval_minutes}-minute conflict detection loop...`);

  setInterval(async () => {
    try {
      await runHeartbeatCycle(config);
    } catch (error) {
      console.error('[HEARTBEAT] Error in cycle:', error);
    }
  }, intervalMs);

  // Run immediately on start
  await runHeartbeatCycle(config);
}

export async function runHeartbeatCycle(config?: Config): Promise<void> {
  const activeConfig = config || loadConfig();
  const startTime = Date.now();
  console.log('[HEARTBEAT] Running cycle...');

  try {
    // Step 1: Load recent contexts
    const contexts = await loadRecentContexts(activeConfig.heartbeat.max_contexts_per_ai);
    console.log(`[HEARTBEAT] Loaded ${contexts.length} contexts.`);

    // Step 2: Extract beliefs
    const allBeliefs = contexts.flatMap(extractBeliefs);
    console.log(`[HEARTBEAT] Extracted ${allBeliefs.length} beliefs.`);

    // Step 3: Detect conflicts
    const conflicts = detectConflicts(allBeliefs, activeConfig.heartbeat.severity_threshold);
    console.log(`[HEARTBEAT] Found ${conflicts.length} conflicts.`);

    // Step 4: Alert & Log conflicts
    await alertAndLog(conflicts);

    // Step 5: Detect context poisoning
    const poisoningAlerts = await detectPoisoning();
    if (poisoningAlerts.length > 0) {
      console.warn(`[HEARTBEAT] ⚠️  Detected ${poisoningAlerts.length} potential poisoning risk(s)`);
    }

    // Step 6: Detect persona drift
    const personaDrifts = await detectPersonaDrift();
    if (personaDrifts.length > 0) {
      console.warn(`[HEARTBEAT] 📊 Detected ${personaDrifts.length} persona drift(s)`);
    }

    // Step 7: Log history
    await logHistory({
      cycle_at: new Date().toISOString(),
      contexts_loaded: contexts.length,
      beliefs_extracted: allBeliefs.length,
      conflicts_found: conflicts.length,
      poisoning_alerts: poisoningAlerts.length,
      persona_drifts: personaDrifts.length,
      runtime_ms: Date.now() - startTime,
    });

    console.log(`[HEARTBEAT] Cycle complete in ${Date.now() - startTime}ms.`);
  } catch (error) {
    console.error('[HEARTBEAT] Cycle failed:', error);
    throw error;
  }
}

async function logHistory(entry: {
  cycle_at: string;
  contexts_loaded: number;
  beliefs_extracted: number;
  conflicts_found: number;
  poisoning_alerts: number;
  persona_drifts: number;
  runtime_ms: number;
}): Promise<void> {
  const historyPath = 'storage/heartbeat-history.yaml';
  let history: { history: any[] } = { history: [] };

  if (fs.existsSync(historyPath)) {
    const content = fs.readFileSync(historyPath, 'utf-8');
    history = yaml.parse(content) || { history: [] };
  }

  history.history.push(entry);

  // Keep only last 100 entries
  if (history.history.length > 100) {
    history.history = history.history.slice(-100);
  }

  fs.writeFileSync(historyPath, yaml.stringify(history), 'utf-8');
}

// Run if executed directly
if (require.main === module) {
  startHeartbeat().catch(console.error);
}