const fs = require('fs');
const file = 'kortex_users/student/StudentDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `onClick={() => handleActionClick('lessons')} // Route to lessons view`,
  `onClick={() => handleActionClick(\`lessons:\${combo}\`)} // Route to specific lessons combo`
);

fs.writeFileSync(file, code);
