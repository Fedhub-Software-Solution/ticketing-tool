import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function slaToResponse(row) {
  return {
    id: row.id,
    name: row.name,
    priority: row.priority,
    responseTime: row.response_time_mins,
    resolutionTime: row.resolution_time_mins,
    category: row.category ?? undefined,
  };
}

router.get('/', async (_req, res) => {
  try {
    const r = await pool.query(
      'SELECT id, name, priority, response_time_mins, resolution_time_mins, category FROM slas ORDER BY priority'
    );
    res.json(r.rows.map(slaToResponse));
  } catch (err) {
    console.error('SLAs list error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT id, name, priority, response_time_mins, resolution_time_mins, category FROM slas WHERE id = $1',
      [req.params.id]
    );
    const row = r.rows[0];
    if (!row) return res.status(404).json({ message: 'SLA not found' });
    res.json(slaToResponse(row));
  } catch (err) {
    console.error('SLA get error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, priority, responseTime, resolutionTime, category } = req.body || {};
    if (!name || priority == null || responseTime == null || resolutionTime == null) {
      return res.status(400).json({ message: 'Name, priority, responseTime, resolutionTime required' });
    }
    const r = await pool.query(
      `INSERT INTO slas (name, priority, response_time_mins, resolution_time_mins, category)
       VALUES ($1, $2::priority_level, $3, $4, $5)
       RETURNING id, name, priority, response_time_mins, resolution_time_mins, category`,
      [name, priority, responseTime, resolutionTime, category ?? null]
    );
    res.status(201).json(slaToResponse(r.rows[0]));
  } catch (err) {
    console.error('SLA create error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const body = req.body || {};
    const updates = [];
    const values = [];
    let i = 1;
    if (body.name !== undefined) { updates.push(`name = $${i++}`); values.push(body.name); }
    if (body.priority !== undefined) { updates.push(`priority = $${i++}::priority_level`); values.push(body.priority); }
    if (body.responseTime !== undefined) { updates.push(`response_time_mins = $${i++}`); values.push(body.responseTime); }
    if (body.resolutionTime !== undefined) { updates.push(`resolution_time_mins = $${i++}`); values.push(body.resolutionTime); }
    if (body.category !== undefined) { updates.push(`category = $${i++}`); values.push(body.category); }
    if (updates.length === 0) {
      const r = await pool.query(
        'SELECT id, name, priority, response_time_mins, resolution_time_mins, category FROM slas WHERE id = $1',
        [req.params.id]
      );
      const row = r.rows[0];
      if (!row) return res.status(404).json({ message: 'SLA not found' });
      return res.json(slaToResponse(row));
    }
    values.push(req.params.id);
    const r = await pool.query(
      `UPDATE slas SET ${updates.join(', ')} WHERE id = $${i} RETURNING id, name, priority, response_time_mins, resolution_time_mins, category`,
      values
    );
    if (r.rowCount === 0) return res.status(404).json({ message: 'SLA not found' });
    res.json(slaToResponse(r.rows[0]));
  } catch (err) {
    console.error('SLA update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM slas WHERE id = $1 RETURNING id', [req.params.id]);
    if (r.rowCount === 0) return res.status(404).json({ message: 'SLA not found' });
    res.status(204).send();
  } catch (err) {
    if (err.code === '23503') return res.status(400).json({ message: 'SLA in use' });
    console.error('SLA delete error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
