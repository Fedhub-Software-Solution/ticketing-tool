import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { pool } from '../db';
import { config } from '../config';
import { AuthRequest } from '../middleware';
import { resolveTicketId } from './ticketsController';

const UPLOAD_BASE = config.uploadDir;

export async function listAttachments(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const ticketId = await resolveTicketId(id);
  if (!ticketId) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }
  const r = await pool.query(
    `SELECT id, ticket_id, file_name, file_size, file_type, uploaded_at
     FROM ticket_attachments WHERE ticket_id = $1 ORDER BY uploaded_at DESC`,
    [ticketId]
  );
  res.json(r.rows.map((row: any) => ({
    id: row.id,
    ticketId: row.ticket_id,
    fileName: row.file_name,
    fileSize: row.file_size,
    fileType: row.file_type,
    uploadedAt: row.uploaded_at,
  })));
}

export async function uploadAttachment(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const ticketId = await resolveTicketId(id);
  if (!ticketId) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }
  const file = (req as any).file;
  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  const userId = req.user!.userId;
  const relativePath = path.join('tickets', ticketId, file.filename);
  const r = await pool.query(
    `INSERT INTO ticket_attachments (ticket_id, file_name, file_size, file_type, file_path, uploaded_by_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, ticket_id, file_name, file_size, file_type, uploaded_at`,
    [ticketId, file.originalname, file.size, file.mimetype || null, relativePath, userId]
  );
  const row = r.rows[0];
  res.status(201).json({
    id: row.id,
    ticketId: row.ticket_id,
    fileName: row.file_name,
    fileSize: row.file_size,
    fileType: row.file_type,
    uploadedAt: row.uploaded_at,
  });
}

export async function deleteAttachment(req: AuthRequest, res: Response): Promise<void> {
  const { id, attachmentId } = req.params;
  const ticketId = await resolveTicketId(id);
  if (!ticketId) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }
  const r = await pool.query(
    'SELECT file_path FROM ticket_attachments WHERE id = $1 AND ticket_id = $2',
    [attachmentId, ticketId]
  );
  const row = r.rows[0];
  if (!row) {
    res.status(404).json({ error: 'Attachment not found' });
    return;
  }
  const fullPath = path.join(UPLOAD_BASE, row.file_path);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  await pool.query('DELETE FROM ticket_attachments WHERE id = $1 AND ticket_id = $2', [attachmentId, ticketId]);
  res.status(204).send();
}
