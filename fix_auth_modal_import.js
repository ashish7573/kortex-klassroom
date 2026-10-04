const fs = require('fs');
let code = fs.readFileSync('kortex_users/auth/UnifiedAuthModal.tsx', 'utf8');

code = code.replace(
  `import { generateParentId } from '../../app/actions/student';`,
  `import { generateParentId, updateUserSessionToken } from '../../app/actions/student';`
);

fs.writeFileSync('kortex_users/auth/UnifiedAuthModal.tsx', code);
