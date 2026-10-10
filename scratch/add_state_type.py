with open('types/user.ts', 'r') as f:
    content = f.read()

old_interface = """export interface ParentProfile extends BaseUserProfile {
  role: 'parent';
  children_ids: string[];
  contact_number: string;
  pending_org_approvals?: OrgApprovalRequest[];
  city?: string;
  country?: string;
}"""

new_interface = """export interface ParentProfile extends BaseUserProfile {
  role: 'parent';
  children_ids: string[];
  contact_number: string;
  pending_org_approvals?: OrgApprovalRequest[];
  city?: string;
  state?: string;
  country?: string;
}"""

content = content.replace(old_interface, new_interface)

with open('types/user.ts', 'w') as f:
    f.write(content)
