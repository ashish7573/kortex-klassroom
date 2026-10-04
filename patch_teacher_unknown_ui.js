const fs = require('fs');
let code = fs.readFileSync('kortex_users/teacher/TeacherDashboard.tsx', 'utf8');

code = code.replaceAll(
  `{a.tool_type}`,
  `{a.tool_type === 'unknown' ? 'Task' : a.tool_type}`
);

fs.writeFileSync('kortex_users/teacher/TeacherDashboard.tsx', code);

let classCode = fs.readFileSync('kortex_users/teacher/TeacherClassView.tsx', 'utf8');
classCode = classCode.replaceAll(
  `{a.tool_type}`,
  `{a.tool_type === 'unknown' ? 'Task' : a.tool_type}`
);
fs.writeFileSync('kortex_users/teacher/TeacherClassView.tsx', classCode);
