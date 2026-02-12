/**
 * Map DB row (snake_case) to API response (camelCase) for consistent JSON.
 */
export function toCamel(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

export function mapRow(row) {
  if (!row || typeof row !== 'object') return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    out[toCamel(k)] = v;
  }
  return out;
}

export function mapRows(rows) {
  return Array.isArray(rows) ? rows.map(mapRow) : [];
}
