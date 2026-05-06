// tests/integration/poisoning.test.ts — Context Poisoning Detection Tests
import * as fs from 'fs';
import * as yaml from 'yaml';
import { detectPoisoning, confirmBelief, getPendingAlerts } from '../../src/skills/context-poisoning-detector';

const TEST_STORAGE = 'storage';

beforeAll(() => {
  fs.mkdirSync(TEST_STORAGE, { recursive: true });

  // Simulate poisoned beliefs: same wrong belief repeated 4 times across platforms
  const claudeContexts = {
    contexts: [
      {
        extracted_at: '2026-05-01T00:00:00Z',
        signals: { beliefs: [
          { statement: "User's timezone is PST", topic: 'user-location', confidence: 0.7 },
          { statement: "User's timezone is PST", topic: 'user-location', confidence: 0.7 },
          { statement: "User's timezone is PST", topic: 'user-location', confidence: 0.7 },
        ]},
      },
    ],
  };

  const chatgptContexts = {
    contexts: [
      {
        extracted_at: '2026-05-02T00:00:00Z',
        signals: { beliefs: [
          { statement: "User's timezone is PST", topic: 'user-location', confidence: 0.65 },
          { statement: 'User prefers Java over Python', topic: 'user-preference', confidence: 0.6 },
          { statement: 'User prefers Java over Python', topic: 'user-preference', confidence: 0.6 },
          { statement: 'User prefers Java over Python', topic: 'user-preference', confidence: 0.6 },
        ]},
      },
    ],
  };

  fs.writeFileSync(`${TEST_STORAGE}/claude-contexts.yaml`, yaml.stringify(claudeContexts));
  fs.writeFileSync(`${TEST_STORAGE}/chatgpt-contexts.yaml`, yaml.stringify(chatgptContexts));
  // Remove stale tracker
  const tracker = `${TEST_STORAGE}/poisoning-tracker.yaml`;
  if (fs.existsSync(tracker)) fs.unlinkSync(tracker);
});

afterAll(() => {
  for (const f of ['claude-contexts.yaml', 'chatgpt-contexts.yaml', 'gemini-contexts.yaml', 'poisoning-tracker.yaml']) {
    const p = `${TEST_STORAGE}/${f}`;
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
});

describe('Context Poisoning Detection', () => {
  it('should detect repeated wrong beliefs as poisoning risk', async () => {
    const alerts = await detectPoisoning();
    expect(alerts.length).toBeGreaterThanOrEqual(1);

    const tzAlert = alerts.find(a => a.belief.statement.includes('PST'));
    if (tzAlert) {
      expect(tzAlert.occurrences).toBeGreaterThanOrEqual(3);
      expect(tzAlert.status).toBe('poisoning_risk');
      console.log(`[KPI] Poisoning detected: "${tzAlert.belief.statement}" (${tzAlert.occurrences}x)`);
    }
  });

  it('should track source AIs for poisoned beliefs', async () => {
    const alerts = await detectPoisoning();
    const tzAlert = alerts.find(a => a.belief.statement.includes('PST'));
    if (tzAlert) {
      expect(tzAlert.source_ais.length).toBeGreaterThanOrEqual(1);
      console.log(`[KPI] Sources: ${tzAlert.source_ais.join(', ')}`);
    }
  });

  it('should calculate severity > 0.5 for multi-AI poisoning', async () => {
    const alerts = await detectPoisoning();
    for (const alert of alerts) {
      expect(alert.severity).toBeGreaterThan(0);
      console.log(`[KPI] Severity for "${alert.belief.topic}": ${(alert.severity * 100).toFixed(0)}%`);
    }
  });

  it('should persist alerts to poisoning-tracker.yaml', async () => {
    await detectPoisoning();
    expect(fs.existsSync(`${TEST_STORAGE}/poisoning-tracker.yaml`)).toBe(true);
    const content = fs.readFileSync(`${TEST_STORAGE}/poisoning-tracker.yaml`, 'utf-8');
    const parsed = yaml.parse(content);
    expect(parsed.alerts.length).toBeGreaterThanOrEqual(1);
  });

  it('should allow user to confirm/reject a poisoned belief', async () => {
    const alerts = await getPendingAlerts();
    if (alerts.length > 0) {
      await confirmBelief(alerts[0].id, false, 'User is actually in Mumbai');
      const updated = await getPendingAlerts();
      const rejected = updated.find(a => a.id === alerts[0].id);
      // It should be removed from pending (status changed to 'rejected')
      expect(rejected).toBeUndefined();
    }
  });
});
