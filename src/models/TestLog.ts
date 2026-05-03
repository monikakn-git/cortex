import mongoose, { Schema, Document } from 'mongoose';

export interface ITestLog extends Document {
  sessionId: string;
  aiPlatform: string; // e.g., "ChatGPT", "Claude", "Gemini"
  action: 'extraction' | 'injection' | 'conflict_detected' | 'health_score_update';
  payload: any;
  timestamp: Date;
  latencyMs?: number; // Used for injection latency KPI
  success: boolean;
}

const TestLogSchema: Schema = new Schema({
  sessionId: { type: String, required: true },
  aiPlatform: { type: String, required: true },
  action: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, required: true },
  timestamp: { type: Date, default: Date.now },
  latencyMs: { type: Number },
  success: { type: Boolean, required: true }
});

export const TestLog = mongoose.model<ITestLog>('TestLog', TestLogSchema);
