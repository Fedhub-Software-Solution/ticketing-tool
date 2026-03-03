import { SLA, User } from '@/app/types';

// Mock users with different roles and regional assignments
export const mockUsers: User[] = [
  // Admin Users (Access to all zones and branches)
  {
    id: 'USR-001',
    name: 'Admin User',
    email: 'admin@company.com',
    password: 'admin123',
    role: 'admin',
    zone: 'South',
    branch: 'Chennai Main',
    location: 'Chennai',
    status: 'active',
  },
  
  // Technical Support Staff
  {
    id: 'USR-002',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    password: 'password123',
    role: 'manager',
    zone: 'South',
    branch: 'Chennai North',
    location: 'Chennai',
    status: 'active',
  },
  {
    id: 'USR-003',
    name: 'Alex Rivera',
    email: 'alex.rivera@company.com',
    password: 'password123',
    role: 'agent',
    zone: 'South',
    branch: 'Bangalore East',
    location: 'Bangalore',
    status: 'active',
  },
  {
    id: 'USR-004',
    name: 'David Park',
    email: 'david.park@company.com',
    password: 'password123',
    role: 'agent',
    zone: 'West',
    branch: 'Mumbai Central',
    location: 'Mumbai',
    status: 'inactive',
  },
  
  // Customer Success Staff
  {
    id: 'USR-005',
    name: 'Emily Chen',
    email: 'emily.chen@company.com',
    password: 'password123',
    role: 'manager',
    zone: 'South',
    branch: 'Chennai North',
    location: 'Chennai',
    status: 'active',
  },
  {
    id: 'USR-006',
    name: 'Michael Zhang',
    email: 'michael.zhang@company.com',
    password: 'password123',
    role: 'agent',
    zone: 'South',
    branch: 'Hyderabad West',
    location: 'Hyderabad',
    status: 'active',
  },
  
  // Billing & Finance Staff
  {
    id: 'USR-007',
    name: 'Jennifer Martinez',
    email: 'jennifer.martinez@company.com',
    password: 'password123',
    role: 'manager',
    zone: 'North',
    branch: 'Delhi City',
    location: 'Delhi',
    status: 'active',
  },
  {
    id: 'USR-008',
    name: 'Robert Wilson',
    email: 'robert.wilson@company.com',
    password: 'password123',
    role: 'agent',
    zone: 'South',
    branch: 'Chennai North',
    location: 'Chennai',
    status: 'active',
  },
  
  // Product Development Staff
  {
    id: 'USR-009',
    name: 'Lisa Anderson',
    email: 'lisa.anderson@company.com',
    password: 'password123',
    role: 'manager',
    zone: 'South',
    branch: 'Bangalore East',
    location: 'Bangalore',
    status: 'active',
  },
  {
    id: 'USR-010',
    name: 'James Taylor',
    email: 'james.taylor@company.com',
    password: 'password123',
    role: 'agent',
    zone: 'West',
    branch: 'Mumbai Central',
    location: 'Mumbai',
    status: 'active',
  },
  
  // Sales Staff
  {
    id: 'USR-011',
    name: 'Amanda White',
    email: 'amanda.white@company.com',
    password: 'password123',
    role: 'manager',
    zone: 'West',
    branch: 'Pune West',
    location: 'Pune',
    status: 'active',
  },
  {
    id: 'USR-012',
    name: 'Chris Brown',
    email: 'chris.brown@company.com',
    password: 'password123',
    role: 'agent',
    zone: 'South',
    branch: 'Chennai North',
    location: 'Chennai',
    status: 'active',
  },
  
  // Security Staff
  {
    id: 'USR-013',
    name: 'Rachel Green',
    email: 'rachel.green@company.com',
    password: 'password123',
    role: 'manager',
    zone: 'North',
    branch: 'Delhi City',
    location: 'Delhi',
    status: 'active',
  },
  {
    id: 'USR-014',
    name: 'Thomas Anderson',
    email: 'thomas.anderson@company.com',
    password: 'password123',
    role: 'agent',
    zone: 'South',
    branch: 'Hyderabad West',
    location: 'Hyderabad',
    status: 'active',
  },
  
  // Customers
  {
    id: 'USR-015',
    name: 'John Smith',
    email: 'customer@company.com',
    password: 'customer123',
    role: 'customer',
    status: 'active',
  },
  {
    id: 'USR-016',
    name: 'Emma Wilson',
    email: 'emma.customer@company.com',
    password: 'customer123',
    role: 'customer',
    status: 'inactive',
  },
];

// Mock SLA configurations
export const mockSLAs: SLA[] = [
  {
    id: 'SLA-001',
    name: 'Critical Priority SLA',
    priority: 'urgent',
    responseTime: 15, // 15 minutes
    resolutionTime: 240, // 4 hours
  },
  {
    id: 'SLA-002',
    name: 'High Priority SLA',
    priority: 'high',
    responseTime: 60, // 1 hour
    resolutionTime: 480, // 8 hours
  },
  {
    id: 'SLA-003',
    name: 'Medium Priority SLA',
    priority: 'medium',
    responseTime: 240, // 4 hours
    resolutionTime: 1440, // 24 hours
  },
  {
    id: 'SLA-004',
    name: 'Low Priority SLA',
    priority: 'low',
    responseTime: 480, // 8 hours
    resolutionTime: 2880, // 48 hours
  },
];

export const mockDepartments: any[] = [];
