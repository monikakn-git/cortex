// src/conflict-detector.ts — Detect contradictions between beliefs
import { Belief } from './context-loader';

export interface Conflict {
  id: string;
  topic: string;
  beliefs: Belief[];
  severity: number;
  status: 'pending' | 'resolved' | 'ignored';
  detected_at: string;
  resolved_at?: string;
  resolution?: string;
}

// Keywords that indicate contradiction
const CONTRADICTION_PATTERNS = [
  ['best', 'worst'],
  ['good', 'bad'],
  ['prefer', 'avoid'],
  ['use', 'do not use'],
  ['should', 'should not'],
  ['recommended', 'not recommended'],
  ['sufficient', 'insufficient'],
];

export function detectConflicts(beliefs: Belief[], severityThreshold: number = 0.5): Conflict[] {
  const conflicts: Conflict[] = [];
  
  // Group beliefs by topic
  const byTopic = new Map<string, Belief[]>();
  
  for (const belief of beliefs) {
    if (!byTopic.has(belief.topic)) {
      byTopic.set(belief.topic, []);
    }
    byTopic.get(belief.topic)!.push(belief);
  }
  
  // Compare beliefs within each topic
  for (const [topic, topicBeliefs] of byTopic.entries()) {
    if (topicBeliefs.length < 2) continue;
    
    // Compare each pair
    for (let i = 0; i < topicBeliefs.length; i++) {
      for (let j = i + 1; j < topicBeliefs.length; j++) {
        const beliefA = topicBeliefs[i];
        const beliefB = topicBeliefs[j];
        
        // Skip if same AI
        if (beliefA.ai === beliefB.ai) continue;
        
        const conflict = checkContradiction(beliefA, beliefB);
        
        if (conflict && conflict.severity >= severityThreshold) {
          conflicts.push(conflict);
        }
      }
    }
  }
  
  return conflicts;
}

function checkContradiction(a: Belief, b: Belief): Conflict | null {
  const statementA = a.statement.toLowerCase();
  const statementB = b.statement.toLowerCase();
  
  // Check for explicit contradiction patterns
  for (const [positive, negative] of CONTRADICTION_PATTERNS) {
    if (
      (statementA.includes(positive) && statementB.includes(negative)) ||
      (statementA.includes(negative) && statementB.includes(positive))
    ) {
      return {
        id: generateConflictId(),
        topic: a.topic,
        beliefs: [a, b],
        severity: calculateSeverity(a, b),
        status: 'pending',
        detected_at: new Date().toISOString(),
      };
    }
  }
  
  // Check for semantic contradiction using simple heuristics
  // In production, use LLM for better detection
  if (isSemanticContradiction(a.statement, b.statement)) {
    return {
      id: generateConflictId(),
      topic: a.topic,
      beliefs: [a, b],
      severity: calculateSeverity(a, b),
      status: 'pending',
      detected_at: new Date().toISOString(),
    };
  }
  
  return null;
}

function isSemanticContradiction(statementA: string, statementB: string): boolean {
  // Placeholder: Simple heuristic-based detection
  // In production, use embedding similarity or LLM
  
  const wordsA = new Set(statementA.toLowerCase().split(' '));
  const wordsB = new Set(statementB.toLowerCase().split(' '));
  
  // Check for opposite words
  const opposites: [string, string][] = [
    ['openclaw', 'langchain'],
    ['typescript', 'javascript'],
    ['local', 'cloud'],
    ['docker', 'serverless'],
  ];
  
  for (const [word1, word2] of opposites) {
    if (wordsA.has(word1) && wordsB.has(word2)) return true;
    if (wordsA.has(word2) && wordsB.has(word1)) return true;
  }
  
  return false;
}

function calculateSeverity(a: Belief, b: Belief): number {
  // Severity based on confidence of both beliefs
  const avgConfidence = (a.confidence + b.confidence) / 2;
  
  // Boost severity if beliefs are from different AIs
  const aiMultiplier = a.ai !== b.ai ? 1.2 : 0.8;
  
  return Math.min(1.0, avgConfidence * aiMultiplier);
}

function generateConflictId(): string {
  return `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}