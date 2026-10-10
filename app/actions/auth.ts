"use server";
import { adminDb, adminAuth } from '../../backend_configurations/firebase-admin';

export async function completeRegistration(userData: {
  uid?: string;
  email: string;
  phoneNumber: string;
  full_name: string;
}) {
  try {
    let authUser;
    if (userData.uid) {
      // User created via client-side signInWithPhoneNumber
      authUser = await adminAuth.updateUser(userData.uid, {
        email: userData.email,
        displayName: userData.full_name,
      });
    } else {
      try {
        authUser = await adminAuth.getUserByPhoneNumber(userData.phoneNumber);
        authUser = await adminAuth.updateUser(authUser.uid, {
          email: userData.email,
          displayName: userData.full_name,
        });
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          authUser = await adminAuth.createUser({
            email: userData.email,
            phoneNumber: userData.phoneNumber,
            displayName: userData.full_name,
          });
        } else {
          throw error;
        }
      }
    }

    // Generate Password Reset Link
    const resetLink = await adminAuth.generatePasswordResetLink(userData.email);
    // TODO: Dispatch resetLink to userData.email via email provider

    // Create Firestore Document
    await adminDb.collection('users').doc(authUser.uid).set({
      uid: authUser.uid,
      role: 'parent',
      email: userData.email,
      full_name: userData.full_name,
      phone: userData.phoneNumber,
      phoneVerified: true,
      onboardingStatus: 'ACTIVE',
      created_at: new Date().toISOString(),
      status: 'active',
      accountStatus: 'ACTIVE',
      deletedBy: null,
      deletedAt: null,
      children_ids: [],
    });

    return { success: true, uid: authUser.uid, message: "Registration complete." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
