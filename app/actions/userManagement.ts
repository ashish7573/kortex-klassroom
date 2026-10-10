"use server";

import { adminAuth, adminDb } from '../../backend_configurations/firebase-admin';

export async function softDeleteUser(
  idToken: string, 
  targetUid: string
) {
  try {
    // 1. Verify caller identity
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const callerUid = decodedToken.uid;

    // 2. Fetch both caller and target documents securely on the server
    const callerDoc = await adminDb.collection('users').doc(callerUid).get();
    const targetDoc = await adminDb.collection('users').doc(targetUid).get();

    if (!callerDoc.exists) {
      throw new Error("Caller profile not found.");
    }
    if (!targetDoc.exists) {
      throw new Error("Target user profile not found.");
    }

    const callerData = callerDoc.data();
    const targetData = targetDoc.data();
    const callerRole = callerData?.role;
    const targetRole = targetData?.role;

    const isKortexAdmin = callerRole === 'admin' || callerRole === 'super_admin';
    let authorized = false;
    let deletedByRole = null;

    // 3. Deletion Permission Matrix Enforcement
    if (isKortexAdmin) {
      authorized = true;
      deletedByRole = 'kortex_admin';
    } else {
      switch (targetRole) {
        case 'student':
          // Can ONLY be soft-deleted by their linked parent (or admin)
          if (callerRole === 'parent' && targetData?.parent_id === callerUid) {
            authorized = true;
            deletedByRole = 'parent';
          }
          break;

        case 'teacher':
          // Can ONLY be soft-deleted by their linked organization (or admin)
          if (callerRole === 'org_admin' && targetData?.org_id === callerUid) {
            authorized = true;
            deletedByRole = 'organization';
          }
          break;

        case 'parent':
          // Can ONLY be soft-deleted by themselves (or admin)
          if (callerUid === targetUid) {
            authorized = true;
            deletedByRole = 'self';
          }
          break;

        case 'org_admin':
        case 'admin':
        case 'super_admin':
        case 'krew':
          // Organizations and Admins can ONLY be deleted by a kortex_admin (already checked above)
          break;

        default:
          throw new Error("Unknown target role.");
      }
    }

    if (!authorized) {
      throw new Error("Unauthorized to delete this user based on strict deletion matrix.");
    }

    // 4. Execute Tombstoning (Soft Delete)
    await adminDb.collection('users').doc(targetUid).update({
      accountStatus: 'DELETED',
      deletedBy: deletedByRole,
      deletedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error: any) {
    console.error("Soft delete failed:", error);
    return { success: false, error: error.message };
  }
}

// Phase 4 Preparation: restoreUser
export async function restoreUser(idToken: string, targetUid: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const callerUid = decodedToken.uid;

    const callerDoc = await adminDb.collection('users').doc(callerUid).get();
    const targetDoc = await adminDb.collection('users').doc(targetUid).get();

    if (!callerDoc.exists) throw new Error("Caller profile not found.");
    if (!targetDoc.exists) throw new Error("Target user profile not found.");

    const callerData = callerDoc.data();
    const targetData = targetDoc.data();
    const callerRole = callerData?.role;
    const targetRole = targetData?.role;

    const isKortexAdmin = callerRole === 'admin' || callerRole === 'super_admin';
    let authorized = false;

    if (isKortexAdmin) {
      authorized = true;
    } else {
      switch (targetRole) {
        case 'student':
          if (callerRole === 'parent' && targetData?.parent_id === callerUid) authorized = true;
          break;
        case 'teacher':
          if (callerRole === 'org_admin' && targetData?.org_id === callerUid) authorized = true;
          break;
        case 'parent':
          if (callerUid === targetUid) authorized = true;
          break;
      }
    }

    if (!authorized) {
      throw new Error("Unauthorized to restore this user.");
    }

    await adminDb.collection('users').doc(targetUid).update({
      accountStatus: 'ACTIVE',
      deletedBy: null,
      deletedAt: null
    });

    return { success: true };
  } catch (error: any) {
    console.error("Restore failed:", error);
    return { success: false, error: error.message };
  }
}

