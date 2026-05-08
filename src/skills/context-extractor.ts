// src/skills/context-extractor.ts — Context extraction skill implementation
import * as fs from 'fs';
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

// Extraction prompt template
const EXTRACTION_PROMPT = `You are CORTEX's context extraction engine. Your task is to analyze AI conversations and extract structured signals that CORTEX can use to understand the user and their context.

## INPUT
- AI Platform: [[PLATFORM]]
- Conversation Date: [[DATE]]
- Raw Conversation:
\`\`\`
[[CONVERSATION_TEXT]]
\`\`\`

## OUTPUT FORMAT
Extract the following signal types. Return as valid JSON:

[[JSON_SCHEMA]]

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
- Include: goal, status (active|completed|pending)

### constraints
Hard or soft limits mentioned:
- hard: must follow (local-only, no cloud)
- soft: preferred but flexible
- Include: type (hard|soft), description, source

### life_state
User's current context:
- primary: learning | building | debugging | refactoring | planning | researching | documenting | deploying
- secondary: [] (array of secondary states)
- context: free-text description of what they're doing

### tool_usage
Tools mentioned or recommended:
- tool_name
- usage_context (why/how used)
- recommendation_strength (strong|weak)

## EXTRACTION RULES
1. Be conservative — only extract signals that are explicitly stated or strongly implied.
2. Include confidence scores — rate your certainty for each belief (0.0-1.0).
3. Track sources — note which message in the conversation the signal came from.
4. Avoid duplicates — don't extract signals already in SOUL.md unless they've changed.
5. Human-readable — write statements as clear, concise facts.

Return ONLY the JSON output, no additional text.`;

const JSON_SCHEMA = `{
  "extracted_at": "ISO8601 timestamp",
  "platform": "claude|chatgpt|gemini",
  "signals": {
    "preferences": [{"type": "", "key": "", "value": "", "confidence": 0.0, "source": ""}],
    "beliefs": [{"statement": "", "confidence": 0.0, "topic": "", "source": ""}],
    "goals": [{"goal": "", "status": "active|completed|pending", "source": ""}],
    "constraints": [{"type": "hard|soft", "description": "", "source": ""}],
    "life_state": {"primary": "", "secondary": [], "context": ""},
    "tool_usage": [{"tool_name": "", "usage_context": "", "recommendation_strength": "strong|weak"}]
  }
}`;

export function buildExtractionPrompt(
  conversationText: string,
  platform: string,
  date: string = new Date().toISOString()
): string {
  return EXTRACTION_PROMPT
    .replace('[[PLATFORM]]', platform)
    .replace('[[DATE]]', date)
    .replace('[[CONVERSATION_TEXT]]', conversationText)
    .replace('[[JSON_SCHEMA]]', JSON_SCHEMA);
}

export function parseExtractedSignals(response: string): ExtractedSignals {
  // Extract JSON from response (handle potential markdown code blocks)
  const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || 
                    response.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    throw new Error('Failed to parse extracted signals from LLM response');
  }
  
  const jsonStr = jsonMatch[1] || jsonMatch[0];
  return JSON.parse(jsonStr.trim());
}

// Smart heuristic extraction for demo purposes
export async function extractSignals(
  conversationText: string,
  platform: string
): Promise<ExtractedSignals> {
  const signals: ExtractedSignals['signals'] = {
    preferences: [],
    beliefs: [],
    goals: [],
    constraints: [],
    life_state: { primary: 'building', secondary: [], context: '' },
    tool_usage: [],
  };

  const lines = conversationText.split('\n');
  
  // Simple heuristic patterns
  const patterns = [
    { regex: /prefer (?:to use )?([\w\s.#]+)/i, type: 'preferences', key: 'tool_preference' },
    { regex: /style is ([\w\s]+)/i, type: 'preferences', key: 'coding_style' },
    { regex: /goal is to ([\w\s]+)/i, type: 'goals', field: 'goal' },
    { regex: /want to (?:achieve|build|create) ([\w\s]+)/i, type: 'goals', field: 'goal' },
    { regex: /working on ([\w\s.#]+)/i, type: 'goals', field: 'goal' },
    { regex: /i am a ([\w\s]+)/i, type: 'preferences', key: 'user_role' },
    { regex: /as a ([\w\s]+),/i, type: 'preferences', key: 'user_role' },
    { regex: /(?:using|used) ([\w\s.#]+)/i, type: 'tool_usage', field: 'tool_name' },
    { regex: /must (?:be|have) ([\w\s]+)/i, type: 'constraints', field: 'description' },
  ];

  lines.forEach((line, index) => {
    patterns.forEach(p => {
      const match = line.match(p.regex);
      if (match && match[1]) {
        const val = match[1].trim();
        const source = `Line ${index + 1}`;

        // Basic deduplication: don't add if very similar to existing signal of same type
        const isDuplicate = (list: any[]) => list.some(item => 
          (item.value || item.goal || item.tool_name || item.description || "").toLowerCase().includes(val.toLowerCase()) ||
          val.toLowerCase().includes((item.value || item.goal || item.tool_name || item.description || "").toLowerCase())
        );

        if (p.type === 'preferences' && !isDuplicate(signals.preferences)) {
          signals.preferences.push({ type: 'stated', key: p.key!, value: val, confidence: 0.9, source });
        } else if (p.type === 'goals' && !isDuplicate(signals.goals)) {
          signals.goals.push({ goal: val, status: 'active', source });
        } else if (p.type === 'tool_usage' && !isDuplicate(signals.tool_usage)) {
          signals.tool_usage.push({ tool_name: val, usage_context: line.trim(), recommendation_strength: 'strong' });
        } else if (p.type === 'constraints' && !isDuplicate(signals.constraints)) {
          signals.constraints.push({ type: 'hard', description: val, source });
        }
      }
    });

    // Detect Life State
    if (line.toLowerCase().includes('debug')) signals.life_state.primary = 'debugging';
    else if (line.toLowerCase().includes('refactor')) signals.life_state.primary = 'refactoring';
    else if (line.toLowerCase().includes('learn')) signals.life_state.primary = 'learning';
  });

  return {
    extracted_at: new Date().toISOString(),
    platform,
    signals,
  };
}

export function saveExtractedSignals(signals: ExtractedSignals): void {
  if (!fs.existsSync('storage')) fs.mkdirSync('storage', { recursive: true });
  const filePath = `storage/${signals.platform}-contexts.yaml`;
  
  let store: { contexts: ExtractedSignals[] } = { contexts: [] };
  
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      store = yaml.parse(content) || { contexts: [] };
    } catch (error) {
      console.warn(`[ContextExtractor] Failed to load existing contexts:`, error);
    }
  }
  
  store.contexts.unshift(signals);
  
  // Keep only last 50 contexts per platform
  if (store.contexts.length > 50) {
    store.contexts = store.contexts.slice(0, 50);
  }
  
  fs.writeFileSync(filePath, yaml.stringify(store), 'utf-8');
  console.log(`[ContextExtractor] Saved signals to ${filePath}`);
}

export async function runExtraction(
  conversationText: string,
  platform: string
): Promise<ExtractedSignals> {
  console.log(`[ContextExtractor] Extracting signals from ${platform} conversation...`);
  
  const signals = await extractSignals(conversationText, platform);
  saveExtractedSignals(signals);
  
  console.log(`[ContextExtractor] Extracted ${signals.signals.preferences.length} preferences, ` +
              `${signals.signals.beliefs.length} beliefs, ` +
              `${signals.signals.goals.length} goals`);
  
  return signals;
}