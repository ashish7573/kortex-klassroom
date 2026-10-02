const fs = require('fs');
const file = 'app/actions/student.ts';
let code = fs.readFileSync(file, 'utf8');

const getOrgsLogic = `
export async function getStudentOrgProfiles(idToken: string, orgIds: string[]) {
  try {
    await adminAuth.verifyIdToken(idToken);
    
    const orgProfiles: Record<string, any> = {};
    for (const orgId of orgIds) {
      const snap = await adminDb.collection('users').doc(orgId).get();
      if (snap.exists) {
         const data = snap.data() as any;
         orgProfiles[orgId] = {
           kortex_id: data.kortex_id,
           full_name: data.full_name,
           approved_grade_subject_combos: data.approved_grade_subject_combos || []
         };
      }
    }
    return { success: true, orgProfiles };
  } catch (error: unknown) {
    console.error("Error fetching org profiles:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
`;

code += "\n" + getOrgsLogic;

fs.writeFileSync(file, code);
