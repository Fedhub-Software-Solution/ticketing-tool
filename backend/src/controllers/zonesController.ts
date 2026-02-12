import { Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../middleware';

function toZone(row: any) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    manager: row.manager,
    isActive: row.is_active,
  };
}

export async function listZones(_req: AuthRequest, res: Response): Promise<void> {
  const r = await pool.query('SELECT * FROM zones ORDER BY name');
  res.json(r.rows.map(toZone));
}

export async function createZone(req: AuthRequest, res: Response): Promise<void> {
  const { name, code, manager, isActive } = req.body;
  if (!name) {
    res.status(400).json({ error: 'name required' });
    return;
  }
  const r = await pool.query(
    'INSERT INTO zones (name, code, manager, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, code || null, manager || null, isActive !== false]
  );
  res.status(201).json(toZone(r.rows[0]));
}

export async function updateZone(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { name, code, manager, isActive } = req.body;
  const r = await pool.query(
    `UPDATE zones SET name = COALESCE($1, name), code = COALESCE($2, code), manager = COALESCE($3, manager), is_active = COALESCE($4, is_active) WHERE id = $5 RETURNING *`,
    [name, code, manager, isActive, id]
  );
  const row = r.rows[0];
  if (!row) {
    res.status(404).json({ error: 'Zone not found' });
    return;
  }
  res.json(toZone(row));
}
