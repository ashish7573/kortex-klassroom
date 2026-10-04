"use server";

import { adminAuth, adminDb } from '../../backend_configurations/firebase-admin';
import { OrgAdminProfile } from '../../types/user';

export async function provisionSchoolAccount(
  idToken: string, 
  provisionData: {
    kortexId: string;
    orgName: string;
    email: string;
    approvedCombos: string[];
    maxStudentSeats: number;
    subscriptionEndDate: string | null;
  }
) {
  try {
    // 1. Verify the caller's identity securely on the backend
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const callerUid = decodedToken.uid;

    // 2. Verify caller is an 'admin' in Firestore
    const callerDoc = await adminDb.collection('users').doc(callerUid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
      throw new Error("Unauthorized: Only Super Admins can provision organizations.");
    }

    const { kortexId, orgName, email, approvedCombos, maxStudentSeats, subscriptionEndDate } = provisionData;
    const cleanKortexId = kortexId.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    // 3. Uniqueness Guard: Check if kortex_id exists
    const idSnapshot = await adminDb.collection('users').where('kortex_id', '==', cleanKortexId).get();
    if (!idSnapshot.empty) {
      throw new Error(`The User ID "${cleanKortexId}" is already in use.`);
    }
    
    // Also check if email is already in use in Firestore just in case
    const emailSnapshot = await adminDb.collection('users').where('email', '==', cleanEmail).get();
    if (!emailSnapshot.empty) {
      throw new Error(`The email "${cleanEmail}" is already registered in the system.`);
    }

    // 4. Create the Auth User (No password needed, they will set it via the link)
    const userRecord = await adminAuth.createUser({
      email: cleanEmail,
      displayName: orgName.trim(),
    });

    // 5. Create the Firestore Profile
    const profileData: OrgAdminProfile = {
      uid: userRecord.uid,
      kortex_id: cleanKortexId,
      email: cleanEmail,
      full_name: orgName.trim(),
      organization_name: orgName.trim(),
      role: 'org_admin',
      created_at: new Date().toISOString(),
      status: 'active',
      has_completed_onboarding: false, // Forces the first-login guard
      license_quota: Number(maxStudentSeats),
      active_students_count: 0,
      teacher_ids: [],
    };

    await adminDb.collection('users').doc(userRecord.uid).set({
      ...profileData,
      approved_grade_subject_combos: approvedCombos,
      subscription_end_date: subscriptionEndDate ? new Date(subscriptionEndDate).toISOString() : null,
    });

    // 6. Generate Secure Password Reset Link
    const link = await adminAuth.generatePasswordResetLink(cleanEmail);
    
    // Log it to the server console as requested
    console.log("\n=========================================");
    console.log("🎉 SUCCESS: ORGANIZATION PROVISIONED!");
    console.log("Organization:", orgName);
    console.log("Kortex ID:", cleanKortexId);
    console.log("Email:", cleanEmail);
    console.log("Password Setup Link:", link);
    console.log("=========================================\n");

    return { 
      success: true, 
      kortexId: cleanKortexId, 
      email: cleanEmail,
      passwordLink: link
    };

  } catch (error: any) {
    console.error("Server Provisioning Error:", error);
    
    // Format Firebase Auth errors to be readable
    if (error.code === 'auth/email-already-exists') {
      return { success: false, error: 'This email is already registered in Firebase Authentication.' };
    }
    
    return { 
      success: false, 
      error: error.message || "An error occurred while provisioning the organization on the server." 
    };
  }
}


export async function deleteOrganizationAccount(idToken: string, targetUid: string) {
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

export async function updateOrganizationAccount(
  idToken: string, 
  targetUid: string,
  updateData: {
    orgName: string;
    approvedCombos: string[];
    maxStudentSeats: number;
    subscriptionEndDate: string | null;
    agreementUrl?: string;
    invoiceUrl?: string;
  }
) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const callerDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    
    if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
      throw new Error("Unauthorized: Only Super Admins can update organizations.");
    }

    const { orgName, approvedCombos, maxStudentSeats, subscriptionEndDate, agreementUrl, invoiceUrl } = updateData;

    // 1. Update Firebase Auth Display Name
    await adminAuth.updateUser(targetUid, {
      displayName: orgName.trim(),
    });

    // 2. Update Firestore Profile
    await adminDb.collection('users').doc(targetUid).update({
      organization_name: orgName.trim(),
      approved_grade_subject_combos: approvedCombos,
      license_quota: Number(maxStudentSeats),
      subscription_end_date: subscriptionEndDate ? new Date(subscriptionEndDate).toISOString() : null,
      agreement_url: agreementUrl !== undefined ? agreementUrl : null,
      invoice_url: invoiceUrl !== undefined ? invoiceUrl : null,
      updated_at: new Date().toISOString()
    });

    return { success: true };
  } catch (error: any) {
    console.error("Update Error:", error);
    return { success: false, error: error.message || "Failed to update organization." };
  }
}

