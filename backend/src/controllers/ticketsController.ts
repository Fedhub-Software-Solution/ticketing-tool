import { Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../middleware';
import { createNotification } from './notificationsController';
import { sendTicketNotificationEmail, type TicketDetailsForEmail } from '../services/email';

/** Resolve public id (TKT-001) or uuid to internal uuid for DB lookups. */
export async function resolveTicketId(id: string): Promise<string | null> {
  if (/^TKT-\d+$/.test(id)) {
    const r = await pool.query('SELECT id FROM tickets WHERE ticket_number = $1', [id]);
    return r.rows[0]?.id ?? null;
  }
  return id;
}

/** Breach = overdue: not closed/resolved, has SLA due date, past due. Same definition as Dashboard and Overdue Tickets. */
function isBreachedSLA(row: any): boolean {
  if (row.status === 'resolved' || row.status === 'closed' || row.sla_due_date == null) return false;
  return new Date(row.sla_due_date) < new Date();
}

function toTicket(row: any) {
  return {
    id: row.ticket_number ?? row.id,
    ticketNumber: row.ticket_number ?? null,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    category: row.category_name,
    categoryId: row.category_id,
    subCategory: row.sub_category,
    zone: row.zone_name ?? row.zone,
    location: row.location,
    branch: row.branch_name ?? row.branch,
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
    breachedSLA: isBreachedSLA(row),
    parentId: row.parent_id,
    childIds: row.child_ids || [],
  };
}

/** Resolve zone name or code to zone_id. Returns null if not found. */
async function resolveZoneId(zoneNameOrCode: string | undefined): Promise<string | null> {
  if (!zoneNameOrCode) return null;
  const r = await pool.query(
    'SELECT id FROM zones WHERE (name = $1 OR code = $1) AND is_active = true LIMIT 1',
    [zoneNameOrCode.trim()]
  );
  return r.rows[0]?.id ?? null;
}

/** Resolve branch name (and optionally zone) to branch_id. Returns null if not found. */
async function resolveBranchId(branchNameOrCode: string | undefined, zoneId: string | null): Promise<string | null> {
  if (!branchNameOrCode) return null;
  if (zoneId) {
    const r = await pool.query(
      'SELECT id FROM branches WHERE (name = $1 OR code = $1) AND zone_id = $2 AND is_active = true LIMIT 1',
      [branchNameOrCode.trim(), zoneId]
    );
    return r.rows[0]?.id ?? null;
  }
  const r = await pool.query(
    'SELECT id FROM branches WHERE (name = $1 OR code = $1) AND is_active = true LIMIT 1',
    [branchNameOrCode.trim()]
  );
  return r.rows[0]?.id ?? null;
}

/** Treat "none" / "unassigned" / empty as null for UUID columns to avoid invalid input syntax. */
function uuidOrNull(value: string | undefined | null): string | null {
  if (value == null || value === '' || value === 'none' || value === 'unassigned') return null;
  return value;
}

/** Get resolution time in minutes for SLA due calculation. Prefer slaId; fallback to first SLA for priority. */
async function getSlaResolutionMinutes(slaId: string | null, priority: string | null): Promise<number | null> {
  if (slaId) {
    const r = await pool.query('SELECT resolution_time_mins FROM slas WHERE id = $1', [slaId]);
    const mins = r.rows[0]?.resolution_time_mins;
    return typeof mins === 'number' ? mins : null;
  }
  if (priority) {
    const r = await pool.query(
      'SELECT resolution_time_mins FROM slas WHERE priority = $1 ORDER BY created_at ASC LIMIT 1',
      [priority]
    );
    const mins = r.rows[0]?.resolution_time_mins;
    return typeof mins === 'number' ? mins : null;
  }
  return null;
}

/** Compute SLA due date from a base timestamp and resolution minutes. */
function addMinutes(isoOrDate: string | Date, minutes: number): Date {
  const d = new Date(isoOrDate);
  d.setMinutes(d.getMinutes() + minutes);
  return d;
}

/** If ticket has no sla_due_date but has SLA (sla_id or priority), compute and optionally persist. Mutates row. */
async function ensureSlaDueDate(row: any, persist: boolean): Promise<void> {
  if (row.sla_due_date != null) return;
  const mins = await getSlaResolutionMinutes(row.sla_id ?? null, row.priority ?? null);
  if (mins == null || mins < 0) return;
  const due = addMinutes(row.created_at, mins);
  row.sla_due_date = due;
  if (persist && row.id) {
    await pool.query('UPDATE tickets SET sla_due_date = $1 WHERE id = $2', [due, row.id]);
  }
}

export async function listTickets(req: AuthRequest, res: Response): Promise<void> {
  const { status, priority, zone, assignedTo, createdAfter, createdBefore, limit = '50', offset = '0' } = req.query;
  let sql = `
    SELECT t.*, c.name AS category_name,
           z.name AS zone_name, b.name AS branch_name,
           u1.name AS assigned_to_name, u2.name AS created_by_name,
           (SELECT array_agg(child.id) FROM tickets child WHERE child.parent_id = t.id) AS child_ids
    FROM tickets t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN zones z ON t.zone_id = z.id
    LEFT JOIN branches b ON t.branch_id = b.id
    LEFT JOIN users u1 ON t.assigned_to_id = u1.id
    LEFT JOIN users u2 ON t.created_by_id = u2.id
    WHERE 1=1`;
  const params: any[] = [];
  let i = 1;
  // Non-admin users see only tickets assigned to them
  if (req.user && req.user.role !== 'admin') {
    sql += ` AND t.assigned_to_id = $${i++}`;
    params.push(req.user.userId);
  }
  if (status) {
    sql += ` AND t.status = $${i++}`;
    params.push(status);
  }
  if (priority) {
    sql += ` AND t.priority = $${i++}`;
    params.push(priority);
  }
  if (zone) {
    const zoneId = await resolveZoneId(zone as string);
    if (zoneId) {
      sql += ` AND t.zone_id = $${i++}`;
      params.push(zoneId);
    }
  }
  if (assignedTo && req.user?.role === 'admin') {
    sql += ` AND t.assigned_to_id = $${i++}`;
    params.push(assignedTo);
  }
  if (createdAfter) {
    sql += ` AND t.created_at >= $${i++}`;
    params.push(createdAfter);
  }
  if (createdBefore) {
    sql += ` AND t.created_at <= $${i++}`;
    params.push(createdBefore);
  }
  sql += ` ORDER BY t.updated_at DESC LIMIT $${i++} OFFSET $${i}`;
  params.push(parseInt(limit as string, 10) || 50, parseInt(offset as string, 10) || 0);

  const r = await pool.query(sql, params);
  for (const row of r.rows) {
    await ensureSlaDueDate(row, true);
  }
  res.json(r.rows.map(toTicket));
}

export async function getTicket(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const ticketId = await resolveTicketId(id);
  if (!ticketId) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }
  const r = await pool.query(
    `SELECT t.*, c.name AS category_name,
            z.name AS zone_name, b.name AS branch_name,
            u1.name AS assigned_to_name, u2.name AS created_by_name,
            (SELECT array_agg(child.id) FROM tickets child WHERE child.parent_id = t.id) AS child_ids
     FROM tickets t
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN zones z ON t.zone_id = z.id
     LEFT JOIN branches b ON t.branch_id = b.id
     LEFT JOIN users u1 ON t.assigned_to_id = u1.id
     LEFT JOIN users u2 ON t.created_by_id = u2.id
     WHERE t.id = $1`,
    [ticketId]
  );
  const row = r.rows[0];
  if (!row) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }
  // Non-admin may only view tickets assigned to them
  if (req.user && req.user.role !== 'admin' && row.assigned_to_id !== req.user.userId) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }
  await ensureSlaDueDate(row, true);
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
    requesterId,
    assignedToId,
    slaId,
    slaDueDate,
    tags,
    parentId,
  } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ error: 'title required' });
    return;
  }
  if (!description || typeof description !== 'string' || !description.trim()) {
    res.status(400).json({ error: 'description required' });
    return;
  }
  if (!categoryId) {
    res.status(400).json({ error: 'categoryId required' });
    return;
  }
  if (!zone) {
    res.status(400).json({ error: 'zone required' });
    return;
  }
  if (!branch) {
    res.status(400).json({ error: 'branch required' });
    return;
  }
  const createdById = req.user!.userId;
  const zoneId = await resolveZoneId(zone);
  const branchId = await resolveBranchId(branch, zoneId);
  if (!zoneId) {
    res.status(400).json({ error: 'invalid zone' });
    return;
  }
  if (!branchId) {
    res.status(400).json({ error: 'invalid branch' });
    return;
  }

  // Auto-assign: when no assignee provided, assign to a random agent in the selected branch
  let effectiveAssignedToId = assignedToId;
  if (!effectiveAssignedToId && branchId) {
    const agentRow = await pool.query(
      `SELECT id FROM users WHERE role = $1 AND branch_id = $2 AND status::text = 'active' ORDER BY RANDOM() LIMIT 1`,
      ['agent', branchId]
    );
    if (agentRow.rows[0]) effectiveAssignedToId = agentRow.rows[0].id;
  }

  const nextNum = await pool.query("SELECT nextval('ticket_number_seq') AS n");
  const n = nextNum.rows[0]?.n ?? 1;
  const ticketNumber = 'TKT-' + String(n).padStart(3, '0');

  const r = await pool.query(
    `INSERT INTO tickets (ticket_number, title, description, status, priority, category_id, sub_category, zone_id, location, branch_id, branch_code, assigned_to_id, created_by_id, sla_id, sla_due_date, tags, parent_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
    [
      ticketNumber,
      title,
      description || null,
      status,
      priority,
      uuidOrNull(categoryId),
      subCategory === 'none' || subCategory === '' ? null : subCategory || null,
      zoneId,
      location || null,
      branchId,
      branchCode || null,
      uuidOrNull(effectiveAssignedToId),
      createdById,
      uuidOrNull(slaId),
      slaDueDate || null,
      Array.isArray(tags) ? tags : [],
      uuidOrNull(parentId),
    ]
  );
  const row = r.rows[0];
  // Set SLA due date from SLA resolution time (slaId or priority)
  const resolutionMins = await getSlaResolutionMinutes(uuidOrNull(slaId), priority || null);
  if (resolutionMins != null && resolutionMins >= 0) {
    const dueDate = addMinutes(row.created_at, resolutionMins);
    await pool.query('UPDATE tickets SET sla_due_date = $1 WHERE id = $2', [dueDate, row.id]);
  }
  const full = await pool.query(
    `SELECT t.*, c.name AS category_name, z.name AS zone_name, b.name AS branch_name,
            u1.name AS assigned_to_name, u2.name AS created_by_name, u2.email AS created_by_email, '{}' AS child_ids
     FROM tickets t
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN zones z ON t.zone_id = z.id
     LEFT JOIN branches b ON t.branch_id = b.id
     LEFT JOIN users u1 ON t.assigned_to_id = u1.id
     LEFT JOIN users u2 ON t.created_by_id = u2.id
     WHERE t.id = $1`,
    [row.id]
  );
  const ticketPayload = full.rows[0];
  const createdByName = ticketPayload?.created_by_name || 'Customer';
  const createdByEmail = ticketPayload?.created_by_email ?? undefined;
  const ticketTitle = row.title || row.id;

  // Notify users whose role is in the notify list (all role codes except customer and agent)
  const { getRoleCodes } = await import('../lib/roleEnums');
  const roleCodes = await getRoleCodes();
  const notifyRoles = roleCodes.filter((r) => r !== 'customer' && r !== 'agent');
  const notifyUsers = await pool.query(
    `SELECT id FROM users WHERE role = ANY($1) AND status::text = 'active' AND id != $2`,
    [notifyRoles.length ? notifyRoles : ['admin', 'manager'], createdById]
  );
  for (const u of notifyUsers.rows) {
    createNotification(
      u.id,
      'new_ticket',
      'New ticket created',
      `${ticketTitle} created by ${createdByName}`,
      row.id
    ).catch((err) => {
      console.error('Failed to create new-ticket notification for user', u.id, err.message);
    });
  }

  // Email: requester (person ticket is for), assignee, and creator (if different)
  const ticketDetails: TicketDetailsForEmail = {
    ticketId: row.ticket_number ?? row.id,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status,
    priority: row.priority,
    category: ticketPayload?.category_name ?? undefined,
    subCategory: row.sub_category ?? undefined,
    zone: ticketPayload?.zone_name ?? undefined,
    branch: ticketPayload?.branch_name ?? undefined,
    location: row.location ?? undefined,
    createdBy: ticketPayload?.created_by_name ?? undefined,
    createdByEmail: requesterId && requesterId !== row.created_by_id ? createdByEmail : undefined,
    assignedTo: ticketPayload?.assigned_to_name ?? undefined,
    slaDueDate: row.sla_due_date ? new Date(row.sla_due_date).toISOString() : undefined,
  };
  const recipientIds = [
    requesterId || row.created_by_id,
    row.assigned_to_id,
    row.created_by_id,
  ].filter(Boolean) as string[];
  const uniqIds = [...new Set(recipientIds)];
  let emailSent = false;
  let emailError: string | undefined;
  if (uniqIds.length > 0) {
    // Build query with explicit UUID params to avoid driver/ANY casting issues
    const placeholders = uniqIds.map((_, i) => `$${i + 1}::uuid`).join(', ');
    const users = await pool.query(
      `SELECT id, name, email FROM users WHERE id IN (${placeholders}) AND email IS NOT NULL AND LENGTH(TRIM(email)) > 0`,
      uniqIds
    );
    if (users.rows.length === 0) {
      emailError = 'No recipient emails found. Ensure the requester and assigned user have an email address in their profile.';
      console.warn('[email] Ticket created: no users with email found for ids', uniqIds);
    } else {
      for (const u of users.rows) {
        const isAssignee = row.assigned_to_id && u.id === row.assigned_to_id;
        const result = await sendTicketNotificationEmail(
          u.email,
          u.name || 'User',
          ticketDetails,
          'created',
          isAssignee ? 'assignee' : 'requester'
        );
        if (result.sent) emailSent = true;
        else if (!emailError) emailError = result.reason;
      }
    }
  } else {
    emailError = 'No requester or assignee to send notification to.';
  }

  const response = toTicket(ticketPayload) as Record<string, unknown>;
  response.emailSent = emailSent;
  if (emailError) response.emailError = emailError;
  res.status(201).json(response);
}

export async function updateTicket(req: AuthRequest, res: Response): Promise<void> {
  const { id: idParam } = req.params;
  const id = await resolveTicketId(idParam);
  if (!id) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }
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
  const zoneId = zone !== undefined ? await resolveZoneId(zone) : undefined;
  const branchId = branch !== undefined ? await resolveBranchId(branch, zoneId ?? null) : undefined;

  const updates: string[] = [];
  const values: any[] = [];
  let i = 1;
  const map: Record<string, any> = {
    title,
    description,
    status,
    priority,
    category_id: categoryId !== undefined ? uuidOrNull(categoryId) : undefined,
    sub_category: subCategory !== undefined ? (subCategory === 'none' || subCategory === '' ? null : subCategory) : undefined,
    zone_id: zoneId !== undefined ? zoneId : undefined,
    location,
    branch_id: branchId !== undefined ? branchId : undefined,
    branch_code: branchCode,
    assigned_to_id: assignedToId !== undefined ? uuidOrNull(assignedToId) : undefined,
    sla_id: slaId !== undefined ? uuidOrNull(slaId) : undefined,
    sla_due_date: slaDueDate,
    escalation_level: escalationLevel,
    escalated_to: escalatedTo,
    breached_sla: breachedSLA,
    tags: tags != null ? (Array.isArray(tags) ? tags : [tags]) : undefined,
    parent_id: parentId !== undefined ? uuidOrNull(parentId) : undefined,
  };
  // Recompute SLA due date when SLA or priority changes (from ticket created_at + SLA resolution time)
  if (slaId !== undefined || priority !== undefined) {
    const cur = await pool.query('SELECT created_at, sla_id, priority FROM tickets WHERE id = $1', [id]);
    const ticketRow = cur.rows[0];
    if (ticketRow) {
      const effSlaId = slaId !== undefined ? uuidOrNull(slaId) : ticketRow.sla_id;
      const effPriority = priority !== undefined ? priority : ticketRow.priority;
      const resolutionMins = await getSlaResolutionMinutes(effSlaId, effPriority);
      if (resolutionMins != null && resolutionMins >= 0) {
        map.sla_due_date = addMinutes(ticketRow.created_at, resolutionMins);
      }
    }
  }
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
  let previousAssignedToId: string | null = null;
  if (assignedToId !== undefined) {
    const cur = await pool.query('SELECT assigned_to_id FROM tickets WHERE id = $1', [id]);
    previousAssignedToId = cur.rows[0]?.assigned_to_id ?? null;
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
  if (assignedToId && assignedToId !== previousAssignedToId && assignedToId !== req.user!.userId) {
    const ticketTitle = row.title || id;
    createNotification(
      assignedToId,
      'assignment',
      'New ticket assigned',
      `${ticketTitle} has been assigned to you`,
      id
    ).catch(() => {});
  }
  const full = await pool.query(
    `SELECT t.*, c.name AS category_name, z.name AS zone_name, b.name AS branch_name,
            u1.name AS assigned_to_name, u2.name AS created_by_name,
            (SELECT array_agg(child.id) FROM tickets child WHERE child.parent_id = t.id) AS child_ids
     FROM tickets t
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN zones z ON t.zone_id = z.id
     LEFT JOIN branches b ON t.branch_id = b.id
     LEFT JOIN users u1 ON t.assigned_to_id = u1.id
     LEFT JOIN users u2 ON t.created_by_id = u2.id
     WHERE t.id = $1`,
    [id]
  );
  const ticketRow = full.rows[0];

  // Email requester and assigned person with full updated ticket details
  const ticketDetails: TicketDetailsForEmail = {
    ticketId: ticketRow.ticket_number ?? id,
    title: ticketRow.title,
    description: ticketRow.description ?? undefined,
    status: ticketRow.status,
    priority: ticketRow.priority,
    category: ticketRow.category_name ?? undefined,
    subCategory: ticketRow.sub_category ?? undefined,
    zone: ticketRow.zone_name ?? undefined,
    branch: ticketRow.branch_name ?? undefined,
    location: ticketRow.location ?? undefined,
    createdBy: ticketRow.created_by_name ?? undefined,
    assignedTo: ticketRow.assigned_to_name ?? undefined,
    slaDueDate: ticketRow.sla_due_date ? new Date(ticketRow.sla_due_date).toISOString() : undefined,
  };
  const recipientIds = [ticketRow.created_by_id, ticketRow.assigned_to_id].filter(Boolean) as string[];
  const uniqIds = [...new Set(recipientIds)];
  let emailSent = false;
  let emailError: string | undefined;
  if (uniqIds.length > 0) {
    const placeholders = uniqIds.map((_, i) => `$${i + 1}::uuid`).join(', ');
    const users = await pool.query(
      `SELECT id, name, email FROM users WHERE id IN (${placeholders}) AND email IS NOT NULL AND LENGTH(TRIM(email)) > 0`,
      uniqIds
    );
    if (users.rows.length === 0) {
      emailError = 'No recipient emails found. Ensure the requester and assigned user have an email address in their profile.';
    } else {
      for (const u of users.rows) {
        const isAssignee = ticketRow.assigned_to_id && u.id === ticketRow.assigned_to_id;
        const result = await sendTicketNotificationEmail(
          u.email,
          u.name || 'User',
          ticketDetails,
          'updated',
          isAssignee ? 'assignee' : 'requester'
        );
        if (result.sent) emailSent = true;
        else if (!emailError) emailError = result.reason;
      }
    }
  }
  const response = toTicket(ticketRow) as Record<string, unknown>;
  response.emailSent = emailSent;
  if (emailError) response.emailError = emailError;
  res.json(response);
}

export async function deleteTicket(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const ticketId = await resolveTicketId(id);
  if (!ticketId) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }
  const r = await pool.query('DELETE FROM tickets WHERE id = $1 RETURNING id', [ticketId]);
  if (r.rowCount === 0) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }
  res.status(204).send();
}
