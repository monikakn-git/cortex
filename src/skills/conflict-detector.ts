// src/skills/conflict-detector.ts — Conflict detection skill implementation
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

// Opposite word pairs for semantic detection
const OPPOSITE_PAIRS: [string, string][] = [
  ['openclaw', 'langchain'],
  ['typescript', 'javascript'],
  ['local', 'cloud'],
  ['docker', 'serverless'],
  ['prefer', 'avoid'],
  ['use', 'skip'],
  ['yes', 'no'],
  ['true', 'false'],
];

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
  
  // Method 3: Direct opposition check
  if (isDirectOpposition(statementA, statementB)) {
    return createConflict(a, b, topic, getConflictType(topic));
  }
  
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
  const wordsA = new Set(stmtA.split(/\s+/));
  const wordsB = new Set(stmtB.split(/\s+/));
  
  for (const [word1, word2] of OPPOSITE_PAIRS) {
    if (wordsA.has(word1) && wordsB.has(word2)) return true;
    if (wordsA.has(word2) && wordsB.has(word1)) return true;
  }
  
  return false;
}

function isDirectOpposition(stmtA: string, stmtB: string): boolean {
  // Check for direct negation patterns
  const negationPatterns = [
    [/use\s+(\w+)/i, /don't use\s+(\w+)/i],
    [/prefer\s+(\w+)/i, /avoid\s+(\w+)/i],
    [/should use/i, /should not use/i],
    [/recommend\s+(\w+)/i, /don't recommend\s+(\w+)/i],
  ];
  
  for (const [patternA, patternB] of negationPatterns) {
    const matchA = stmtA.match(patternA);
    const matchB = stmtB.match(patternB);
    if (matchA && matchB && matchA[1] === matchB[1]) {
      return true;
    }
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
    project: 'priority',
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

// LLM-based detection prompt (for complex cases)
export const LLM_CONFLICT_PROMPT = [
  'You are CORTEX\'s conflict detection engine. Your task is to identify contradictions between beliefs expressed by different AI platforms.',
  '',
  '## INPUT',
  'Beliefs to analyze:',
  '{beliefs_json}',
  '',
  '## OUTPUT FORMAT',
  'Return as valid JSON:',
  '{"conflicts": [{"id": "conflict-001", "topic": "", "beliefs": [{"ai": "", "statement": "", "confidence": 0.0}], "severity": 0.0, "type": "technology|approach|constraint|priority|tool", "explanation": ""}]}',
  '',
  '## CONFLICT TYPES',
  '- technology: Disagreement about tools/frameworks',
  '- approach: Disagreement about methodology',
  '- constraint: Opposing constraints',
  '- priority: Different priorities',
  '- tool: Different tool recommendations',
  '',
  '## DETECTION RULES',
  '1. Only compare beliefs on the same topic',
  '2. Compare beliefs from different AI platforms',
  '3. Must be clear opposition, not just different opinions',
  '4. Severity: average confidence * 1.2 (if different AIs), cap at 1.0',
  '',
  'Return ONLY the JSON output.',
].join('\n');

// LLM-based detection (for more complex cases)
export async function detectConflictsWithLLM(beliefs: Belief[]): Promise<Conflict[]> {
  // TODO: Implement LLM-based conflict detection
  // const prompt = LLM_CONFLICT_PROMPT.replace('{beliefs_json}', JSON.stringify(beliefs));
  // const result = await llm.call(prompt);
  // return parseConflicts(result);
  
  return detectConflicts(beliefs);
}

export function filterBySeverity(conflicts: Conflict[], threshold: number = 0.5): Conflict[] {
  return conflicts.filter(c => c.severity >= threshold);
}

export function getConflictsByStatus(
  conflicts: Conflict[],
  status: Conflict['status']
): Conflict[] {
  return conflicts.filter(c => c.status === status);
}