// src/belief-extractor.ts — Extract beliefs from contexts using LLM
import { Context, Belief } from './context-loader';

export function extractBeliefs(context: Context): Belief[] {
  const beliefs: Belief[] = [];
  
  // 1. Process explicit signals if available
  if (context.signals) {
    const { preferences, goals, beliefs: existingBeliefs, tool_usage, constraints } = context.signals;

    // Convert preferences to beliefs
    for (const p of preferences) {
      beliefs.push({
        id: generateBeliefId(),
        topic: 'preference',
        statement: p.preference,
        confidence: 0.8,
        ai: context.ai,
        timestamp: context.date || new Date().toISOString(),
      });
    }

    // Convert goals to beliefs
    for (const g of goals) {
      beliefs.push({
        id: generateBeliefId(),
        topic: 'goal',
        statement: g.goal,
        confidence: 0.7,
        ai: context.ai,
        timestamp: context.date || new Date().toISOString(),
      });
    }

    // Convert tool usage to beliefs
    for (const t of tool_usage) {
      beliefs.push({
        id: generateBeliefId(),
        topic: 'tool',
        statement: `${t.tool_name} (${t.usage_context})`,
        confidence: t.recommendation_strength === 'strong' ? 0.9 : 0.7,
        ai: context.ai,
        timestamp: context.date || new Date().toISOString(),
      });
    }

    // Convert constraints to beliefs
    for (const c of constraints) {
      beliefs.push({
        id: generateBeliefId(),
        topic: 'constraint',
        statement: c.description,
        confidence: c.type === 'hard' ? 1.0 : 0.8,
        ai: context.ai,
        timestamp: context.date || new Date().toISOString(),
      });
    }

    // Add existing beliefs
    for (const b of existingBeliefs) {
      beliefs.push({
        id: generateBeliefId(),
        topic: b.topic || 'general',
        statement: b.statement,
        confidence: b.confidence || 0.6,
        ai: context.ai,
        timestamp: context.date || new Date().toISOString(),
      });
    }
  }

  // 2. Fallback to summary if no signals or to supplement
  if (context.summary) {
    // Simple keyword-based extraction (placeholder)
    // In production, use LLM to analyze the full conversation
    
    const topics = extractTopicsFromSummary(context.summary);
    
    for (const topic of topics) {
      beliefs.push({
        id: generateBeliefId(),
        topic: topic.name,
        statement: topic.statement,
        confidence: topic.confidence,
        ai: context.ai,
        timestamp: context.date || new Date().toISOString(),
      });
    }
  }
  
  return beliefs;
}

function extractTopicsFromSummary(summary: string): { name: string; statement: string; confidence: number }[] {
  const topics: { name: string; statement: string; confidence: number }[] = [];
  
  // Placeholder: Extract explicit mentions from summary
  // In production, this would call an LLM with a prompt like:
  // "Extract any beliefs the AI expressed about the user or project from this conversation."
  
  const frameworkMatch = summary.match(/(OpenClaw|LangChain|Node\.js|TypeScript)/i);
  if (frameworkMatch) {
    topics.push({
      name: 'project-framework',
      statement: `${frameworkMatch[1]} is being used for this project`,
      confidence: 0.6,
    });
  }
  
  const preferenceMatch = summary.match(/prefer(?:ring|s)?\s+(\w+)/i);
  if (preferenceMatch) {
    topics.push({
      name: 'user-preference',
      statement: `User prefers ${preferenceMatch[1]}`,
      confidence: 0.5,
    });
  }
  
  return topics;
}

function generateBeliefId(): string {
  return `belief-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Placeholder LLM extraction function
export async function extractBeliefsWithLLM(context: Context): Promise<Belief[]> {
  // TODO: Implement LLM-based extraction
  // const llm = new ChatOpenAI({ ... });
  // const prompt = `Extract beliefs from: ${context.raw_content}`;
  // const result = await llm.call(prompt);
  // return parseBeliefs(result);
  
  return extractBeliefs(context);
}