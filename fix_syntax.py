import re

with open('components/users/admin/ProvisionOrgModal.tsx', 'r') as f:
    content = f.read()

# Fix the first error: 
# return createPortal( ... </div> ), document.body);
# -> return createPortal( ... </div>, document.body);
content = content.replace("), document.body);", ", document.body);")

with open('components/users/admin/ProvisionOrgModal.tsx', 'w') as f:
    f.write(content)
print("Syntax fixed")
