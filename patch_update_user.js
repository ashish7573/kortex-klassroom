const fs = require('fs');
const file = 'app/actions/student.ts';
let code = fs.readFileSync(file, 'utf8');

const updateFunc = `
export async function updateIndividualUser(idToken: string, uidToUpdate: string, updateData: any): Promise<{ success: boolean; error?: string }> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const caller = await adminAuth.getUser(decodedToken.uid);
    const callerDoc = await adminDb.collection('users').doc(caller.uid).get();
    if (!callerDoc.exists || (callerDoc.data()?.role !== 'admin' && callerDoc.data()?.role !== 'krew')) {
       return { success: false, error: 'Unauthorized. Only Admins can edit users.' };
    }

    // Clean data (prevent role escalation or critical uid changes)
    const safeData = { ...updateData };
    delete safeData.uid;
    delete safeData.role;
    delete safeData.org_id;
    delete safeData.org_ids;
    delete safeData.parent_id;
    
    // Update the target user in Firestore
    await adminDb.collection('users').doc(uidToUpdate).update(safeData);

    // If email is updated, update in Auth as well
    if (safeData.email) {
       await adminAuth.updateUser(uidToUpdate, { email: safeData.email });
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
`;

code += "\n" + updateFunc;
fs.writeFileSync(file, code);
