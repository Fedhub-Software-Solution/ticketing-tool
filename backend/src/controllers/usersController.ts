import { Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../middleware';
import { UserResponse } from '../types';

function toUserResponse(row: any): UserResponse {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatar: row.avatar,
    zone: row.zone,
    branch: row.branch,
    location: row.location,
    status: row.status,
  };
}

export async function listUsers(req: AuthRequest, res: Response): Promise<void> {
  const r = await pool.query(
    'SELECT id, name, email, role, avatar, zone, branch, location, status FROM users ORDER BY name'
  );
  res.json(r.rows.map(toUserResponse));
}

export async function getUser(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const r = await pool.query(
    'SELECT id, name, email, role, avatar, zone, branch, location, status FROM users WHERE id = $1',
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
    values.push(role);
  }
  if (zone !== undefined) {
    updates.push(`zone = $${i++}`);
    values.push(zone);
  }
  if (branch !== undefined) {
    updates.push(`branch = $${i++}`);
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
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${i} RETURNING id, name, email, role, avatar, zone, branch, location, status`,
    values
  );
  const row = r.rows[0];
  if (!row) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(toUserResponse(row));
}
