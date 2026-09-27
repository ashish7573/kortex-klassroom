import re

with open('app/page.tsx', 'r') as f:
    content = f.read()

# Find the start of AdminView
pattern = r"const AdminView = \(\{ profile \}: any\) => \{[\s\S]*?\n};\n"
new_content = re.sub(pattern, "", content)

if new_content != content:
    with open('app/page.tsx', 'w') as f:
        f.write(new_content)
    print("Deleted AdminView from page.tsx")
else:
    print("Regex failed to match AdminView")
