import { Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { pool } from '../db';
import { AuthRequest } from '../middleware';
import { UserResponse } from '../types';
import { sendVerificationWithPasswordEmail, sendProfileUpdatedEmail } from '../services/email';
import { config } from '../config';

const ALPHANUM = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function generateRandomPassword(length = 12): string {
  const bytes = crypto.randomBytes(length);
  let s = '';
  for (let i = 0; i < length; i++) s += ALPHANUM[bytes[i]! % ALPHANUM.length];
  return s;
}

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
  let zoneName: string | undefined;
  let branchName: string | undefined;
  if (row.zone_id) {
    const z = await pool.query('SELECT name FROM zones WHERE id = $1', [row.zone_id]);
    zoneName = z.rows[0]?.name;
  }
  if (row.branch_id) {
    const b = await pool.query('SELECT name FROM branches WHERE id = $1', [row.branch_id]);
    branchName = b.rows[0]?.name;
  }
  const emailResult = await sendProfileUpdatedEmail(row.email, {
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    location: row.location ?? undefined,
    zoneName,
    branchName,
  });
  res.json({
    ...toUserResponse(row),
    emailSent: emailResult.sent,
    emailError: !emailResult.sent ? emailResult.reason : undefined,
  });
}

export async function createUser(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user?.userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const { name, email, password: providedPassword, role = 'agent', zone, branch, location, status = 'active' } = req.body;
  if (!name || !email) {
    res.status(400).json({ message: 'Name and email are required' });
    return;
  }
  const creatorId = req.user.userId;
  const plainPassword = providedPassword && String(providedPassword).trim().length >= 6
    ? String(providedPassword).trim()
    : generateRandomPassword(12);
  const roleVal = toEnumRole(role);
  const hash = await bcrypt.hash(plainPassword, 10);
  const emailNorm = email.trim().toLowerCase();
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const baseUrl = (config as { frontendBaseUrl?: string }).frontendBaseUrl || 'http://localhost:5173';
  const verificationLink = `${baseUrl.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(verificationToken)}`;
  try {
    const r = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, zone_id, branch_id, location, status, created_by, email_verified, verification_token, verification_token_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, $10, $11)
       RETURNING id, name, email, role, avatar_url, zone_id, branch_id, location, status`,
      [name.trim(), emailNorm, hash, roleVal, zone || null, branch || null, location || null, status, creatorId, verificationToken, expiresAt]
    );
    const row = r.rows[0];
    const emailResult = await sendVerificationWithPasswordEmail(emailNorm, name.trim(), plainPassword, verificationLink);
    if (!emailResult.sent && config.nodeEnv === 'development') {
      console.log('[dev] Verification email not sent. Link for', emailNorm, ':', verificationLink, '| Password:', plainPassword, '| Reason:', emailResult.reason);
    }
    res.status(201).json({
      ...toUserResponse(row),
      emailSent: emailResult.sent,
      emailError: !emailResult.sent ? emailResult.reason : undefined,
    });
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(400).json({ message: 'A user with this email already exists' });
      return;
    }
    throw err;
  }
}

/** Update current user's own profile (name, location, zone, branch, notification prefs). */
export async function updateMyProfile(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { name, location, zone, branch, emailAlerts, slaWarnings, desktopPush } = req.body;
  const updates: string[] = [];
  const values: any[] = [];
  let i = 1;
  if (name !== undefined) {
    updates.push(`name = $${i++}`);
    values.push(name);
  }
  if (location !== undefined) {
    updates.push(`location = $${i++}`);
    values.push(location);
  }
  if (zone !== undefined) {
    updates.push(`zone_id = $${i++}`);
    values.push(zone || null);
  }
  if (branch !== undefined) {
    updates.push(`branch_id = $${i++}`);
    values.push(branch || null);
  }
  if (emailAlerts !== undefined) {
    updates.push(`email_alerts = $${i++}`);
    values.push(!!emailAlerts);
  }
  if (slaWarnings !== undefined) {
    updates.push(`sla_warnings = $${i++}`);
    values.push(!!slaWarnings);
  }
  if (desktopPush !== undefined) {
    updates.push(`desktop_push = $${i++}`);
    values.push(!!desktopPush);
  }
  if (updates.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }
  values.push(userId);
  const r = await pool.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${i}
     RETURNING id, name, email, role, avatar_url, zone_id, branch_id, location, status, email_alerts, sla_warnings, desktop_push`,
    values
  );
  const row = r.rows[0];
  if (!row) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const out: any = toUserResponse(row);
  out.emailAlerts = row.email_alerts !== undefined ? !!row.email_alerts : true;
  out.slaWarnings = row.sla_warnings !== undefined ? !!row.sla_warnings : true;
  out.desktopPush = !!row.desktop_push;
  res.json(out);
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
