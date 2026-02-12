import { Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../middleware';

export async function reportSummary(req: AuthRequest, res: Response): Promise<void> {
  const { dateRange = 'month' } = req.query;
  let since = 'NOW() - INTERVAL \'30 days\'';
  if (dateRange === 'week') since = 'NOW() - INTERVAL \'7 days\'';
  if (dateRange === 'year') since = 'NOW() - INTERVAL \'365 days\'';

  const r = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE status IN ('resolved', 'closed')) AS resolved,
       COUNT(*) FILTER (WHERE status = 'open') AS open,
       COUNT(*) FILTER (WHERE status = 'in-progress') AS in_progress,
       COUNT(*) FILTER (WHERE escalation_level > 0) AS escalated,
       COUNT(*) AS total
     FROM tickets WHERE created_at >= ${since}`
  );
  const row = r.rows[0];
  res.json({
    total: parseInt(row.total, 10),
    resolved: parseInt(row.resolved, 10),
    open: parseInt(row.open, 10),
    inProgress: parseInt(row.in_progress, 10),
    escalated: parseInt(row.escalated, 10),
  });
}
