import { Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../middleware';

function toPriority(row: any) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    displayOrder: row.display_order,
  };
}

export async function listPriorities(_req: AuthRequest, res: Response): Promise<void> {
  const r = await pool.query(
    `SELECT id, code, name, display_order FROM priorities ORDER BY display_order ASC, name ASC`
  );
  res.json(r.rows.map(toPriority));
}
