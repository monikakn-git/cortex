import * as fs from 'fs';

// Ensure storage directory exists for tests
beforeAll(() => {
  fs.mkdirSync('storage', { recursive: true });
  fs.mkdirSync('config', { recursive: true });
});

// Note: DB tests (vault.test.ts, conflict.test.ts) require MongoDB.
// Logic-only tests (extraction, injection, conflict-detection, poisoning, persona-drift)
// run without a database connection.
