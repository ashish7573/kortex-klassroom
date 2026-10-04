const fs = require('fs');
let code = fs.readFileSync('hooks/useStudentAssignments.ts', 'utf8');

// The original code in useStudentAssignments.ts was:
// const dueDateObj = new Date(a.due_date);
// We need to remove the duplicate.
code = code.replace(/const dueDateObj = new Date\(a.due_date\);\n              \n              let isOnTime/g, 'let isOnTime');

fs.writeFileSync('hooks/useStudentAssignments.ts', code);
