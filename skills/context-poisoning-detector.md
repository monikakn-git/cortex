# context-poisoning-detector SKILL

> **Purpose:** Detect and flag beliefs that have been reinforced 3+ times across AI conversations without user confirmation.  
> **Input:** Belief history from multiple AI platforms, user confirmations.  
> **Output:** Poisoned belief alerts with verification status.  
> **Trigger:** HEARTBEAT loop (every 10 minutes) or on-demand analysis.

---

## 1. Overview

Context Poisoning occurs when:
- An AI makes an assumption about the user
- The same assumption gets reinforced across multiple conversations
- The user never explicitly confirms it
- It becomes "accepted truth" in SOUL.md

The detector prevents this by flagging unconfirmed beliefs that appear 3+ times.

---

## 2. Detection Algorithm

```
1. Load all beliefs from storage
2. Group beliefs by: statement + topic + confidence
3. Count occurrences across conversations
4. For each belief with count >= 3:
   - Check if user confirmed it
   - If NOT confirmed → FLAG as potentially poisoned
   - Calculate severity based on:
     * How many times repeated
     * How confident the AIs were
     * How different the source AIs are
5. Generate alert report
```

---

## 3. Belief Tracking

### Belief Status Lifecycle

```
EXTRACTED
   │
   ├─ 1st mention: "unverified"
   │
   ├─ 2nd mention: "repeated" (mark for user review)
   │
   ├─ 3rd+ mention: "⚠️ POISONING RISK"
   │    │
   │    ├─ User confirms → "verified"
   │    │
   │    ├─ User rejects → "rejected" (remove from SOUL)
   │    │
   │    └─ User ignores → stays "poisoning_risk"
```

---

## 4. Detection Rules

| Rule | Trigger | Action |
|------|---------|--------|
| **Triple Mention** | Belief appears 3+ times | Flag as poisoning_risk |
| **High Confidence** | All sources >0.7 confidence | Increase severity |
| **Conflicting AI** | Different AIs same belief | Increase severity (consensus bias) |
| **User Silence** | >7 days, no user confirmation | Escalate to warning |
| **User Confirmation** | User explicitly confirms | Mark as verified |

---

## 5. Implementation (TypeScript)

```typescript
// src/skills/context-poisoning-detector.ts

import * as fs from 'fs';
import * as yaml from 'yaml';

export interface BeliefEntry {
  statement: string;
  topic: string;
  ai: string;
  confidence: number;
  timestamp: string;
  extracted_from: string; // platform-contexts.yaml file
}

export interface PoisoningAlert {
  id: string;
  belief: BeliefEntry;
  occurrences: number;
  source_ais: string[];
  severity: number; // 0.0-1.0
  status: 'poisoning_risk' | 'verified' | 'rejected' | 'under_review';
  first_seen: string;
  last_seen: string;
  user_confirmation?: {
    confirmed: boolean;
    timestamp: string;
    note?: string;
  };
}

export async function detectPoisoning(): Promise<PoisoningAlert[]> {
  // 1. Load all beliefs from platform contexts
  const beliefs = loadAllBeliefs();
  
  // 2. Group and count
  const grouped = groupBeliefs(beliefs);
  
  // 3. Identify poisoned beliefs
  const alerts: PoisoningAlert[] = [];
  
  for (const [key, entries] of Object.entries(grouped)) {
    if (entries.length >= 3) {
      const alert = createPoisoningAlert(key, entries);
      alerts.push(alert);
    }
  }
  
  // 4. Check existing tracking
  const tracked = loadPoisoningTracker();
  const newAlerts = alerts.filter(a => !tracked.find(t => t.id === a.id));
  
  // 5. Save and return
  savePoisoningTracker([...tracked, ...newAlerts]);
  
  return newAlerts;
}

function loadAllBeliefs(): BeliefEntry[] {
  const beliefs: BeliefEntry[] = [];
  const platforms = ['claude', 'chatgpt', 'gemini'];
  
  for (const platform of platforms) {
    const path = `storage/${platform}-contexts.yaml`;
    if (fs.existsSync(path)) {
      const content = fs.readFileSync(path, 'utf-8');
      const data = yaml.parse(content);
      
      if (data?.contexts) {
        for (const context of data.contexts) {
          if (context.signals?.beliefs) {
            for (const belief of context.signals.beliefs) {
              beliefs.push({
                ...belief,
                ai: platform,
                timestamp: context.extracted_at,
                extracted_from: `${platform}-contexts.yaml`,
              });
            }
          }
        }
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
  
  return grouped;
}

function createPoisoningAlert(key: string, entries: BeliefEntry[]): PoisoningAlert {
  const avgConfidence = entries.reduce((sum, e) => sum + e.confidence, 0) / entries.length;
  const sourceAis = [...new Set(entries.map(e => e.ai))];
  const diversity = sourceAis.length > 1 ? 1.0 : 0.5; // Multiple AIs = more severe
  
  return {
    id: `poison-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    belief: entries[0],
    occurrences: entries.length,
    source_ais: sourceAis,
    severity: Math.min(1.0, avgConfidence * diversity),
    status: 'poisoning_risk',
    first_seen: entries[entries.length - 1].timestamp,
    last_seen: entries[0].timestamp,
  };
}

function loadPoisoningTracker(): PoisoningAlert[] {
  const path = 'storage/poisoning-tracker.yaml';
  if (fs.existsSync(path)) {
    const content = fs.readFileSync(path, 'utf-8');
    const data = yaml.parse(content);
    return data?.alerts || [];
  }
  return [];
}

function savePoisoningTracker(alerts: PoisoningAlert[]): void {
  const path = 'storage/poisoning-tracker.yaml';
  fs.writeFileSync(path, yaml.stringify({ alerts }), 'utf-8');
}

export async function confirmBelief(alertId: string, confirmed: boolean, note?: string): Promise<void> {
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

// CLI interface
if (require.main === module) {
  detectPoisoning().then(alerts => {
    if (alerts.length === 0) {
      console.log('[PoisoningDetector] No poisoning risks detected.');
    } else {
      console.log(`[PoisoningDetector] Found ${alerts.length} potential poisoning risks:\n`);
      for (const alert of alerts) {
        console.log(`⚠️ ${alert.belief.topic}`);
        console.log(`   Belief: "${alert.belief.statement}"`);
        console.log(`   Occurrences: ${alert.occurrences}`);
        console.log(`   Source AIs: ${alert.source_ais.join(', ')}`);
        console.log(`   Severity: ${(alert.severity * 100).toFixed(0)}%\n`);
      }
    }
  });
}
```

---

## 6. Storage Format

### storage/poisoning-tracker.yaml

```yaml
alerts:
  - id: "poison-001"
    belief:
      statement: "You prefer React over Vue"
      topic: "frontend-framework"
      ai: "claude"
      confidence: 0.7
      timestamp: "2026-04-28T10:00:00Z"
    occurrences: 3
    source_ais: ["claude", "chatgpt", "gemini"]
    severity: 0.85
    status: "poisoning_risk"
    first_seen: "2026-04-27T10:00:00Z"
    last_seen: "2026-04-30T10:00:00Z"
    user_confirmation:
      confirmed: false
      timestamp: null
      note: null
```

---

## 7. Integration

| Component | File | Purpose |
|-----------|------|---------|
| Skill | `skills/context-poisoning-detector.md` | Detection logic |
| Implementation | `src/skills/context-poisoning-detector.ts` | TypeScript code |
| Storage | `storage/poisoning-tracker.yaml` | Alert tracking |
| Called By | `src/heartbeat.ts` | Runs every 10 minutes |

---

## 8. Example Alert

```
⚠️ CONTEXT POISONING DETECTED

Belief: "You prefer React over Vue"
Topic: frontend-framework

Occurrences: 3 times across conversations
Source AIs: Claude, ChatGPT, Gemini
Confidence: 70-85%
Severity: HIGH (multiple AIs reinforcing same assumption)

Action Required:
1. Do you actually prefer React? (Yes/No/Maybe)
2. If NO: This belief will be removed from SOUL.md
3. If YES: Mark as verified, confidence increases
4. If MAYBE: Marked for user review, not stored
```

---

## 9. Next Steps

- **Task 10**: Persona Drift Alert — track AI tone shifts over time.

---

> **Remember:** Context poisoning is subtle. One AI's guess repeated 3 times becomes "truth" unless detected.