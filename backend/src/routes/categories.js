import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.use(requireAuth);

function categoryToResponse(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    icon: row.icon ?? undefined,
    color: row.color ?? undefined,
    slaId: row.sla_id ?? undefined,
    parentId: row.parent_id ?? undefined,
    isActive: row.is_active ?? true,
  };
}

router.get('/', async (_req, res) => {
  try {
    const r = await pool.query(
      'SELECT id, name, description, icon, color, sla_id, parent_id, is_active FROM categories ORDER BY name'
    );
    res.json(r.rows.map(categoryToResponse));
  } catch (err) {
    console.error('Categories list error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, icon, color, slaId, parentId, isActive = true } = req.body || {};
    if (!name) return res.status(400).json({ message: 'Name required' });
    const r = await pool.query(
      `INSERT INTO categories (name, description, icon, color, sla_id, parent_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, description, icon, color, sla_id, parent_id, is_active`,
      [name, description ?? null, icon ?? null, color ?? null, slaId ?? null, parentId ?? null, isActive]
    );
    res.status(201).json(categoryToResponse(r.rows[0]));
  } catch (err) {
    console.error('Category create error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const body = req.body || {};
    const updates = [];
    const values = [];
    let i = 1;
    ['name', 'description', 'icon', 'color', 'slaId', 'parentId', 'isActive'].forEach(key => {
      if (body[key] === undefined) return;
      const col = key === 'slaId' ? 'sla_id' : key === 'parentId' ? 'parent_id' : key === 'isActive' ? 'is_active' : key;
      updates.push(`${col} = $${i++}`);
      values.push(body[key]);
    });
    if (updates.length === 0) {
      const r = await pool.query(
        'SELECT id, name, description, icon, color, sla_id, parent_id, is_active FROM categories WHERE id = $1',
        [req.params.id]
      );
      const row = r.rows[0];
      if (!row) return res.status(404).json({ message: 'Category not found' });
      return res.json(categoryToResponse(row));
    }
    values.push(req.params.id);
    const r = await pool.query(
      `UPDATE categories SET ${updates.join(', ')} WHERE id = $${i} RETURNING id, name, description, icon, color, sla_id, parent_id, is_active`,
      values
    );
    if (r.rowCount === 0) return res.status(404).json({ message: 'Category not found' });
    res.json(categoryToResponse(r.rows[0]));
  } catch (err) {
    console.error('Category update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [req.params.id]);
    if (r.rowCount === 0) return res.status(404).json({ message: 'Category not found' });
    res.status(204).send();
  } catch (err) {
    if (err.code === '23503') return res.status(400).json({ message: 'Category in use by tickets' });
    console.error('Category delete error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
