const fs = require('fs');
const file = 'app/actions/student.ts';
let code = fs.readFileSync(file, 'utf8');

// Add plain_pin to provisionChildAccount
code = code.replace(
  `      username: studentId, `,
  `      username: studentId, \n      plain_pin: childData.pin,`
);

// Add plain_pin to claimProvisionedChild
code = code.replace(
  `      parent_email: parentEmail,
      emergency_contact: parentContact,
      status: 'active',`,
  `      parent_email: parentEmail,
      emergency_contact: parentContact,
      plain_pin: claimData.pin,
      status: 'active',`
);

// Add updateChildPin Server Action
const updatePinLogic = `
export async function updateChildPin(idToken: string, childUid: string, newPin: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const parentUid = decodedToken.uid;
    
    const studentRef = adminDb.collection('users').doc(childUid);
    const studentDoc = await studentRef.get();
    
    if (!studentDoc.exists || studentDoc.data()?.parent_id !== parentUid) {
      throw new Error("Unauthorized: You can only update your own child's PIN.");
    }
    
    // Update Auth
    await adminAuth.updateUser(childUid, { password: newPin });
    
    // Update Firestore plain_pin
    await studentRef.update({
      plain_pin: newPin,
      updated_at: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error: unknown) {
    console.error("Error updating child PIN:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
`;

code += "\n" + updatePinLogic;

fs.writeFileSync(file, code);
