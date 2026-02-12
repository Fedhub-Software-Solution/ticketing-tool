export type UserRole = 'admin' | 'manager' | 'agent' | 'customer';
export type UserStatus = 'active' | 'inactive';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed';

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  zone?: string;
  branch?: string;
  location?: string;
  status: UserStatus;
  created_at: Date;
  updated_at: Date;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  zone?: string;
  branch?: string;
  location?: string;
  status: UserStatus;
}

export interface SLARow {
  id: string;
  name: string;
  priority: TicketPriority;
  response_time_mins: number;
  resolution_time_mins: number;
  category?: string;
}

export interface EscalationRuleRow {
  id: string;
  name: string;
  priority: TicketPriority;
  trigger_after_mins: number;
  level1_escalate: string;
  level2_escalate: string;
  notify_users: string[];
  auto_escalate: boolean;
}

export interface CategoryRow {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sla_id?: string;
  parent_id?: string;
  is_active: boolean;
}

export interface TicketRow {
  id: string;
  title: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  category_id?: string;
  sub_category?: string;
  zone?: string;
  location?: string;
  branch?: string;
  branch_code?: string;
  assigned_to_id?: string;
  created_by_id: string;
  sla_id?: string;
  sla_due_date?: Date;
  escalation_level?: number;
  escalated_to?: string;
  breached_sla?: boolean;
  parent_id?: string;
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

export interface TicketCommentRow {
  id: string;
  ticket_id: string;
  author_id: string;
  text: string;
  created_at: Date;
  updated_at: Date;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}
