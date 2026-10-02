const fs = require('fs');
const file = 'app/actions/student.ts';
let code = fs.readFileSync(file, 'utf8');

const updateParentFunc = `
export async function updateParentProfile(
  idToken: string,
  updateData: {
    fullName: string;
    contactNumber: string;
    email: string;
  }
) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const parentUid = decodedToken.uid;
    
    const parentRef = adminDb.collection('users').doc(parentUid);
    const parentDoc = await parentRef.get();
    
    if (!parentDoc.exists || parentDoc.data()?.role !== 'parent') {
      throw new Error("Unauthorized: Not a parent.");
    }
    
    const batch = adminDb.batch();
    
    batch.update(parentRef, {
      full_name: updateData.fullName,
      contact_number: updateData.contactNumber,
      email: updateData.email,
      updated_at: new Date().toISOString()
    });
    
    // Update all linked children to sync the data for Org Admins!
    const childrenSnap = await adminDb.collection('users').where('parent_id', '==', parentUid).get();
    childrenSnap.docs.forEach(childDoc => {
      batch.update(childDoc.ref, {
        parent_name: updateData.fullName,
        parent_email: updateData.email,
        emergency_contact: updateData.contactNumber
      });
    });
    
    await batch.commit();

    // Finally update email in Firebase Auth
    if (updateData.email && decodedToken.email !== updateData.email) {
      await adminAuth.updateUser(parentUid, { email: updateData.email });
    }
    
    return { success: true };
  } catch (error: unknown) {
    console.error("Error updating parent profile:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
`;

code += "\n" + updateParentFunc;
fs.writeFileSync(file, code);
