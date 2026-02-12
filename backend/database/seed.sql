-- Optional seed data for development. Run after schema.sql
-- For users with real password hashes, run from backend: npx ts-node scripts/seed.ts

-- SLAs (run once; skip if table already has rows)
INSERT INTO slas (name, priority, response_time_mins, resolution_time_mins)
SELECT 'Critical Priority SLA', 'urgent', 15, 240
WHERE NOT EXISTS (SELECT 1 FROM slas LIMIT 1);

INSERT INTO slas (name, priority, response_time_mins, resolution_time_mins)
SELECT 'High Priority SLA', 'high', 60, 480
WHERE NOT EXISTS (SELECT 1 FROM slas WHERE name = 'High Priority SLA');

INSERT INTO slas (name, priority, response_time_mins, resolution_time_mins)
SELECT 'Medium Priority SLA', 'medium', 240, 1440
WHERE NOT EXISTS (SELECT 1 FROM slas WHERE name = 'Medium Priority SLA');

INSERT INTO slas (name, priority, response_time_mins, resolution_time_mins)
SELECT 'Low Priority SLA', 'low', 480, 2880
WHERE NOT EXISTS (SELECT 1 FROM slas WHERE name = 'Low Priority SLA');

-- Zones (run once)
INSERT INTO zones (name, code, manager, is_active)
SELECT 'Chennai', 'CHN', 'Zone Manager Chennai', true
WHERE NOT EXISTS (SELECT 1 FROM zones WHERE code = 'CHN');

INSERT INTO zones (name, code, manager, is_active)
SELECT 'Bangalore', 'BLR', 'Zone Manager Bangalore', true
WHERE NOT EXISTS (SELECT 1 FROM zones WHERE code = 'BLR');

INSERT INTO zones (name, code, manager, is_active)
SELECT 'Mumbai', 'MUM', 'Zone Manager Mumbai', true
WHERE NOT EXISTS (SELECT 1 FROM zones WHERE code = 'MUM');
