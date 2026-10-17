"use server";
import { adminDb, adminAuth } from '../../backend_configurations/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { UserRole } from '../../types/user';

export async function completeRegistration(userData: {
  uid?: string;
  email: string;
  phoneNumber: string;
  full_name: string;
}) {
  try {
    const cleanEmail = userData.email.trim().toLowerCase();

    // Check if an existing account already exists with this email
    const emailQuery = await adminDb.collection('users').where('email', '==', cleanEmail).limit(1).get();
    if (!emailQuery.empty) {
      const existingDoc = emailQuery.docs[0];
      const existingData = existingDoc.data();
      const existingRoles: string[] = existingData.roles || (existingData.role ? [existingData.role] : []);

      // If existing user is a teacher, link parent role
      if (existingRoles.includes('teacher')) {
        await existingDoc.ref.update({
          roles: FieldValue.arrayUnion('teacher', 'parent'),
          phone: userData.phoneNumber,
          phoneVerified: true,
          children_ids: existingData.children_ids || [],
          updated_at: new Date().toISOString()
        });

        // Clean up temporary phone-auth user if created separately
        if (userData.uid && userData.uid !== existingDoc.id) {
          try {
            await adminAuth.deleteUser(userData.uid);
          } catch (e) {
            console.warn("Could not delete temporary phone auth user:", e);
          }
        }

        return { 
          success: true, 
          uid: existingDoc.id, 
          isDualRole: true,
          message: "Teacher account recognized! Parent portal has been successfully activated for your account." 
        };
      }

      if (existingRoles.includes('parent')) {
        return { 
          success: false, 
          error: "An account with this email is already registered as a parent. Please sign in instead." 
        };
      }
    }

    let authUser;
    if (userData.uid) {
      // User created via client-side signInWithPhoneNumber
      authUser = await adminAuth.updateUser(userData.uid, {
        email: cleanEmail,
        displayName: userData.full_name,
      });
    } else {
      try {
        authUser = await adminAuth.getUserByPhoneNumber(userData.phoneNumber);
        authUser = await adminAuth.updateUser(authUser.uid, {
          email: cleanEmail,
          displayName: userData.full_name,
        });
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          authUser = await adminAuth.createUser({
            email: cleanEmail,
            phoneNumber: userData.phoneNumber,
            displayName: userData.full_name,
          });
        } else {
          throw error;
        }
      }
    }

    // Generate Password Reset Link
    const resetLink = await adminAuth.generatePasswordResetLink(cleanEmail);
    // TODO: Dispatch resetLink to cleanEmail via email provider

    // Create Firestore Document
    await adminDb.collection('users').doc(authUser.uid).set({
      uid: authUser.uid,
      role: 'parent',
      roles: ['parent'],
      email: cleanEmail,
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

export async function switchActiveRole(idToken: string, newRole: UserRole) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) throw new Error("User not found");
    const data = userDoc.data();
    const roles: string[] = data?.roles || (data?.role ? [data.role] : []);
    if (!roles.includes(newRole)) {
      throw new Error(`Unauthorized: Your account does not have the '${newRole}' role.`);
    }
    await adminDb.collection('users').doc(uid).update({
      active_role: newRole,
      updated_at: new Date().toISOString()
    });
    return { success: true, activeRole: newRole };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
