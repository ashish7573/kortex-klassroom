"use server";

import { adminAuth, adminDb } from '../../backend_configurations/firebase-admin';
import { TeacherProfile } from '../../types/user';

export async function provisionTeacherAccount(
  idToken: string, 
  provisionData: {
    teacherId: string;
    fullName: string;
    email: string;
    assignedCombos: string[];
  }
) {
  try {
    // 1. Verify caller
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const callerUid = decodedToken.uid;

    const callerDoc = await adminDb.collection('users').doc(callerUid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'org_admin') {
      throw new Error("Unauthorized: Only Organization Admins can provision teachers.");
    }
    
    // Org Admin's Kortex ID must prefix the teacher's ID
    const orgKortexId = callerDoc.data()?.kortex_id;
    if (!orgKortexId) throw new Error("Organization ID not found.");

    const orgAbbrev = orgKortexId.startsWith("ORG_") ? orgKortexId.replace("ORG_", "") : orgKortexId;
    
    const { teacherId, fullName, email, assignedCombos } = provisionData;
    const cleanTeacherId = teacherId.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    // Ensure they didn't bypass the prefix rule
    if (!cleanTeacherId.startsWith(`${orgAbbrev}_`)) {
       throw new Error(`Teacher ID must start with the organization prefix: ${orgAbbrev}_`);
    }

    // 2. Uniqueness Guard: Check if kortex_id exists
    const idSnapshot = await adminDb.collection('users').where('kortex_id', '==', cleanTeacherId).get();
    if (!idSnapshot.empty) {
      throw new Error(`The Teacher ID "${cleanTeacherId}" is already in use.`);
    }
    
    const emailSnapshot = await adminDb.collection('users').where('email', '==', cleanEmail).get();
    if (!emailSnapshot.empty) {
      throw new Error(`The email "${cleanEmail}" is already registered in the system.`);
    }

    // 3. Create the Auth User
    const userRecord = await adminAuth.createUser({
      email: cleanEmail,
      displayName: fullName.trim(),
    });

    // 4. Create the Firestore Profile
    const profileData: TeacherProfile = {
      uid: userRecord.uid,
      kortex_id: cleanTeacherId,
      email: cleanEmail,
      full_name: fullName.trim(),
      role: 'teacher',
      org_id: callerUid,
      created_at: new Date().toISOString(),
      status: 'active',
      has_completed_onboarding: false,
      assigned_combos: assignedCombos,
      assigned_student_ids: [],
    };

    await adminDb.collection('users').doc(userRecord.uid).set(profileData);

    // Also link the teacher to the Org Admin's teacher_ids array
    const orgTeacherIds = callerDoc.data()?.teacher_ids || [];
    await adminDb.collection('users').doc(callerUid).update({
      teacher_ids: [...orgTeacherIds, userRecord.uid]
    });

    // 5. Generate Secure Password Reset Link
    const link = await adminAuth.generatePasswordResetLink(cleanEmail);
    
    return { 
      success: true, 
      kortexId: cleanTeacherId,
      email: cleanEmail,
      passwordLink: link,
      uid: userRecord.uid
    };
  } catch (error: any) {
    console.error("Provisioning Error:", error);
    return { success: false, error: error.message || "Failed to provision teacher account." };
  }
}

export async function updateTeacherAccount(
  idToken: string, 
  targetUid: string,
  updateData: {
    fullName: string;
    assignedCombos: string[];
  }
) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const callerUid = decodedToken.uid;

    const callerDoc = await adminDb.collection('users').doc(callerUid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'org_admin') {
      throw new Error("Unauthorized: Only Organization Admins can update teachers.");
    }

    // Ensure the teacher actually belongs to this org admin
    const targetDoc = await adminDb.collection('users').doc(targetUid).get();
    if (!targetDoc.exists || targetDoc.data()?.org_id !== callerUid) {
      throw new Error("Unauthorized: Cannot update a teacher belonging to another organization.");
    }

    const { fullName, assignedCombos } = updateData;

    await adminAuth.updateUser(targetUid, {
      displayName: fullName.trim(),
    });

    await adminDb.collection('users').doc(targetUid).update({
      full_name: fullName.trim(),
      assigned_combos: assignedCombos,
      updated_at: new Date().toISOString()
    });

    return { success: true };
  } catch (error: any) {
    console.error("Update Error:", error);
    return { success: false, error: error.message || "Failed to update teacher account." };
  }
}

export async function deleteTeacherAccount(idToken: string, targetUid: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const callerUid = decodedToken.uid;

    const callerDoc = await adminDb.collection('users').doc(callerUid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'org_admin') {
      throw new Error("Unauthorized: Only Organization Admins can delete teachers.");
    }

    // Ensure the teacher belongs to this org
    const targetDoc = await adminDb.collection('users').doc(targetUid).get();
    if (!targetDoc.exists || targetDoc.data()?.org_id !== callerUid) {
      throw new Error("Unauthorized: Cannot delete a teacher belonging to another organization.");
    }

    // Delete Auth User
    await adminAuth.deleteUser(targetUid);
    
    // Delete Firestore Doc
    await adminDb.collection('users').doc(targetUid).delete();

    // Remove from org's teacher_ids array
    const orgTeacherIds = callerDoc.data()?.teacher_ids || [];
    await adminDb.collection('users').doc(callerUid).update({
      teacher_ids: orgTeacherIds.filter((id: string) => id !== targetUid)
    });

    return { success: true };
  } catch (error: any) {
    console.error("Deletion Error:", error);
    return { success: false, error: error.message || "Failed to delete teacher account." };
  }
}
