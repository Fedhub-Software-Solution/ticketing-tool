import { Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../middleware';

export type NotificationType = 'assignment' | 'comment' | 'escalation' | 'warning' | 'success' | 'new_ticket';

function toNotification(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    description: row.description,
    ticketId: row.ticket_id,
    ticketNumber: row.ticket_number ?? undefined,
    read: row.read,
    createdAt: row.created_at,
    time: row.created_at,
  };
}

/** Create a notification (used by tickets and comments controllers). */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  description: string,
  ticketId?: string | null
): Promise<void> {
  await pool.query(
    `INSERT INTO notifications (user_id, type, title, description, ticket_id) VALUES ($1, $2, $3, $4, $5)`,
    [userId, type, title, description, ticketId || null]
  );
}

export async function listNotifications(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const limit = Math.min(parseInt(String(req.query.limit || 50), 10) || 50, 100);

  const r = await pool.query(
    `SELECT n.*, t.ticket_number
     FROM notifications n
     LEFT JOIN tickets t ON n.ticket_id = t.id
     WHERE n.user_id = $1
     ORDER BY n.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  let list = r.rows.map(toNotification);

  // Append synthetic SLA breach warnings: tickets assigned to user, overdue, not closed/resolved
  const overdue = await pool.query(
    `SELECT t.id, t.ticket_number, t.title, t.sla_due_date
     FROM tickets t
     WHERE t.assigned_to_id = $1 AND t.sla_due_date IS NOT NULL AND t.sla_due_date < now()
       AND t.status NOT IN ('closed', 'resolved')
     ORDER BY t.sla_due_date ASC
     LIMIT 20`,
    [userId]
  );
  const existingTicketIds = new Set(list.map((n: any) => n.ticketId).filter(Boolean));
  for (const row of overdue.rows) {
    if (existingTicketIds.has(row.id)) continue;
    const displayName = row.title?.trim() || row.ticket_number || row.id;
    list.push({
      id: `sla-${row.id}`,
      userId,
      type: 'warning',
      title: 'SLA breach warning',
      description: `${displayName} is past SLA deadline`,
      ticketId: row.id,
      ticketNumber: row.ticket_number ?? undefined,
      read: false,
      createdAt: row.sla_due_date,
      time: row.sla_due_date,
      synthetic: true,
    });
    existingTicketIds.add(row.id);
  }
  list.sort((a: any, b: any) => new Date(b.time || b.createdAt).getTime() - new Date(a.time || a.createdAt).getTime());

  res.json(list);
}

export async function markRead(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;
  if (id.startsWith('sla-')) {
    return res.json({ ok: true });
  }
  const r = await pool.query(
    `UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, userId]
  );
  if (r.rowCount === 0) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  res.json({ ok: true });
}

export async function markAllRead(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.userId;
  await pool.query(`UPDATE notifications SET read = true WHERE user_id = $1`, [userId]);
  res.json({ ok: true });
}
