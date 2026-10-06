const fs = require('fs');
let code = fs.readFileSync('app/actions/teacher.ts', 'utf8');

const newAction = `
export async function generateTeacherPasswordLink(idToken: string, email: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const callerUid = decodedToken.uid;
    const callerDoc = await adminDb.collection('users').doc(callerUid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'org_admin') {
      throw new Error("Unauthorized");
    }
    const link = await adminAuth.generatePasswordResetLink(email);
    return { success: true, link };
  } catch (error: any) {
    console.error("Link Generation Error:", error);
    return { success: false, error: error.message };
  }
}
`;

code = code + newAction;
fs.writeFileSync('app/actions/teacher.ts', code);
console.log("Patched teacher.ts.");
