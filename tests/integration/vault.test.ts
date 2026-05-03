import { TestLog } from '../../src/models/TestLog';

describe('Vault Write Integration', () => {
  it('should successfully log a vault extraction action', async () => {
    const mockExtraction = {
      sessionId: 'test-session-001',
      aiPlatform: 'ChatGPT',
      action: 'extraction',
      payload: { key: 'user_diet', value: 'vegan' },
      success: true,
      latencyMs: 150
    };

    const log = new TestLog(mockExtraction);
    const savedLog = await log.save();

    expect(savedLog._id).toBeDefined();
    expect(savedLog.sessionId).toBe('test-session-001');
    expect(savedLog.action).toBe('extraction');
  });

  it('should successfully log a context injection action', async () => {
    const mockInjection = {
      sessionId: 'test-session-001',
      aiPlatform: 'Claude',
      action: 'injection',
      payload: { injected_beliefs: ['user_diet=vegan'] },
      success: true,
      latencyMs: 85
    };

    const log = new TestLog(mockInjection);
    const savedLog = await log.save();

    expect(savedLog._id).toBeDefined();
    expect(savedLog.aiPlatform).toBe('Claude');
    expect(savedLog.latencyMs).toBe(85);
  });
});
