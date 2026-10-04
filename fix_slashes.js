const fs = require('fs');
let code = fs.readFileSync('kortex_users/teacher/TeacherDashboard.tsx', 'utf8');

code = code.replace(/className={\\\`/g, 'className={`');
code = code.replace(/\\\${/g, '${');
code = code.replace(/\\\`}/g, '`}');
code = code.replace(/width: \\\`/g, 'width: `');

fs.writeFileSync('kortex_users/teacher/TeacherDashboard.tsx', code);
