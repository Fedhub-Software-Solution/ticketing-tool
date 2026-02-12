import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function ruleToResponse(row) {
  return {
    id: row.id,
    name: row.name,
    priority: row.priority,
    triggerAfter: row.trigger_after_mins,
    level1Escalate: row.level1_escalate ?? undefined,
    level2Escalate: row.level2_escalate ?? undefined,
    notifyUsers: row.notify_users ?? [],
    autoEscalate: row.auto_escalate ?? false,
  };
}

router.get('/', async (_req, res) => {
  try {
    const r = await pool.query(
      'SELECT id, name, priority, trigger_after_mins, level1_escalate, level2_escalate, notify_users, auto_escalate FROM escalation_rules ORDER BY priority'
    );
    res.json(r.rows.map(ruleToResponse));
  } catch (err) {
    console.error('Escalation rules list error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, priority, triggerAfter, level1Escalate, level2Escalate, notifyUsers, autoEscalate = false } = req.body || {};
    if (!name || priority == null || triggerAfter == null) {
      return res.status(400).json({ message: 'Name, priority, triggerAfter required' });
    }
    const r = await pool.query(
      `INSERT INTO escalation_rules (name, priority, trigger_after_mins, level1_escalate, level2_escalate, notify_users, auto_escalate)
       VALUES ($1, $2::priority_level, $3, $4, $5, $6::text[], $7)
       RETURNING id, name, priority, trigger_after_mins, level1_escalate, level2_escalate, notify_users, auto_escalate`,
      [
        name, priority, triggerAfter,
        level1Escalate ?? null, level2Escalate ?? null,
        Array.isArray(notifyUsers) ? notifyUsers : [], autoEscalate,
      ]
    );
    res.status(201).json(ruleToResponse(r.rows[0]));
  } catch (err) {
    console.error('Escalation rule create error:', err);
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
    if (body.triggerAfter !== undefined) { updates.push(`trigger_after_mins = $${i++}`); values.push(body.triggerAfter); }
    if (body.level1Escalate !== undefined) { updates.push(`level1_escalate = $${i++}`); values.push(body.level1Escalate); }
    if (body.level2Escalate !== undefined) { updates.push(`level2_escalate = $${i++}`); values.push(body.level2Escalate); }
    if (body.notifyUsers !== undefined) {
      updates.push(`notify_users = $${i++}::text[]`);
      values.push(Array.isArray(body.notifyUsers) ? body.notifyUsers : []);
    }
    if (body.autoEscalate !== undefined) { updates.push(`auto_escalate = $${i++}`); values.push(body.autoEscalate); }
    if (updates.length === 0) {
      const r = await pool.query(
        'SELECT id, name, priority, trigger_after_mins, level1_escalate, level2_escalate, notify_users, auto_escalate FROM escalation_rules WHERE id = $1',
        [req.params.id]
      );
      const row = r.rows[0];
      if (!row) return res.status(404).json({ message: 'Escalation rule not found' });
      return res.json(ruleToResponse(row));
    }
    values.push(req.params.id);
    const r = await pool.query(
      `UPDATE escalation_rules SET ${updates.join(', ')} WHERE id = $${i} RETURNING id, name, priority, trigger_after_mins, level1_escalate, level2_escalate, notify_users, auto_escalate`,
      values
    );
    if (r.rowCount === 0) return res.status(404).json({ message: 'Escalation rule not found' });
    res.json(ruleToResponse(r.rows[0]));
  } catch (err) {
    console.error('Escalation rule update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM escalation_rules WHERE id = $1 RETURNING id', [req.params.id]);
    if (r.rowCount === 0) return res.status(404).json({ message: 'Escalation rule not found' });
    res.status(204).send();
  } catch (err) {
    console.error('Escalation rule delete error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
