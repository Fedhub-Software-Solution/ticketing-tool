import { Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../middleware';

function toBranch(row: any) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    zoneId: row.zone_id,
    zone: row.zone_name || null,
    manager: row.manager,
    isActive: row.is_active,
  };
}

export async function listBranches(_req: AuthRequest, res: Response): Promise<void> {
  const r = await pool.query(
    'SELECT b.*, z.name AS zone_name FROM branches b LEFT JOIN zones z ON b.zone_id = z.id ORDER BY b.name'
  );
  res.json(r.rows.map(toBranch));
}

export async function createBranch(req: AuthRequest, res: Response): Promise<void> {
  const { name, code, zoneId, manager, isActive } = req.body;
  if (!name || !zoneId) {
    res.status(400).json({ message: 'Name and zone are required' });
    return;
  }
  const r = await pool.query(
    'INSERT INTO branches (name, code, zone_id, manager, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [name, code || null, zoneId, manager || null, isActive !== false]
  );
  const row = r.rows[0];
  const withZone = await pool.query(
    'SELECT b.*, z.name AS zone_name FROM branches b LEFT JOIN zones z ON b.zone_id = z.id WHERE b.id = $1',
    [row.id]
  );
  res.status(201).json(toBranch(withZone.rows[0]));
}

export async function updateBranch(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { name, code, zoneId, manager, isActive } = req.body;
  const r = await pool.query(
    `UPDATE branches SET name = COALESCE($1, name), code = COALESCE($2, code), zone_id = COALESCE($3, zone_id), manager = COALESCE($4, manager), is_active = COALESCE($5, is_active) WHERE id = $6 RETURNING id`,
    [name, code, zoneId, manager, isActive, id]
  );
  if (r.rowCount === 0) {
    res.status(404).json({ error: 'Branch not found' });
    return;
  }
  const withZone = await pool.query(
    'SELECT b.*, z.name AS zone_name FROM branches b LEFT JOIN zones z ON b.zone_id = z.id WHERE b.id = $1',
    [id]
  );
  res.json(toBranch(withZone.rows[0]));
}

export async function deleteBranch(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const r = await pool.query('DELETE FROM branches WHERE id = $1 RETURNING id', [id]);
  const row = r.rows[0];
  if (!row) {
    res.status(404).json({ message: 'Branch not found' });
    return;
  }
  res.status(204).send();
}
