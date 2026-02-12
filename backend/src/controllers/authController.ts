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
    avatar: row.avatar,
    zone: row.zone,
    branch: row.branch,
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
    'SELECT id, name, email, password_hash, role, avatar, zone, branch, location, status FROM users WHERE email = $1 AND status = $2',
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
  const r = await pool.query(
    `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, avatar, zone, branch, location, status`,
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
    'SELECT id, name, email, role, avatar, zone, branch, location, status FROM users WHERE id = $1',
    [req.user!.userId]
  );
  const row = r.rows[0];
  if (!row) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(toUserResponse(row));
}
