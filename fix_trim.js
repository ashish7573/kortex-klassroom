const fs = require('fs');
const file = 'kortex_users/student/StudentDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

// Fix the comboObj.subject definition
code = code.replace(
  `subject: comboStr.split('-').pop()?.toUpperCase() || 'SUBJECT',`,
  `subject: comboStr.split('-').pop()?.trim().toUpperCase() || 'SUBJECT',`
);

code = code.replace(
  `subject: foundStr ? foundStr.split('-').pop()?.toUpperCase() || 'EXTRA SUBJECT' : 'EXTRA SUBJECT',`,
  `subject: foundStr ? foundStr.split('-').pop()?.trim().toUpperCase() || 'EXTRA SUBJECT' : 'EXTRA SUBJECT',`
);

code = code.replace(
  `subject: comboStr.split('-').pop()?.toUpperCase() || 'SUBJECT',`,
  `subject: comboStr.split('-').pop()?.trim().toUpperCase() || 'SUBJECT',`
);

// Note: there are 3 occurrences of .pop()?.toUpperCase()

fs.writeFileSync(file, code);
