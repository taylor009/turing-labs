// Database types matching the Supabase schema

export type UserRole = 'ADMIN' | 'PRODUCT_MANAGER' | 'STAKEHOLDER';
export type ProposalStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
export type StakeholderStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Proposal {
  id: string;
  product_name: string;
  current_cost: number;
  category: string;
  formulation: string;
  status: ProposalStatus;
  created_at: string;
  updated_at: string;
  created_by: string;
  business_objectives: string[];
  priority_objectives: Array<{
    objective: string;
    priority: string;
  }>;
  constraints: {
    [category: string]: string[];
  };
  acceptable_changes: string[];
  not_acceptable_changes: string[];
  feasibility_limits: string[];
}

export interface Stakeholder {
  id: string;
  proposal_id: string;
  user_id: string;
  status: StakeholderStatus;
  invited_at: string;
  responded_at: string | null;
  comments: string | null;
}

export interface Approval {
  id: string;
  proposal_id: string;
  user_id: string;
  status: ApprovalStatus;
  comments: string | null;
  created_at: string;
  updated_at: string;
}

export interface RefreshToken {
  id: string;
  token: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

// Extended types with relations
export interface ProposalWithRelations extends Proposal {
  creator: Pick<User, 'id' | 'name' | 'email'>;
  stakeholders?: StakeholderWithUser[];
  approvals?: ApprovalWithUser[];
}

export interface StakeholderWithUser extends Stakeholder {
  user: Pick<User, 'id' | 'name' | 'email' | 'role'>;
}

export interface ApprovalWithUser extends Approval {
  user: Pick<User, 'id' | 'name' | 'email' | 'role'>;
}

// Form types
export interface ProposalFormData {
  product_name: string;
  current_cost: number;
  category: string;
  formulation: string;
  business_objectives: string[];
  priority_objectives: Array<{
    objective: string;
    priority: string;
  }>;
  constraints: {
    [category: string]: string[];
  };
  acceptable_changes: string[];
  not_acceptable_changes: string[];
  feasibility_limits: string[];
}