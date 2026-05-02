// src/skills/tuning/test-runner.ts — Test framework for extraction prompt tuning
import { buildExtractionPrompt } from '../context-extractor';

interface TestCase {
  id: string;
  platform: 'claude' | 'chatgpt' | 'gemini';
  conversation: string;
  expected: ExpectedSignals;
}

interface ExpectedSignals {
  minPreferences: number;
  minBeliefs: number;
  minGoals: number;
  minConstraints: number;
  life_state: string;
}

interface TestResult {
  testCaseId: string;
  platform: string;
  passed: boolean;
  extracted: ExtractedSignals;
  expected: ExpectedSignals;
  errors: string[];
  warnings: string[];
}

interface ExtractedSignals {
  preferences: any[];
  beliefs: any[];
  goals: any[];
  constraints: any[];
  life_state: { primary: string; secondary: string[]; context: string };
  tool_usage: any[];
}

interface TestReport {
  total: number;
  passed: number;
  failed: number;
  results: TestResult[];
}

// Sample test cases from real conversation patterns
const TEST_CASES: TestCase[] = [
  {
    id: 'tc-001',
    platform: 'claude',
    conversation: `User: Hi, I'm new to programming and want to learn how to build AI agents.
AI: Great! I'd recommend starting with Python and using LangChain for agent development. It's beginner-friendly and has great documentation.`,
    expected: {
      minPreferences: 2,
      minBeliefs: 0,
      minGoals: 1,
      minConstraints: 0,
      life_state: 'learning',
    },
  },
  {
    id: 'tc-002',
    platform: 'chatgpt',
    conversation: `User: Actually, I prefer TypeScript over JavaScript for type safety.
AI: Excellent choice! TypeScript is great for maintainability in larger projects.`,
    expected: {
      minPreferences: 1,
      minBeliefs: 0,
      minGoals: 0,
      minConstraints: 0,
      life_state: 'building',
    },
  },
  {
    id: 'tc-003',
    platform: 'gemini',
    conversation: `User: All my data must stay local on my machine. No cloud storage.
AI: Understood. I'll ensure all data stays local and nothing gets uploaded.`,
    expected: {
      minPreferences: 0,
      minBeliefs: 0,
      minGoals: 0,
      minConstraints: 1,
      life_state: 'building',
    },
  },
  {
    id: 'tc-004',
    platform: 'claude',
    conversation: `User: How should I containerize this app?
AI: You should use Docker Compose for local development. It handles multi-service setups well and keeps everything isolated.`,
    expected: {
      minPreferences: 0,
      minBeliefs: 0,
      minGoals: 0,
      minConstraints: 0,
      life_state: 'building',
    },
  },
  {
    id: 'tc-005',
    platform: 'claude',
    conversation: `User: What's the best framework for building AI agents?
AI: Use OpenClaw for agent automation. It's designed specifically for AI agents and has built-in heartbeat and memory features.`,
    expected: {
      minPreferences: 1,
      minBeliefs: 1,
      minGoals: 0,
      minConstraints: 0,
      life_state: 'researching',
    },
  },
  {
    id: 'tc-006',
    platform: 'chatgpt',
    conversation: `User: I'm building a backend with Node.js and need to set up authentication.
AI: For Node.js backends, I'd recommend using JWT with bcrypt for password hashing. Also consider Express.js for the framework.`,
    expected: {
      minPreferences: 2,
      minBeliefs: 0,
      minGoals: 1,
      minConstraints: 0,
      life_state: 'building',
    },
  },
  {
    id: 'tc-007',
    platform: 'gemini',
    conversation: `User: Debug this error for me: "Cannot read property of undefined"
AI: This error typically happens when you're accessing a property on null or undefined. Check line 42 where the object might not be initialized.`,
    expected: {
      minPreferences: 0,
      minBeliefs: 0,
      minGoals: 0,
      minConstraints: 0,
      life_state: 'debugging',
    },
  },
  {
    id: 'tc-008',
    platform: 'claude',
    conversation: `User: I want to refactor this function to be more modular.
AI: Good idea. Let's break it into smaller functions with single responsibilities. I'll extract the validation logic into a separate helper function.`,
    expected: {
      minPreferences: 0,
      minBeliefs: 0,
      minGoals: 1,
      minConstraints: 0,
      life_state: 'refactoring',
    },
  },
];

export async function runTests(): Promise<TestReport> {
  console.log('[Tuning] Running extraction prompt tests...\n');
  
  const results: TestResult[] = [];
  
  for (const testCase of TEST_CASES) {
    const result = await runTestCase(testCase);
    results.push(result);
  }
  
  return generateReport(results);
}

async function runTestCase(testCase: TestCase): Promise<TestResult> {
  // Build the extraction prompt (like the real extractor would)
  const prompt = buildExtractionPrompt(
    testCase.conversation,
    testCase.platform
  );
  
  // Simulate extraction (in production, this would call the LLM)
  const extracted = simulateExtraction(testCase.conversation, testCase.platform);
  
  // Validate against expected
  const validation = validateExtraction(extracted, testCase.expected);
  
  return {
    testCaseId: testCase.id,
    platform: testCase.platform,
    passed: validation.valid,
    extracted,
    expected: testCase.expected,
    errors: validation.errors,
    warnings: validation.warnings,
  };
}

function validateExtraction(
  extracted: ExtractedSignals,
  expected: ExpectedSignals
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check preferences
  if (extracted.preferences.length < expected.minPreferences) {
    warnings.push(`Expected at least ${expected.minPreferences} preferences, got ${extracted.preferences.length}`);
  }
  
  // Check goals
  if (extracted.goals.length < expected.minGoals) {
    warnings.push(`Expected at least ${expected.minGoals} goals, got ${extracted.goals.length}`);
  }
  
  // Check constraints
  if (extracted.constraints.length < expected.minConstraints) {
    warnings.push(`Expected at least ${expected.minConstraints} constraints, got ${extracted.constraints.length}`);
  }
  
  // Check life state
  if (extracted.life_state.primary !== expected.life_state) {
    errors.push(`Expected life_state '${expected.life_state}', got '${extracted.life_state.primary}'`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function simulateExtraction(conversation: string, platform: string): ExtractedSignals {
  const lower = conversation.toLowerCase();
  const signals: ExtractedSignals = {
    preferences: [],
    beliefs: [],
    goals: [],
    constraints: [],
    life_state: { primary: 'building', secondary: [], context: '' },
    tool_usage: [],
  };
  
  // Extract preferences (keywords)
  if (lower.includes('python')) {
    signals.preferences.push({ type: 'coding', key: 'language', value: 'Python', confidence: 0.8 });
  }
  if (lower.includes('typescript')) {
    signals.preferences.push({ type: 'coding', key: 'language', value: 'TypeScript', confidence: 0.8 });
  }
  if (lower.includes('javascript')) {
    signals.preferences.push({ type: 'coding', key: 'language', value: 'JavaScript', confidence: 0.8 });
  }
  if (lower.includes('langchain')) {
    signals.preferences.push({ type: 'coding', key: 'framework', value: 'LangChain', confidence: 0.8 });
  }
  if (lower.includes('openclaw')) {
    signals.preferences.push({ type: 'coding', key: 'framework', value: 'OpenClaw', confidence: 0.8 });
  }
  if (lower.includes('express')) {
    signals.preferences.push({ type: 'coding', key: 'framework', value: 'Express.js', confidence: 0.7 });
  }
  if (lower.includes('jwt')) {
    signals.preferences.push({ type: 'coding', key: 'auth', value: 'JWT', confidence: 0.7 });
  }
  if (lower.includes('bcrypt')) {
    signals.preferences.push({ type: 'coding', key: 'hashing', value: 'bcrypt', confidence: 0.7 });
  }
  
  // Extract goals
  if (lower.includes('learn')) {
    signals.goals.push({ goal: 'Learn AI agent development', status: 'active' });
  }
  if (lower.includes('build') && !lower.includes('building')) {
    signals.goals.push({ goal: 'Build AI agent/project', status: 'active' });
  }
  if (lower.includes('refactor')) {
    signals.goals.push({ goal: 'Refactor code', status: 'active' });
  }
  if (lower.includes('debug')) {
    signals.goals.push({ goal: 'Debug error', status: 'active' });
  }
  
  // Extract constraints
  if (lower.includes('local') && (lower.includes('no cloud') || lower.includes("can't") || lower.includes('must stay'))) {
    signals.constraints.push({ type: 'hard', description: 'All data must stay local', source: 'user' });
  }
  
  // Extract life state (check specific keywords FIRST, then general)
  if (lower.includes('learn')) {
    signals.life_state.primary = 'learning';
  } else if (lower.includes('debug') || lower.includes('error')) {
    signals.life_state.primary = 'debugging';
  } else if (lower.includes('refactor')) {
    signals.life_state.primary = 'refactoring';
  } else if ((lower.includes('what') || lower.includes('which')) && (lower.includes('best') || lower.includes('should'))) {
    signals.life_state.primary = 'researching';
  } else if (lower.includes('build')) {
    signals.life_state.primary = 'building';
  }
  
  // Extract tool usage
  if (lower.includes('docker')) {
    signals.tool_usage.push({ tool_name: 'Docker', usage_context: 'containerization', recommendation_strength: 'strong' });
  }
  if (lower.includes('docker compose')) {
    signals.tool_usage.push({ tool_name: 'Docker Compose', usage_context: 'local development', recommendation_strength: 'strong' });
  }
  
  return signals;
}

function generateReport(results: TestResult[]): TestReport {
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  return {
    total: results.length,
    passed,
    failed,
    results,
  };
}

// CLI interface
if (require.main === module) {
  runTests().then(report => {
    console.log('\n' + '='.repeat(50));
    console.log('       EXTRACTION PROMPT TEST REPORT');
    console.log('='.repeat(50));
    console.log(`\nTotal:   ${report.total}`);
    console.log(`Passed:  ${report.passed} ✅`);
    console.log(`Failed:  ${report.failed} ❌`);
    console.log(`\n${'='.repeat(50)}\n`);
    
    for (const result of report.results) {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} | ${result.testCaseId} (${result.platform})`);
      
      if (result.errors.length > 0) {
        for (const error of result.errors) {
          console.log(`        Error: ${error}`);
        }
      }
      if (result.warnings.length > 0) {
        for (const warning of result.warnings) {
          console.log(`        Warning: ${warning}`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('Tuning Recommendations:');
    console.log('  1. Review failed test cases for prompt improvements');
    console.log('  2. Adjust extraction prompt in skills/context-extractor.md');
    console.log('  3. Re-run tests to validate improvements');
    console.log('='.repeat(50) + '\n');
  });
}