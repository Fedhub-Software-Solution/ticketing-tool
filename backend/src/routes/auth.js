import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function userToResponse(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatar: row.avatar_url ?? undefined,
    zone: row.zone_name ?? undefined,
    branch: row.branch_name ?? undefined,
    location: row.location ?? undefined,
    status: row.status,
  };
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    const r = await pool.query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.role, u.location, u.status, u.avatar_url,
              z.name AS zone_name, b.name AS branch_name
       FROM users u
       LEFT JOIN zones z ON u.zone_id = z.id
       LEFT JOIN branches b ON u.branch_id = b.id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email]
    );
    const user = r.rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    let passwordValid = false;
    try {
      passwordValid = await bcrypt.compare(password, user.password_hash);
    } catch (hashErr) {
      console.error('Login password check failed (invalid hash?):', hashErr.message);
      return res.status(500).json({
        message: 'Server error: login configuration. Re-run backend seed (npm run db:seed) and restart the API.',
      });
    }
    if (!passwordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );
    res.json({
      user: userToResponse(user),
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return res.status(503).json({ message: 'Database unavailable. Check PostgreSQL is running and DATABASE_URL in .env' });
    }
    if (err.code === '28P01') {
      return res.status(503).json({
        message: 'Database login failed. Check DATABASE_URL in backend .env — use the correct PostgreSQL username and password (e.g. postgres:yourpassword).',
      });
    }
    if (err.code === '42P01') {
      return res.status(503).json({ message: 'Database schema missing. Run: npm run db:schema' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'customer' } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password required' });
    }
    const validRoles = ['admin', 'manager', 'agent', 'customer'];
    const rRole = validRoles.includes(role) ? role : 'customer';
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4::user_role)
       RETURNING id, name, email, role, location, status, avatar_url, zone_id, branch_id`,
      [name, email, hash, rRole]
    );
    const user = r.rows[0];
    const zoneBranch = await pool.query(
      `SELECT z.name AS zone_name, b.name AS branch_name
       FROM users u
       LEFT JOIN zones z ON u.zone_id = z.id
       LEFT JOIN branches b ON u.branch_id = b.id
       WHERE u.id = $1`,
      [user.id]
    );
    const row = { ...user, ...zoneBranch.rows[0] };
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );
    res.status(201).json({
      user: userToResponse(row),
      token,
    });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Email already registered' });
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.location, u.status, u.avatar_url,
              z.name AS zone_name, b.name AS branch_name
       FROM users u
       LEFT JOIN zones z ON u.zone_id = z.id
       LEFT JOIN branches b ON u.branch_id = b.id
       WHERE u.id = $1`,
      [req.userId]
    );
    const user = r.rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(userToResponse(user));
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
