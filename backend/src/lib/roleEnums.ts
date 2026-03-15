import { pool } from '../db';

let cachedRoleCodes: string[] | null = null;

/**
 * Get all role codes from the roles table (single source of truth).
 * Used for validation and listing; cached until process restarts.
 */
export async function getRoleCodes(): Promise<string[]> {
  if (cachedRoleCodes) return cachedRoleCodes;
  const r = await pool.query('SELECT code FROM roles ORDER BY name');
  cachedRoleCodes = r.rows.map((row: { code: string }) => row.code);
  return cachedRoleCodes;
}

/**
 * Invalidate cached role codes (e.g. after creating/deleting a role).
 */
export function invalidateRoleCodesCache(): void {
  cachedRoleCodes = null;
}

/**
 * Load permissions for a user role from the roles table (code = user.role).
 * Returns empty array if no matching role row.
 */
export async function getPermissionsForRole(roleCode: string): Promise<string[]> {
  const r = await pool.query(
    'SELECT permissions FROM roles WHERE code = $1 LIMIT 1',
    [roleCode]
  );
  const row = r.rows[0];
  if (!row || !Array.isArray(row.permissions)) return [];
  return row.permissions;
}
