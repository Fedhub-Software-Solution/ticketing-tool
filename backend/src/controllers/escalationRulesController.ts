import { Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../middleware';

function toRule(row: any) {
  return {
    id: row.id,
    name: row.name,
    priority: row.priority,
    triggerAfter: row.trigger_after_mins,
    level1Escalate: row.level1_escalate,
    level2Escalate: row.level2_escalate,
    notifyUsers: row.notify_users || [],
    autoEscalate: row.auto_escalate,
  };
}

export async function listRules(_req: AuthRequest, res: Response): Promise<void> {
  const r = await pool.query('SELECT * FROM escalation_rules ORDER BY name');
  res.json(r.rows.map(toRule));
}

export async function createRule(req: AuthRequest, res: Response): Promise<void> {
  const { name, priority, triggerAfter, level1Escalate, level2Escalate, notifyUsers, autoEscalate } = req.body;
  if (!name || !priority || triggerAfter == null) {
    res.status(400).json({ error: 'name, priority, triggerAfter required' });
    return;
  }
  const r = await pool.query(
    `INSERT INTO escalation_rules (name, priority, trigger_after_mins, level1_escalate, level2_escalate, notify_users, auto_escalate)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      name,
      priority,
      triggerAfter,
      level1Escalate || '',
      level2Escalate || '',
      JSON.stringify(notifyUsers || []),
      !!autoEscalate,
    ]
  );
  res.status(201).json(toRule(r.rows[0]));
}

export async function updateRule(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { name, priority, triggerAfter, level1Escalate, level2Escalate, notifyUsers, autoEscalate } = req.body;
  const r = await pool.query(
    `UPDATE escalation_rules SET
     name = COALESCE($1, name), priority = COALESCE($2, priority), trigger_after_mins = COALESCE($3, trigger_after_mins),
     level1_escalate = COALESCE($4, level1_escalate), level2_escalate = COALESCE($5, level2_escalate),
     notify_users = COALESCE($6, notify_users), auto_escalate = COALESCE($7, auto_escalate)
     WHERE id = $8 RETURNING *`,
    [
      name,
      priority,
      triggerAfter,
      level1Escalate,
      level2Escalate,
      notifyUsers != null ? JSON.stringify(notifyUsers) : null,
      autoEscalate,
      id,
    ]
  );
  const row = r.rows[0];
  if (!row) {
    res.status(404).json({ error: 'Escalation rule not found' });
    return;
  }
  res.json(toRule(row));
}

export async function deleteRule(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const r = await pool.query('DELETE FROM escalation_rules WHERE id = $1 RETURNING id', [id]);
  if (r.rowCount === 0) {
    res.status(404).json({ error: 'Escalation rule not found' });
    return;
  }
  res.status(204).send();
}
