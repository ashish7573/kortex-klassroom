const fs = require('fs');
const file = 'kortex_users/auth/UnifiedAuthModal.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldLogic = `      // If identifier is not an email, treat as student Kortex ID
      if (!emailToAuth.includes('@')) {
        const cleanId = loginIdentifier.trim().toUpperCase(); // e.g. STU_ABC_123
        const q = query(collection(db, 'users'), where('kortex_id', '==', cleanId));
        const snap = await getDocs(q);

        if (snap.empty) {
          throw new Error("Student ID not found. Please check with your parent or school.");
        }
        const studentDoc = snap.docs[0].data();
        
        // If the student was provisioned by an Org and hasn't been claimed yet
        if (studentDoc.parent_id === 'PENDING') {
          throw new Error("This Student ID has not been claimed by a parent yet.");
        }

        emailToAuth = studentDoc.email || \`\${cleanId.toLowerCase()}@student.kortex.app\`;
      }`;

const newLogic = `      // If identifier is not an email, treat as student Kortex ID
      if (!emailToAuth.includes('@')) {
        const cleanId = loginIdentifier.trim().toLowerCase(); // e.g. stu_abc_123
        emailToAuth = \`\${cleanId}@student.kortex.app\`;
      }`;

code = code.replace(oldLogic, newLogic);

fs.writeFileSync(file, code);
