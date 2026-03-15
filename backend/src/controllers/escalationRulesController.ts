import { Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../middleware';

function toRule(row: any) {
  return {
    id: row.id,
    name: row.name,
    slaId: row.sla_id,
    slaName: row.sla_name ?? null,
    level1EscalatePercent: row.level1_escalate_percent ?? 50,
    level2EscalatePercent: row.level2_escalate_percent ?? 75,
    level1Escalate: row.level1_escalate,
    level2Escalate: row.level2_escalate,
    level1EscalateRoleName: row.level1_escalate_role_name ?? null,
    level2EscalateRoleName: row.level2_escalate_role_name ?? null,
    notifyUsers: row.notify_users || [],
    autoEscalate: row.auto_escalate,
  };
}

export async function listRules(_req: AuthRequest, res: Response): Promise<void> {
  const r = await pool.query(
    `SELECT er.*, s.name AS sla_name,
       r1.name AS level1_escalate_role_name, r2.name AS level2_escalate_role_name
     FROM escalation_rules er
     LEFT JOIN slas s ON s.id = er.sla_id
     LEFT JOIN roles r1 ON r1.code = er.level1_escalate
     LEFT JOIN roles r2 ON r2.code = er.level2_escalate
     ORDER BY er.name`
  );
  res.json(r.rows.map(toRule));
}

export async function createRule(req: AuthRequest, res: Response): Promise<void> {
  const { name, slaId, level1EscalatePercent, level2EscalatePercent, level1Escalate, level2Escalate, notifyUsers, autoEscalate } = req.body;
  if (!name) {
    res.status(400).json({ error: 'name required' });
    return;
  }
  const r = await pool.query(
    `INSERT INTO escalation_rules (name, sla_id, level1_escalate_percent, level2_escalate_percent, level1_escalate, level2_escalate, notify_users, auto_escalate)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      name,
      slaId || null,
      level1EscalatePercent != null ? Number(level1EscalatePercent) : 50,
      level2EscalatePercent != null ? Number(level2EscalatePercent) : 75,
      level1Escalate || '',
      level2Escalate || '',
      Array.isArray(notifyUsers) ? notifyUsers : [],
      !!autoEscalate,
    ]
  );
  const withSla = await pool.query(
    `SELECT er.*, s.name AS sla_name,
       r1.name AS level1_escalate_role_name, r2.name AS level2_escalate_role_name
     FROM escalation_rules er
     LEFT JOIN slas s ON s.id = er.sla_id
     LEFT JOIN roles r1 ON r1.code = er.level1_escalate
     LEFT JOIN roles r2 ON r2.code = er.level2_escalate
     WHERE er.id = $1`,
    [r.rows[0].id]
  );
  res.status(201).json(toRule(withSla.rows[0]));
}

export async function updateRule(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { name, slaId, level1EscalatePercent, level2EscalatePercent, level1Escalate, level2Escalate, notifyUsers, autoEscalate } = req.body;
  const r = await pool.query(
    `UPDATE escalation_rules SET
     name = COALESCE($1, name), sla_id = $2,
     level1_escalate_percent = COALESCE($3, level1_escalate_percent), level2_escalate_percent = COALESCE($4, level2_escalate_percent),
     level1_escalate = COALESCE($5, level1_escalate), level2_escalate = COALESCE($6, level2_escalate),
     notify_users = COALESCE($7, notify_users), auto_escalate = COALESCE($8, auto_escalate)
     WHERE id = $9 RETURNING *`,
    [
      name,
      slaId,
      level1EscalatePercent != null ? Number(level1EscalatePercent) : null,
      level2EscalatePercent != null ? Number(level2EscalatePercent) : null,
      level1Escalate,
      level2Escalate,
      notifyUsers != null && Array.isArray(notifyUsers) ? notifyUsers : null,
      autoEscalate,
      id,
    ]
  );
  const row = r.rows[0];
  if (!row) {
    res.status(404).json({ error: 'Escalation rule not found' });
    return;
  }
  const withSla = await pool.query(
    `SELECT er.*, s.name AS sla_name,
       r1.name AS level1_escalate_role_name, r2.name AS level2_escalate_role_name
     FROM escalation_rules er
     LEFT JOIN slas s ON s.id = er.sla_id
     LEFT JOIN roles r1 ON r1.code = er.level1_escalate
     LEFT JOIN roles r2 ON r2.code = er.level2_escalate
     WHERE er.id = $1`,
    [id]
  );
  res.json(toRule(withSla.rows[0]));
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
