import mongoose, { Schema, Document } from 'mongoose';

export interface IKpiResult extends Document {
  metricName: 'Extraction_Accuracy' | 'Injection_Latency' | 'Conflict_Recall_Rate';
  value: number;
  totalSamples: number;
  successfulSamples: number;
  timestamp: Date;
  notes?: string;
}

const KpiResultSchema: Schema = new Schema({
  metricName: { type: String, required: true },
  value: { type: Number, required: true },
  totalSamples: { type: Number, required: true },
  successfulSamples: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  notes: { type: String }
});

export const KpiResult = mongoose.model<IKpiResult>('KpiResult', KpiResultSchema);
