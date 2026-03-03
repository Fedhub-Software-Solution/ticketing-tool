import { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { pool } from '../db';
import { config } from '../config';
import { AuthRequest } from '../middleware';
import { UserResponse } from '../types';

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

export async function login(req: AuthRequest, res: Response): Promise<void> {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }
  const r = await pool.query(
    'SELECT id, name, email, password_hash, role, avatar_url, zone_id, branch_id, location, status FROM users WHERE LOWER(email) = LOWER($1) AND status = $2',
    [email, 'active']
  );
  const row = r.rows[0];
  if (!row) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  const match = await bcrypt.compare(password, row.password_hash);
  if (!match) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  const token = jwt.sign(
    { userId: row.id, email: row.email, role: row.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn } as SignOptions
  );
  res.json({ user: toUserResponse(row), token });
}

export async function register(req: AuthRequest, res: Response): Promise<void> {
  const { name, email, password, role = 'customer' } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email and password required' });
    return;
  }
  const hash = await bcrypt.hash(password, 10);
  // created_by left NULL = self-registered (not created by an admin)
  const r = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, created_by) VALUES ($1, $2, $3, $4, NULL)
     RETURNING id, name, email, role, avatar_url, zone_id, branch_id, location, status`,
    [name, email, hash, role]
  );
  const row = r.rows[0];
  const token = jwt.sign(
    { userId: row.id, email: row.email, role: row.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn } as SignOptions
  );
  res.status(201).json({ user: toUserResponse(row), token });
}

export async function me(req: AuthRequest, res: Response): Promise<void> {
  const r = await pool.query(
    `SELECT u.id, u.name, u.email, u.role, u.avatar_url, u.zone_id, u.branch_id, u.location, u.status,
            u.email_alerts, u.sla_warnings, u.desktop_push,
            z.name AS zone_name, b.name AS branch_name
     FROM users u
     LEFT JOIN zones z ON u.zone_id = z.id
     LEFT JOIN branches b ON u.branch_id = b.id
     WHERE u.id = $1`,
    [req.user!.userId]
  );
  const row = r.rows[0];
  if (!row) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const user = toUserResponse(row);
  const profile = {
    ...user,
    zoneName: row.zone_name ?? undefined,
    branchName: row.branch_name ?? undefined,
    emailAlerts: row.email_alerts !== undefined ? !!row.email_alerts : true,
    slaWarnings: row.sla_warnings !== undefined ? !!row.sla_warnings : true,
    desktopPush: !!row.desktop_push,
  };
  res.json(profile);
}

export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current password and new password required' });
    return;
  }
  if (String(newPassword).trim().length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters' });
    return;
  }
  const r = await pool.query(
    'SELECT id, password_hash FROM users WHERE id = $1',
    [req.user!.userId]
  );
  const row = r.rows[0];
  if (!row) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const match = await bcrypt.compare(currentPassword, row.password_hash);
  if (!match) {
    res.status(401).json({ error: 'Current password is incorrect' });
    return;
  }
  const hash = await bcrypt.hash(newPassword.trim(), 10);
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user!.userId]);
  res.json({ message: 'Password updated' });
}
