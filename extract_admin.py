import re

with open('app/page.tsx', 'r') as f:
    content = f.read()

# We need to extract everything inside const AdminView = ({ profile }: any) => { ... }
start_idx = content.find("const AdminView =")
end_idx = content.find("};\n\n\n\n\n// ============================================================================\n// SECTION 13:")

admin_view_code = content[start_idx:end_idx+2]

with open('admin_view_extracted.txt', 'w') as f:
    f.write(admin_view_code)

print("Extracted to admin_view_extracted.txt")
