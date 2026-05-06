// tests/integration/conflict-detection.test.ts — Conflict Detection E2E Tests
import * as fs from 'fs';
import * as yaml from 'yaml';
import { detectConflicts } from '../../src/conflict-detector';
import { alertAndLog } from '../../src/alert-logger';
import { Belief } from '../../src/context-loader';

const TEST_STORAGE = 'storage';

beforeAll(() => { fs.mkdirSync(TEST_STORAGE, { recursive: true }); });
afterAll(() => {
  const p = `${TEST_STORAGE}/conflicts.yaml`;
  if (fs.existsSync(p)) fs.unlinkSync(p);
});

const deployBeliefs: Belief[] = [
  { id: 'b1', topic: 'deployment-strategy', statement: 'You should use Kubernetes for deployment', confidence: 0.9, ai: 'claude', timestamp: '' },
  { id: 'b2', topic: 'deployment-strategy', statement: 'You should not use Kubernetes, use serverless', confidence: 0.85, ai: 'chatgpt', timestamp: '' },
];

const dbBeliefs: Belief[] = [
  { id: 'b3', topic: 'database-choice', statement: 'PostgreSQL is recommended, do not use MongoDB', confidence: 0.9, ai: 'gemini', timestamp: '' },
  { id: 'b4', topic: 'database-choice', statement: 'MongoDB is good, you should use it', confidence: 0.85, ai: 'claude', timestamp: '' },
];

const testBeliefs: Belief[] = [
  { id: 'b5', topic: 'testing-approach', statement: 'Unit tests are bad', confidence: 0.85, ai: 'chatgpt', timestamp: '' },
  { id: 'b6', topic: 'testing-approach', statement: 'Unit tests are good', confidence: 0.85, ai: 'gemini', timestamp: '' },
];

describe('Conflict Detection', () => {
  it('should detect deployment strategy conflict', () => {
    const conflicts = detectConflicts(deployBeliefs, 0.3);
    expect(conflicts.length).toBeGreaterThanOrEqual(1);
    expect(conflicts[0].topic).toBe('deployment-strategy');
    console.log(`[KPI] Deploy conflict severity: ${conflicts[0]?.severity?.toFixed(2)}`);
  });

  it('should detect database choice conflict', () => {
    const conflicts = detectConflicts(dbBeliefs, 0.3);
    expect(conflicts.length).toBeGreaterThanOrEqual(1);
  });

  it('should detect testing approach conflict', () => {
    const conflicts = detectConflicts(testBeliefs, 0.3);
    expect(conflicts.length).toBeGreaterThanOrEqual(1);
  });

  it('should NOT flag non-conflicting beliefs', () => {
    const safe: Belief[] = [
      { id: 's1', topic: 'framework', statement: 'User prefers TypeScript', confidence: 0.9, ai: 'claude', timestamp: '' },
      { id: 's2', topic: 'ide', statement: 'User likes VSCode', confidence: 0.85, ai: 'chatgpt', timestamp: '' },
    ];
    expect(detectConflicts(safe, 0.3)).toHaveLength(0);
  });

  it('should not flag same-AI beliefs', () => {
    const same: Belief[] = [
      { id: 'x1', topic: 'test', statement: 'Use Docker', confidence: 0.9, ai: 'claude', timestamp: '' },
      { id: 'x2', topic: 'test', statement: 'Do not use Docker', confidence: 0.9, ai: 'claude', timestamp: '' },
    ];
    expect(detectConflicts(same, 0.3)).toHaveLength(0);
  });

  it('should achieve >= 66% conflict recall rate (KPI)', () => {
    const all = [...deployBeliefs, ...dbBeliefs, ...testBeliefs];
    const conflicts = detectConflicts(all, 0.3);
    const recall = conflicts.length / 3;
    console.log(`\n[KPI] Conflict Recall: ${conflicts.length}/3 = ${(recall * 100).toFixed(0)}%`);
    expect(recall).toBeGreaterThanOrEqual(0.66);
  });

  it('should write conflicts to YAML via alertAndLog', async () => {
    const conflicts = detectConflicts(deployBeliefs, 0.3);
    await alertAndLog(conflicts);
    const content = fs.readFileSync(`${TEST_STORAGE}/conflicts.yaml`, 'utf-8');
    const parsed = yaml.parse(content);
    expect(parsed.conflicts.length).toBeGreaterThanOrEqual(1);
  });
});
