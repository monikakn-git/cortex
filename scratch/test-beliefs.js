
const { loadRecentContexts } = require('./src/context-loader');
const { extractBeliefs } = require('./src/belief-extractor');

async function test() {
  const contexts = await loadRecentContexts(10);
  console.log(`Loaded ${contexts.length} contexts`);
  
  const allBeliefs = contexts.flatMap(extractBeliefs);
  console.log(`Extracted ${allBeliefs.length} beliefs:`);
  
  allBeliefs.forEach(b => {
    console.log(`- [${b.ai}] ${b.topic}: ${b.statement}`);
  });
}

test();
