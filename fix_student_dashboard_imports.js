const fs = require('fs');
let code = fs.readFileSync('kortex_users/student/StudentDashboard.tsx', 'utf8');

code = code.replace(
  `import { getStudentOrgProfiles } from '../../app/actions/student';`,
  `import { getStudentOrgProfiles, markAssignmentAsDone } from '../../app/actions/student';`
);

fs.writeFileSync('kortex_users/student/StudentDashboard.tsx', code);
