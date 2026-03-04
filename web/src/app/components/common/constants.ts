export const ROLE_PERMISSIONS_OPTIONS = [
  'View Tickets',
  'Edit Tickets',
  'Delete Tickets',
  'Assign Tickets',
  'Manage SLA',
  'View Reports',
  'Manage Users',
  'System Settings',
  'Customer Data',
];

export const RESERVED_ROLE_CODES = ['admin', 'manager', 'agent', 'customer'];

export const ROLE_COLORS = {
  admin: 'bg-red-100 text-red-700 border-red-200',
  manager: 'bg-blue-100 text-blue-700 border-blue-200',
  agent: 'bg-green-100 text-green-700 border-green-200',
  customer: 'bg-purple-100 text-purple-700 border-purple-200',
} as const;

export const EMPTY_USER_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: '' as string,
  zone: '',
  branch: '',
  location: '',
  status: 'active' as 'active' | 'inactive',
};

export const EMPTY_ENTERPRISE = {
  companyName: '',
  legalName: '',
  regNumber: '',
  taxId: '',
  industry: '',
  email: '',
  phone: '',
  website: '',
  address: '',
};

/** Target priority values for SLA and escalation (source for dropdowns and validation). */
export const SLA_PRIORITIES = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
] as const;

export type SLAPriorityValue = (typeof SLA_PRIORITIES)[number]['value'];

export const SLA_PRIORITY_COLORS: Record<SLAPriorityValue, string> = {
  urgent: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
};

/** Default SLA priority (medium). */
export const SLA_DEFAULT_PRIORITY = SLA_PRIORITIES.find((p) => p.value === 'medium')!.value;

/** Status (ticket_statuses.code) to dropdown item CSS. */
export const STATUS_COLORS: Record<string, string> = {
  open: 'font-bold text-indigo-600 bg-indigo-50/50 m-1 rounded-lg focus:bg-indigo-100',
  'in-progress': 'font-bold text-violet-600 bg-violet-50/50 m-1 rounded-lg focus:bg-violet-100',
  'on-hold': 'font-bold text-amber-600 bg-amber-50/50 m-1 rounded-lg focus:bg-amber-100',
  resolved: 'font-bold text-emerald-600 bg-emerald-50/50 m-1 rounded-lg focus:bg-emerald-100',
  closed: 'font-bold text-slate-600 bg-slate-100 m-1 rounded-lg focus:bg-slate-200',
};

/** Initial form state for create/edit SLA. */
export const SLA_INITIAL_FORM = {
  name: '',
  priority: SLA_DEFAULT_PRIORITY as SLAPriorityValue,
  responseTime: 60,
  resolutionTime: 480,
} as const;

export type SLAFormData = {
  name: string;
  priority: SLAPriorityValue;
  responseTime: number;
  resolutionTime: number;
};

/** Empty state message for SLA list/table. */
export const SLA_EMPTY_MESSAGE =
  'No SLA policies found. Try adjusting your filters or create a new policy.';
