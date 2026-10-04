const fs = require('fs');
let code = fs.readFileSync('kortex_users/teacher/TeacherClassView.tsx', 'utf8');

code = code.replace(
  `import { auth } from '../../backend_configurations/firebase';`,
  `import { auth } from '../../backend_configurations/firebase';\nimport { fetchTeacherAssignments } from '../../app/actions/teacher_assignments';`
);

fs.writeFileSync('kortex_users/teacher/TeacherClassView.tsx', code);
