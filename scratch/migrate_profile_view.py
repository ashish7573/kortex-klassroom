import os

def replace_in_file(filepath, old, new):
    with open(filepath, 'r') as f:
        content = f.read()
    content = content.replace(old, new)
    with open(filepath, 'w') as f:
        f.write(content)

org_profile = 'kortex_users/org_admin/tabs/ProfileView.tsx'
with open(org_profile, 'r') as f:
    org_content = f.read()
org_content = org_content.replace(
    "        phone: formData.phone.trim(),\n        contact_number: formData.phone.trim()",
    "        phone: formData.phone.trim()"
)
with open(org_profile, 'w') as f:
    f.write(org_content)

