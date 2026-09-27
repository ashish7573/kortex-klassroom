const fs = require('fs');

let content = fs.readFileSync('app/actions/provision.ts', 'utf8');

// 1. Fix the return statement
const oldReturn = `    return { 
      success: true, 
      kortexId: cleanKortexId, 
      email: cleanEmail 
    };`;
const newReturn = `    return { 
      success: true, 
      kortexId: cleanKortexId, 
      email: cleanEmail,
      passwordLink: link
    };`;
content = content.replace(oldReturn, newReturn);

// 2. Add the delete function if it's not there
if (!content.includes('deleteOrganizationAccount')) {
  content += `\n\nexport async function deleteOrganizationAccount(idToken: string, targetUid: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const callerDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    
    if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
      throw new Error("Unauthorized: Only Super Admins can delete organizations.");
    }

    // 1. Delete from Firebase Auth
    await adminAuth.deleteUser(targetUid);
    
    // 2. Delete from Firestore
    await adminDb.collection('users').doc(targetUid).delete();

    return { success: true };
  } catch (error: any) {
    console.error("Delete Error:", error);
    return { success: false, error: error.message || "Failed to delete organization." };
  }
}
`;
}

fs.writeFileSync('app/actions/provision.ts', content);
console.log('Fixed provision.ts fully');
