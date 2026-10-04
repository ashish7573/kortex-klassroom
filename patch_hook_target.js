const fs = require('fs');
let code = fs.readFileSync('hooks/useStudentAssignments.ts', 'utf8');

code = code.replace(
  `const res = await getStudentAssignments(token);`,
  `const res = await getStudentAssignments(token, studentUid);`
);

fs.writeFileSync('hooks/useStudentAssignments.ts', code);
