import { Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../middleware';

function toComment(row: any) {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    authorId: row.author_id,
    author: row.author_name,
    text: row.text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listComments(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const r = await pool.query(
    `SELECT c.*, u.name AS author_name FROM ticket_comments c
     JOIN users u ON c.author_id = u.id WHERE c.ticket_id = $1 ORDER BY c.created_at ASC`,
    [id]
  );
  res.json(r.rows.map(toComment));
}

export async function createComment(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { text } = req.body;
  if (!text || !text.trim()) {
    res.status(400).json({ error: 'text required' });
    return;
  }
  const authorId = req.user!.userId;
  const r = await pool.query(
    `INSERT INTO ticket_comments (ticket_id, author_id, text) VALUES ($1, $2, $3) RETURNING *`,
    [id, authorId, text.trim()]
  );
  const row = r.rows[0];
  const withAuthor = await pool.query(
    'SELECT c.*, u.name AS author_name FROM ticket_comments c JOIN users u ON c.author_id = u.id WHERE c.id = $1',
    [row.id]
  );
  res.status(201).json(toComment(withAuthor.rows[0]));
}

export async function updateComment(req: AuthRequest, res: Response): Promise<void> {
  const { id, cid } = req.params;
  const { text } = req.body;
  if (!text || !text.trim()) {
    res.status(400).json({ error: 'text required' });
    return;
  }
  const r = await pool.query(
    `UPDATE ticket_comments SET text = $1 WHERE id = $2 AND ticket_id = $3 RETURNING *`,
    [text.trim(), cid, id]
  );
  const row = r.rows[0];
  if (!row) {
    res.status(404).json({ error: 'Comment not found' });
    return;
  }
  const withAuthor = await pool.query(
    'SELECT c.*, u.name AS author_name FROM ticket_comments c JOIN users u ON c.author_id = u.id WHERE c.id = $1',
    [row.id]
  );
  res.json(toComment(withAuthor.rows[0]));
}

export async function deleteComment(req: AuthRequest, res: Response): Promise<void> {
  const { id, cid } = req.params;
  const r = await pool.query('DELETE FROM ticket_comments WHERE id = $1 AND ticket_id = $2 RETURNING id', [cid, id]);
  if (r.rowCount === 0) {
    res.status(404).json({ error: 'Comment not found' });
    return;
  }
  res.status(204).send();
}
