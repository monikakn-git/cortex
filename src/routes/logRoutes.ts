import express from 'express';
import { TestLog } from '../models/TestLog';

const router = express.Router();

// GET /api/logs - Fetch all test logs
router.get('/', async (req, res) => {
  try {
    const logs = await TestLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch test logs' });
  }
});

// GET /api/logs/:action - Fetch logs by action (extraction, injection, conflict)
router.get('/:action', async (req, res) => {
  try {
    const { action } = req.params;
    const logs = await TestLog.find({ action }).sort({ timestamp: -1 }).limit(50);
    res.json(logs);
  } catch (error) {
    console.error(`Error fetching logs for action ${req.params.action}:`, error);
    res.status(500).json({ error: 'Failed to fetch specific test logs' });
  }
});

export default router;
