import os

def replace_in_file(filepath, old, new):
    with open(filepath, 'r') as f:
        content = f.read()
    content = content.replace(old, new)
    with open(filepath, 'w') as f:
        f.write(content)

# 1. types/user.ts
replace_in_file(
    'types/user.ts',
    "  contact_number: string;",
    "  phone: string;"
)

# 2. app/actions/student.ts
student_ts_path = 'app/actions/student.ts'
with open(student_ts_path, 'r') as f:
    student_content = f.read()

# Fallbacks for reads
student_content = student_content.replace(
    'const parentContact = parentDoc.data()?.contact_number || "";',
    'const parentContact = parentDoc.data()?.phone || parentDoc.data()?.contact_number || "";'
)

# Fix writes
student_content = student_content.replace(
    'contact_number: updateData.contactNumber,',
    'phone: updateData.contactNumber,'
)

# Remove the alias assignment since phone is now the main one
student_content = student_content.replace(
    '''      // Also update the 'phone' alias field if they are kept in sync
      parentUpdateObj.phone = updateData.contactNumber;''',
    ''
)

student_content = student_content.replace(
    "const currentPhone = (currentData?.contact_number || '').replace(/\\s/g, '');",
    "const currentPhone = (currentData?.phone || currentData?.contact_number || '').replace(/\\s/g, '');"
)

with open(student_ts_path, 'w') as f:
    f.write(student_content)

# 3. app/onboarding/verify-phone/page.tsx
replace_in_file(
    'app/onboarding/verify-phone/page.tsx',
    "        contact_number: fullPhoneNumber,\n",
    ""
)

# 4. kortex_users/auth/UnifiedAuthModal.tsx
replace_in_file(
    'kortex_users/auth/UnifiedAuthModal.tsx',
    '          contact_number: "", // Kept for schema backwards compatibility\n',
    ''
)

# 5. kortex_users/parent/ParentDashboard.tsx
dashboard_path = 'kortex_users/parent/ParentDashboard.tsx'
with open(dashboard_path, 'r') as f:
    dash_content = f.read()

# Reads with fallback
dash_content = dash_content.replace(
    "const initialContact = (profile as any).contact_number || '';",
    "const initialContact = profile.phone || (profile as any).contact_number || '';"
)

dash_content = dash_content.replace(
    "!!(profile.full_name && profile.email && profile.contact_number &&",
    "!!(profile.full_name && profile.email && (profile.phone || (profile as any).contact_number) &&"
)

dash_content = dash_content.replace(
    "const originalPhone = (profile.contact_number || '').replace(/\\s/g, '');",
    "const originalPhone = (profile.phone || (profile as any).contact_number || '').replace(/\\s/g, '');"
)

with open(dashboard_path, 'w') as f:
    f.write(dash_content)


# 6. kortex_users/org_admin/tabs/ProfileView.tsx
org_profile = 'kortex_users/org_admin/tabs/ProfileView.tsx'
with open(org_profile, 'r') as f:
    org_content = f.read()
org_content = org_content.replace(
    "        contact_number: formData.phone.trim()\n",
    ""
)
# Note: it was written like this:
#        phone: formData.phone.trim(),
#        contact_number: formData.phone.trim()
# Wait, let's verify ProfileView.tsx before replacing directly.

