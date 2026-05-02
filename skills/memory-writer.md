# memory-writer SKILL

> **Purpose:** Merge new extracted signals into the YAML vault while maintaining data integrity.  
> **Input:** New signals from context-extractor, existing SOUL.md and context files.  
> **Output:** Updated YAML files with merged data.  
> **Trigger:** After context-extractor runs, or when HEARTBEAT detects changes.

---

## 1. Overview

The memory-writer:

1. **Loads** existing vault data (SOUL.md, platform contexts).
2. **Analyzes** new signals for merge strategy.
3. **Merges** using appropriate strategy per data type.
4. **Validates** YAML structure after merge.
5. **Writes** updated files to storage.

---

## 2. Merge Strategies

### 2.1 Replace Strategy
Used when new data should overwrite old data.

```typescript
// Example: User changed preferred language
if (newPreference.confidence > oldPreference.confidence) {
  oldPreference = newPreference;
}
```

### 2.2 Append Strategy
Used when adding new items to a list.

```typescript
// Example: New goal added
soul.user.goals.push(newGoal);
```

### 2.3 Deep Merge Strategy
Used for nested objects.

```typescript
// Example: Merging preferences
soul.preferences.coding = { 
  ...soul.preferences.coding, 
  ...newPreferences.coding 
};
```

### 2.4 Keep Existing Strategy
Used when old data is more reliable.

```typescript
// Example: User confirmed preference
if (oldPreference.userConfirmed) {
  // Keep old, ignore new
}
```

### 2.5 Flag Conflict Strategy
Used when resolution requires user input.

```typescript
// Example: Contradictory preferences
conflict = {
  type: 'preference_conflict',
  old: oldPreference,
  new: newPreference,
  status: 'pending_resolution'
};
```

---

## 3. Implementation (TypeScript)

```typescript
// src/skills/memory-writer.ts

import * as fs from 'fs';
import * as yaml from 'yaml';
import { ExtractedSignals } from './context-extractor';

export interface MergeOptions {
  conflictStrategy: 'replace' | 'keep' | 'flag';
  maxGoals: number;
  maxBeliefs: number;
  maxHistory: number;
}

const DEFAULT_OPTIONS: MergeOptions = {
  conflictStrategy: 'flag',
  maxGoals: 20,
  maxBeliefs: 50,
  maxHistory: 100,
};

export async function mergeSignals(
  signals: ExtractedSignals,
  options: Partial<MergeOptions> = {}
): Promise<MergeResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const results: MergeResult = {
    updated: [],
    conflicts: [],
    errors: [],
  };

  try {
    // Load existing SOUL data
    const soul = loadSoulData();
    
    // Merge each signal type
    const merged = await mergeIntoSoul(soul, signals, opts);
    
    // Save updated SOUL
    saveSoulData(merged);
    results.updated.push('soul.yaml');

    // Save platform-specific context
    saveContext(signals);
    results.updated.push(`${signals.platform}-contexts.yaml`);

  } catch (error) {
    results.errors.push(error.message);
  }

  return results;
}

interface MergeResult {
  updated: string[];
  conflicts: any[];
  errors: string[];
}

// ============== SOUL Merge Functions ==============

async function mergeIntoSoul(
  soul: any,
  signals: ExtractedSignals,
  opts: MergeOptions
): Promise<any> {
  const newSoul = JSON.parse(JSON.stringify(soul)); // Deep clone

  // Merge preferences
  if (signals.signals.preferences.length > 0) {
    newSoul.preferences = mergePreferences(
      newSoul.preferences,
      signals.signals.preferences,
      opts
    );
  }

  // Merge beliefs
  if (signals.signals.beliefs.length > 0) {
    newSoul.beliefs = mergeBeliefs(
      newSoul.beliefs,
      signals.signals.beliefs,
      opts
    );
  }

  // Merge goals
  if (signals.signals.goals.length > 0) {
    newSoul.user.goals = mergeGoals(
      newSoul.user.goals,
      signals.signals.goals,
      opts
    );
  }

  // Merge constraints
  if (signals.signals.constraints.length > 0) {
    newSoul.constraints = mergeConstraints(
      newSoul.constraints,
      signals.signals.constraints
    );
  }

  // Merge life-state
  if (signals.signals.life_state) {
    newSoul.life_state = mergeLifeState(
      newSoul.life_state,
      signals.signals.life_state
    );
  }

  // Merge tool usage
  if (signals.signals.tool_usage.length > 0) {
    newSoul.preferences.tools = mergeTools(
      newSoul.preferences.tools,
      signals.signals.tool_usage
    );
  }

  // Update metadata
  newSoul.metadata.last_modified = new Date().toISOString();
  newSoul.metadata.soul_hash = generateHash(newSoul);

  return newSoul;
}

function mergePreferences(
  existing: any,
  newPrefs: any[],
  opts: MergeOptions
): any {
  const merged = { ...existing };
  
  for (const pref of newPrefs) {
    const key = `${pref.type}.${pref.key}`;
    const existingPref = findPreference(existing, pref.type, pref.key);
    
    if (!existingPref) {
      // Add new preference
      if (pref.type === 'coding') {
        merged.coding[pref.key] = pref.value;
      } else if (pref.type === 'response') {
        merged.response[pref.key] = pref.value;
      }
    } else if (pref.confidence > existingPref.confidence) {
      // Replace if more confident
      if (pref.type === 'coding') {
        merged.coding[pref.key] = pref.value;
      } else if (pref.type === 'response') {
        merged.response[pref.key] = pref.value;
      }
    }
  }
  
  return merged;
}

function findPreference(prefs: any, type: string, key: string): any {
  const category = prefs[type === 'coding' ? 'coding' : type === 'response' ? 'response' : null];
  if (category && category[key]) {
    return { value: category[key], confidence: 0.5 }; // Default confidence
  }
  return null;
}

function mergeBeliefs(
  existing: any,
  newBeliefs: any[],
  opts: MergeOptions
): any {
  const merged = { project: [...existing.project], technology: [...existing.technology] };
  
  for (const belief of newBeliefs) {
    // Check for duplicate
    const isDuplicate = merged.project.some(b => b.belief === belief.statement) ||
                        merged.technology.some(b => b.belief === belief.statement);
    
    if (!isDuplicate) {
      // Add to appropriate category
      const category = belief.topic.includes('technology') ? 'technology' : 'project';
      merged[category].push({
        belief: belief.statement,
        confidence: belief.confidence,
        source: belief.source,
      });
    }
  }
  
  // Limit beliefs
  if (merged.project.length > opts.maxBeliefs) {
    merged.project = merged.project.slice(-opts.maxBeliefs);
  }
  if (merged.technology.length > opts.maxBeliefs) {
    merged.technology = merged.technology.slice(-opts.maxBeliefs);
  }
  
  return merged;
}

function mergeGoals(
  existing: string[],
  newGoals: any[],
  opts: MergeOptions
): string[] {
  const merged = [...existing];
  
  for (const goal of newGoals) {
    if (!merged.includes(goal.goal)) {
      merged.push(goal.goal);
    }
  }
  
  // Limit goals
  return merged.slice(-opts.maxGoals);
}

function mergeConstraints(
  existing: any,
  newConstraints: any[]
): any {
  const merged = { hard: [...existing.hard], soft: [...existing.soft] };
  
  for (const constraint of newConstraints) {
    const list = constraint.type === 'hard' ? merged.hard : merged.soft;
    if (!list.includes(constraint.description)) {
      list.push(constraint.description);
    }
  }
  
  return merged;
}

function mergeLifeState(existing: any, newState: any): any {
  // Replace primary, append to secondary
  return {
    primary: newState.primary || existing.primary,
    secondary: [...new Set([...existing.secondary, ...(newState.secondary || [])])],
    context: newState.context || existing.context,
    started_at: existing.started_at,
  };
}

function mergeTools(existing: any, newTools: any[]): any {
  const merged = { preferred: [...existing.preferred], avoided: [...existing.avoided] };
  
  for (const tool of newTools) {
    const list = tool.recommendation_strength === 'strong' 
      ? merged.preferred 
      : merged.avoided;
    
    if (!list.includes(tool.tool_name)) {
      list.push(tool.tool_name);
    }
  }
  
  return merged;
}

// ============== Storage Functions ==============

function loadSoulData(): any {
  const soulPath = 'storage/soul.yaml';
  if (fs.existsSync(soulPath)) {
    const content = fs.readFileSync(soulPath, 'utf-8');
    return yaml.parse(content);
  }
  return createEmptySoul();
}

function createEmptySoul(): any {
  return {
    user: { name: '', role: '', goals: [], communication_style: '', timezone: '' },
    preferences: {
      coding: {},
      response: {},
      tools: { preferred: [], avoided: [] },
    },
    life_state: { primary: 'building', secondary: [], context: '', started_at: '' },
    beliefs: { project: [], technology: [] },
    constraints: { hard: [], soft: [] },
    history: { recent_contexts: [], last_updated: '' },
    metadata: {
      version: '1.0.0',
      created: new Date().toISOString(),
      last_modified: new Date().toISOString(),
      soul_hash: '',
    },
  };
}

function saveSoulData(soul: any): void {
  const soulPath = 'storage/soul.yaml';
  fs.writeFileSync(soulPath, yaml.stringify(soul), 'utf-8');
  console.log(`[MemoryWriter] Updated soul.yaml`);
}

function saveContext(signals: ExtractedSignals): void {
  const path = `storage/${signals.platform}-contexts.yaml`;
  let store: { contexts: ExtractedSignals[] } = { contexts: [] };
  
  if (fs.existsSync(path)) {
    try {
      const content = fs.readFileSync(path, 'utf-8');
      store = yaml.parse(content) || { contexts: [] };
    } catch (error) {
      console.warn(`[MemoryWriter] Failed to load existing contexts:`, error);
    }
  }
  
  store.contexts.unshift(signals);
  
  // Keep only last 50
  if (store.contexts.length > 50) {
    store.contexts = store.contexts.slice(0, 50);
  }
  
  fs.writeFileSync(path, yaml.stringify(store), 'utf-8');
  console.log(`[MemoryWriter] Updated ${signals.platform}-contexts.yaml`);
}

function generateHash(data: any): string {
  // Simple hash for change detection
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// CLI interface
if (require.main === module) {
  console.log('[MemoryWriter] Use mergeSignals() in code to merge signals.');
}
```

---

## 4. Merge Decision Matrix

| Data Type | Strategy | Condition |
|-----------|----------|-----------|
| **Preferences** | Replace | New confidence > old |
| **Beliefs** | Append | Not duplicate |
| **Goals** | Append | Not duplicate |
| **Constraints (hard)** | Keep | Never replace |
| **Constraints (soft)** | Append | Not duplicate |
| **Life-State** | Replace | Always replace primary |
| **Tools** | Merge | Add new, keep existing |

---

## 5. Integration

| Component | File | Purpose |
|-----------|------|---------|
| Skill | `skills/memory-writer.md` | Merge logic documentation |
| Implementation | `src/skills/memory-writer.ts` | TypeScript code |
| Input | `storage/soul.yaml` | Existing SOUL data |
| Input | `storage/{platform}-contexts.yaml` | Platform contexts |
| Called By | `src/skills/context-extractor.ts` | After signal extraction |

---

## 6. Next Steps

- **Task 8**: Tune extraction prompts against real conversations.
- **Task 9**: Context Poisoning Detection.
- **Task 10**: Persona Drift Alert.

---

> **Remember:** memory-writer is the backbone of CORTEX's data management — it ensures your context grows intelligently without data loss or corruption.