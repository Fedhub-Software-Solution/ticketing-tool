import { Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../middleware';

function toTicket(row: any) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    category: row.category_name,
    categoryId: row.category_id,
    subCategory: row.sub_category,
    zone: row.zone,
    location: row.location,
    branch: row.branch,
    branchCode: row.branch_code,
    assignedTo: row.assigned_to_name,
    assignedToId: row.assigned_to_id,
    createdBy: row.created_by_name,
    createdById: row.created_by_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: row.tags || [],
    slaId: row.sla_id,
    slaDueDate: row.sla_due_date,
    escalationLevel: row.escalation_level ?? 0,
    escalatedTo: row.escalated_to,
    breachedSLA: row.breached_sla ?? false,
    parentId: row.parent_id,
    childIds: row.child_ids || [],
  };
}

export async function listTickets(req: AuthRequest, res: Response): Promise<void> {
  const { status, priority, zone, assignedTo, limit = '50', offset = '0' } = req.query;
  let sql = `
    SELECT t.*, c.name AS category_name,
           u1.name AS assigned_to_name, u2.name AS created_by_name,
           (SELECT array_agg(child.id) FROM tickets child WHERE child.parent_id = t.id) AS child_ids
    FROM tickets t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN users u1 ON t.assigned_to_id = u1.id
    LEFT JOIN users u2 ON t.created_by_id = u2.id
    WHERE 1=1`;
  const params: any[] = [];
  let i = 1;
  if (status) {
    sql += ` AND t.status = $${i++}`;
    params.push(status);
  }
  if (priority) {
    sql += ` AND t.priority = $${i++}`;
    params.push(priority);
  }
  if (zone) {
    sql += ` AND t.zone = $${i++}`;
    params.push(zone);
  }
  if (assignedTo) {
    sql += ` AND t.assigned_to_id = $${i++}`;
    params.push(assignedTo);
  }
  sql += ` ORDER BY t.updated_at DESC LIMIT $${i++} OFFSET $${i}`;
  params.push(parseInt(limit as string, 10) || 50, parseInt(offset as string, 10) || 0);

  const r = await pool.query(sql, params);
  res.json(r.rows.map(toTicket));
}

export async function getTicket(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const r = await pool.query(
    `SELECT t.*, c.name AS category_name,
            u1.name AS assigned_to_name, u2.name AS created_by_name,
            (SELECT array_agg(child.id) FROM tickets child WHERE child.parent_id = t.id) AS child_ids
     FROM tickets t
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN users u1 ON t.assigned_to_id = u1.id
     LEFT JOIN users u2 ON t.created_by_id = u2.id
     WHERE t.id = $1`,
    [id]
  );
  const row = r.rows[0];
  if (!row) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }
  res.json(toTicket(row));
}

export async function createTicket(req: AuthRequest, res: Response): Promise<void> {
  const {
    title,
    description,
    status = 'open',
    priority = 'medium',
    categoryId,
    subCategory,
    zone,
    location,
    branch,
    branchCode,
    assignedToId,
    slaId,
    slaDueDate,
    tags,
    parentId,
  } = req.body;
  if (!title) {
    res.status(400).json({ error: 'title required' });
    return;
  }
  const createdById = req.user!.userId;
  const r = await pool.query(
    `INSERT INTO tickets (title, description, status, priority, category_id, sub_category, zone, location, branch, branch_code, assigned_to_id, created_by_id, sla_id, sla_due_date, tags, parent_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
    [
      title,
      description || null,
      status,
      priority,
      categoryId || null,
      subCategory || null,
      zone || null,
      location || null,
      branch || null,
      branchCode || null,
      assignedToId || null,
      createdById,
      slaId || null,
      slaDueDate || null,
      JSON.stringify(tags || []),
      parentId || null,
    ]
  );
  const row = r.rows[0];
  const full = await pool.query(
    `SELECT t.*, c.name AS category_name, u1.name AS assigned_to_name, u2.name AS created_by_name, '{}' AS child_ids
     FROM tickets t LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN users u1 ON t.assigned_to_id = u1.id LEFT JOIN users u2 ON t.created_by_id = u2.id WHERE t.id = $1`,
    [row.id]
  );
  res.status(201).json(toTicket(full.rows[0]));
}

export async function updateTicket(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const {
    title,
    description,
    status,
    priority,
    categoryId,
    subCategory,
    zone,
    location,
    branch,
    branchCode,
    assignedToId,
    slaId,
    slaDueDate,
    escalationLevel,
    escalatedTo,
    breachedSLA,
    tags,
    parentId,
  } = req.body;
  const updates: string[] = [];
  const values: any[] = [];
  let i = 1;
  const map: Record<string, any> = {
    title,
    description,
    status,
    priority,
    category_id: categoryId,
    sub_category: subCategory,
    zone,
    location,
    branch,
    branch_code: branchCode,
    assigned_to_id: assignedToId,
    sla_id: slaId,
    sla_due_date: slaDueDate,
    escalation_level: escalationLevel,
    escalated_to: escalatedTo,
    breached_sla: breachedSLA,
    tags: tags != null ? JSON.stringify(tags) : null,
    parent_id: parentId,
  };
  for (const [key, val] of Object.entries(map)) {
    if (val !== undefined) {
      updates.push(`${key} = $${i++}`);
      values.push(val);
    }
  }
  if (updates.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }
  values.push(id);
  const r = await pool.query(
    `UPDATE tickets SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  const row = r.rows[0];
  if (!row) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }
  const full = await pool.query(
    `SELECT t.*, c.name AS category_name, u1.name AS assigned_to_name, u2.name AS created_by_name,
            (SELECT array_agg(child.id) FROM tickets child WHERE child.parent_id = t.id) AS child_ids
     FROM tickets t LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN users u1 ON t.assigned_to_id = u1.id LEFT JOIN users u2 ON t.created_by_id = u2.id WHERE t.id = $1`,
    [id]
  );
  res.json(toTicket(full.rows[0]));
}

export async function deleteTicket(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const r = await pool.query('DELETE FROM tickets WHERE id = $1 RETURNING id', [id]);
  if (r.rowCount === 0) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }
  res.status(204).send();
}
