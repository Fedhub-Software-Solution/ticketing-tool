import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const ENTERPRISE_ID = '00000000-0000-0000-0000-000000000001';

function configToResponse(row) {
  if (!row) return {};
  return {
    companyName: row.company_name ?? undefined,
    legalName: row.legal_name ?? undefined,
    regNumber: row.reg_number ?? undefined,
    taxId: row.tax_id ?? undefined,
    industry: row.industry ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    address: row.address ?? undefined,
  };
}

router.get('/', async (_req, res) => {
  try {
    const r = await pool.query(
      'SELECT company_name, legal_name, reg_number, tax_id, industry, email, phone, website, address FROM enterprise_config WHERE id = $1',
      [ENTERPRISE_ID]
    );
    res.json(configToResponse(r.rows[0] || {}));
  } catch (err) {
    console.error('Enterprise get error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/', async (req, res) => {
  try {
    const body = req.body || {};
    const cols = ['company_name', 'legal_name', 'reg_number', 'tax_id', 'industry', 'email', 'phone', 'website', 'address'];
    const updates = [];
    const values = [];
    let i = 1;
    cols.forEach(col => {
      const key = col.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      if (body[key] !== undefined) {
        updates.push(`${col} = $${i++}`);
        values.push(body[key]);
      }
    });
    if (updates.length > 0) {
      values.push(ENTERPRISE_ID);
      await pool.query(
        `UPDATE enterprise_config SET ${updates.join(', ')} WHERE id = $${i}`,
        values
      );
    }
    const r = await pool.query(
      'SELECT company_name, legal_name, reg_number, tax_id, industry, email, phone, website, address FROM enterprise_config WHERE id = $1',
      [ENTERPRISE_ID]
    );
    res.json(configToResponse(r.rows[0] || {}));
  } catch (err) {
    console.error('Enterprise update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
