// Concise row types for the tables the client touches (see Supabase schema).
export type Role = 'employee' | 'manager' | 'hr_admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  manager_id: string | null;
  department: string | null;
  job_title: string | null;
  avatar_color: string | null;
  avatar_image_url: string | null;
  frame: string | null;
  status: 'active' | 'invited' | 'disabled';
}

export interface PlayerStateRow {
  user_id: string;
  xp: number;
  level: number;
  energy: number;
  energy_updated_at: string | null;
  title_ar: string | null;
  coins: number;
  streak: number;
  last_active_day: string | null;
  character_tint: string | null;
  frame: string | null;
  current_rung: number;
  promotion_pending: boolean;
  daily: Record<string, unknown>;
  onboarding: Record<string, unknown>;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title_ar: string;
  body_ar: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface AssignmentRow {
  id: string;
  assigner_id: string;
  assignee_id: string;
  type: 'assessment' | 'task' | 'quest' | 'goal';
  ref_id: string | null;
  title_ar: string;
  desc_ar: string | null;
  due_date: string | null;
  status: 'assigned' | 'in_progress' | 'submitted' | 'completed' | 'overdue';
  result_id: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface RequestRow {
  id: string;
  requester_id: string;
  type: 'sick_leave' | 'holiday' | 'remote' | 'question' | 'other';
  start_date: string | null;
  end_date: string | null;
  days: number | null;
  reason_ar: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'answered';
  approver_id: string | null;
  response_ar: string | null;
  decided_at: string | null;
  created_at: string;
}

export interface LeaderboardRow {
  id: string;
  full_name: string | null;
  title_ar: string | null;
  department: string | null;
  avatar_color: string | null;
  avatar_image_url: string | null;
  frame: string | null;
  level: number;
  xp: number;
  equipped_pet: string | null;
}
