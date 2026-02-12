import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

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

router.get('/', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.location, u.status, u.avatar_url,
              z.name AS zone_name, b.name AS branch_name
       FROM users u
       LEFT JOIN zones z ON u.zone_id = z.id
       LEFT JOIN branches b ON u.branch_id = b.id
       ORDER BY u.name`
    );
    res.json(r.rows.map(userToResponse));
  } catch (err) {
    console.error('Users list error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.location, u.status, u.avatar_url,
              z.name AS zone_name, b.name AS branch_name
       FROM users u
       LEFT JOIN zones z ON u.zone_id = z.id
       LEFT JOIN branches b ON u.branch_id = b.id
       WHERE u.id = $1`,
      [req.params.id]
    );
    const user = r.rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(userToResponse(user));
  } catch (err) {
    console.error('User get error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { name, role, zone, branch, location, status } = req.body || {};
    const updates = [];
    const values = [];
    let i = 1;
    if (name !== undefined) { updates.push(`name = $${i++}`); values.push(name); }
    if (role !== undefined) { updates.push(`role = $${i++}::user_role`); values.push(role); }
    if (location !== undefined) { updates.push(`location = $${i++}`); values.push(location); }
    if (status !== undefined) { updates.push(`status = $${i++}::user_status`); values.push(status); }
    if (zone !== undefined) {
      const z = await pool.query('SELECT id FROM zones WHERE name = $1', [zone]);
      const zoneId = z.rows[0]?.id ?? null;
      updates.push(`zone_id = $${i++}`);
      values.push(zoneId);
    }
    if (branch !== undefined) {
      const b = await pool.query('SELECT id FROM branches WHERE name = $1', [branch]);
      const branchId = b.rows[0]?.id ?? null;
      updates.push(`branch_id = $${i++}`);
      values.push(branchId);
    }
    if (updates.length === 0) {
      const r = await pool.query(
        `SELECT u.id, u.name, u.email, u.role, u.location, u.status, u.avatar_url,
                z.name AS zone_name, b.name AS branch_name
         FROM users u
         LEFT JOIN zones z ON u.zone_id = z.id
         LEFT JOIN branches b ON u.branch_id = b.id
         WHERE u.id = $1`,
        [req.params.id]
      );
      const user = r.rows[0];
      if (!user) return res.status(404).json({ message: 'User not found' });
      return res.json(userToResponse(user));
    }
    values.push(req.params.id);
    const r = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${i} RETURNING id`,
      values
    );
    if (r.rowCount === 0) return res.status(404).json({ message: 'User not found' });
    const get = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.location, u.status, u.avatar_url,
              z.name AS zone_name, b.name AS branch_name
       FROM users u
       LEFT JOIN zones z ON u.zone_id = z.id
       LEFT JOIN branches b ON u.branch_id = b.id
       WHERE u.id = $1`,
      [req.params.id]
    );
    res.json(userToResponse(get.rows[0]));
  } catch (err) {
    console.error('User update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
