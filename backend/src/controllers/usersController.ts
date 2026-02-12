import { Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db';
import { AuthRequest } from '../middleware';
import { UserResponse } from '../types';

const VALID_ROLES = ['admin', 'manager', 'agent', 'customer'] as const;

/** Map role code from roles table to user_role enum (admin, manager, agent, customer). */
function toEnumRole(code: string | undefined): (typeof VALID_ROLES)[number] {
  if (!code) return 'agent';
  const c = code.toLowerCase().trim();
  if (VALID_ROLES.includes(c as any)) return c as (typeof VALID_ROLES)[number];
  if (c === 'administrator' || c.startsWith('admin')) return 'admin';
  if (c === 'mm' || c.startsWith('manager')) return 'manager';
  if (c.startsWith('agent') || c.includes('support')) return 'agent';
  if (c.startsWith('customer')) return 'customer';
  return 'agent';
}

function toUserResponse(row: any): UserResponse {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatar: row.avatar_url,
    zone: row.zone_id,
    branch: row.branch_id,
    location: row.location,
    status: row.status,
  };
}

export async function listUsers(req: AuthRequest, res: Response): Promise<void> {
  const r = await pool.query(
    'SELECT id, name, email, role, avatar_url, zone_id, branch_id, location, status FROM users ORDER BY name'
  );
  res.json(r.rows.map(toUserResponse));
}

export async function getUser(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const r = await pool.query(
    'SELECT id, name, email, role, avatar_url, zone_id, branch_id, location, status FROM users WHERE id = $1',
    [id]
  );
  const row = r.rows[0];
  if (!row) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(toUserResponse(row));
}

export async function updateUser(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { name, role, zone, branch, location, status } = req.body;
  const updates: string[] = [];
  const values: any[] = [];
  let i = 1;
  if (name !== undefined) {
    updates.push(`name = $${i++}`);
    values.push(name);
  }
  if (role !== undefined) {
    updates.push(`role = $${i++}`);
    values.push(toEnumRole(role));
  }
  if (zone !== undefined) {
    updates.push(`zone_id = $${i++}`);
    values.push(zone);
  }
  if (branch !== undefined) {
    updates.push(`branch_id = $${i++}`);
    values.push(branch);
  }
  if (location !== undefined) {
    updates.push(`location = $${i++}`);
    values.push(location);
  }
  if (status !== undefined) {
    updates.push(`status = $${i++}`);
    values.push(status);
  }
  if (updates.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }
  values.push(id);
  const r = await pool.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${i} RETURNING id, name, email, role, avatar_url, zone_id, branch_id, location, status`,
    values
  );
  const row = r.rows[0];
  if (!row) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(toUserResponse(row));
}

export async function createUser(req: AuthRequest, res: Response): Promise<void> {
  const { name, email, password, role = 'agent', zone, branch, location, status = 'active' } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ message: 'Name, email and password are required' });
    return;
  }
  const roleVal = toEnumRole(role);
  const hash = await bcrypt.hash(password, 10);
  try {
    const r = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, zone_id, branch_id, location, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, email, role, avatar_url, zone_id, branch_id, location, status`,
      [name.trim(), email.trim().toLowerCase(), hash, roleVal, zone || null, branch || null, location || null, status]
    );
    const row = r.rows[0];
    res.status(201).json(toUserResponse(row));
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(400).json({ message: 'A user with this email already exists' });
      return;
    }
    throw err;
  }
}

export async function deleteUser(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const r = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
  if (r.rows.length === 0) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.status(204).send();
}
