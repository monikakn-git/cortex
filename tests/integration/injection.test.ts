// tests/integration/injection.test.ts — Context Injection E2E Tests
import * as fs from 'fs';
import * as yaml from 'yaml';
import { generateBriefing, Platform } from '../../src/skills/context-injector';

const TEST_STORAGE = 'storage';

beforeAll(() => {
  fs.mkdirSync(TEST_STORAGE, { recursive: true });

  // Set up test SOUL data
  const soulData = {
    user: {
      name: 'TestUser',
      role: 'Full-Stack Developer',
      goals: ['Build CORTEX', 'Ship by May 8th'],
      communication_style: 'concise',
    },
    preferences: {
      coding: { language: 'TypeScript', framework: 'React' },
      response: { format: 'markdown', length: 'concise' },
      tools: { preferred: ['VSCode', 'Docker'], avoided: ['Vim'] },
    },
    life_state: {
      primary: 'building',
      secondary: ['testing'],
      context: 'Working on CORTEX hackathon project',
    },
    beliefs: {
      project: [{ belief: 'OpenClaw is the right framework', confidence: 0.8 }],
      technology: [{ belief: 'TypeScript is preferred', confidence: 0.9 }],
    },
    constraints: {
      hard: ['All data stored locally', 'No cloud dependencies'],
      soft: ['Prefer YAML over JSON for config'],
    },
    history: { recent_contexts: [] },
  };
  fs.writeFileSync(`${TEST_STORAGE}/soul.yaml`, yaml.stringify(soulData), 'utf-8');

  // Set up test conflicts
  const conflictsData = {
    conflicts: [
      {
        id: 'test-conflict-1',
        topic: 'deployment-strategy',
        beliefs: [
          { ai: 'claude', statement: 'Use Kubernetes for deployment' },
          { ai: 'chatgpt', statement: 'Avoid Kubernetes, use serverless' },
        ],
        severity: 0.85,
        status: 'pending',
        detected_at: '2026-05-06T00:00:00Z',
      },
    ],
  };
  fs.writeFileSync(`${TEST_STORAGE}/conflicts.yaml`, yaml.stringify(conflictsData), 'utf-8');
});

afterAll(() => {
  const files = ['soul.yaml', 'conflicts.yaml'];
  for (const f of files) {
    const path = `${TEST_STORAGE}/${f}`;
    if (fs.existsSync(path)) fs.unlinkSync(path);
  }
});

describe('Context Injection', () => {
  describe('generateBriefing() for Claude', () => {
    it('should produce a markdown-formatted briefing', async () => {
      const briefing = await generateBriefing('claude');

      expect(briefing).toContain('TestUser');
      expect(briefing).toContain('Full-Stack Developer');
      expect(briefing).toContain('TypeScript');
      expect(briefing).toContain('CORTEX');
    });

    it('should include active conflicts', async () => {
      const briefing = await generateBriefing('claude');

      expect(briefing).toContain('deployment-strategy');
      expect(briefing).toContain('Kubernetes');
    });

    it('should include constraints', async () => {
      const briefing = await generateBriefing('claude');

      expect(briefing).toContain('locally');
    });
  });

  describe('generateBriefing() for ChatGPT', () => {
    it('should produce a JSON-formatted briefing', async () => {
      const briefing = await generateBriefing('chatgpt');

      const parsed = JSON.parse(briefing);
      expect(parsed.context.user.name).toBe('TestUser');
      expect(parsed.context.preferences.coding.language).toBe('TypeScript');
      expect(parsed.context.active_conflicts).toHaveLength(1);
    });
  });

  describe('generateBriefing() for Gemini', () => {
    it('should produce a plain-text formatted briefing', async () => {
      const briefing = await generateBriefing('gemini');

      expect(briefing).toContain('CONTEXT INJECTION');
      expect(briefing).toContain('TestUser');
      expect(briefing).toContain('TypeScript');
      expect(briefing).toContain('Injected by CORTEX');
    });
  });

  describe('Injection Latency', () => {
    it('should generate briefing within 100ms', async () => {
      const platforms: Platform[] = ['claude', 'chatgpt', 'gemini'];

      for (const platform of platforms) {
        const start = Date.now();
        await generateBriefing(platform);
        const elapsed = Date.now() - start;

        console.log(`[KPI] Injection latency for ${platform}: ${elapsed}ms`);
        expect(elapsed).toBeLessThan(100); // Must be under 100ms
      }
    });
  });

  describe('Briefing without conflicts', () => {
    it('should work when no conflicts exist', async () => {
      const briefing = await generateBriefing('claude', { includeConflicts: false });
      expect(briefing).toContain('TestUser');
      expect(briefing).not.toContain('Active Conflicts');
    });
  });
});
