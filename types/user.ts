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
  is_pro?: boolean; // Global Pro status
  
  // Phase 1: Auth & Onboarding Overhaul fields
  phone?: string | null;
  phoneVerified?: boolean;
  onboardingStatus?: 'PENDING_PHONE' | 'ACTIVE';
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
  phone: string;
  pending_org_approvals?: OrgApprovalRequest[];
  city?: string;
  state?: string;
  country?: string;
}

// 2. Student Profile (Child - created by parent or org admin)
export interface OrgLinkData {
  org_name: string;
  grade: string;
  section?: string | null;
  assigned_combos: string[];
  status: 'pending' | 'approved';
  requested_at?: string;
}

export interface StudentProfile extends BaseUserProfile {
  role: 'student';
  username: string;
  plain_pin?: string;
  // Independent Learner Data (Used if no org, or as a global baseline)
  grade: string;
  section?: string | null;
  active_b2c_licenses: string[]; // Global extra combos bought directly by parent

  // Freemium Engine Data
  hearts_remaining: number;                // Daily stamina (Default 5)
  last_heart_reset: string;                // ISO timestamp of last reset

  // Relationship Data
  parent_id: string;                       // Mandatory parent link
  claim_code?: string;                     // Used during handshakes
  parent_name?: string;                    // Parent's name for easy dashboard reads
  parent_email?: string;                   // Parent's email for Org Admins
  emergency_contact?: string | null;       // Emergency contact number
  teacher_ids: string[];                   // Linked teachers across all orgs

  // Multi-Organization Data
  org_ids?: string[];                       // Array of active OR pending org IDs for fast querying
  org_links?: {                            // Detailed mapping per org
    [orgId: string]: OrgLinkData
  };
  is_pro?: boolean;

  // Gamification & Progress
  current_streak_days?: number;
  last_active_date?: string;
  total_xp?: number;
  achievements?: string[];
}

export interface SubjectProgress {
  subject_id: string;              
  xp: number;                      
  total_time_spent_seconds: number;
  completed_tools: {
    [toolId: string]: {
      chapter_name: string;
      last_played_at: string;
      times_completed: number;
      best_score?: number;         
    }
  };
  last_played_at: string;
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
  address?: string;
  phone?: string;
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

export interface TeacherComboData {
  id?: string;
  orgId: string;
  comboId: string;
  gradeStr: string;
  subjectStr: string;
  comboLabel: string;
  orgName: string;
  totalCurriculumTools: number;
  totalToolsAssigned: number;
  grade?: string;
  subject?: string;
  label?: string;
}

export interface ClassStudentData {
  uid: string;
  name?: string;
  fullName?: string;
  pin?: string;
  kortexId?: string;
  avatar?: string;
  completedToolsCount: number;
  totalTools: number;
  progressPercentage: number;
  isPro?: boolean;
  hearts?: number;
}

export interface CreateAssignmentPayload {
  comboId: string;
  orgId: string;
  toolId?: string;
  toolType: string;
  toolTitle?: string;
  chapterName?: string;
  assignedStudentIds?: string[];
  assignedTo?: string[];
  dueDate: string;
  instructions: string;
  title?: string;
  externalLink?: string;
}
