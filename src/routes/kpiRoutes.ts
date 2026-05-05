import express from 'express';
import { KpiResult } from '../models/KpiResult';

const router = express.Router();

// GET /api/kpis - Fetch all KPI results
router.get('/', async (req, res) => {
  try {
    const kpis = await KpiResult.find().sort({ timestamp: -1 });
    res.json(kpis);
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({ error: 'Failed to fetch KPI data' });
  }
});

// GET /api/kpis/:metricName - Fetch specific KPI history
router.get('/:metricName', async (req, res) => {
  try {
    const { metricName } = req.params;
    const kpis = await KpiResult.find({ metricName } as any).sort({ timestamp: -1 });
    res.json(kpis);
  } catch (error) {
    console.error(`Error fetching KPI ${req.params.metricName}:`, error);
    res.status(500).json({ error: 'Failed to fetch specific KPI data' });
  }
});

export default router;
