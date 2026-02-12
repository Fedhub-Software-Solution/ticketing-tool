import { Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../middleware';

export async function getEnterprise(_req: AuthRequest, res: Response): Promise<void> {
  const r = await pool.query('SELECT * FROM enterprise_config ORDER BY id LIMIT 1');
  const row = r.rows[0];
  if (!row) {
    res.json({});
    return;
  }
  res.json({
    companyName: row.company_name,
    legalName: row.legal_name,
    regNumber: row.reg_number,
    taxId: row.tax_id,
    industry: row.industry,
    email: row.email,
    phone: row.phone,
    website: row.website,
    address: row.address,
  });
}

export async function updateEnterprise(req: AuthRequest, res: Response): Promise<void> {
  const {
    companyName,
    legalName,
    regNumber,
    taxId,
    industry,
    email,
    phone,
    website,
    address,
  } = req.body;
  const count = await pool.query('SELECT COUNT(*) FROM enterprise_config');
  if (parseInt(count.rows[0].count, 10) === 0) {
    await pool.query(
      `INSERT INTO enterprise_config (company_name, legal_name, reg_number, tax_id, industry, email, phone, website, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        companyName || null,
        legalName || null,
        regNumber || null,
        taxId || null,
        industry || null,
        email || null,
        phone || null,
        website || null,
        address || null,
      ]
    );
  } else {
    await pool.query(
      `UPDATE enterprise_config SET
       company_name = COALESCE($1, company_name), legal_name = COALESCE($2, legal_name), reg_number = COALESCE($3, reg_number),
       tax_id = COALESCE($4, tax_id), industry = COALESCE($5, industry), email = COALESCE($6, email),
       phone = COALESCE($7, phone), website = COALESCE($8, website), address = COALESCE($9, address)`,
      [
        companyName,
        legalName,
        regNumber,
        taxId,
        industry,
        email,
        phone,
        website,
        address,
      ]
    );
  }
  const updated = await pool.query('SELECT * FROM enterprise_config LIMIT 1');
  const row = updated.rows[0];
  res.json({
    companyName: row.company_name,
    legalName: row.legal_name,
    regNumber: row.reg_number,
    taxId: row.tax_id,
    industry: row.industry,
    email: row.email,
    phone: row.phone,
    website: row.website,
    address: row.address,
  });
}
