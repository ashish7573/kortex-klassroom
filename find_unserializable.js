const fs = require('fs');

const files = ['app/actions/admin.ts', 'app/actions/provision.ts', 'app/actions/student.ts', 'app/actions/teacher.ts', 'app/actions/teacher_assignments.ts'];

for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  if (code.includes('Timestamp') || code.includes('FieldValue')) {
     console.log(`Contains Timestamp/FieldValue: ${file}`);
  }
}
