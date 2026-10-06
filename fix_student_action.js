const fs = require('fs');
let code = fs.readFileSync('app/actions/student.ts', 'utf8');

code = code.replace(
  /parent_email: student.parentEmail \|\| '',\n\s*parent_phone: student.parentPhone \|\| ''/,
  `status: 'pending'`
);

fs.writeFileSync('app/actions/student.ts', code);
console.log("Fixed student.ts");
