import { Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../middleware';

function toStatus(row: any) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    displayOrder: row.display_order,
    color: row.color,
    isActive: row.is_active,
  };
}

export async function listTicketStatuses(_req: AuthRequest, res: Response): Promise<void> {
  const r = await pool.query(
    `SELECT id, code, name, display_order, color, is_active, created_at, updated_at
     FROM ticket_statuses
     WHERE is_active = true
     ORDER BY display_order ASC, name ASC`
  );
  res.json(r.rows.map(toStatus));
}

export async function getTicketStatus(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const r = await pool.query('SELECT * FROM ticket_statuses WHERE id = $1', [id]);
  const row = r.rows[0];
  if (!row) {
    res.status(404).json({ error: 'Ticket status not found' });
    return;
  }
  res.json(toStatus(row));
}
