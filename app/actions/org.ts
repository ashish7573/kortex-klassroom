"use server";
import { adminDb, adminAuth } from '../../backend_configurations/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function createTeacher(idToken: string, teacherData: any) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const orgUid = decodedToken.uid;
    
    // Verify org_admin role
    const docSnap = await adminDb.collection('users').doc(orgUid).get();
    const data = docSnap.data();
    if (data?.role !== 'org_admin') {
      throw new Error("Unauthorized: Only organizations can create teachers.");
    }
    
    // Create Auth User
    const newAuthUser = await adminAuth.createUser({
      email: teacherData.email,
      displayName: teacherData.full_name,
    });

    // Generate Password Reset Link
    const resetLink = await adminAuth.generatePasswordResetLink(teacherData.email);
    // TODO: Dispatch resetLink to teacherData.email via email provider

    // Create Firestore Document
    await adminDb.collection('users').doc(newAuthUser.uid).set({
      uid: newAuthUser.uid,
      role: 'teacher',
      email: teacherData.email,
      full_name: teacherData.full_name,
      org_id: orgUid,
      created_at: new Date().toISOString(),
      status: 'active',
      phone: null,
      phoneVerified: false,
      onboardingStatus: 'ACTIVE',
      assigned_combos: [],
      assigned_student_ids: []
    });

    // Add teacher to organization's teacher_ids array
    await adminDb.collection('users').doc(orgUid).update({
      teacher_ids: FieldValue.arrayUnion(newAuthUser.uid)
    });

    return { success: true, uid: newAuthUser.uid, message: "Teacher created." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
