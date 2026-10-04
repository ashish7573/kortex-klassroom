const fs = require('fs');
let code = fs.readFileSync('kortex_users/auth/UnifiedAuthModal.tsx', 'utf8');

code = code.replace(
  `import { generateParentId } from '../../utils/generators';`,
  `import { generateParentId } from '../../utils/generators';\nimport { updateUserSessionToken } from '../../app/actions/student';`
);

const oldUpdate = `      // Update session token in Firestore
      try {
        await updateDoc(doc(db, 'users', cred.user.uid), {
          session_token: sessionToken,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn("Profile update warning during sign-in:", err);
      }`;

const newUpdate = `      // Update session token in Firestore (via Server Action to bypass strict security rules)
      try {
        const idToken = await cred.user.getIdToken();
        const res = await updateUserSessionToken(idToken, sessionToken);
        if (!res.success) {
           console.warn("Server action session update failed:", res.error);
        }
      } catch (err) {
        console.warn("Profile update warning during sign-in:", err);
      }`;

code = code.replace(oldUpdate, newUpdate);
fs.writeFileSync('kortex_users/auth/UnifiedAuthModal.tsx', code);
