/**
 * Run from backend folder: npx ts-node scripts/seed.ts
 * Creates initial admin and customer users. Requires .env with DATABASE_URL.
 */
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { pool } from '../src/db';

async function run() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const customerHash = await bcrypt.hash('customer123', 10);
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role, zone, branch, location, status)
     VALUES ($1, $2, $3, 'admin', 'South', 'Chennai Main', 'Chennai', 'active')
     ON CONFLICT (email) DO UPDATE SET password_hash = $3`,
    ['Admin User', 'admin@company.com', adminHash]
  );
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role, status)
     VALUES ($1, $2, $3, 'customer', 'active')
     ON CONFLICT (email) DO UPDATE SET password_hash = $3`,
    ['John Customer', 'customer@company.com', customerHash]
  );
  console.log('Seed done. Login: admin@company.com / admin123 or customer@company.com / customer123');
  process.exit(0);
}
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
