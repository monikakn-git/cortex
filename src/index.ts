// Entry point for CORTEX OpenClaw backend
import express from 'express';
import cors from 'cors';
import * as fs from 'fs';
import { connectDB } from './db/mongoose';
import { startHeartbeat } from './heartbeat';
import kpiRoutes from './routes/kpiRoutes';
import logRoutes from './routes/logRoutes';
import extensionRoutes from './routes/extensionRoutes';

// Ensure required directories exist (Render doesn't persist them)
fs.mkdirSync('storage', { recursive: true });
fs.mkdirSync('config', { recursive: true });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allows your Vercel frontend to fetch data
app.use(express.json());

// Routes
app.use('/api/kpis', kpiRoutes);
app.use('/api/logs', logRoutes);
app.use('/', extensionRoutes); // Extension endpoints like /health, /inject

// Basic health check route for Render
app.get('/', (req, res) => {
  res.send('CORTEX Backend API is running!');
});

async function main() {
  console.log('CORTEX OpenClaw backend starting...\n');
  
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Start the Express Server
    app.listen(PORT, () => {
      console.log(`✅ API Server running on port ${PORT}`);
    });

    // 3. Start the HEARTBEAT loop in the background
    await startHeartbeat();
    console.log('\n✅ CORTEX heartbeat active. Press Ctrl+C to stop.');
  } catch (error) {
    console.error('❌ Failed to start CORTEX:', error);
    process.exit(1);
  }
}

main();
