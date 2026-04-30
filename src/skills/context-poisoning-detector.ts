// src/skills/context-poisoning-detector.ts — Context poisoning detection
import * as fs from 'fs';
import * as yaml from 'yaml';

export interface BeliefEntry {
  statement: string;
  topic: string;
  ai: string;
  confidence: number;
  timestamp: string;
  extracted_from: string;
}

export interface PoisoningAlert {
  id: string;
  belief: BeliefEntry;
  occurrences: number;
  source_ais: string[];
  severity: number;
  status: 'poisoning_risk' | 'verified' | 'rejected' | 'under_review';
  first_seen: string;
  last_seen: string;
  user_confirmation?: {
    confirmed: boolean;
    timestamp: string;
    note?: string;
  };
}

const POISONING_THRESHOLD = 3; // Number of occurrences to trigger alert

export async function detectPoisoning(): Promise<PoisoningAlert[]> {
  console.log('[PoisoningDetector] Starting detection...');
  
  // 1. Load all beliefs from platform contexts
  const beliefs = loadAllBeliefs();
  console.log(`[PoisoningDetector] Loaded ${beliefs.length} total beliefs`);
  
  // 2. Group and count
  const grouped = groupBeliefs(beliefs);
  
  // 3. Identify poisoned beliefs
  const alerts: PoisoningAlert[] = [];
  
  for (const [key, entries] of Object.entries(grouped)) {
    if (entries.length >= POISONING_THRESHOLD) {
      const alert = createPoisoningAlert(key, entries);
      alerts.push(alert);
    }
  }
  
  console.log(`[PoisoningDetector] Found ${alerts.length} potential poisoning risks`);
  
  // 4. Check existing tracking and merge
  const tracked = loadPoisoningTracker();
  const merged = mergeAlerts([...tracked, ...alerts]);
  
  // 5. Save
  savePoisoningTracker(merged);
  
  return alerts;
}

function loadAllBeliefs(): BeliefEntry[] {
  const beliefs: BeliefEntry[] = [];
  const platforms = ['claude', 'chatgpt', 'gemini'];
  
  for (const platform of platforms) {
    const path = `storage/${platform}-contexts.yaml`;
    if (fs.existsSync(path)) {
      try {
        const content = fs.readFileSync(path, 'utf-8');
        const data = yaml.parse(content);
        
        if (data?.contexts) {
          for (const context of data.contexts) {
            if (context.signals?.beliefs) {
              for (const belief of context.signals.beliefs) {
                beliefs.push({
                  statement: belief.statement,
                  topic: belief.topic,
                  confidence: belief.confidence,
                  ai: platform,
                  timestamp: context.extracted_at || new Date().toISOString(),
                  extracted_from: `${platform}-contexts.yaml`,
                });
              }
            }
          }
        }
      } catch (error) {
        console.warn(`[PoisoningDetector] Failed to load ${platform} beliefs:`, error);
      }
    }
  }
  
  return beliefs;
}

function groupBeliefs(beliefs: BeliefEntry[]): Record<string, BeliefEntry[]> {
  const grouped: Record<string, BeliefEntry[]> = {};
  
  for (const belief of beliefs) {
    const key = `${belief.topic}::${belief.statement}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(belief);
  }
  
  // Sort by timestamp (oldest first)
  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
  
  return grouped;
}

function createPoisoningAlert(key: string, entries: BeliefEntry[]): PoisoningAlert {
  const avgConfidence = entries.reduce((sum, e) => sum + e.confidence, 0) / entries.length;
  const sourceAis = [...new Set(entries.map(e => e.ai))];
  
  // Severity calculation
  let severity = avgConfidence;
  
  // Boost severity if multiple different AIs agree
  if (sourceAis.length >= 2) {
    severity = Math.min(1.0, severity * 1.2);
  }
  
  // Boost severity by occurrence count
  if (entries.length >= 4) {
    severity = Math.min(1.0, severity * 1.1);
  }
  
  return {
    id: `poison-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    belief: entries[0],
    occurrences: entries.length,
    source_ais: sourceAis,
    severity,
    status: 'poisoning_risk',
    first_seen: entries[0].timestamp,
    last_seen: entries[entries.length - 1].timestamp,
  };
}

function loadPoisoningTracker(): PoisoningAlert[] {
  const path = 'storage/poisoning-tracker.yaml';
  if (fs.existsSync(path)) {
    try {
      const content = fs.readFileSync(path, 'utf-8');
      const data = yaml.parse(content);
      return data?.alerts || [];
    } catch (error) {
      console.warn('[PoisoningDetector] Failed to load tracker:', error);
      return [];
    }
  }
  return [];
}

function savePoisoningTracker(alerts: PoisoningAlert[]): void {
  const path = 'storage/poisoning-tracker.yaml';
  fs.writeFileSync(path, yaml.stringify({ alerts }), 'utf-8');
}

function mergeAlerts(alerts: PoisoningAlert[]): PoisoningAlert[] {
  const merged: Record<string, PoisoningAlert> = {};
  
  for (const alert of alerts) {
    const key = `${alert.belief.topic}::${alert.belief.statement}`;
    if (!merged[key]) {
      merged[key] = alert;
    } else {
      // Update existing alert with latest data
      const existing = merged[key];
      existing.occurrences = Math.max(existing.occurrences, alert.occurrences);
      existing.source_ais = [...new Set([...existing.source_ais, ...alert.source_ais])];
      existing.severity = Math.max(existing.severity, alert.severity);
      existing.last_seen = alert.last_seen;
    }
  }
  
  return Object.values(merged);
}

export async function confirmBelief(
  alertId: string,
  confirmed: boolean,
  note?: string
): Promise<void> {
  const tracker = loadPoisoningTracker();
  const alert = tracker.find(a => a.id === alertId);
  
  if (!alert) {
    throw new Error(`Alert ${alertId} not found`);
  }
  
  alert.status = confirmed ? 'verified' : 'rejected';
  alert.user_confirmation = {
    confirmed,
    timestamp: new Date().toISOString(),
    note,
  };
  
  savePoisoningTracker(tracker);
  console.log(`[PoisoningDetector] Belief marked as ${alert.status}`);
}

export async function getPendingAlerts(): Promise<PoisoningAlert[]> {
  const tracker = loadPoisoningTracker();
  return tracker.filter(a => a.status === 'poisoning_risk');
}

export async function getAlertHistory(): Promise<PoisoningAlert[]> {
  return loadPoisoningTracker();
}

// CLI interface
if (require.main === module) {
  detectPoisoning()
    .then(alerts => {
      if (alerts.length === 0) {
        console.log('\n[PoisoningDetector] ✅ No poisoning risks detected.\n');
      } else {
        console.log(`\n[PoisoningDetector] ⚠️  Found ${alerts.length} potential poisoning risk(s):\n`);
        
        for (const alert of alerts) {
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log(`ID: ${alert.id}`);
          console.log(`Topic: ${alert.belief.topic}`);
          console.log(`Belief: "${alert.belief.statement}"`);
          console.log(`Occurrences: ${alert.occurrences}x`);
          console.log(`Source AIs: ${alert.source_ais.join(', ')}`);
          console.log(`Severity: ${(alert.severity * 100).toFixed(0)}% 🔴`);
          console.log(`First seen: ${alert.first_seen}`);
          console.log(`Last seen: ${alert.last_seen}`);
          console.log(`\nAction: Verify this belief with the user`);
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        }
      }
    })
    .catch(console.error);
}