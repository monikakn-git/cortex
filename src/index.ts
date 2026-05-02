// Entry point for CORTEX OpenClaw backend
import { startHeartbeat } from './heartbeat';

async function main() {
  console.log('CORTEX OpenClaw backend starting...\n');
  
  try {
    // Start the HEARTBEAT loop
    await startHeartbeat();
    console.log('\n✅ CORTEX backend running. Press Ctrl+C to stop.');
  } catch (error) {
    console.error('❌ Failed to start CORTEX:', error);
    process.exit(1);
  }
}

main();
