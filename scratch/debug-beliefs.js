
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
    (preferences || []).forEach(p => beliefs.push({ ai: context.ai, topic: 'pref', statement: p.preference }));
    (goals || []).forEach(g => beliefs.push({ ai: context.ai, topic: 'goal', statement: g.goal }));
    (tool_usage || []).forEach(t => beliefs.push({ ai: context.ai, topic: 'tool', statement: t.tool_name }));
  }
  return beliefs;
}

const contexts = loadContexts();
const beliefs = contexts.flatMap(extractBeliefs);
console.log(`Total Beliefs: ${beliefs.length}`);
beliefs.forEach(b => console.log(`[${b.ai}] ${b.topic}: ${b.statement}`));
