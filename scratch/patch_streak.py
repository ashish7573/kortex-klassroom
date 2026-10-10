import os

path = 'app/actions/student.ts'
with open(path, 'r') as f:
    content = f.read()

old_logic = """       if (lastActive) {
         const lastDate = new Date(lastActive);
         const diffTime = Math.abs(today.getTime() - lastDate.getTime());
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
         if (diffDays === 1) {"""

new_logic = """       if (lastActive) {
         // Strictly compare just the dates at midnight UTC to prevent timezone/hour shifting
         const todayDate = new Date(dateString);
         const lastDate = new Date(lastActive);
         const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
         const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
         
         if (diffDays === 1) {"""

content = content.replace(old_logic, new_logic)

with open(path, 'w') as f:
    f.write(content)

