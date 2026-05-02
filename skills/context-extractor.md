# context-extractor SKILL

> **Purpose:** Extract structured signals from AI conversations for CORTEX.  
> **Input:** Raw conversation text from any AI platform (Claude, ChatGPT, Gemini).  
> **Output:** Structured signals (preferences, beliefs, goals, constraints, life-state, tool usage).  
> **Storage:** Updates `storage/soul.yaml` and platform-specific context files.

---

## 1. Overview

The context-extractor is an LLM-powered skill that:

1. **Receives** a raw AI conversation (user + AI messages).
2. **Analyzes** the conversation for signals.
3. **Extracts** structured data matching SOUL.md schema.
4. **Outputs** JSON/YAML for storage and later injection.

---

## 2. Extraction Prompt

```prompt
You are CORTEX's context extraction engine. Your task is to analyze AI conversations and extract structured signals that CORTEX can use to understand the user and their context.

## INPUT
- AI Platform: {platform} (claude/chatgpt/gemini)
- Conversation Date: {date}
- Raw Conversation:
```
{conversation_text}
```

## OUTPUT FORMAT
Extract the following signal types. Return as valid JSON:

```json
{
  "extracted_at": "{timestamp}",
  "platform": "{platform}",
  "signals": {
    "preferences": [],
    "beliefs": [],
    "goals": [],
    "constraints": [],
    "life_state": {},
    "tool_usage": []
  }
}
```

## SIGNAL DEFINITIONS

### preferences
User's stated or implied preferences:
- coding style (language, framework, format)
- response format (markdown, json, plain)
- communication style (concise, detailed, casual)
- tool preferences (vscode, docker, git)

### beliefs
What the AI expressed about the user or project:
- beliefs about project direction
- beliefs about technology choices
- beliefs about user goals or constraints
- Include: statement, confidence (0.0-1.0), source

### goals
What the user is trying to achieve:
- short-term goals (this session)
- long-term goals (project-level)
- Include: goal, status (active/completed/pending)

### constraints
Hard or soft limits mentioned:
- hard: must follow (local-only, no cloud)
- soft: preferred but flexible
- Include: type (hard/soft), description, source

### life_state
User's current context:
- primary: learning | building | debugging | refactoring | planning | researching | documenting | deploying
- secondary: [] (array of secondary states)
- context: free-text description of what they're doing

### tool_usage
Tools mentioned or recommended:
- tool_name
- usage_context (why/how used)
- recommendation_strength (strong/weak)

## EXTRACTION RULES

1. **Be conservative** — only extract signals that are explicitly stated or strongly implied.
2. **Include confidence scores** — rate your certainty for each belief (0.0-1.0).
3. **Track sources** — note which message in the conversation the signal came from.
4. **Avoid duplicates** — don't extract signals already in SOUL.md unless they've changed.
5. **Human-readable** — write statements as clear, concise facts.

## EXAMPLES

### Input
User: "I want to build a TypeScript project with Node.js"
AI: "Great choice! TypeScript with Node.js works well with..."

### Output
```json
{
  "extracted_at": "2026-04-29T10:00:00Z",
  "platform": "claude",
  "signals": {
    "preferences": [
      {
        "type": "coding",
        "key": "language",
        "value": "TypeScript",
        "confidence": 0.9,
        "source": "user-message"
      },
      {
        "type": "coding",
        "key": "runtime",
        "value": "Node.js",
        "confidence": 0.9,
        "source": "user-message"
      }
    ],
    "beliefs": [],
    "goals": [
      {
        "goal": "Build a TypeScript project",
        "status": "active",
        "source": "user-message"
      }
    ],
    "constraints": [],
    "life_state": {
      "primary": "building",
      "context": "Setting up a new TypeScript project"
    },
    "tool_usage": []
  }
}
```

---

## 3. Implementation (TypeScript)

```typescript
// src/skills/context-extractor.ts

import { LLM } from 'langchain';
import * as yaml from 'yaml';

export interface ExtractedSignals {
  extracted_at: string;
  platform: string;
  signals: {
    preferences: Preference[];
    beliefs: Belief[];
    goals: Goal[];
    constraints: Constraint[];
    life_state: LifeState;
    tool_usage: ToolUsage[];
  };
}

export interface Preference {
  type: string;
  key: string;
  value: string;
  confidence: number;
  source: string;
}

export interface Belief {
  statement: string;
  confidence: number;
  topic: string;
  source: string;
}

export interface Goal {
  goal: string;
  status: 'active' | 'completed' | 'pending';
  source: string;
}

export interface Constraint {
  type: 'hard' | 'soft';
  description: string;
  source: string;
}

export interface LifeState {
  primary: string;
  secondary: string[];
  context: string;
}

export interface ToolUsage {
  tool_name: string;
  usage_context: string;
  recommendation_strength: 'strong' | 'weak';
}

const EXTRACTION_PROMPT = `You are CORTEX's context extraction engine...`; // (full prompt above)

export async function extractSignals(
  conversationText: string,
  platform: string,
  llm: LLM
): Promise<ExtractedSignals> {
  const prompt = EXTRACTION_PROMPT
    .replace('{platform}', platform)
    .replace('{date}', new Date().toISOString())
    .replace('{conversation_text}', conversationText)
    .replace('{timestamp}', new Date().toISOString());

  const result = await llm.call(prompt);
  
  // Parse JSON from LLM response
  return parseExtractedSignals(result);
}

function parseExtractedSignals(response: string): ExtractedSignals {
  // Extract JSON from response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse extracted signals');
  }
  return JSON.parse(jsonMatch[0]);
}

export async function mergeSignals(
  newSignals: ExtractedSignals,
  existingSoul: any
): Promise<any> {
  // Merge new signals into SOUL.md structure
  // Avoid duplicates, update changed values
  // TODO: Implement merge logic
  return existingSoul;
}
```

---

## 4. Storage

### Input: `storage/{platform}-contexts.yaml`

```yaml
contexts:
  - extracted_at: "2026-04-29T10:00:00Z"
    platform: "claude"
    signals:
      preferences: []
      beliefs: []
      goals: []
      constraints: []
      life_state: {}
      tool_usage: []
```

### Output: Updates `storage/soul.yaml`

See [SOUL.md](../SOUL.md) for the full schema.

---

## 5. Integration

| Component | File | Purpose |
|-----------|------|---------|
| Skill | `skills/context-extractor.md` | LLM prompt (this file) |
| Implementation | `src/skills/context-extractor.ts` | TypeScript code |
| Storage | `storage/{platform}-contexts.yaml` | Platform-specific contexts |
| Updates | `storage/soul.yaml` | User's SOUL profile |

---

## 6. Next Steps

- **Task 5**: conflict-detector SKILL.md — contradiction identification logic.
- **Task 6**: context-injector SKILL.md — platform-specific briefing formatter.
- **Task 7**: memory-writer SKILL.md — YAML vault merge logic.

---

> **Remember:** The context-extractor runs after each AI conversation to keep SOUL.md up-to-date.