/**
 * Reset admin@company.com password to "admin123" using the same bcrypt as the API.
 * Run from backend: node scripts/reset-admin-password.cjs
 */
require('dotenv').config();
const pg = require('pg');
const bcrypt = require('bcrypt');

const ADMIN_EMAIL = 'admin@company.com';
const NEW_PASSWORD = 'admin123';

async function main() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/ticketing_tool';
  const hash = await bcrypt.hash(NEW_PASSWORD, 10);
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();
    const r = await client.query(
      "UPDATE users SET password_hash = $1 WHERE LOWER(email) = LOWER($2) RETURNING id, name, email, role",
      [hash, ADMIN_EMAIL]
    );
    if (r.rowCount === 0) {
      console.error('No user found with email:', ADMIN_EMAIL);
      console.error('Create an admin user first (e.g. run sql/02_seed.sql).');
      process.exit(1);
    }
    console.log('Admin password reset successfully.');
    console.log('User:', r.rows[0].name, r.rows[0].email, '| Role:', r.rows[0].role);
    console.log('Login with password:', NEW_PASSWORD);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
