import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/summary', async (req, res) => {
  try {
    const dateRange = req.query.dateRange || 'month';
    let interval = '30 days';
    if (dateRange === 'week') interval = '7 days';
    else if (dateRange === 'year') interval = '365 days';

    const r = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status IN ('resolved', 'closed'))::int AS resolved,
         COUNT(*) FILTER (WHERE status = 'open')::int AS open,
         COUNT(*) FILTER (WHERE status = 'in-progress')::int AS "inProgress",
         COUNT(*) FILTER (WHERE escalation_level IS NOT NULL AND escalation_level > 0)::int AS escalated
       FROM tickets
       WHERE created_at >= now() - $1::interval`,
      [interval]
    );
    const row = r.rows[0];
    res.json({
      total: row?.total ?? 0,
      resolved: row?.resolved ?? 0,
      open: row?.open ?? 0,
      inProgress: row?.inProgress ?? 0,
      escalated: row?.escalated ?? 0,
    });
  } catch (err) {
    console.error('Reports summary error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
