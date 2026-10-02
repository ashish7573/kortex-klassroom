const fs = require('fs');
const file = 'app/actions/student.ts';
let code = fs.readFileSync(file, 'utf8');

const deleteFunc = `
export async function deleteIndividualUser(idToken: string, uidToDelete: string, roleToDelete: string): Promise<{ success: boolean; error?: string }> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const caller = await adminAuth.getUser(decodedToken.uid);
    // Assuming 'krew' or 'admin' can do this, but usually just checking the db for role
    const callerDoc = await adminDb.collection('users').doc(caller.uid).get();
    if (!callerDoc.exists || (callerDoc.data()?.role !== 'admin' && callerDoc.data()?.role !== 'krew')) {
       return { success: false, error: 'Unauthorized. Only Admins can delete users.' };
    }

    if (roleToDelete === 'parent') {
      // Cascade delete children
      const studentsSnap = await adminDb.collection('users').where('parent_id', '==', uidToDelete).get();
      const batch = adminDb.batch();
      const childUids = [];
      studentsSnap.docs.forEach(doc => {
         batch.delete(doc.ref);
         childUids.push(doc.id);
      });
      if (childUids.length > 0) {
        await batch.commit();
        await adminAuth.deleteUsers(childUids);
      }
    }
    
    // Delete the target user
    await adminDb.collection('users').doc(uidToDelete).delete();
    await adminAuth.deleteUser(uidToDelete);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
`;

code += "\n" + deleteFunc;
fs.writeFileSync(file, code);
