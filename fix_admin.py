import re

with open('app/page.tsx', 'r') as f:
    content = f.read()

# Find the return ( ... ); for AdminView
# We know it starts at "return (\n    <div className=\"max-w-7xl mx-auto animate-fade-in space-y-8 pb-20\">"
# and ends with "    </div>\n  );\n};" for the AdminView.

start_str = "return (\n    <div className=\"max-w-7xl mx-auto animate-fade-in space-y-8 pb-20\">"
end_str = "    </div>\n  );\n};"

start_idx = content.find(start_str)
end_idx = content.find(end_str, start_idx) + len(end_str)

admin_view_body = content[start_idx:end_idx]

# Extract the approvals block
approvals_start = admin_view_body.find("{activeTab === 'approvals' && (")
approvals_end = admin_view_body.find("      {/* DATABASE TAB (SYNC TOOL) */}")

approvals_jsx = admin_view_body[approvals_start + len("{activeTab === 'approvals' && ("):approvals_end].strip()
# Remove the trailing ")}"
approvals_jsx = approvals_jsx[:-2].strip()

# Extract the database block
db_start = admin_view_body.find("{activeTab === 'database' && (")
db_end = admin_view_body.rfind("</div>") # the last div before the end of the return
db_jsx = admin_view_body[db_start + len("{activeTab === 'database' && (") : admin_view_body.rfind(")}", db_start)]

db_jsx = db_jsx.strip()

new_return = f"""
  return (
    <KortexAdminDashboard 
      profile={{profile}}
      approvalsNode={{
        {approvals_jsx}
      }}
      systemConfigNode={{
        {db_jsx}
      }}
    />
  );
}};
"""

new_content = content[:start_idx] + new_return + content[end_idx:]

with open('app/page.tsx', 'w') as f:
    f.write(new_content)

print("Replaced!")
