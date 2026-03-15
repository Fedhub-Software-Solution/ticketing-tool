import { Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../middleware';
import { invalidateRoleCodesCache } from '../lib/roleEnums';

function toRole(row: any) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description ?? '',
    permissions: row.permissions ?? [],
    userCount: parseInt(row.user_count, 10) || 0,
  };
}

// users.role stores role code (text); count users whose role matches this role's code
const USER_COUNT_BY_ROLE = `
  (SELECT COUNT(*)::int FROM users u WHERE u.role = r.code) AS user_count
`;

export async function listRoles(_req: AuthRequest, res: Response): Promise<void> {
  const r = await pool.query(
    `SELECT r.*, ${USER_COUNT_BY_ROLE}
     FROM roles r
     ORDER BY r.name`
  );
  res.json(r.rows.map((row) => toRole(row)));
}

export async function createRole(req: AuthRequest, res: Response): Promise<void> {
  const { name, code, description, permissions } = req.body;
  if (!name) {
    res.status(400).json({ message: 'Name is required' });
    return;
  }
  const slug = (code || name).toString().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const finalCode = slug || `role-${Date.now()}`;
  const existing = await pool.query('SELECT id FROM roles WHERE code = $1', [finalCode]);
  if (existing.rows.length > 0) {
    res.status(400).json({ message: 'A role with this code already exists. Use a different name or code.' });
    return;
  }
  const r = await pool.query(
    `INSERT INTO roles (name, code, description, permissions)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, code, description, permissions`,
    [name, finalCode, description || null, permissions || []]
  );
  const row = r.rows[0];
  invalidateRoleCodesCache();
  res.status(201).json(toRole({ ...row, user_count: 0, code: row.code }));
}

export async function updateRole(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { name, description, permissions } = req.body;
  const r = await pool.query(
    'SELECT id, code FROM roles WHERE id = $1',
    [id]
  );
  const existing = r.rows[0];
  if (!existing) {
    res.status(404).json({ message: 'Role not found' });
    return;
  }
  await pool.query(
    `UPDATE roles SET name = COALESCE($1, name), description = COALESCE($2, description), permissions = COALESCE($3, permissions) WHERE id = $4`,
    [name, description, permissions, id]
  );
  const withCount = await pool.query(
    `SELECT r.*, ${USER_COUNT_BY_ROLE} FROM roles r WHERE r.id = $1`,
    [id]
  );
  res.json(toRole(withCount.rows[0]));
}

export async function deleteRole(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const r = await pool.query('SELECT code FROM roles WHERE id = $1', [id]);
  const row = r.rows[0];
  if (!row) {
    res.status(404).json({ message: 'Role not found' });
    return;
  }
  const count = await pool.query('SELECT COUNT(*)::int AS c FROM users u WHERE u.role = $1', [row.code]);
  if (parseInt(count.rows[0]?.c, 10) > 0) {
    res.status(400).json({ message: 'Cannot delete role that has users assigned' });
    return;
  }
  await pool.query('DELETE FROM roles WHERE id = $1', [id]);
  invalidateRoleCodesCache();
  res.status(204).send();
}
