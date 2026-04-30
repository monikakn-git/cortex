# persona-drift-detector SKILL

> **Purpose:** Detect and track tone/personality shifts in how each AI interacts with the user over time.  
> **Input:** AI conversation history and tone analysis.  
> **Output:** Weekly persona drift report with tone trends.  
> **Trigger:** Weekly (suggested) or on-demand from HEARTBEAT.

---

## 1. Overview

Persona Drift tracks changes in **how** an AI communicates with you, not what it says:

- **Tone** — formal, casual, technical, supportive, directive
- **Engagement** — how interactive and attentive the AI is
- **Helpfulness** — how action-oriented the advice is
- **Verbosity** — how wordy the responses are
- **Confidence** — how certain vs hedging the statements are

Over time, these can shift. CORTEX detects and alerts you to meaningful changes.

---

## 2. Detection Metrics

| Metric | Range | Description |
|--------|-------|-------------|
| **Tone** | categorical | formal, casual, technical, supportive, directive |
| **Engagement** | 0.0–1.0 | How interactive (questions, personalization) |
| **Helpfulness** | 0.0–1.0 | How action-oriented (advice, recommendations) |
| **Verbosity** | 0.0–1.0 | How wordy (sentence length) |
| **Confidence** | 0.0–1.0 | Certainty vs hedging |

---

## 3. Drift Detection Algorithm

```typescript
1. Analyze recent conversations for tone
2. Calculate averages per metric
3. Compare to baseline (previous week/month)
4. For each metric:
   - If |new - old| > threshold (0.2) → flag drift
   - Calculate severity as average difference
5. If severity >= 0.3 → alert
6. Generate weekly report
```

---

## 4. Example Drift Scenarios

### Scenario A: AI Becoming Less Confident
```
Week 1: "Use React for this. It's the best choice."
        confidence: 0.9

Week 2: "React might work, but consider Vue too."
        confidence: 0.5

Drift Detected: confidence_shift (severity: 0.4)
Action: AI is hedging more - may indicate uncertainty or new information
```

### Scenario B: AI Becoming More Helpful
```
Week 1: "Here's what you need."
        helpfulness: 0.5

Week 2: "Here's what you need, and here are 3 alternatives..."
        helpfulness: 0.8

Drift Detected: helpfulness_shift (severity: 0.3)
Action: AI is becoming more thorough - positive change
```

### Scenario C: Tone Shift
```
Week 1: "You should implement X. It's standard practice."
        tone: directive

Week 2: "Have you considered X? It might help with..."
        tone: supportive

Drift Detected: tone_shift (from directive to supportive)
Action: AI style has changed - may indicate different model or configuration
```

---

## 5. Weekly Report Format

```yaml
week_start: "2026-04-28T00:00:00Z"
week_end: "2026-05-05T00:00:00Z"

drifts:
  - ai: claude
    drift_type: confidence_shift
    severity: 0.35
    old_tone: technical
    new_tone: supportive

summaries:
  - ai: claude
    tone_trend: supportive
    changes:
      - confidence_shift
      - engagement_increase
  
  - ai: chatgpt
    tone_trend: directive
    changes: []

  - ai: gemini
    tone_trend: technical
    changes:
      - verbosity_decrease
```

---

## 6. Integration

| Component | File | Purpose |
|-----------|------|---------|
| Skill | `skills/persona-drift-detector.md` | Detection logic |
| Implementation | `src/skills/persona-drift-detector.ts` | TypeScript code |
| Storage | `storage/tone-baseline.yaml` | Tone metrics |
| Storage | `storage/persona-drift-history.yaml` | Drift alerts |
| Called By | `src/heartbeat.ts` | Weekly (or on-demand) |

---

## 7. Usage

### Generate Weekly Report
```bash
npx ts-node src/skills/persona-drift-detector.ts
```

### Get Drift History
```typescript
import { detectPersonaDrift, generateWeeklyReport } from './skills/persona-drift-detector';

const report = await generateWeeklyReport();
console.log(report);
```

---

## 8. Benefits

- **Detect Model Degradation** — If Claude becomes less helpful, CORTEX notices
- **Track Consistency** — Monitor if an AI stays true to your interaction style
- **Spot Changes** — Know when an AI platform updates its behavior
- **Inform Context Decisions** — Update preferences if AI tone shifts permanently
- **Archive Baseline** — Historical record of how each AI evolved

---

## 9. Next Steps

All 10 tasks now complete! Deploy and run CORTEX in production.

---

> **Remember:** Persona drift is subtle. A small change per conversation adds up. Weekly reports help you stay aware.