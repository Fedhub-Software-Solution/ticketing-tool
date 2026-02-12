-- Fix admin password so login works with bcryptjs (admin123).
-- Run this if you get 500 on login after an older seed: node scripts/run-sql.js sql/03_fix_admin_password.sql
UPDATE users
SET password_hash = '$2a$10$2YQNKj5fNVk8YGcbsxRjHO9CxX8Ce8IJchdCVAf9cUdszuaNYjtWC'
WHERE email = 'admin@company.com';
