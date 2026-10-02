const fs = require('fs');
const file = 'kortex_users/student/StudentDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `subject: foundStr ? foundStr.split('-').pop()?.toUpperCase() || 'SUBJECT' : 'EXTRA SUBJECT',`,
  `subject: foundStr ? foundStr.split('-').pop()?.trim().toUpperCase() || 'SUBJECT' : 'EXTRA SUBJECT',`
);

code = code.replace(
  `subject: comboStr.split('-').pop()?.toUpperCase() || 'SUBJECT',`,
  `subject: comboStr.split('-').pop()?.trim().toUpperCase() || 'SUBJECT',`
);

fs.writeFileSync(file, code);
