import { TestLog } from '../../src/models/TestLog';

describe('Conflict Detection Integration', () => {
  it('should successfully log a conflict detection event', async () => {
    const mockConflict = {
      sessionId: 'test-session-002',
      aiPlatform: 'Gemini',
      action: 'conflict_detected',
      payload: { 
        existing_belief: 'user_location=New York',
        new_belief: 'user_location=San Francisco'
      },
      success: true
    };

    const log = new TestLog(mockConflict);
    const savedLog = await log.save();

    expect(savedLog._id).toBeDefined();
    expect(savedLog.action).toBe('conflict_detected');
    expect(savedLog.payload.new_belief).toBe('user_location=San Francisco');
  });
});
