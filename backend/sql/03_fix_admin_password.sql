-- Fix admin password so login works with password "admin123".
-- Prefer using the Node script (same bcrypt as API): npm run db:reset-admin
-- Or run this SQL after generating a hash: node scripts/run-sql.cjs sql/03_fix_admin_password.sql
UPDATE users
SET password_hash = '$2a$10$2YQNKj5fNVk8YGcbsxRjHO9CxX8Ce8IJchdCVAf9cUdszuaNYjtWC'
WHERE LOWER(email) = 'admin@company.com';
