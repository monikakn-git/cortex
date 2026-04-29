# Task 8: Tune Extraction Prompts — Test Framework

> **Purpose:** Test and refine context-extractor prompts against real AI conversations.  
> **Input:** Sample conversations from Claude, ChatGPT, Gemini.  
> **Output:** Refined extraction prompts with validated accuracy.

---

## 1. Test Framework Overview

```typescript
// src/skills/tuning/test-runner.ts

import { buildExtractionPrompt, parseExtractedSignals } from '../context-extractor';

interface TestCase {
  id: string;
  platform: 'claude' | 'chatgpt' | 'gemini';
  conversation: string;
  expected: ExpectedSignals;
}

interface ExpectedSignals {
  preferences: number;
  beliefs: number;
  goals: number;
  constraints: number;
  life_state: string;
}
```

---

## 2. Sample Test Cases

### Test Case 1: New User Onboarding

```markdown
User: Hi, I'm new to programming and want to learn how to build AI agents.
AI: Great! I'd recommend starting with Python and using LangChain for agent development.
```

**Expected Signals:**
- preferences: language=Python, framework=LangChain
- goals: learn AI agent development
- life_state: learning

---

### Test Case 2: Project Preference Change

```markdown
User: Actually, I prefer TypeScript over JavaScript for type safety.
AI: Excellent choice! TypeScript is great for maintainability.
```

**Expected Signals:**
- preferences: language=TypeScript (replace JavaScript)
- life_state: building

---

### Test Case 3: Hard Constraint

```markdown
User: All my data must stay local on my machine. No cloud storage.
AI: Understood. I'll ensure all data stays local.
```

**Expected Signals:**
- constraints: type=hard, description="All data must stay local"

---

### Test Case 4: Tool Recommendation

```markdown
User: How should I containerize this app?
AI: You should use Docker Compose for local development. It handles multi-service setups well.
```

**Expected Signals:**
- tool_usage: tool_name=Docker Compose, recommendation_strength=strong

---

### Test Case 5: Conflicting AI Advice

```markdown
Conversation with Claude:
User: What's the best framework for this?
Claude: Use OpenClaw for agent automation.

Conversation with ChatGPT:
User: What's the best framework for this?
ChatGPT: LangChain is more mature and better supported.
```

**Expected Signals:**
- beliefs: framework=OpenClaw (from Claude), framework=LangChain (from ChatGPT)
- conflict detected between beliefs

---

## 3. Running Tests

```bash
# Run all test cases
npx ts-node src/skills/tuning/run-tests.ts

# Run specific platform tests
npx ts-node src/skills/tuning/run-tests.ts --platform claude

# Generate test report
npx ts-node src/skills/tuning/run-tests.ts --report
```

---

## 4. Tuning Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| **Precision** | > 80% | Signals correctly extracted / total extracted |
| **Recall** | > 80% | Signals correctly extracted / total in conversation |
| **False Positive Rate** | < 10% | Incorrect signals / total extracted |
| **Schema Compliance** | 100% | Output matches SOUL.md schema |

---

## 5. Tuning Workflow

```
1. Load test cases
       │
       ▼
2. For each test case:
   - Build extraction prompt
   - (In production) Call LLM
   - Parse response
   - Compare with expected
       │
       ▼
3. Generate report
       │
       ▼
4. Identify failures
       │
       ▼
5. Refine prompts
       │
       ▼
6. Re-run tests
```

---

## 6. Implementation

```typescript
// src/skills/tuning/test-runner.ts

import { buildExtractionPrompt, parseExtractedSignals } from '../context-extractor';

const TEST_CASES: TestCase[] = [
  {
    id: 'tc-001',
    platform: 'claude',
    conversation: `User: Hi, I'm new to programming and want to learn how to build AI agents.
AI: Great! I'd recommend starting with Python and using LangChain for agent development.`,
    expected: {
      preferences: 2, // language=Python, framework=LangChain
      goals: 1,       // learn AI agent development
      constraints: 0,
      life_state: 'learning',
    },
  },
  // ... more test cases
];

export async function runTests(): Promise<TestReport> {
  const results: TestResult[] = [];
  
  for (const testCase of TEST_CASES) {
    const result = await runTestCase(testCase);
    results.push(result);
  }
  
  return generateReport(results);
}

async function runTestCase(testCase: TestCase): Promise<TestResult> {
  // Build prompt
  const prompt = buildExtractionPrompt(
    testCase.conversation,
    testCase.platform
  );
  
  // TODO: In production, call LLM with prompt
  // const llmResponse = await llm.call(prompt);
  // const extracted = parseExtractedSignals(llmResponse);
  
  // Placeholder: Simulate extraction
  const extracted = simulateExtraction(testCase.conversation);
  
  // Compare with expected
  const passed = validateExtraction(extracted, testCase.expected);
  
  return {
    testCaseId: testCase.id,
    passed,
    extracted,
    expected: testCase.expected,
    errors: passed ? [] : ['Signal count mismatch'],
  };
}

function validateExtraction(extracted: any, expected: any): boolean {
  // Simple validation
  const prefCount = extracted.signals.preferences.length;
  const goalCount = extracted.signals.goals.length;
  const constraintCount = extracted.signals.constraints.length;
  
  return (
    prefCount >= expected.preferences - 1 && // Allow ±1
    goalCount >= expected.goals - 1 &&
    constraintCount >= expected.constraints
  );
}

function simulateExtraction(conversation: string): any {
  // Placeholder: Simple keyword-based extraction
  const signals: any = {
    preferences: [],
    beliefs: [],
    goals: [],
    constraints: [],
    life_state: { primary: 'building', secondary: [], context: '' },
    tool_usage: [],
  };
  
  // Extract preferences
  if (conversation.includes('Python')) {
    signals.preferences.push({ type: 'coding', key: 'language', value: 'Python', confidence: 0.8 });
  }
  if (conversation.includes('TypeScript')) {
    signals.preferences.push({ type: 'coding', key: 'language', value: 'TypeScript', confidence: 0.8 });
  }
  if (conversation.includes('LangChain')) {
    signals.preferences.push({ type: 'coding', key: 'framework', value: 'LangChain', confidence: 0.8 });
  }
  if (conversation.includes('OpenClaw')) {
    signals.preferences.push({ type: 'coding', key: 'framework', value: 'OpenClaw', confidence: 0.8 });
  }
  
  // Extract goals
  if (conversation.includes('learn')) {
    signals.goals.push({ goal: 'Learn AI agent development', status: 'active' });
  }
  if (conversation.includes('build')) {
    signals.goals.push({ goal: 'Build AI agent', status: 'active' });
  }
  
  // Extract constraints
  if (conversation.includes('local') && conversation.includes('no cloud')) {
    signals.constraints.push({ type: 'hard', description: 'All data must stay local', source: 'user' });
  }
  
  // Extract life state
  if (conversation.includes('learn')) {
    signals.life_state.primary = 'learning';
  } else if (conversation.includes('build')) {
    signals.life_state.primary = 'building';
  }
  
  // Extract tool usage
  if (conversation.includes('Docker')) {
    signals.tool_usage.push({ tool_name: 'Docker', usage_context: 'containerization', recommendation_strength: 'strong' });
  }
  
  return {
    extracted_at: new Date().toISOString(),
    platform: 'claude',
    signals,
  };
}

interface TestReport {
  total: number;
  passed: number;
  failed: number;
  results: TestResult[];
}

interface TestResult {
  testCaseId: string;
  passed: boolean;
  extracted: any;
  expected: any;
  errors: string[];
}

// CLI
if (require.main === module) {
  runTests().then(report => {
    console.log('\n=== Test Report ===');
    console.log(`Total: ${report.total}`);
    console.log(`Passed: ${report.passed}`);
    console.log(`Failed: ${report.failed}`);
    console.log('====================\n');
    
    for (const result of report.results) {
      console.log(`${result.passed ? '✅' : '❌'} ${result.testCaseId}: ${result.errors.join(', ') || 'OK'}`);
    }
  });
}
```

---

## 7. Next Steps

After tuning:
- **Task 9**: Context Poisoning Detection — flag beliefs reinforced 3+ times without user confirmation.
- **Task 10**: Persona Drift Alert — track how each AI's tone shifts over time.

---

> **Remember:** Tuning is an iterative process. Run tests → identify issues → refine prompts → re-run until targets are met.