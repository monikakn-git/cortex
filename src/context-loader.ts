// src/context-loader.ts — Load AI conversation logs
import * as fs from 'fs';
import * as yaml from 'yaml';

export interface Context {
  ai: string;
  date: string;
  summary: string;
  raw_content?: string;
  beliefs?: Belief[];
}

export interface Belief {
  id: string;
  topic: string;
  statement: string;
  confidence: number;
  ai: string;
  timestamp: string;
}

const AI_PLATFORMS = ['claude', 'chatgpt', 'gemini'];

export async function loadRecentContexts(maxPerAi: number = 10): Promise<Context[]> {
  const contexts: Context[] = [];

  for (const ai of AI_PLATFORMS) {
    const filePath = `storage/${ai}-contexts.yaml`;
    
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = yaml.parse(content);
        
        if (data && data.contexts) {
          const recent = data.contexts.slice(0, maxPerAi);
          contexts.push(...recent.map((c: any) => ({ ...c, ai })));
        }
      } catch (error) {
        console.warn(`[ContextLoader] Failed to load ${ai} contexts:`, error);
      }
    }
  }

  // Sort by date (newest first)
  contexts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return contexts;
}

export function getContextFilePath(ai: string): string {
  return `storage/${ai}-contexts.yaml`;
}