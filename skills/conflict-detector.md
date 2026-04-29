# conflict-detector SKILL

> **Purpose:** Identify contradictions between beliefs extracted from different AI platforms.  
> **Input:** Array of beliefs from Claude, ChatGPT, and Gemini.  
> **Output:** Array of conflicts with severity scores and metadata.  
> **Storage:** Updates `storage/conflicts.yaml`.

---

## 1. Overview

The conflict-detector:

1. **Receives** beliefs from multiple AIs.
2. **Groups** beliefs by topic.
3. **Compares** each pair of beliefs on the same topic.
4. **Identifies** contradictions using pattern matching, semantic analysis, or LLM judgment.
5. **Scores** severity based on confidence and AI diversity.
6. **Outputs** conflict objects for alerting and logging.

---

## 2. Detection Prompt

```prompt
You are CORTEX's conflict detection engine. Your task is to identify contradictions between beliefs expressed by different AI platforms.

## INPUT
Beliefs to analyze:
```json
{beliefs}
```

## OUTPUT FORMAT
Return as valid JSON:
```json
{
  "conflicts": [
    {
      "id": "conflict-001",
      "topic": "",
      "beliefs": [
        { "ai": "", "statement": "", "confidence": 0.0 }
      ],
      "severity": 0.0,
      "type": "technology|approach|constraint|priority|tool",
      "explanation": ""
    }
  ]
}
```

## CONFLICT TYPES

- **technology**: Disagreement about tools/frameworks (OpenClaw vs LangChain)
- **approach**: Disagreement about methodology (TypeScript vs JavaScript)
- **constraint**: Opposing constraints (local-only vs cloud)
- **priority**: Different priorities (speed vs safety)
- **tool**: Different tool recommendations (Docker vs serverless)

## DETECTION RULES

1. **Same Topic Required** — Only compare beliefs on the same topic.
2. **Different AIs** — Compare beliefs from different AI platforms.
3. **Explicit Contradiction** — Must be clear opposition, not just different opinions.
4. **Severity Calculation**:
   - Base: average confidence of both beliefs
   - Multiplier: 1.2x if from different AIs
   - Cap at 1.0

## EXAMPLES

### Input
```json
[
  { "ai": "claude", "statement": "Use OpenClaw for this agent", "confidence": 0.8, "topic": "framework" },
  { "ai": "chatgpt", "statement": "Use LangChain instead of OpenClaw", "confidence": 0.7, "topic": "framework" }
]
```

### Output
```json
{
  "conflicts": [
    {
      "id": "conflict-001",
      "topic": "framework",
      "beliefs": [
        { "ai": "claude", "statement": "Use OpenClaw for this agent", "confidence": 0.8 },
        { "ai": "chatgpt", "statement": "Use LangChain instead of OpenClaw", "confidence": 0.7 }
      ],
      "severity": 0.9,
      "type": "technology",
      "explanation": "Claude recommends OpenClaw while ChatGPT recommends LangChain — direct contradiction on framework choice."
    }
  ]
}
```

---

## 3. Implementation (TypeScript)

```typescript
// src/skills/conflict-detector.ts

import { Belief } from '../context-loader';

export interface Conflict {
  id: string;
  topic: string;
  beliefs: {
    ai: string;
    statement: string;
    confidence: number;
  }[];
  severity: number;
  type: 'technology' | 'approach' | 'constraint' | 'priority' | 'tool';
  explanation: string;
  status: 'pending' | 'resolved' | 'ignored';
  detected_at: string;
  resolved_at?: string;
  resolution?: string;
}

// Contradiction patterns for quick detection
const CONTRADICTION_PATTERNS: [string, string][] = [
  ['best', 'worst'],
  ['good', 'bad'],
  ['prefer', 'avoid'],
  ['use', 'do not use'],
  ['should', 'should not'],
  ['recommended', 'not recommended'],
  ['sufficient', 'insufficient'],
  ['necessary', 'unnecessary'],
];

// Topic keywords for grouping
const TOPIC_KEYWORDS: Record<string, string[]> = {
  framework: ['openclaw', 'langchain', 'agent', 'framework'],
  language: ['typescript', 'javascript', 'python', 'language'],
  storage: ['local', 'cloud', 'storage', 'database'],
  tools: ['docker', 'git', 'vscode', 'tool'],
  approach: ['testing', 'testing', 'debug', 'deploy'],
};

export function detectConflicts(beliefs: Belief[]): Conflict[] {
  const conflicts: Conflict[] = [];
  
  // Group beliefs by topic
  const byTopic = groupBeliefsByTopic(beliefs);
  
  // Compare beliefs within each topic
  for (const [topic, topicBeliefs] of Object.entries(byTopic)) {
    if (topicBeliefs.length < 2) continue;
    
    // Compare each pair
    for (let i = 0; i < topicBeliefs.length; i++) {
      for (let j = i + 1; j < topicBeliefs.length; j++) {
        const beliefA = topicBeliefs[i];
        const beliefB = topicBeliefs[j];
        
        // Skip same AI
        if (beliefA.ai === beliefB.ai) continue;
        
        const conflict = checkForConflict(beliefA, beliefB, topic);
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }
  }
  
  return conflicts;
}

function groupBeliefsByTopic(beliefs: Belief[]): Record<string, Belief[]> {
  const byTopic: Record<string, Belief[]> = {};
  
  for (const belief of beliefs) {
    const topic = belief.topic || 'general';
    if (!byTopic[topic]) {
      byTopic[topic] = [];
    }
    byTopic[topic].push(belief);
  }
  
  return byTopic;
}

function checkForConflict(
  a: Belief,
  b: Belief,
  topic: string
): Conflict | null {
  const statementA = a.statement.toLowerCase();
  const statementB = b.statement.toLowerCase();
  
  // Method 1: Pattern-based detection
  for (const [positive, negative] of CONTRADICTION_PATTERNS) {
    if (hasContradiction(statementA, statementB, positive, negative)) {
      return createConflict(a, b, topic, 'technology');
    }
  }
  
  // Method 2: Semantic keywords
  if (hasSemanticContradiction(statementA, statementB)) {
    return createConflict(a, b, topic, getConflictType(topic));
  }
  
  // Method 3: LLM-based (placeholder)
  // In production, call LLM with contradiction detection prompt
  
  return null;
}

function hasContradiction(
  stmtA: string,
  stmtB: string,
  positive: string,
  negative: string
): boolean {
  return (
    (stmtA.includes(positive) && stmtB.includes(negative)) ||
    (stmtA.includes(negative) && stmtB.includes(positive))
  );
}

function hasSemanticContradiction(stmtA: string, stmtB: string): boolean {
  const opposites: [string, string][] = [
    ['openclaw', 'langchain'],
    ['typescript', 'javascript'],
    ['local', 'cloud'],
    ['docker', 'serverless'],
    ['prefer', 'avoid'],
  ];
  
  const wordsA = new Set(stmtA.split(/\s+/));
  const wordsB = new Set(stmtB.split(/\s+/));
  
  for (const [word1, word2] of opposites) {
    if (wordsA.has(word1) && wordsB.has(word2)) return true;
    if (wordsA.has(word2) && wordsB.has(word1)) return true;
  }
  
  return false;
}

function getConflictType(topic: string): Conflict['type'] {
  const typeMap: Record<string, Conflict['type']> = {
    framework: 'technology',
    language: 'approach',
    storage: 'constraint',
    tools: 'tool',
    approach: 'approach',
  };
  return typeMap[topic] || 'priority';
}

function createConflict(
  a: Belief,
  b: Belief,
  topic: string,
  type: Conflict['type']
): Conflict {
  const severity = calculateSeverity(a, b);
  
  return {
    id: generateConflictId(),
    topic,
    beliefs: [
      { ai: a.ai, statement: a.statement, confidence: a.confidence },
      { ai: b.ai, statement: b.statement, confidence: b.confidence },
    ],
    severity,
    type,
    explanation: `${a.ai} says "${a.statement}" while ${b.ai} says "${b.statement}"`,
    status: 'pending',
    detected_at: new Date().toISOString(),
  };
}

function calculateSeverity(a: Belief, b: Belief): number {
  const avgConfidence = (a.confidence + b.confidence) / 2;
  const aiMultiplier = a.ai !== b.ai ? 1.2 : 1.0;
  return Math.min(1.0, avgConfidence * aiMultiplier);
}

function generateConflictId(): string {
  return `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// LLM-based detection (for more complex cases)
export async function detectConflictsWithLLM(beliefs: Belief[]): Promise<Conflict[]> {
  // TODO: Implement LLM-based conflict detection
  // const prompt = buildConflictDetectionPrompt(beliefs);
  // const result = await llm.call(prompt);
  // return parseConflicts(result);
  
  return detectConflicts(beliefs);
}
```

---

## 4. Storage Format

### storage/conflicts.yaml

```yaml
conflicts:
  - id: "conflict-001"
    topic: "framework"
    beliefs:
      - ai: "claude"
        statement: "Use OpenClaw for this agent"
        confidence: 0.8
      - ai: "chatgpt"
        statement: "Use LangChain instead of OpenClaw"
        confidence: 0.7
    severity: 0.9
    type: "technology"
    explanation: "Claude says "Use OpenClaw for this agent" while ChatGPT says "Use LangChain instead of OpenClaw""
    status: "pending"
    detected_at: "2026-04-29T14:00:00Z"
```

---

## 5. Integration

| Component | File | Purpose |
|-----------|------|---------|
| Skill | `skills/conflict-detector.md` | LLM prompt (this file) |
| Implementation | `src/skills/conflict-detector.ts` | TypeScript code |
| Storage | `storage/conflicts.yaml` | Conflict log |
| Used By | `src/heartbeat.ts` | HEARTBEAT loop |

---

## 6. Next Steps

- **Task 6**: context-injector SKILL.md — platform-specific briefing formatter.
- **Task 7**: memory-writer SKILL.md — YAML vault merge logic.
- **Task 9**: Context Poisoning Detection.
- **Task 10**: Persona Drift Alert.

---

> **Remember:** conflict-detector runs inside HEARTBEAT every 10 minutes to continuously monitor for AI contradictions.