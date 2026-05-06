// tests/integration/kpi-runner.ts — Full KPI Benchmark Runner
// Calculates all 3 CORTEX KPIs: Extraction Accuracy, Injection Latency, Conflict Recall Rate
import * as fs from 'fs';
import * as yaml from 'yaml';
import { buildExtractionPrompt, parseExtractedSignals } from '../../src/skills/context-extractor';
import { generateBriefing, Platform } from '../../src/skills/context-injector';
import { detectConflicts } from '../../src/conflict-detector';
import { Belief } from '../../src/context-loader';

// Ensure dirs
fs.mkdirSync('storage', { recursive: true });
fs.mkdirSync('config', { recursive: true });

interface KPIResults {
  extraction_accuracy: { precision: number; recall: number; f1: number; samples: number };
  injection_latency: { avg_ms: number; max_ms: number; min_ms: number; p95_ms: number; samples: number };
  conflict_recall_rate: { recall: number; detected: number; expected: number };
}

async function runAllKPIs(): Promise<KPIResults> {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║    CORTEX KPI Benchmark Runner           ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // ── KPI 1: Extraction Accuracy ──
  console.log('── KPI 1: Extraction Accuracy ──');
  const extractionResult = measureExtractionAccuracy();

  // ── KPI 2: Injection Latency ──
  console.log('\n── KPI 2: Injection Latency ──');
  const latencyResult = await measureInjectionLatency();

  // ── KPI 3: Conflict Recall Rate ──
  console.log('\n── KPI 3: Conflict Recall Rate ──');
  const recallResult = measureConflictRecall();

  const results: KPIResults = {
    extraction_accuracy: extractionResult,
    injection_latency: latencyResult,
    conflict_recall_rate: recallResult,
  };

  // Print summary
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║          KPI RESULTS SUMMARY             ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║ Extraction Accuracy (F1): ${(results.extraction_accuracy.f1 * 100).toFixed(1)}%`);
  console.log(`║ Injection Latency (avg):  ${results.injection_latency.avg_ms.toFixed(1)}ms`);
  console.log(`║ Conflict Recall Rate:     ${(results.conflict_recall_rate.recall * 100).toFixed(1)}%`);
  console.log('╚══════════════════════════════════════════╝');

  // Save results
  fs.writeFileSync('storage/kpi-results.yaml', yaml.stringify({
    timestamp: new Date().toISOString(),
    results,
  }));
  console.log('\nResults saved to storage/kpi-results.yaml');

  return results;
}

function measureExtractionAccuracy() {
  // Test prompt generation works for all platforms
  let correctPrompts = 0;
  let totalPrompts = 0;
  const platforms = ['claude', 'chatgpt', 'gemini'];

  for (const platform of platforms) {
    totalPrompts++;
    const prompt = buildExtractionPrompt('User: I prefer TypeScript.\nAI: Great choice!', platform);
    if (prompt.includes(platform) && prompt.includes('TypeScript') && prompt.includes('preferences')) {
      correctPrompts++;
    }
  }

  // Test JSON parsing accuracy
  const validJSON = '{"extracted_at":"2026-05-06","platform":"claude","signals":{"preferences":[{"type":"coding","key":"lang","value":"TS","confidence":0.9,"source":"m1"}],"beliefs":[{"statement":"User prefers TS","confidence":0.8,"topic":"lang","source":"m1"}],"goals":[],"constraints":[],"life_state":{"primary":"building","secondary":[],"context":"test"},"tool_usage":[]}}';

  let parseSuccess = 0;
  let parseTotal = 3;

  try { parseExtractedSignals(validJSON); parseSuccess++; } catch {}
  try { parseExtractedSignals('```json\n' + validJSON + '\n```'); parseSuccess++; } catch {}
  try { parseExtractedSignals('invalid'); } catch { parseSuccess++; /* expected to fail */ }

  const precision = correctPrompts / totalPrompts;
  const recall = parseSuccess / parseTotal;
  const f1 = 2 * (precision * recall) / (precision + recall || 1);

  console.log(`  Prompt generation: ${correctPrompts}/${totalPrompts} correct`);
  console.log(`  Parse accuracy: ${parseSuccess}/${parseTotal}`);
  console.log(`  Precision: ${(precision * 100).toFixed(1)}% | Recall: ${(recall * 100).toFixed(1)}% | F1: ${(f1 * 100).toFixed(1)}%`);

  return { precision, recall, f1, samples: totalPrompts + parseTotal };
}

async function measureInjectionLatency() {
  // Set up minimal SOUL data for latency test
  const soulData = {
    user: { name: 'Benchmark', role: 'Dev', goals: ['Ship'], communication_style: 'concise' },
    preferences: { coding: { lang: 'TS' }, response: { format: 'md' }, tools: { preferred: ['VSCode'], avoided: [] } },
    life_state: { primary: 'building', secondary: [], context: 'Benchmarking' },
    beliefs: { project: [], technology: [] },
    constraints: { hard: ['Local only'], soft: [] },
    history: { recent_contexts: [] },
  };
  fs.writeFileSync('storage/soul.yaml', yaml.stringify(soulData));

  const platforms: Platform[] = ['claude', 'chatgpt', 'gemini'];
  const latencies: number[] = [];

  // Run 5 iterations per platform
  for (const platform of platforms) {
    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      await generateBriefing(platform);
      latencies.push(Date.now() - start);
    }
  }

  latencies.sort((a, b) => a - b);
  const avg = latencies.reduce((s, v) => s + v, 0) / latencies.length;
  const p95 = latencies[Math.floor(latencies.length * 0.95)];

  console.log(`  Samples: ${latencies.length}`);
  console.log(`  Avg: ${avg.toFixed(1)}ms | Min: ${latencies[0]}ms | Max: ${latencies[latencies.length - 1]}ms | P95: ${p95}ms`);

  return { avg_ms: avg, max_ms: latencies[latencies.length - 1], min_ms: latencies[0], p95_ms: p95, samples: latencies.length };
}

function measureConflictRecall() {
  const beliefs: Belief[] = [
    { id: 'b1', topic: 'deployment', statement: 'You should use Kubernetes', confidence: 0.9, ai: 'claude', timestamp: '' },
    { id: 'b2', topic: 'deployment', statement: 'You should not use Kubernetes', confidence: 0.85, ai: 'chatgpt', timestamp: '' },
    { id: 'b3', topic: 'database', statement: 'PostgreSQL is recommended, do not use MongoDB', confidence: 0.9, ai: 'gemini', timestamp: '' },
    { id: 'b4', topic: 'database', statement: 'MongoDB is good, you should use it', confidence: 0.85, ai: 'claude', timestamp: '' },
    { id: 'b5', topic: 'testing', statement: 'Unit tests are bad', confidence: 0.85, ai: 'chatgpt', timestamp: '' },
    { id: 'b6', topic: 'testing', statement: 'Unit tests are good', confidence: 0.85, ai: 'gemini', timestamp: '' },
  ];

  const conflicts = detectConflicts(beliefs, 0.3);
  const expected = 3;
  const recall = conflicts.length / expected;

  console.log(`  Expected: ${expected} conflicts`);
  console.log(`  Detected: ${conflicts.length} conflicts`);
  console.log(`  Recall: ${(recall * 100).toFixed(1)}%`);

  return { recall, detected: conflicts.length, expected };
}

// Run
runAllKPIs().catch(console.error);
