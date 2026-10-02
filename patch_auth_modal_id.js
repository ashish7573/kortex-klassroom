const fs = require('fs');
const file = 'kortex_users/auth/UnifiedAuthModal.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes("import { generateParentId }")) {
  code = code.replace(
    `import { ParentProfile } from '../../types/user';`,
    `import { ParentProfile } from '../../types/user';\nimport { generateParentId } from '../../app/actions/student';`
  );
}

code = code.replace(
  `      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, parentPassword);`,
  `      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, parentPassword);\n      const parentKortexId = await generateParentId();`
);

code = code.replace(
  `kortex_id: 'PR-' + cred.user.uid.substring(0, 8).toUpperCase(),`,
  `kortex_id: parentKortexId,`
);

fs.writeFileSync(file, code);
