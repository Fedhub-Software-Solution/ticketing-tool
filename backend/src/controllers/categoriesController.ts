import { Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../middleware';

function toCategory(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    color: row.color,
    slaId: row.sla_id,
    parentId: row.parent_id,
    isActive: row.is_active,
  };
}

export async function listCategories(_req: AuthRequest, res: Response): Promise<void> {
  const r = await pool.query('SELECT * FROM categories ORDER BY name');
  res.json(r.rows.map(toCategory));
}

export async function createCategory(req: AuthRequest, res: Response): Promise<void> {
  const { name, description, icon, color, slaId, parentId, isActive } = req.body;
  if (!name) {
    res.status(400).json({ error: 'name required' });
    return;
  }
  const r = await pool.query(
    `INSERT INTO categories (name, description, icon, color, sla_id, parent_id, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [name, description || null, icon || null, color || null, slaId || null, parentId || null, isActive !== false]
  );
  res.status(201).json(toCategory(r.rows[0]));
}

export async function updateCategory(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { name, description, icon, color, slaId, parentId, isActive } = req.body;
  const r = await pool.query(
    `UPDATE categories SET name = COALESCE($1, name), description = COALESCE($2, description), icon = COALESCE($3, icon),
     color = COALESCE($4, color), sla_id = COALESCE($5, sla_id), parent_id = COALESCE($6, parent_id), is_active = COALESCE($7, is_active)
     WHERE id = $8 RETURNING *`,
    [name, description, icon, color, slaId, parentId, isActive, id]
  );
  const row = r.rows[0];
  if (!row) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }
  res.json(toCategory(row));
}

export async function deleteCategory(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const r = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
  if (r.rowCount === 0) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }
  res.status(204).send();
}
