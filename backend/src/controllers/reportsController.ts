import { Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../middleware';

export async function reportSummary(req: AuthRequest, res: Response): Promise<void> {
  const { dateRange = 'month' } = req.query;
  const allTime = dateRange === 'all';
  const intervalDays = dateRange === 'week' ? 7 : dateRange === 'year' ? 365 : 30;

  const sql = allTime
    ? `SELECT
         COUNT(*) FILTER (WHERE status IN ('resolved', 'closed')) AS resolved,
         COUNT(*) FILTER (WHERE status = 'open') AS open,
         COUNT(*) FILTER (WHERE status = 'in-progress') AS in_progress,
         COUNT(*) FILTER (WHERE status = 'on-hold') AS on_hold,
         COUNT(*) FILTER (WHERE status = 'closed') AS closed,
         COUNT(*) FILTER (WHERE escalation_level > 0) AS escalated,
         COUNT(*) AS total
       FROM tickets`
    : `SELECT
         COUNT(*) FILTER (WHERE status IN ('resolved', 'closed')) AS resolved,
         COUNT(*) FILTER (WHERE status = 'open') AS open,
         COUNT(*) FILTER (WHERE status = 'in-progress') AS in_progress,
         COUNT(*) FILTER (WHERE status = 'on-hold') AS on_hold,
         COUNT(*) FILTER (WHERE status = 'closed') AS closed,
         COUNT(*) FILTER (WHERE escalation_level > 0) AS escalated,
         COUNT(*) AS total
       FROM tickets WHERE created_at >= NOW() - INTERVAL '1 day' * $1`;
  const r = allTime ? await pool.query(sql) : await pool.query(sql, [intervalDays]);
  const row = r.rows[0];
  res.json({
    total: parseInt(row.total, 10),
    resolved: parseInt(row.resolved, 10),
    open: parseInt(row.open, 10),
    inProgress: parseInt(row.in_progress, 10),
    onHold: parseInt(row.on_hold, 10),
    closed: parseInt(row.closed, 10),
    escalated: parseInt(row.escalated, 10),
  });
}

export interface RegionalRow {
  zoneName: string;
  total: number;
  resolved: number;
  open: number;
}

export async function reportRegional(req: AuthRequest, res: Response): Promise<void> {
  const { dateRange = 'month' } = req.query;
  const allTime = dateRange === 'all';
  const intervalDays = dateRange === 'week' ? 7 : dateRange === 'year' ? 365 : 30;

  const sql = allTime
    ? `SELECT
         COALESCE(z.name, 'Unassigned') AS zone_name,
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE t.status IN ('resolved', 'closed')) AS resolved,
         COUNT(*) FILTER (WHERE t.status = 'open') AS open
       FROM tickets t
       LEFT JOIN zones z ON t.zone_id = z.id
       GROUP BY z.name
       ORDER BY total DESC`
    : `SELECT
         COALESCE(z.name, 'Unassigned') AS zone_name,
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE t.status IN ('resolved', 'closed')) AS resolved,
         COUNT(*) FILTER (WHERE t.status = 'open') AS open
       FROM tickets t
       LEFT JOIN zones z ON t.zone_id = z.id
       WHERE t.created_at >= NOW() - INTERVAL '1 day' * $1
       GROUP BY z.name
       ORDER BY total DESC`;
  const r = allTime ? await pool.query(sql) : await pool.query(sql, [intervalDays]);
  res.json(
    r.rows.map((row) => ({
      zoneName: row.zone_name || 'Unassigned',
      total: parseInt(row.total, 10),
      resolved: parseInt(row.resolved, 10),
      open: parseInt(row.open, 10),
    }))
  );
}

/** Dashboard: KPIs, trend (last 7 days), priority/category distribution, week-over-week change */
export async function reportDashboard(req: AuthRequest, res: Response): Promise<void> {
  const { forUser: forUserId } = req.query;
  const filterClause = forUserId && typeof forUserId === 'string' ? 'WHERE created_by_id = $1' : '';
  const filterClauseTrend = forUserId && typeof forUserId === 'string' ? 'AND created_by_id = $1' : '';
  const params = forUserId && typeof forUserId === 'string' ? [forUserId] : [];

  // Breach = overdue: not resolved/closed, has SLA due date, and past due (same definition as Overdue Tickets page)
  const summaryR = await pool.query(
    `SELECT
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE status = 'open') AS open,
       COUNT(*) FILTER (WHERE status = 'in-progress') AS in_progress,
       COUNT(*) FILTER (WHERE status IN ('resolved', 'closed')) AS resolved,
       COUNT(*) FILTER (WHERE priority = 'urgent') AS urgent,
       COUNT(*) FILTER (WHERE status NOT IN ('resolved', 'closed') AND sla_due_date IS NOT NULL AND sla_due_date < NOW()) AS breached_sla
     FROM tickets ${filterClause}`,
    params
  );
  const s = summaryR.rows[0];
  const total = parseInt(s.total, 10);
  const open = parseInt(s.open, 10);
  const inProgress = parseInt(s.in_progress, 10);
  const resolved = parseInt(s.resolved, 10);
  const urgent = parseInt(s.urgent, 10);
  const breachedSLA = parseInt(s.breached_sla, 10);
  const slaComplianceRate = total > 0 ? Math.round(((total - breachedSLA) / total) * 100) : 100;

  const wWhere = params.length ? ' AND created_by_id = $1' : '';
  const lastWeekR = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM tickets WHERE created_at >= NOW() - INTERVAL '7 days'${wWhere}) AS this_week_total,
       (SELECT COUNT(*) FROM tickets WHERE created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days'${wWhere}) AS last_week_total,
       (SELECT COUNT(*) FROM tickets WHERE status IN ('resolved', 'closed') AND updated_at >= NOW() - INTERVAL '7 days'${wWhere}) AS this_week_resolved,
       (SELECT COUNT(*) FROM tickets WHERE status IN ('resolved', 'closed') AND updated_at >= NOW() - INTERVAL '14 days' AND updated_at < NOW() - INTERVAL '7 days'${wWhere}) AS last_week_resolved`,
    params
  );
  const w = lastWeekR.rows[0];
  const thisWeekTotal = parseInt(w.this_week_total, 10);
  const lastWeekTotal = parseInt(w.last_week_total, 10);
  const thisWeekResolved = parseInt(w.this_week_resolved, 10);
  const lastWeekResolved = parseInt(w.last_week_resolved, 10);
  const totalChangePct =
    lastWeekTotal > 0 ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100) : (thisWeekTotal > 0 ? 100 : 0);
  const resolvedChangePct =
    lastWeekResolved > 0
      ? Math.round(((thisWeekResolved - lastWeekResolved) / lastWeekResolved) * 100)
      : (thisWeekResolved > 0 ? 100 : 0);

  const trendParams = params.length ? [...params] : [];
  const trendWhere = params.length ? ' AND t.created_by_id = $1' : '';
  // Define last 7 days (including today) in DB using UTC so "today" is always correct and includes tickets created today
  const trendR = await pool.query(
    `WITH utc_today AS (
       SELECT (NOW() AT TIME ZONE 'UTC')::date AS d
     ),
     last_7 AS (
       SELECT (SELECT d FROM utc_today) - n AS d
       FROM generate_series(0, 6) AS n
     ),
     opened_per_day AS (
       SELECT (t.created_at AT TIME ZONE 'UTC')::date AS d, COUNT(*) AS opened
       FROM tickets t
       WHERE (t.created_at AT TIME ZONE 'UTC')::date >= (SELECT d FROM utc_today) - 6
         AND (t.created_at AT TIME ZONE 'UTC')::date <= (SELECT d FROM utc_today)
         ${trendWhere}
       GROUP BY (t.created_at AT TIME ZONE 'UTC')::date
     ),
     resolved_per_day AS (
       SELECT (t.updated_at AT TIME ZONE 'UTC')::date AS d, COUNT(*) AS resolved
       FROM tickets t
       WHERE t.status IN ('resolved', 'closed')
         AND (t.updated_at AT TIME ZONE 'UTC')::date >= (SELECT d FROM utc_today) - 6
         AND (t.updated_at AT TIME ZONE 'UTC')::date <= (SELECT d FROM utc_today)
         ${trendWhere}
       GROUP BY (t.updated_at AT TIME ZONE 'UTC')::date
     )
     SELECT
       to_char(l.d, 'YYYY-MM-DD') AS date,
       trim(to_char(l.d, 'Dy')) AS day,
       COALESCE(o.opened, 0)::integer AS opened,
       COALESCE(r.resolved, 0)::integer AS resolved
     FROM last_7 l
     LEFT JOIN opened_per_day o ON o.d = l.d
     LEFT JOIN resolved_per_day r ON r.d = l.d
     ORDER BY l.d`,
    trendParams
  );
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const last7 = (trendR.rows as { date: string; day: string; opened: unknown; resolved: unknown }[]).map((row) => {
    const dateStr = row.date;
    const dayIndex = new Date(dateStr + 'T12:00:00Z').getUTCDay();
    return {
      date: dateStr,
      day: dayLabels[dayIndex],
      opened: typeof row.opened === 'number' ? row.opened : parseInt(String(row.opened), 10) || 0,
      resolved: typeof row.resolved === 'number' ? row.resolved : parseInt(String(row.resolved), 10) || 0,
    };
  });

  const priorityR = await pool.query(
    `SELECT priority, COUNT(*) AS cnt FROM tickets ${filterClause} GROUP BY priority`,
    params
  );
  const priorityMap = (priorityR.rows as { priority: string; cnt: string }[]).reduce(
    (acc, row) => {
      acc[row.priority] = parseInt(row.cnt, 10);
      return acc;
    },
    {} as Record<string, number>
  );

  const categoryWhere = params.length ? ' WHERE t.created_by_id = $1' : '';
  const categoryR = await pool.query(
    `SELECT COALESCE(c.name, 'Uncategorized') AS name, COUNT(*) AS cnt
     FROM tickets t
     LEFT JOIN categories c ON t.category_id = c.id
     ${categoryWhere}
     GROUP BY c.name
     ORDER BY cnt DESC`,
    params
  );

  res.json({
    summary: {
      total,
      open,
      inProgress,
      resolved,
      urgent,
      breachedSLA,
      slaComplianceRate,
    },
    change: {
      totalChangePct,
      resolvedChangePct,
    },
    trend: last7,
    priority: {
      urgent: priorityMap.urgent ?? 0,
      high: priorityMap.high ?? 0,
      medium: priorityMap.medium ?? 0,
      low: priorityMap.low ?? 0,
    },
    category: (categoryR.rows as { name: string; cnt: string }[]).map((row) => ({
      name: row.name || 'Uncategorized',
      value: parseInt(row.cnt, 10),
    })),
  });
}
