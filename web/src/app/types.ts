export type UserRole = 'admin' | 'manager' | 'agent' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  zone?: string;
  branch?: string;
  location?: string;
  status: 'active' | 'inactive';
}

export interface SLA {
  id: string;
  name: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  responseTime: number; // in minutes
  resolutionTime: number; // in minutes
  category?: string;
}

export interface EscalationRule {
  id: string;
  name: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  triggerAfter: number; // in minutes
  level1Escalate: string;
  level2Escalate: string;
  notifyUsers: string[];
  autoEscalate: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  slaId?: string;
  parentId?: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  subCategory?: string;
  zone?: string;
  location?: string;
  branch?: string;
  branchCode?: string;
  assignedTo: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  slaId?: string;
  slaDueDate?: string;
  escalationLevel?: number;
  escalatedTo?: string;
  breachedSLA?: boolean;
  parentId?: string;
  childIds?: string[];
}

export type ViewType = 'dashboard' | 'tickets' | 'ticket-detail' | 'sla-config' | 'escalations' | 'categories' | 'enterprise' | 'escalated-tickets' | 'ticket-tracking' | 'reports' | 'my-open-tickets' | 'my-closed-tickets' | 'my-overdue-tickets' | 'board' | 'create-ticket' | 'users' | 'customer-portal' | 'profile';
