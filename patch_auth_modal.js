const fs = require('fs');
let code = fs.readFileSync('kortex_users/auth/UnifiedAuthModal.tsx', 'utf8');

const oldCode = `      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, parentPassword);
      const parentKortexId = await generateParentId();`;

const newCode = `      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, parentPassword);
      const idToken = await cred.user.getIdToken();
      const parentKortexId = await generateParentId(idToken);`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('kortex_users/auth/UnifiedAuthModal.tsx', code);
