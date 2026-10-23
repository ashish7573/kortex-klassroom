"use server";
import { adminDb, adminAuth } from '../../backend_configurations/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { UserRole } from '../../types/user';
import { generateParentId } from './student';

export async function resolveLoginEmail(identifier: string) {
  try {
    const raw = (identifier || '').trim();
    if (!raw) {
      return { success: false, error: "Please enter your email or mobile number." };
    }

    // 1. If it contains @, it's an email
    if (raw.includes('@')) {
      return { success: true, email: raw.toLowerCase() };
    }

    // 2. If it's a student username (e.g. stu_abc_123)
    if (raw.toLowerCase().startsWith('stu_')) {
      return { success: true, email: `${raw.toLowerCase()}@student.kortex.app` };
    }

    // 3. Otherwise, check if it's a mobile number (digits)
    const digitsOnly = raw.replace(/\D/g, '');
    if (digitsOnly.length >= 7) {
      const last10 = digitsOnly.slice(-10);
      const queries = [
        adminDb.collection('users').where('phone', '==', last10).limit(1).get(),
        adminDb.collection('users').where('phone', '==', `+91${last10}`).limit(1).get(),
        adminDb.collection('users').where('phone', '==', `+91 ${last10}`).limit(1).get(),
        adminDb.collection('users').where('phone', '==', `+${digitsOnly}`).limit(1).get(),
      ];

      const results = await Promise.all(queries);
      for (const snap of results) {
        if (!snap.empty) {
          const userData = snap.docs[0].data();
          if (userData?.email) {
            return { success: true, email: userData.email.toLowerCase() };
          }
        }
      }

      return { 
        success: false, 
        error: "No parent account found registered with this mobile number. Please sign in with your email address." 
      };
    }

    // Fallback: If not clearly an email or phone, treat as student kortex ID without prefix
    return { success: true, email: `${raw.toLowerCase()}@student.kortex.app` };
  } catch (error: any) {
    console.error("Error in resolveLoginEmail:", error);
    return { success: false, error: error.message || "Failed to resolve login identifier." };
  }
}

export async function requestPinResetForIdentifier(identifier: string) {
  try {
    const raw = (identifier || '').trim().toLowerCase();
    if (!raw) {
      return { success: false, error: "Please enter your registered email address." };
    }

    // Guard: School Student accounts with synthetic emails or Student IDs cannot reset by email
    if (raw.endsWith('@student.kortex.app') || raw.startsWith('stu_') || raw.startsWith('stu-') || !raw.includes('@')) {
      return { 
        success: false, 
        error: "Student PINs cannot be reset by email. Please ask your class teacher or school administrator directly at school to view or reset your PIN." 
      };
    }

    const targetEmail = raw;

    // Mask the email for user feedback: e.g. "p***a@gmail.com"
    const [userPart, domainPart] = targetEmail.split('@');
    const maskedUser = userPart.length <= 2 
      ? userPart[0] + '***' 
      : userPart[0] + '***' + userPart[userPart.length - 1];
    const maskedEmail = `${maskedUser}@${domainPart}`;

    // Generate password reset link using Firebase Admin
    await adminAuth.generatePasswordResetLink(targetEmail);

    return { 
      success: true, 
      targetEmail, 
      maskedEmail,
      isPhoneLookup: false 
    };
  } catch (error: any) {
    console.error("Error in requestPinResetForIdentifier:", error);
    return { success: false, error: error.message || "Failed to send reset link." };
  }
}

export async function syncUserSessionAndProfile(
  idToken: string, 
  sessionToken: string, 
  options?: { full_name?: string }
) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = (decodedToken.email || '').trim().toLowerCase();
    const displayName = options?.full_name || decodedToken.name || 'Parent User';

    const userDocRef = adminDb.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
      const existingData = userDoc.data()!;
      await userDocRef.update({
        session_token: sessionToken,
        updated_at: new Date().toISOString()
      });

      return { 
        success: true, 
        uid, 
        profile: { ...existingData, session_token: sessionToken } 
      };
    }

    // Check if an existing profile exists with this email
    if (email) {
      const emailSnap = await adminDb.collection('users').where('email', '==', email).limit(1).get();
      if (!emailSnap.empty) {
        const matchedDoc = emailSnap.docs[0];
        const matchedData = matchedDoc.data();
        const mergedData = {
          ...matchedData,
          uid,
          session_token: sessionToken,
          updated_at: new Date().toISOString()
        };
        await userDocRef.set(mergedData);
        if (matchedDoc.id !== uid) {
          await matchedDoc.ref.delete().catch(() => {});
        }
        return { success: true, uid, profile: mergedData };
      }
    }

    // Brand new user: generate Parent Kortex ID and create profile
    let parentKortexId = `PR_AAA_${Math.floor(100 + Math.random() * 900)}`;
    try {
      parentKortexId = await generateParentId(idToken);
    } catch (e) {
      console.warn("Failed to generate parent counter ID, using fallback:", e);
    }

    const newProfile = {
      uid,
      kortex_id: parentKortexId,
      email,
      full_name: displayName,
      role: 'parent',
      roles: ['parent'],
      active_role: 'parent',
      phone: decodedToken.phone_number || null,
      phoneVerified: false,
      onboardingStatus: 'ACTIVE',
      children_ids: [],
      status: 'active',
      accountStatus: 'ACTIVE',
      session_token: sessionToken,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await userDocRef.set(newProfile);

    return { success: true, uid, profile: newProfile };
  } catch (error: any) {
    console.error("Error in syncUserSessionAndProfile:", error);
    return { success: false, error: error.message };
  }
}

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
