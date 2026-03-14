import { Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { pool } from '../db';
import { config } from '../config';
import { AuthRequest } from '../middleware';
import { UserResponse } from '../types';
import { sendVerificationEmail } from '../services/email';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    'SELECT id, name, email, password_hash, role, avatar_url, zone_id, branch_id, location, status, email_verified FROM users WHERE LOWER(email) = LOWER($1) AND status = $2',
    [email, 'active']
  );
  const row = r.rows[0];
  if (!row) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  if (!row.email_verified) {
    res.status(403).json({
      error: 'Please verify your email before signing in. Check your inbox for the verification link.',
      code: 'EMAIL_NOT_VERIFIED',
    });
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
  const {
    name,
    fullName,
    email,
    workEmail,
    password,
    confirmPassword,
    role = 'customer',
    companyName,
    company_name,
    phoneNumber,
    phone_number,
  } = req.body;
  const displayName = (name || fullName || '').trim();
  const emailVal = (email || workEmail || '').trim().toLowerCase();
  const company = (companyName ?? company_name ?? '').trim() || null;
  const phone = (phoneNumber ?? phone_number ?? '').trim() || null;

  if (!displayName || !emailVal || !password) {
    res.status(400).json({ error: 'Name, email and password required' });
    return;
  }
  if (!EMAIL_REGEX.test(emailVal)) {
    res.status(400).json({ error: 'Please enter a valid email address' });
    return;
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    res.status(400).json({ error: 'Password and confirm password do not match' });
    return;
  }
  if (String(password).length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [emailVal]);
  if (existing.rows.length > 0) {
    res.status(400).json({ error: 'An account with this email already exists' });
    return;
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const hash = await bcrypt.hash(password, 10);
  try {
    const r = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, created_by, company_name, phone_number, email_verified, verification_token, verification_token_expires_at)
       VALUES ($1, $2, $3, $4, NULL, $5, $6, false, $7, $8)
       RETURNING id, name, email, role, avatar_url, zone_id, branch_id, location, status`,
      [displayName, emailVal, hash, role, company, phone, verificationToken, expiresAt]
    );
    const row = r.rows[0];
    const baseUrl = (config as { frontendBaseUrl?: string }).frontendBaseUrl || 'http://localhost:5173';
    const verificationLink = `${baseUrl.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(verificationToken)}`;
    const emailResult = await sendVerificationEmail(emailVal, displayName, verificationLink);
    if (!emailResult.sent && config.nodeEnv === 'development') {
      console.log('[dev] Verification email not sent. Link for', emailVal, ':', verificationLink);
    }
    res.status(201).json({
      message: 'Please check your email to verify your account. You can sign in after verification.',
      emailSent: emailResult.sent,
    });
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(400).json({ error: 'An account with this email already exists' });
      return;
    }
    throw err;
  }
}

export async function verifyEmail(req: AuthRequest, res: Response): Promise<void> {
  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'Verification token is required' });
    return;
  }
  const r = await pool.query(
    'SELECT id, name, email FROM users WHERE verification_token = $1 AND verification_token_expires_at > NOW()',
    [token.trim()]
  );
  const row = r.rows[0];
  if (!row) {
    res.status(400).json({ error: 'Invalid or expired verification link. Please request a new one.' });
    return;
  }
  await pool.query(
    'UPDATE users SET email_verified = true, verification_token = NULL, verification_token_expires_at = NULL WHERE id = $1',
    [row.id]
  );
  res.json({ success: true, message: 'Email verified. You can now sign in.' });
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
