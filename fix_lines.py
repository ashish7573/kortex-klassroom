with open('app/page.tsx', 'r') as f:
    lines = f.readlines()

# Replace lines 2448 to 2451 (0-indexed)
# Wait, the lines were:
# 2449        )}
# 2450
# 2451        {/* DATABASE TAB */}
# 2452        {activeTab === 'database' && (

for i in range(2440, 2460):
    if ")}".strip() in lines[i].strip() and "DATABASE TAB" in lines[i+2]:
        lines[i] = "      }\n"
        lines[i+1] = "      systemConfigNode={\n"
        lines[i+2] = ""
        lines[i+3] = ""
        break

with open('app/page.tsx', 'w') as f:
    f.writelines(lines)

print("Fixed boundaries!")
