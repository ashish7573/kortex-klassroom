export type UserRole = 
  | 'parent' 
  | 'student' 
  | 'teacher' 
  | 'org_admin' 
  | 'krew' 
  | 'admin';

export type UserStatus = 'active' | 'suspended' | 'pending';

export interface BaseUserProfile {
  uid: string;
  kortex_id?: string;             // Custom unique human-readable ID
  email?: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at?: string;
  session_token?: string;
  status: UserStatus;
  avatar?: string;
  has_completed_onboarding?: boolean; // Used for first-login guards
}

export interface OrgApprovalRequest {
  org_id: string;
  student_id: string;
  org_name: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

// 1. Parent Profile (Can self-register and manage children accounts)
export interface ParentProfile extends BaseUserProfile {
  role: 'parent';
  children_ids: string[];
  pending_org_approvals?: OrgApprovalRequest[];
}

// 2. Student Profile (Child - created by parent or org admin)
export interface StudentProfile extends BaseUserProfile {
  role: 'student';
  username: string;
  grade: string;
  parent_id: string;                       // Mandatory parent link
  org_id?: string | null;                 // Optional school/organization link
  teacher_ids: string[];                   // Linked teachers
  org_approval_status: 'none' | 'pending' | 'approved';
  is_pro?: boolean;
}

// 3. Teacher Profile (Provisioned by Org Admin or Super Admin)
export interface TeacherProfile extends BaseUserProfile {
  role: 'teacher';
  org_id: string;
  assigned_combos: string[];
  assigned_student_ids: string[];
}

// 4. Organization Admin Profile (Schools, Academies, Institutions)
export interface OrgAdminProfile extends BaseUserProfile {
  role: 'org_admin';
  organization_name: string;
  org_type?: 'school' | 'coaching' | 'ngo' | 'other';
  license_quota: number;
  active_students_count: number;
  teacher_ids: string[];
  approved_grade_subject_combos?: string[];
  agreement_url?: string;
  invoice_url?: string;
  subscription_end_date?: string | null;
}

// 5. Krew Profile (Content creators / internal contributors)
export interface KrewProfile extends BaseUserProfile {
  role: 'krew';
  permissions: string[];
}

// 6. Super Admin Profile (System administrators)
export interface AdminProfile extends BaseUserProfile {
  role: 'admin';
  is_super_admin: true;
}

// Discriminated Union for exhaustive type checking
export type UserProfile = 
  | ParentProfile 
  | StudentProfile 
  | TeacherProfile 
  | OrgAdminProfile 
  | KrewProfile 
  | AdminProfile;

// B2B Contact / Quote Inquiry Model
export interface QuoteInquiry {
  id?: string;
  organization_name: string;
  contact_person: string;
  email: string;
  phone?: string;
  org_type: 'school' | 'coaching' | 'ngo' | 'other';
  estimated_students: number;
  message?: string;
  status: 'new' | 'contacted' | 'quoted' | 'account_created' | 'archived';
  created_at: string;
}
