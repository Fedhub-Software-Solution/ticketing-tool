import { Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../middleware';

function toSla(row: any) {
  return {
    id: row.id,
    name: row.name,
    priority: row.priority,
    responseTime: row.response_time_mins,
    resolutionTime: row.resolution_time_mins,
    category: row.category,
  };
}

export async function listSlas(_req: AuthRequest, res: Response): Promise<void> {
  const r = await pool.query('SELECT * FROM slas ORDER BY name');
  res.json(r.rows.map(toSla));
}

export async function getSla(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const r = await pool.query('SELECT * FROM slas WHERE id = $1', [id]);
  const row = r.rows[0];
  if (!row) {
    res.status(404).json({ error: 'SLA not found' });
    return;
  }
  res.json(toSla(row));
}

export async function createSla(req: AuthRequest, res: Response): Promise<void> {
  const { name, priority, responseTime, resolutionTime, category } = req.body;
  if (!name || !priority || responseTime == null || resolutionTime == null) {
    res.status(400).json({ error: 'name, priority, responseTime, resolutionTime required' });
    return;
  }
  const r = await pool.query(
    `INSERT INTO slas (name, priority, response_time_mins, resolution_time_mins, category)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, priority, responseTime, resolutionTime, category || null]
  );
  res.status(201).json(toSla(r.rows[0]));
}

export async function updateSla(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { name, priority, responseTime, resolutionTime, category } = req.body;
  const r = await pool.query(
    `UPDATE slas SET name = COALESCE($1, name), priority = COALESCE($2, priority),
     response_time_mins = COALESCE($3, response_time_mins), resolution_time_mins = COALESCE($4, resolution_time_mins),
     category = COALESCE($5, category) WHERE id = $6 RETURNING *`,
    [name, priority, responseTime, resolutionTime, category, id]
  );
  const row = r.rows[0];
  if (!row) {
    res.status(404).json({ error: 'SLA not found' });
    return;
  }
  res.json(toSla(row));
}

export async function deleteSla(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const r = await pool.query('DELETE FROM slas WHERE id = $1 RETURNING id', [id]);
  if (r.rowCount === 0) {
    res.status(404).json({ error: 'SLA not found' });
    return;
  }
  res.status(204).send();
}
