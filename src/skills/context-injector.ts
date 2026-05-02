// src/skills/context-injector.ts — Context injection skill implementation
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
  const platforms = ['claude', 'chatgpt', 'gemini'];
  const allContexts: any[] = [];
  
  for (const platform of platforms) {
    const path = `storage/${platform}-contexts.yaml`;
    if (fs.existsSync(path)) {
      try {
        const content = fs.readFileSync(path, 'utf-8');
        const data = yaml.parse(content);
        if (data?.contexts) {
          allContexts.push(...data.contexts);
        }
      } catch (error) {
        console.warn(`[ContextInjector] Failed to load ${platform} contexts:`, error);
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
        details: c.beliefs.map((b: any) => `${b.ai}: ${b.statement}`),
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
  
  const conflictsSection = conflicts.length > 0 
    ? conflicts.map(c => `- ${c.topic}: ${c.beliefs[0].ai} vs ${c.beliefs[1].ai}`).join('\n')
    : 'None';
  
  const historySection = history.length > 0
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
  const platform = (process.argv[2] as Platform) || 'claude';
  generateBriefing(platform).then(console.log).catch(console.error);
}