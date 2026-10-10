"use server";
import { adminDb, adminAuth } from '../../backend_configurations/firebase-admin';

export async function syncCurriculumTotals(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const adminUid = decodedToken.uid;
    
    // Verify admin role
    const docSnap = await adminDb.collection('users').doc(adminUid).get();
    const data = docSnap.data();
    if (data?.role !== 'admin') {
      throw new Error("Unauthorized: Only admins can sync curriculum totals.");
    }
    
    // Fetch all tools
    const snap = await adminDb.collection('learning_tools').get();
    const totals: Record<string, number> = {};
    
    snap.docs.forEach(doc => {
       const tool = doc.data();
       const grade = (tool.grade || 'unknown').trim().toLowerCase();
       let dbSubj = (tool.subject || 'unknown').trim().toLowerCase();
       if (dbSubj === 'mathematics' || dbSubj === 'maths') dbSubj = 'maths';
       const key = `${grade}_${dbSubj}`;
       totals[key] = (totals[key] || 0) + 1;
    });
    
    await adminDb.collection('metadata').doc('curriculum_totals').set(totals);
    
    return { success: true, message: "Curriculum totals synced successfully." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createOrganization(idToken: string, orgData: any) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const adminUid = decodedToken.uid;
    
    // Verify admin role
    const docSnap = await adminDb.collection('users').doc(adminUid).get();
    const data = docSnap.data();
    if (data?.role !== 'admin') {
      throw new Error("Unauthorized: Only admins can create organizations.");
    }
    
    // Create Auth User
    const newAuthUser = await adminAuth.createUser({
      email: orgData.email,
      displayName: orgData.organization_name,
      // No phone required. No password provided here.
    });

    // Generate Password Reset Link
    const resetLink = await adminAuth.generatePasswordResetLink(orgData.email);
    // TODO: Dispatch resetLink to orgData.email via email provider

    // Create Firestore Document
    await adminDb.collection('users').doc(newAuthUser.uid).set({
      uid: newAuthUser.uid,
      role: 'org_admin',
      email: orgData.email,
      full_name: orgData.organization_name,
      organization_name: orgData.organization_name,
      created_at: new Date().toISOString(),
      status: 'active',
      phone: null,
      phoneVerified: false, 
      onboardingStatus: 'ACTIVE',
      ...orgData
    });

    return { success: true, uid: newAuthUser.uid, message: "Organization created." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
