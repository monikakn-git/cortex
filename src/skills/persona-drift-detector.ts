// src/skills/persona-drift-detector.ts — Track AI tone and personality shifts
import * as fs from 'fs';
import * as yaml from 'yaml';

export interface PersonaTone {
  ai: string;
  timestamp: string;
  tone: 'formal' | 'casual' | 'technical' | 'supportive' | 'directive';
  engagement_level: number; // 0.0-1.0
  helpfulness: number; // 0.0-1.0
  verbosity: number; // 0.0-1.0 (how wordy)
  confidence: number; // 0.0-1.0
  detected_patterns: string[];
}

export interface PersonaDrift {
  id: string;
  ai: string;
  old_persona: PersonaTone;
  new_persona: PersonaTone;
  drift_severity: number; // 0.0-1.0
  drift_type: string;
  first_observed: string;
  status: 'pending_review' | 'noted' | 'dismissed';
}

export interface PersonaReport {
  week_start: string;
  week_end: string;
  drifts: PersonaDrift[];
  summaries: {
    ai: string;
    tone_trend: string;
    changes: string[];
  }[];
}

const DRIFT_THRESHOLD = 0.3; // Minimum difference to trigger alert

export async function detectPersonaDrift(): Promise<PersonaDrift[]> {
  console.log('[PersonaDriftDetector] Analyzing AI tone shifts...');
  
  // 1. Load all recent contexts and extract tone
  const tones = await analyzeAllTones();
  
  // 2. Load previous baseline
  const baseline = loadToneBaseline();
  
  // 3. Compare and detect drifts
  const drifts: PersonaDrift[] = [];
  
  for (const platform of ['claude', 'chatgpt', 'gemini']) {
    const recentTones = tones.filter(t => t.ai === platform);
    const recentAvg = averageTones(recentTones);
    const oldAvg = baseline[platform];
    
    if (oldAvg && recentAvg) {
      const drift = compareTones(platform, oldAvg, recentAvg);
      if (drift && drift.drift_severity >= DRIFT_THRESHOLD) {
        drifts.push(drift);
      }
    }
  }
  
  // 4. Save new baseline and drifts
  saveToneBaseline(tones);
  saveDriftHistory(drifts);
  
  return drifts;
}

async function analyzeAllTones(): Promise<PersonaTone[]> {
  const tones: PersonaTone[] = [];
  const platforms = ['claude', 'chatgpt', 'gemini'];
  
  for (const platform of platforms) {
    const path = `storage/${platform}-contexts.yaml`;
    if (fs.existsSync(path)) {
      try {
        const content = fs.readFileSync(path, 'utf-8');
        const data = yaml.parse(content);
        
        if (data?.contexts) {
          // Take recent contexts (last 5)
          const recent = data.contexts.slice(0, 5);
          
          for (const context of recent) {
            if (context.raw_content) {
              const tone = extractTone(context.raw_content, platform);
              tones.push(tone);
            }
          }
        }
      } catch (error) {
        console.warn(`[PersonaDriftDetector] Failed to analyze ${platform}:`, error);
      }
    }
  }
  
  return tones;
}

function extractTone(content: string, platform: string): PersonaTone {
  const lower = content.toLowerCase();
  
  // Detect tone
  let tone: PersonaTone['tone'] = 'technical';
  if (lower.includes('sure!') || lower.includes('great!') || lower.includes('happy to')) {
    tone = 'supportive';
  } else if (lower.includes('you should') || lower.includes('you need to')) {
    tone = 'directive';
  } else if (lower.includes('lol') || lower.includes(':)') || lower.includes('btw')) {
    tone = 'casual';
  } else if (lower.includes('respectfully') || lower.includes('sincerely')) {
    tone = 'formal';
  }
  
  // Detect engagement (ratio of questions, personalization)
  const questionCount = (content.match(/\?/g) || []).length;
  const personalReferences = (content.match(/you|your/gi) || []).length;
  const engagement = Math.min(1.0, (questionCount + personalReferences) / content.length);
  
  // Detect helpfulness (ratio of actionable advice)
  const actionWords = (content.match(/should|recommend|try|use|consider/gi) || []).length;
  const helpfulness = Math.min(1.0, actionWords / (content.split(' ').length / 10));
  
  // Detect verbosity
  const wordCount = content.split(' ').length;
  const avgSentenceLength = wordCount / (content.split(/[.!?]/).length || 1);
  const verbosity = Math.min(1.0, avgSentenceLength / 20); // Normalize by typical sentence
  
  // Detect confidence (certainty vs hedging)
  const certaintyWords = (content.match(/definitely|clearly|obviously|undoubtedly/gi) || []).length;
  const hedgingWords = (content.match(/might|could|perhaps|maybe|seems/gi) || []).length;
  const confidence = hedgingWords > 0 
    ? certaintyWords / (certaintyWords + hedgingWords)
    : Math.min(1.0, certaintyWords / 5);
  
  // Detect patterns
  const patterns: string[] = [];
  if (lower.includes('markdown code block')) patterns.push('uses_code_blocks');
  if (lower.includes('emoji')) patterns.push('uses_emoji');
  if (lower.includes('###')) patterns.push('uses_headers');
  if (lower.includes('**')) patterns.push('uses_bold');
  if (lower.includes('-')) patterns.push('uses_lists');
  
  return {
    ai: platform,
    timestamp: new Date().toISOString(),
    tone,
    engagement_level: engagement,
    helpfulness,
    verbosity,
    confidence,
    detected_patterns: patterns,
  };
}

function averageTones(tones: PersonaTone[]): PersonaTone | null {
  if (tones.length === 0) return null;
  
  return {
    ai: tones[0].ai,
    timestamp: new Date().toISOString(),
    tone: tones[0].tone, // Use most recent
    engagement_level: tones.reduce((sum, t) => sum + t.engagement_level, 0) / tones.length,
    helpfulness: tones.reduce((sum, t) => sum + t.helpfulness, 0) / tones.length,
    verbosity: tones.reduce((sum, t) => sum + t.verbosity, 0) / tones.length,
    confidence: tones.reduce((sum, t) => sum + t.confidence, 0) / tones.length,
    detected_patterns: tones.flatMap(t => t.detected_patterns),
  };
}

function compareTones(ai: string, old: PersonaTone, newTone: PersonaTone): PersonaDrift | null {
  // Calculate differences
  const engagementDiff = Math.abs(old.engagement_level - newTone.engagement_level);
  const helpfulnessDiff = Math.abs(old.helpfulness - newTone.helpfulness);
  const verbosityDiff = Math.abs(old.verbosity - newTone.verbosity);
  const confidenceDiff = Math.abs(old.confidence - newTone.confidence);
  
  // Overall severity
  const avgDiff = (engagementDiff + helpfulnessDiff + verbosityDiff + confidenceDiff) / 4;
  
  // Identify drift type
  let driftType = 'unknown';
  if (engagementDiff > 0.2) driftType = 'engagement_shift';
  if (helpfulnessDiff > 0.2) driftType = 'helpfulness_shift';
  if (verbosityDiff > 0.2) driftType = 'verbosity_shift';
  if (confidenceDiff > 0.2) driftType = 'confidence_shift';
  
  if (avgDiff < 0.1) return null;
  
  return {
    id: `drift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ai,
    old_persona: old,
    new_persona: newTone,
    drift_severity: avgDiff,
    drift_type: driftType,
    first_observed: new Date().toISOString(),
    status: 'pending_review',
  };
}

function loadToneBaseline(): Record<string, PersonaTone> {
  const path = 'storage/tone-baseline.yaml';
  if (fs.existsSync(path)) {
    try {
      const content = fs.readFileSync(path, 'utf-8');
      const data = yaml.parse(content);
      return data?.baseline || {};
    } catch (error) {
      console.warn('[PersonaDriftDetector] Failed to load baseline:', error);
    }
  }
  return {};
}

function saveToneBaseline(tones: PersonaTone[]): void {
  const baseline: Record<string, PersonaTone> = {};
  
  for (const platform of ['claude', 'chatgpt', 'gemini']) {
    const platformTones = tones.filter(t => t.ai === platform);
    if (platformTones.length > 0) {
      const avg = averageTones(platformTones);
      if (avg) baseline[platform] = avg;
    }
  }
  
  const path = 'storage/tone-baseline.yaml';
  fs.writeFileSync(path, yaml.stringify({ baseline }), 'utf-8');
}

function saveDriftHistory(drifts: PersonaDrift[]): void {
  const path = 'storage/persona-drift-history.yaml';
  let history: { drifts: PersonaDrift[] } = { drifts: [] };
  
  if (fs.existsSync(path)) {
    try {
      const content = fs.readFileSync(path, 'utf-8');
      history = yaml.parse(content) || { drifts: [] };
    } catch (error) {
      console.warn('[PersonaDriftDetector] Failed to load history:', error);
    }
  }
  
  history.drifts.push(...drifts);
  
  // Keep last 100
  if (history.drifts.length > 100) {
    history.drifts = history.drifts.slice(-100);
  }
  
  fs.writeFileSync(path, yaml.stringify(history), 'utf-8');
}

export async function generateWeeklyReport(): Promise<PersonaReport> {
  const now = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  const drifts = await detectPersonaDrift();
  
  // Group by AI
  const summaries: PersonaReport['summaries'] = [];
  
  for (const platform of ['claude', 'chatgpt', 'gemini']) {
    const platformDrifts = drifts.filter(d => d.ai === platform);
    
    if (platformDrifts.length > 0) {
      const changes = platformDrifts.map(d => d.drift_type);
      summaries.push({
        ai: platform,
        tone_trend: platformDrifts[0].new_persona.tone,
        changes,
      });
    }
  }
  
  return {
    week_start: weekStart.toISOString(),
    week_end: weekEnd.toISOString(),
    drifts,
    summaries,
  };
}

// CLI interface
if (require.main === module) {
  detectPersonaDrift()
    .then(drifts => {
      if (drifts.length === 0) {
        console.log('[PersonaDriftDetector] ✅ No significant tone drifts detected.\n');
      } else {
        console.log(`[PersonaDriftDetector] Found ${drifts.length} tone shift(s):\n`);
        
        for (const drift of drifts) {
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log(`AI: ${drift.ai}`);
          console.log(`Type: ${drift.drift_type}`);
          console.log(`Severity: ${(drift.drift_severity * 100).toFixed(0)}%`);
          console.log(`Old tone: ${drift.old_persona.tone}`);
          console.log(`New tone: ${drift.new_persona.tone}`);
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        }
      }
    })
    .catch(console.error);
}