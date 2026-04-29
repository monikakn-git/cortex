# context-injector SKILL

> **Purpose:** Format CORTEX context into platform-specific briefing prompts for AI sessions.  
> **Input:** SOUL.md data, conflict history, recent contexts.  
> **Output:** Formatted briefing prompt for Claude, ChatGPT, or Gemini.  
> **Trigger:** When user switches AI platforms or starts a new session.

---

## 1. Overview

The context-injector:

1. **Loads** context from SOUL.md, conflicts, and history.
2. **Filters** relevant context for the target platform.
3. **Formats** into platform-specific prompt structure.
4. **Outputs** a briefing ready to inject into an AI session.

---

## 2. Injection Prompt Template

```markdown
# CORTEX Context Briefing

## User Profile
- **Name:** {user_name}
- **Role:** {user_role}
- **Goals:** {user_goals}

## Preferences
- **Coding:** {coding_preferences}
- **Response:** {response_preferences}
- **Tools:** {tool_preferences}

## Current Context
- **Primary State:** {life_state_primary}
- **Secondary States:** {life_state_secondary}
- **Context:** {life_state_context}

## Active Conflicts (⚠️)
{conflicts_section}

## Constraints
- **Hard:** {hard_constraints}
- **Soft:** {soft_constraints}

## Recent Context
{recent_history_section}

---
*This context injected by CORTEX — Universal AI Context Passport*
```

---

## 3. Platform-Specific Formats

### For Claude

```markdown
You are working with {user_name}, a {user_role}.

Current context: {life_state_context}

Preferences:
- Coding: {coding_preferences}
- Response format: {response_preferences}
- Preferred tools: {tool_preferences}

Active considerations:
- Goals: {user_goals}
- Constraints: {hard_constraints}

{conflicts_section}

---

Note: This context comes from CORTEX. Update SOUL.md if anything changes.
```

### For ChatGPT

```json
{
  "context": {
    "user": {
      "name": "{user_name}",
      "role": "{user_role}",
      "goals": "{user_goals}"
    },
    "preferences": {
      "coding": "{coding_preferences}",
      "response": "{response_preferences}",
      "tools": "{tool_preferences}"
    },
    "life_state": {
      "primary": "{life_state_primary}",
      "context": "{life_state_context}"
    },
    "constraints": {
      "hard": "{hard_constraints}",
      "soft": "{soft_constraints}"
    },
    "active_conflicts": {conflicts_json},
    "recent_history": {history_json}
  },
  "system_message": "CORTEX context injection - maintain consistency with prior AI sessions."
}
```

### For Gemini

```
CONTEXT INJECTION
=================
User: {user_name} ({user_role})
Goals: {user_goals}

Current State: {life_state_primary} - {life_state_context}

Preferences:
- Code: {coding_preferences}
- Output: {response_preferences}
- Tools: {tool_preferences}

Constraints:
- MUST: {hard_constraints}
- PREFER: {soft_constraints}

Active Issues:
{conflicts_section}

History:
{recent_history_section}

---
Injected by CORTEX
```

---

## 4. Implementation (TypeScript)

```typescript
// src/skills/context-injector.ts

import * as fs from 'fs';
import * as yaml from 'yaml';

export type Platform = 'claude' | 'chatgpt' | 'gemini';

export interface BriefingOptions {
  platform: Platform;
  includeConflicts: boolean;
  includeHistory: boolean;
  maxHistoryItems: number;
}

export interface SoulData {
  user: {
    name: string;
    role: string;
    goals: string[];
    communication_style: string;
  };
  preferences: {
    coding: Record<string, string>;
    response: Record<string, string>;
    tools: { preferred: string[]; avoided: string[] };
  };
  life_state: {
    primary: string;
    secondary: string[];
    context: string;
  };
  beliefs: { project: any[]; technology: any[] };
  constraints: { hard: string[]; soft: string[] };
  history: { recent_contexts: any[] };
}

export async function generateBriefing(
  targetPlatform: Platform,
  options: Partial<BriefingOptions> = {}
): Promise<string> {
  const opts: BriefingOptions = {
    platform: targetPlatform,
    includeConflicts: options.includeConflicts ?? true,
    includeHistory: options.includeHistory ?? true,
    maxHistoryItems: options.maxHistoryItems ?? 5,
  };

  // Load SOUL.md
  const soul = loadSoulData();
  
  // Load conflicts
  const conflicts = opts.includeConflicts ? loadConflicts() : [];
  
  // Load history
  const history = opts.includeHistory ? loadHistory(opts.maxHistoryItems) : [];

  // Format based on platform
  switch (opts.platform) {
    case 'claude':
      return formatForClaude(soul, conflicts, history);
    case 'chatgpt':
      return formatForChatGPT(soul, conflicts, history);
    case 'gemini':
      return formatForGemini(soul, conflicts, history);
    default:
      throw new Error(`Unknown platform: ${opts.platform}`);
  }
}

function loadSoulData(): SoulData {
  const soulPath = 'storage/soul.yaml';
  if (fs.existsSync(soulPath)) {
    const content = fs.readFileSync(soulPath, 'utf-8');
    return yaml.parse(content);
  }
  // Return empty structure if no soul data
  return {
    user: { name: '', role: '', goals: [], communication_style: '' },
    preferences: { coding: {}, response: {}, tools: { preferred: [], avoided: [] } },
    life_state: { primary: 'building', secondary: [], context: '' },
    beliefs: { project: [], technology: [] },
    constraints: { hard: [], soft: [] },
    history: { recent_contexts: [] },
  };
}

function loadConflicts(): any[] {
  const conflictsPath = 'storage/conflicts.yaml';
  if (fs.existsSync(conflictsPath)) {
    const content = fs.readFileSync(conflictsPath, 'utf-8');
    const data = yaml.parse(content);
    return data?.conflicts?.filter((c: any) => c.status === 'pending') || [];
  }
  return [];
}

function loadHistory(maxItems: number): any[] {
  // Load recent contexts from all platforms
  const platforms = ['claude', 'chatgpt', 'gemini'];
  const allContexts: any[] = [];
  
  for (const platform of platforms) {
    const path = `storage/${platform}-contexts.yaml`;
    if (fs.existsSync(path)) {
      const content = fs.readFileSync(path, 'utf-8');
      const data = yaml.parse(content);
      if (data?.contexts) {
        allContexts.push(...data.contexts);
      }
    }
  }
  
  // Sort by date and limit
  allContexts.sort((a, b) => new Date(b.extracted_at).getTime() - new Date(a.extracted_at).getTime());
  return allContexts.slice(0, maxItems);
}

// Platform-specific formatters
function formatForClaude(soul: SoulData, conflicts: any[], history: any[]): string {
  const goals = soul.user.goals.join(', ') || 'Not specified';
  const coding = Object.entries(soul.preferences.coding).map(([k, v]) => `${k}: ${v}`).join(', ') || 'Not specified';
  const response = Object.entries(soul.preferences.response).map(([k, v]) => `${k}: ${v}`).join(', ') || 'Not specified';
  const tools = soul.preferences.tools.preferred.join(', ') || 'Not specified';
  const hardConstraints = soul.constraints.hard.join('; ') || 'None';
  const softConstraints = soul.constraints.soft.join('; ') || 'None';
  
  let conflictsSection = '';
  if (conflicts.length > 0) {
    conflictsSection = '\n## Active Conflicts (⚠️)\n';
    for (const c of conflicts) {
      conflictsSection += `- **${c.topic}**: ${c.beliefs[0].ai} says "${c.beliefs[0].statement}" vs ${c.beliefs[1].ai} says "${c.beliefs[1].statement}"\n`;
    }
  }
  
  let historySection = '';
  if (history.length > 0) {
    historySection = '\n## Recent Context\n';
    for (const h of history.slice(0, 3)) {
      historySection += `- ${h.platform}: ${h.signals?.life_state?.context || 'Unknown'}\n`;
    }
  }

  return `You are working with ${soul.user.name || 'the user'}, a ${soul.user.role || 'developer'}.

Current context: ${soul.life_state.context || 'Not specified'}
Primary state: ${soul.life_state.primary}

Preferences:
- Coding: ${coding}
- Response format: ${response}
- Preferred tools: ${tools}

Goals: ${goals}

Constraints:
- MUST follow: ${hardConstraints}
- PREFER: ${softConstraints}
${conflictsSection}
${historySection}
---
*This context injected by CORTEX — Universal AI Context Passport*
`;
}

function formatForChatGPT(soul: SoulData, conflicts: any[], history: any[]): string {
  const briefing = {
    context: {
      user: {
        name: soul.user.name || 'Unknown',
        role: soul.user.role || 'Developer',
        goals: soul.user.goals || [],
      },
      preferences: {
        coding: soul.preferences.coding,
        response: soul.preferences.response,
        tools: soul.preferences.tools,
      },
      life_state: {
        primary: soul.life_state.primary,
        context: soul.life_state.context,
      },
      constraints: {
        hard: soul.constraints.hard,
        soft: soul.constraints.soft,
      },
      active_conflicts: conflicts.map(c => ({
        topic: c.topic,
        severity: c.severity,
        details: c.beliefs.map(b => `${b.ai}: ${b.statement}`),
      })),
      recent_history: history.map(h => ({
        platform: h.platform,
        context: h.signals?.life_state?.context,
      })),
    },
    system_message: 'CORTEX context injection - maintain consistency with prior AI sessions.',
  };
  
  return JSON.stringify(briefing, null, 2);
}

function formatForGemini(soul: SoulData, conflicts: any[], history: any[]): string {
  const goals = soul.user.goals.join(', ') || 'Not specified';
  const coding = Object.entries(soul.preferences.coding).map(([k, v]) => `${k}: ${v}`).join(', ');
  const hardConstraints = soul.constraints.hard.join(', ') || 'None';
  const softConstraints = soul.constraints.soft.join(', ') || 'None';
  
  let conflictsSection = conflicts.length > 0 
    ? conflicts.map(c => `- ${c.topic}: ${c.beliefs[0].ai} vs ${c.beliefs[1].ai}`).join('\n')
    : 'None';
  
  let historySection = history.length > 0
    ? history.map(h => `- ${h.platform}: ${h.signals?.life_state?.context || 'Unknown'}`).join('\n')
    : 'None';

  return `CONTEXT INJECTION
=================
User: ${soul.user.name || 'Unknown'} (${soul.user.role || 'Developer'})
Goals: ${goals}

Current State: ${soul.life_state.primary} - ${soul.life_state.context}

Preferences:
- Code: ${coding}
- Output: ${soul.preferences.response.format || 'default'}
- Tools: ${soul.preferences.tools.preferred.join(', ') || 'Not specified'}

Constraints:
- MUST: ${hardConstraints}
- PREFER: ${softConstraints}

Active Conflicts:
${conflictsSection}

History:
${historySection}

---
Injected by CORTEX
`;
}

// CLI interface
if (require.main === module) {
  const platform = process.argv[2] as Platform || 'claude';
  generateBriefing(platform).then(console.log).catch(console.error);
}
```

---

## 5. Usage

### Command Line
```bash
npx ts-node src/skills/context-injector.ts claude
npx ts-node src/skills/context-injector.ts chatgpt
npx ts-node src/skills/context-injector.ts gemini
```

### In Code
```typescript
import { generateBriefing } from './skills/context-injector';

// Get Claude briefing
const claudeBriefing = await generateBriefing('claude');

// Get ChatGPT briefing with custom options
const chatgptBriefing = await generateBriefing('chatgpt', {
  includeConflicts: true,
  maxHistoryItems: 3,
});
```

---

## 6. Integration

| Component | File | Purpose |
|-----------|------|---------|
| Skill | `skills/context-injector.md` | LLM prompt (this file) |
| Implementation | `src/skills/context-injector.ts` | TypeScript code |
| Input | `storage/soul.yaml` | User profile |
| Input | `storage/conflicts.yaml` | Active conflicts |
| Input | `storage/{platform}-contexts.yaml` | History |

---

## 7. Next Steps

- **Task 7**: memory-writer SKILL.md — YAML vault merge logic.
- **Task 9**: Context Poisoning Detection.
- **Task 10**: Persona Drift Alert.

---

> **Remember:** context-injector is the bridge that makes CORTEX useful — it takes all the stored context and makes it actionable when you switch AIs.