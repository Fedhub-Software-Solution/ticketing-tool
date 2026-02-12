import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function ticketToResponse(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status,
    priority: row.priority,
    category: row.category_name ?? '',
    subCategory: row.sub_category ?? undefined,
    zone: row.zone_name ?? undefined,
    location: row.location ?? undefined,
    branch: row.branch_name ?? undefined,
    branchCode: row.branch_code ?? undefined,
    assignedTo: row.assigned_to_name ?? undefined,
    createdBy: row.created_by_name ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: row.tags ?? [],
    slaId: row.sla_id ?? undefined,
    slaDueDate: row.sla_due_date ?? undefined,
    escalationLevel: row.escalation_level ?? undefined,
    escalatedTo: row.escalated_to ?? undefined,
    breachedSLA: row.breached_sla ?? false,
    parentId: row.parent_id ?? undefined,
    childIds: row.child_ids ?? [],
  };
}

const ticketSelect = `
  t.id, t.title, t.description, t.status, t.priority, t.sub_category, t.location, t.branch_code,
  t.sla_id, t.sla_due_date, t.escalation_level, t.escalated_to, t.breached_sla, t.parent_id, t.tags,
  t.created_at, t.updated_at,
  c.name AS category_name,
  z.name AS zone_name, b.name AS branch_name,
  u1.name AS assigned_to_name, u2.name AS created_by_name
`;

router.get('/', async (req, res) => {
  try {
    const { status, priority, zone, assignedTo, limit = 100, offset = 0 } = req.query;
    let sql = `
      SELECT ${ticketSelect},
             (SELECT COALESCE(array_agg(child.id), ARRAY[]::uuid[]) FROM tickets child WHERE child.parent_id = t.id) AS child_ids
      FROM tickets t
      JOIN categories c ON t.category_id = c.id
      LEFT JOIN zones z ON t.zone_id = z.id
      LEFT JOIN branches b ON t.branch_id = b.id
      LEFT JOIN users u1 ON t.assigned_to_id = u1.id
      JOIN users u2 ON t.created_by_id = u2.id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;
    if (status) { sql += ` AND t.status = $${i++}::ticket_status`; params.push(status); }
    if (priority) { sql += ` AND t.priority = $${i++}::priority_level`; params.push(priority); }
    if (zone) { sql += ` AND z.name = $${i++}`; params.push(zone); }
    if (assignedTo) { sql += ` AND u1.name = $${i++}`; params.push(assignedTo); }
    sql += ` ORDER BY t.updated_at DESC LIMIT $${i++} OFFSET $${i}`;
    params.push(Math.min(Number(limit) || 100, 500), Number(offset) || 0);

    const r = await pool.query(sql, params);
    res.json(r.rows.map(ticketToResponse));
  } catch (err) {
    console.error('Tickets list error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT ${ticketSelect},
              (SELECT COALESCE(array_agg(child.id), ARRAY[]::uuid[]) FROM tickets child WHERE child.parent_id = t.id) AS child_ids
       FROM tickets t
       JOIN categories c ON t.category_id = c.id
       LEFT JOIN zones z ON t.zone_id = z.id
       LEFT JOIN branches b ON t.branch_id = b.id
       LEFT JOIN users u1 ON t.assigned_to_id = u1.id
       JOIN users u2 ON t.created_by_id = u2.id
       WHERE t.id = $1`,
      [req.params.id]
    );
    const row = r.rows[0];
    if (!row) return res.status(404).json({ message: 'Ticket not found' });
    res.json(ticketToResponse(row));
  } catch (err) {
    console.error('Ticket get error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const {
      title, description, status = 'open', priority = 'medium', categoryId, subCategory,
      zone, location, branch, branchCode, assignedToId, slaId, slaDueDate, tags, parentId,
    } = body;
    if (!title) return res.status(400).json({ message: 'Title required' });
    const createdById = req.userId;

    let categoryIdRes = categoryId;
    if (!categoryIdRes) {
      const cat = await pool.query('SELECT id FROM categories WHERE is_active = true LIMIT 1');
      categoryIdRes = cat.rows[0]?.id;
    }
    if (!categoryIdRes) return res.status(400).json({ message: 'No category available' });

    let zoneId = null, branchId = null;
    if (zone) {
      const z = await pool.query('SELECT id FROM zones WHERE name = $1', [zone]);
      zoneId = z.rows[0]?.id ?? null;
    }
    if (branch) {
      const b = await pool.query('SELECT id FROM branches WHERE name = $1', [branch]);
      branchId = b.rows[0]?.id ?? null;
    }

    const r = await pool.query(
      `INSERT INTO tickets (
        title, description, status, priority, category_id, sub_category, zone_id, location,
        branch_id, branch_code, assigned_to_id, created_by_id, sla_id, sla_due_date, tags, parent_id
      ) VALUES ($1, $2, $3::ticket_status, $4::priority_level, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::text[], $16)
      RETURNING id`,
      [
        title, description ?? null, status, priority, categoryIdRes, subCategory ?? null,
        zoneId, location ?? null, branchId, branchCode ?? null, assignedToId ?? null, createdById,
        slaId ?? null, slaDueDate ?? null, (tags && Array.isArray(tags) ? tags : []) || [], parentId ?? null,
      ]
    );
    const id = r.rows[0].id;
    const get = await pool.query(
      `SELECT ${ticketSelect},
              (SELECT COALESCE(array_agg(child.id), ARRAY[]::uuid[]) FROM tickets child WHERE child.parent_id = t.id) AS child_ids
       FROM tickets t
       JOIN categories c ON t.category_id = c.id
       LEFT JOIN zones z ON t.zone_id = z.id
       LEFT JOIN branches b ON t.branch_id = b.id
       LEFT JOIN users u1 ON t.assigned_to_id = u1.id
       JOIN users u2 ON t.created_by_id = u2.id
       WHERE t.id = $1`,
      [id]
    );
    res.status(201).json(ticketToResponse(get.rows[0]));
  } catch (err) {
    console.error('Ticket create error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const body = req.body || {};
    const allowed = [
      'title', 'description', 'status', 'priority', 'categoryId', 'subCategory',
      'zone', 'location', 'branch', 'branchCode', 'assignedToId', 'slaId', 'slaDueDate',
      'escalationLevel', 'escalatedTo', 'breachedSLA', 'tags', 'parentId',
    ];
    const updates = [];
    const values = [];
    let i = 1;

    const set = (col, val, cast) => {
      if (val === undefined) return;
      updates.push(`${col} = $${i++}${cast || ''}`);
      values.push(val);
    };
    set('title', body.title);
    set('description', body.description);
    set('status', body.status, '::ticket_status');
    set('priority', body.priority, '::priority_level');
    set('sub_category', body.subCategory);
    set('location', body.location);
    set('branch_code', body.branchCode);
    set('assigned_to_id', body.assignedToId);
    set('sla_id', body.slaId);
    set('sla_due_date', body.slaDueDate);
    set('escalation_level', body.escalationLevel);
    set('escalated_to', body.escalatedTo);
    set('breached_sla', body.breachedSLA);
    set('parent_id', body.parentId);
    if (body.tags !== undefined) {
      updates.push(`tags = $${i++}::text[]`);
      values.push(Array.isArray(body.tags) ? body.tags : []);
    }
    if (body.categoryId !== undefined) {
      updates.push(`category_id = $${i++}`);
      values.push(body.categoryId);
    }
    if (body.zone !== undefined) {
      const z = await pool.query('SELECT id FROM zones WHERE name = $1', [body.zone]);
      updates.push(`zone_id = $${i++}`);
      values.push(z.rows[0]?.id ?? null);
    }
    if (body.branch !== undefined) {
      const b = await pool.query('SELECT id FROM branches WHERE name = $1', [body.branch]);
      updates.push(`branch_id = $${i++}`);
      values.push(b.rows[0]?.id ?? null);
    }

    if (updates.length === 0) {
      const r = await pool.query(
        `SELECT ${ticketSelect},
                (SELECT COALESCE(array_agg(child.id), ARRAY[]::uuid[]) FROM tickets child WHERE child.parent_id = t.id) AS child_ids
         FROM tickets t
         JOIN categories c ON t.category_id = c.id
         LEFT JOIN zones z ON t.zone_id = z.id
         LEFT JOIN branches b ON t.branch_id = b.id
         LEFT JOIN users u1 ON t.assigned_to_id = u1.id
         JOIN users u2 ON t.created_by_id = u2.id
         WHERE t.id = $1`,
        [req.params.id]
      );
      const row = r.rows[0];
      if (!row) return res.status(404).json({ message: 'Ticket not found' });
      return res.json(ticketToResponse(row));
    }
    values.push(req.params.id);
    const r = await pool.query(
      `UPDATE tickets SET ${updates.join(', ')} WHERE id = $${i} RETURNING id`,
      values
    );
    if (r.rowCount === 0) return res.status(404).json({ message: 'Ticket not found' });
    const get = await pool.query(
      `SELECT ${ticketSelect},
              (SELECT COALESCE(array_agg(child.id), ARRAY[]::uuid[]) FROM tickets child WHERE child.parent_id = t.id) AS child_ids
       FROM tickets t
       JOIN categories c ON t.category_id = c.id
       LEFT JOIN zones z ON t.zone_id = z.id
       LEFT JOIN branches b ON t.branch_id = b.id
       LEFT JOIN users u1 ON t.assigned_to_id = u1.id
       JOIN users u2 ON t.created_by_id = u2.id
       WHERE t.id = $1`,
      [req.params.id]
    );
    res.json(ticketToResponse(get.rows[0]));
  } catch (err) {
    console.error('Ticket update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM tickets WHERE id = $1 RETURNING id', [req.params.id]);
    if (r.rowCount === 0) return res.status(404).json({ message: 'Ticket not found' });
    res.status(204).send();
  } catch (err) {
    console.error('Ticket delete error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Comments
router.get('/:id/comments', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT c.id, c.ticket_id, c.author_id, u.name AS author, c.text, c.created_at, c.updated_at
       FROM ticket_comments c
       JOIN users u ON c.author_id = u.id
       WHERE c.ticket_id = $1 ORDER BY c.created_at ASC`,
      [req.params.id]
    );
    res.json(r.rows.map(row => ({
      id: row.id,
      ticketId: row.ticket_id,
      authorId: row.author_id,
      author: row.author,
      text: row.text,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })));
  } catch (err) {
    console.error('Comments list error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/comments', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || typeof text !== 'string') return res.status(400).json({ message: 'Text required' });
    const r = await pool.query(
      `INSERT INTO ticket_comments (ticket_id, author_id, text)
       VALUES ($1, $2, $3)
       RETURNING id, ticket_id, author_id, text, created_at, updated_at`,
      [req.params.id, req.userId, text.trim()]
    );
    const row = r.rows[0];
    const u = await pool.query('SELECT name FROM users WHERE id = $1', [row.author_id]);
    res.status(201).json({
      id: row.id,
      ticketId: row.ticket_id,
      authorId: row.author_id,
      author: u.rows[0]?.name ?? '',
      text: row.text,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (err) {
    if (err.code === '23503') return res.status(404).json({ message: 'Ticket not found' });
    console.error('Comment create error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/comments/:cid', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || typeof text !== 'string') return res.status(400).json({ message: 'Text required' });
    const r = await pool.query(
      `UPDATE ticket_comments SET text = $1, updated_at = now()
       WHERE id = $2 AND ticket_id = $3 AND author_id = $4
       RETURNING id, ticket_id, author_id, text, created_at, updated_at`,
      [text.trim(), req.params.cid, req.params.id, req.userId]
    );
    const row = r.rows[0];
    if (!row) return res.status(404).json({ message: 'Comment not found' });
    const u = await pool.query('SELECT name FROM users WHERE id = $1', [row.author_id]);
    res.json({
      id: row.id,
      ticketId: row.ticket_id,
      authorId: row.author_id,
      author: u.rows[0]?.name ?? '',
      text: row.text,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (err) {
    console.error('Comment update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id/comments/:cid', async (req, res) => {
  try {
    const r = await pool.query(
      'DELETE FROM ticket_comments WHERE id = $1 AND ticket_id = $2 RETURNING id',
      [req.params.cid, req.params.id]
    );
    if (r.rowCount === 0) return res.status(404).json({ message: 'Comment not found' });
    res.status(204).send();
  } catch (err) {
    console.error('Comment delete error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
