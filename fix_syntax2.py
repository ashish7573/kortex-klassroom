with open('components/users/admin/ProvisionOrgModal.tsx', 'r') as f:
    content = f.read()

content = content.replace("</div>\n    </div>\n    ),\n    document.body\n  );\n}", "</div>\n    </div>,\n    document.body\n  );\n}")

with open('components/users/admin/ProvisionOrgModal.tsx', 'w') as f:
    f.write(content)
print("Syntax 2 fixed")
