import { SLA_PRIORITIES } from './constants';

/** Format minutes as human-readable duration (e.g. 90 → "1h 30m"). Used for SLA display. */
export function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/** Resolve SLA/priority value to its label from SLA_PRIORITIES. */
export function priorityLabel(value: string): string {
  return SLA_PRIORITIES.find((p) => p.value === value)?.label ?? value;
}

export function slugFromName(name: string): string {
  return name
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || '';
}

/** Resolve user enum role to a role code that exists in the list so dropdown shows correct selection. */
export function getRoleCodeForEnum(
  enumRole: string,
  roles: { code: string }[]
): string {
  const exact = roles.find((r) => r.code === enumRole);
  if (exact) return exact.code;
  const c = (enumRole || '').toLowerCase();
  if (c === 'admin') return roles.find((r) => ['administrator', 'admin'].includes(r.code))?.code ?? enumRole;
  if (c === 'manager') return roles.find((r) => ['manager', 'mm'].includes(r.code))?.code ?? enumRole;
  if (c === 'agent') return roles.find((r) => r.code === 'agent' || r.code.startsWith('agent'))?.code ?? enumRole;
  if (c === 'customer') return roles.find((r) => r.code === 'customer' || r.code.startsWith('customer'))?.code ?? enumRole;
  return enumRole;
}
