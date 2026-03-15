-- Optional: Backfill escalation_rules.level1_escalate and level2_escalate to role codes
-- where current value is not a valid role code (e.g. old free text like 'Senior Agent', 'Team Lead').
-- Uses manager (level 1) and admin (level 2) when no matching role code; excludes agent and customer.

UPDATE escalation_rules er
SET
  level1_escalate = CASE
    WHEN EXISTS (SELECT 1 FROM roles WHERE code = er.level1_escalate AND code NOT IN ('agent', 'customer')) THEN er.level1_escalate
    ELSE 'manager'
  END,
  level2_escalate = CASE
    WHEN EXISTS (SELECT 1 FROM roles WHERE code = er.level2_escalate AND code NOT IN ('agent', 'customer')) THEN er.level2_escalate
    ELSE 'admin'
  END
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = er.level1_escalate AND code NOT IN ('agent', 'customer'))
   OR NOT EXISTS (SELECT 1 FROM roles WHERE code = er.level2_escalate AND code NOT IN ('agent', 'customer'));
