// src/alert-logger.ts — Log conflicts to storage
import * as fs from 'fs';
import * as yaml from 'yaml';
import { Conflict } from './conflict-detector';

const CONFLICTS_FILE = 'storage/conflicts.yaml';

interface ConflictsStore {
  conflicts: Conflict[];
}

export async function alertAndLog(conflicts: Conflict[]): Promise<void> {
  // Load existing conflicts
  let store: ConflictsStore = { conflicts: [] };
  
  if (fs.existsSync(CONFLICTS_FILE)) {
    try {
      const content = fs.readFileSync(CONFLICTS_FILE, 'utf-8');
      store = yaml.parse(content) || { conflicts: [] };
    } catch (error) {
      console.warn('[AlertLogger] Failed to load existing conflicts:', error);
    }
  }
  
  // Add new conflicts (avoid duplicates)
  const existingIds = new Set(store.conflicts.map(c => c.id));
  
  for (const conflict of conflicts) {
    if (!existingIds.has(conflict.id)) {
      store.conflicts.push(conflict);
      existingIds.add(conflict.id);
      
      // Console alert for high-severity conflicts
      if (conflict.severity > 0.7) {
        console.warn(`[HEARTBEAT] ⚠️ High-severity conflict: ${conflict.topic}`);
        console.warn(`  ${conflict.beliefs[0].ai}: "${conflict.beliefs[0].statement}"`);
        console.warn(`  ${conflict.beliefs[1].ai}: "${conflict.beliefs[1].statement}"`);
      }
    }
  }
  
  // Keep only last 50 conflicts
  if (store.conflicts.length > 50) {
    store.conflicts = store.conflicts.slice(-50);
  }
  
  // Write back
  fs.writeFileSync(CONFLICTS_FILE, yaml.stringify(store), 'utf-8');
}

export async function resolveConflict(
  conflictId: string,
  resolution: 'resolved' | 'ignored',
  note?: string
): Promise<void> {
  if (!fs.existsSync(CONFLICTS_FILE)) {
    throw new Error('No conflicts file found');
  }
  
  const content = fs.readFileSync(CONFLICTS_FILE, 'utf-8');
  const store: ConflictsStore = yaml.parse(content);
  
  const conflict = store.conflicts.find(c => c.id === conflictId);
  if (!conflict) {
    throw new Error(`Conflict ${conflictId} not found`);
  }
  
  conflict.status = resolution;
  conflict.resolved_at = new Date().toISOString();
  conflict.resolution = note || `Resolved by user`;
  
  fs.writeFileSync(CONFLICTS_FILE, yaml.stringify(store), 'utf-8');
  
  console.log(`[AlertLogger] Conflict ${conflictId} marked as ${resolution}`);
}