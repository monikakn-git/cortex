# HEARTBEAT.md — 10-Minute Background Conflict Detection Loop

> **Purpose:** Run every 10 minutes to detect belief conflicts between AIs (Claude, ChatGPT, Gemini).  
> **Location:** `src/heartbeat.ts`  
> **Storage:** `storage/conflicts.yaml`, `storage/heartbeat-history.yaml`

---

## 1. Overview

HEARTBEAT is the **pulse of CORTEX**. It runs as a background loop (setInterval or cron) every 10 minutes:

1. **Load** recent contexts from all AI platforms.
2. **Extract** beliefs from each conversation.
3. **Compare** beliefs across AIs for contradictions.
4. **Alert** when conflicts are found.
5. **Log** conflicts to storage for review.

---

## 2. Core Logic

### 2.1 Load Recent Contexts

```typescript
// Pseudocode
async function loadRecentContexts(): Promise<Context[]> {
  const contexts = [];
  for (const ai of ['claude', 'chatgpt', 'gemini']) {
    const file = `storage/${ai}-contexts.yaml`;
    if (exists(file)) {
      const data = await readYaml(file);
      contexts.push(...data.recent);
    }
  }
  return contexts;
}
```

### 2.2 Extract Beliefs

```typescript
interface Belief {
  id: string;
  topic: string;
  statement: string;
  confidence: number; // 0.0–1.0
  ai: string;
  timestamp: string;
}

function extractBeliefs(context: Context): Belief[] {
  // Use LLM to extract belief statements from conversation
  // Prompt: "Extract any beliefs the AI expressed about the user or project"
}
```

### 2.3 Detect Conflicts

```typescript
interface Conflict {
  id: string;
  topic: string;
  beliefs: Belief[];
  severity: number; // 0.0–1.0
  status: 'pending' | 'resolved' | 'ignored';
  detected_at: string;
  resolved_at?: string;
  resolution?: string;
}

function detectConflicts(beliefs: Belief[]): Conflict[] {
  const conflicts: Conflict[] = [];
  
  // Group beliefs by topic
  const byTopic = groupBy(beliefs, 'topic');
  
  for (const [topic, topicBeliefs] of Object.entries(byTopic)) {
    if (topicBeliefs.length < 2) continue;
    
    // Compare each pair of beliefs on the same topic
    for (let i = 0; i < topicBeliefs.length; i++) {
      for (let j = i + 1; j < topicBeliefs.length; j++) {
        const conflict = checkContradiction(topicBeliefs[i], topicBeliefs[j]);
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }
  }
  
  return conflicts;
}

function checkContradiction(a: Belief, b: Belief): Conflict | null {
  // Use LLM to determine if beliefs contradict each other
  // Prompt: "Do these two statements contradict each other?"
  // Return null if they don't conflict
}
```

### 2.4 Alert & Log

```typescript
async function alertAndLog(conflicts: Conflict[]): Promise<void> {
  for (const conflict of conflicts) {
    if (conflict.severity > 0.5) {
      // Log to console
      console.warn(`[HEARTBEAT] Conflict detected: ${conflict.topic}`);
      console.warn(`  ${conflict.beliefs[0].ai}: ${conflict.beliefs[0].statement}`);
      console.warn(`  ${conflict.beliefs[1].ai}: ${conflict.beliefs[1].statement}`);
    }
    
    // Write to storage
    await appendToYaml('storage/conflicts.yaml', conflict);
  }
}
```

---

## 3. Main Loop

```typescript
// src/heartbeat.ts

import { loadRecentContexts } from './context-loader';
import { extractBeliefs } from './belief-extractor';
import { detectConflicts } from './conflict-detector';
import { alertAndLog } from './alert-logger';

const HEARTBEAT_INTERVAL = 10 * 60 * 1000; // 10 minutes

export async function startHeartbeat(): Promise<void> {
  console.log('[HEARTBEAT] Starting 10-minute conflict detection loop...');
  
  setInterval(async () => {
    try {
      await runHeartbeatCycle();
    } catch (error) {
      console.error('[HEARTBEAT] Error in cycle:', error);
    }
  }, HEARTBEAT_INTERVAL);
  
  // Run immediately on start
  await runHeartbeatCycle();
}

async function runHeartbeatCycle(): Promise<void> {
  console.log('[HEARTBEAT] Running cycle...');
  
  // Step 1: Load recent contexts
  const contexts = await loadRecentContexts();
  
  // Step 2: Extract beliefs
  const allBeliefs = contexts.flatMap(extractBeliefs);
  
  // Step 3: Detect conflicts
  const conflicts = detectConflicts(allBeliefs);
  
  // Step 4: Alert & Log
  await alertAndLog(conflicts);
  
  console.log(`[HEARTBEAT] Cycle complete. Found ${conflicts.length} conflicts.`);
}

// Run if executed directly
if (require.main === module) {
  startHeartbeat();
}
```

---

## 4. Storage Format

### storage/conflicts.yaml

```yaml
conflicts:
  - id: "conflict-001"
    topic: "project-framework"
    beliefs:
      - ai: "Claude"
        statement: "OpenClaw is the best framework for CORTEX"
        confidence: 0.8
        timestamp: "2026-04-29T10:00:00Z"
      - ai: "ChatGPT"
        statement: "LangChain alone is sufficient for CORTEX"
        confidence: 0.7
        timestamp: "2026-04-29T09:00:00Z"
    severity: 0.75
    status: "pending"
    detected_at: "2026-04-29T14:00:00Z"
```

### storage/heartbeat-history.yaml

```yaml
history:
  - cycle_at: "2026-04-29T14:00:00Z"
    contexts_loaded: 5
    beliefs_extracted: 12
    conflicts_found: 2
    runtime_ms: 345
```

---

## 5. Configuration

```yaml
# config/heartbeat.yaml
heartbeat:
  interval_minutes: 10
  severity_threshold: 0.5  # Only alert for conflicts above this
  max_contexts_per_ai: 10   # How many recent contexts to load
  enabled: true
```

---

## 6. Integration Points

| Component | File | Purpose |
|-----------|------|---------|
| Context Loader | `src/context-loader.ts` | Load AI conversation logs |
| Belief Extractor | `src/belief-extractor.ts` | Extract beliefs using LLM |
| Conflict Detector | `src/conflict-detector.ts` | Identify contradictions |
| Alert Logger | `src/alert-logger.ts` | Log conflicts to storage |
| Config | `config/heartbeat.yaml` | HEARTBEAT settings |

---

## 7. Next Steps

- **Task 4**: context-extractor SKILL.md — LLM prompt for signal extraction.
- **Task 5**: conflict-detector SKILL.md — contradiction identification logic.
- **Task 6**: context-injector SKILL.md — platform-specific briefing formatter.

---

> **Remember:** HEARTBEAT runs in the background. You can stop it anytime by terminating the process.