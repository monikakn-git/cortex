// tests/integration/extraction.test.ts — Context Extraction E2E Tests
import * as fs from 'fs';
import * as yaml from 'yaml';
import {
  buildExtractionPrompt,
  parseExtractedSignals,
  saveExtractedSignals,
  ExtractedSignals,
} from '../../src/skills/context-extractor';

const TEST_STORAGE = 'storage';

beforeAll(() => {
  fs.mkdirSync(TEST_STORAGE, { recursive: true });
});

afterAll(() => {
  // Clean up test files
  const testFiles = ['claude-contexts.yaml', 'chatgpt-contexts.yaml', 'gemini-contexts.yaml'];
  for (const file of testFiles) {
    const path = `${TEST_STORAGE}/${file}`;
    if (fs.existsSync(path)) fs.unlinkSync(path);
  }
});

describe('Context Extraction', () => {
  describe('buildExtractionPrompt()', () => {
    it('should generate a valid prompt with platform and conversation text', () => {
      const prompt = buildExtractionPrompt(
        'User: I prefer TypeScript.\nClaude: TypeScript is a great choice.',
        'claude',
        '2026-05-06T00:00:00Z'
      );

      expect(prompt).toContain('claude');
      expect(prompt).toContain('I prefer TypeScript');
      expect(prompt).toContain('2026-05-06T00:00:00Z');
      expect(prompt).toContain('preferences');
      expect(prompt).toContain('beliefs');
      expect(prompt).toContain('goals');
    });

    it('should include JSON schema in the prompt', () => {
      const prompt = buildExtractionPrompt('Hello', 'chatgpt');
      expect(prompt).toContain('"preferences"');
      expect(prompt).toContain('"beliefs"');
      expect(prompt).toContain('"life_state"');
    });

    it('should work for all three platforms', () => {
      for (const platform of ['claude', 'chatgpt', 'gemini']) {
        const prompt = buildExtractionPrompt('Test', platform);
        expect(prompt).toContain(platform);
      }
    });
  });

  describe('parseExtractedSignals()', () => {
    it('should parse valid JSON response', () => {
      const mockResponse = JSON.stringify({
        extracted_at: '2026-05-06T00:00:00Z',
        platform: 'claude',
        signals: {
          preferences: [{ type: 'coding', key: 'language', value: 'TypeScript', confidence: 0.9, source: 'msg1' }],
          beliefs: [{ statement: 'User prefers TypeScript', confidence: 0.8, topic: 'language', source: 'msg1' }],
          goals: [{ goal: 'Build a web app', status: 'active', source: 'msg1' }],
          constraints: [{ type: 'hard', description: 'Must use local storage', source: 'msg1' }],
          life_state: { primary: 'building', secondary: [], context: 'Web app development' },
          tool_usage: [{ tool_name: 'VSCode', usage_context: 'IDE', recommendation_strength: 'strong' }],
        },
      });

      const signals = parseExtractedSignals(mockResponse);
      expect(signals.platform).toBe('claude');
      expect(signals.signals.preferences).toHaveLength(1);
      expect(signals.signals.beliefs).toHaveLength(1);
      expect(signals.signals.beliefs[0].statement).toBe('User prefers TypeScript');
    });

    it('should parse JSON wrapped in markdown code blocks', () => {
      const mockResponse = '```json\n{"extracted_at":"2026-05-06","platform":"chatgpt","signals":{"preferences":[],"beliefs":[],"goals":[],"constraints":[],"life_state":{"primary":"building","secondary":[],"context":""},"tool_usage":[]}}\n```';

      const signals = parseExtractedSignals(mockResponse);
      expect(signals.platform).toBe('chatgpt');
    });

    it('should throw on invalid response', () => {
      expect(() => parseExtractedSignals('This is not JSON at all')).toThrow();
    });
  });

  describe('saveExtractedSignals()', () => {
    it('should write signals to platform-specific YAML vault file', () => {
      const signals: ExtractedSignals = {
        extracted_at: new Date().toISOString(),
        platform: 'claude',
        signals: {
          preferences: [{ type: 'coding', key: 'language', value: 'TypeScript', confidence: 0.9, source: 'test' }],
          beliefs: [{ statement: 'Test belief', confidence: 0.8, topic: 'test', source: 'test' }],
          goals: [{ goal: 'Test goal', status: 'active', source: 'test' }],
          constraints: [{ type: 'hard', description: 'Test constraint', source: 'test' }],
          life_state: { primary: 'building', secondary: [], context: 'Testing' },
          tool_usage: [],
        },
      };

      saveExtractedSignals(signals);

      const filePath = `${TEST_STORAGE}/claude-contexts.yaml`;
      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = yaml.parse(content);
      expect(parsed.contexts).toHaveLength(1);
      expect(parsed.contexts[0].platform).toBe('claude');
    });

    it('should append to existing vault without overwriting', () => {
      const signals1: ExtractedSignals = {
        extracted_at: '2026-05-06T00:00:00Z',
        platform: 'gemini',
        signals: {
          preferences: [], beliefs: [], goals: [], constraints: [],
          life_state: { primary: 'building', secondary: [], context: 'First' },
          tool_usage: [],
        },
      };

      const signals2: ExtractedSignals = {
        extracted_at: '2026-05-06T01:00:00Z',
        platform: 'gemini',
        signals: {
          preferences: [], beliefs: [], goals: [], constraints: [],
          life_state: { primary: 'debugging', secondary: [], context: 'Second' },
          tool_usage: [],
        },
      };

      saveExtractedSignals(signals1);
      saveExtractedSignals(signals2);

      const content = fs.readFileSync(`${TEST_STORAGE}/gemini-contexts.yaml`, 'utf-8');
      const parsed = yaml.parse(content);
      expect(parsed.contexts.length).toBeGreaterThanOrEqual(2);
    });
  });
});
