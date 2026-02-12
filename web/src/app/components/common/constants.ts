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
