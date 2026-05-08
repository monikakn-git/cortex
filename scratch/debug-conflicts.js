
const path = require('path');
const fs = require('fs');
const yaml = require('yaml');

// Mocking the loader logic since imports are tricky in this environment
function loadContexts() {
  const platforms = ['chatgpt', 'gemini', 'claude'];
  const all = [];
  platforms.forEach(p => {
    const f = path.join(process.cwd(), 'storage', `${p}-contexts.yaml`);
    if (fs.existsSync(f)) {
      const data = yaml.parse(fs.readFileSync(f, 'utf-8'));
      if (data && data.contexts) {
        data.contexts.forEach(c => all.push({ ...c, ai: p }));
      }
    }
  });
  return all;
}

function extractBeliefs(context) {
  const beliefs = [];
  if (context.signals) {
    const { preferences, goals, beliefs: existing, tool_usage, constraints } = context.signals;
    (preferences || []).forEach(p => beliefs.push({ ai: context.ai, topic: 'pref', statement: p.preference, confidence: 0.8 }));
    (goals || []).forEach(g => beliefs.push({ ai: context.ai, topic: 'goal', statement: g.goal, confidence: 0.7 }));
    (tool_usage || []).forEach(t => beliefs.push({ ai: context.ai, topic: 'tool', statement: t.tool_name, confidence: 0.9 }));
  }
  return beliefs;
}

const OPPOSITE_PAIRS = [
  ['typescript', 'javascript'],
  ['ts', 'js'],
  ['postgres', 'mongodb']
];

function detectConflicts(beliefs) {
  const conflicts = [];
  for (let i = 0; i < beliefs.length; i++) {
    for (let j = i + 1; j < beliefs.length; j++) {
      const bA = beliefs[i];
      const bB = beliefs[j];
      if (bA.ai === bB.ai) continue;
      
      const sA = bA.statement.toLowerCase();
      const sB = bB.statement.toLowerCase();
      
      for (const [w1, w2] of OPPOSITE_PAIRS) {
        if ((sA.includes(w1) && sB.includes(w2)) || (sA.includes(w2) && sB.includes(w1))) {
           conflicts.push({
             topic: `${w1}_vs_${w2}`,
             aiA: bA.ai,
             stmtA: bA.statement,
             aiB: bB.ai,
             stmtB: bB.statement
           });
        }
      }
    }
  }
  return conflicts;
}

const contexts = loadContexts();
const beliefs = contexts.flatMap(extractBeliefs);
console.log(`Total Beliefs: ${beliefs.length}`);
const conflicts = detectConflicts(beliefs);
console.log(`Total Conflicts: ${conflicts.length}`);
conflicts.forEach(c => {
  console.log(`Conflict [${c.topic}]:`);
  console.log(`  ${c.aiA}: ${c.stmtA}`);
  console.log(`  ${c.aiB}: ${c.stmtB}`);
});
