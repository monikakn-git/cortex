import { connectDB, disconnectDB } from '../../src/db/mongoose';
import { TestLog } from '../../src/models/TestLog';
import { KpiResult } from '../../src/models/KpiResult';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function calculateKpis() {
  await connectDB();
  
  try {
    // 1. Calculate Injection Latency (Average latency for injection actions)
    const injections = await TestLog.find({ action: 'injection' });
    if (injections.length > 0) {
      const totalLatency = injections.reduce((sum, log) => sum + (log.latencyMs || 0), 0);
      const avgLatency = totalLatency / injections.length;
      
      await KpiResult.create({
        metricName: 'Injection_Latency',
        value: avgLatency,
        totalSamples: injections.length,
        successfulSamples: injections.filter(i => i.success).length,
        notes: 'Average latency across AI platform switches in ms'
      });
      console.log(`KPI Calculated: Injection_Latency = ${avgLatency}ms`);
    }

    // You can add logic for Extraction_Accuracy and Conflict_Recall_Rate here 
    // as you build out the simulated conversation dataset.
    
    console.log('KPI Calculation Complete.');
  } catch (error) {
    console.error('Error calculating KPIs:', error);
  } finally {
    await disconnectDB();
  }
}

calculateKpis();
