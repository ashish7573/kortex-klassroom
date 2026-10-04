const fs = require('fs');
let code = fs.readFileSync('app/actions/teacher.ts', 'utf8');

code = code.replace(
  `import { TeacherProfile } from '../../types/user';`,
  `import { TeacherProfile } from '../../types/user';\nimport { generateComboId } from '../../kortex_users/org_admin/utils/comboParsers';`
);

fs.writeFileSync('app/actions/teacher.ts', code);
