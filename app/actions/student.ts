"use server";
import { serializeFirebaseData } from "../../utils/serialize";

import { adminDb, adminAuth } from '../../backend_configurations/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { StudentProfile } from '../../types/user';

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function getNextAlphabet(current: string): string {
  const chars = current.split('');
  for (let i = chars.length - 1; i >= 0; i--) {
    const charIndex = ALPHABET.indexOf(chars[i]);
    if (charIndex < 25) {
      chars[i] = ALPHABET[charIndex + 1];
      return chars.join('');
    } else {
      chars[i] = 'A'; // carry over to the left
    }
  }
  return 'A' + chars.join('');
}

async function generateMultipleGlobalStudentIds(count: number): Promise<string[]> {
  const counterRef = adminDb.collection('system').doc('student_counter');
  
  return adminDb.runTransaction(async (transaction) => {
    const doc = await transaction.get(counterRef);
    
    let alphabets = "AAA";
    let number = 101;

    if (doc.exists) {
      const data = doc.data()!;
      alphabets = data.alphabets;
      number = data.number;
    }

    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      if (doc.exists || i > 0) {
        if (number >= 999) {
          number = 101;
          alphabets = getNextAlphabet(alphabets);
        } else {
          number++;
        }
      }
      ids.push(`K${alphabets}${number}`);
    }

    transaction.set(counterRef, { alphabets, number });
    return ids;
  });
}

async function generateGlobalStudentId(): Promise<string> {
  const counterRef = adminDb.collection('system').doc('student_counter');
  
  return adminDb.runTransaction(async (transaction) => {
    const doc = await transaction.get(counterRef);
    
    let alphabets = "AAA";
    let number = 101;

    if (doc.exists) {
      const data = doc.data()!;
      alphabets = data.alphabets;
      number = data.number;

      if (number >= 999) {
        number = 101;
        alphabets = getNextAlphabet(alphabets);
      } else {
        number++;
      }
    } else {
      transaction.set(counterRef, { alphabets, number });
    }

    transaction.update(counterRef, { alphabets, number });
    return `STU_${alphabets}_${number}`;
  });
}


export async function generateParentId(idToken: string): Promise<string> {
  // 🔒 PATCH: Block unauthenticated DDOS attacks
  await adminAuth.verifyIdToken(idToken);
  
  const counterRef = adminDb.collection('system').doc('parent_counter');
  
  return adminDb.runTransaction(async (transaction) => {
    const doc = await transaction.get(counterRef);
    
    let alphabets = "AAA";
    let number = 101;

    if (doc.exists) {
      const data = doc.data() as { alphabets: string, number: number };
      alphabets = data.alphabets || "AAA";
      number = data.number || 101;

      if (number >= 999) {
        number = 101;
        alphabets = getNextAlphabet(alphabets);
      } else {
        number++;
      }
    } else {
      transaction.set(counterRef, { alphabets, number });
    }

    transaction.update(counterRef, { alphabets, number });
    return `PR_${alphabets}_${number}`;
  });
}

export async function provisionStudentPlaceholder(
  idToken: string, 
  provisionData: {
    fullName: string;
    grade: string;
    section?: string;
    assignedCombos: string[];
    emergencyContact?: string;
  }
) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const callerUid = decodedToken.uid;

    const callerDoc = await adminDb.collection('users').doc(callerUid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'org_admin') {
      throw new Error("Unauthorized: Only Organization Admins can provision students.");
    }

    const orgId = callerUid;
    const kortexId = await generateGlobalStudentId();
    const claimCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const placeholderRef = adminDb.collection('users').doc();
    
    const newStudent: StudentProfile = {
      uid: placeholderRef.id,
      kortex_id: kortexId,
      full_name: provisionData.fullName,
      username: `pending_${placeholderRef.id.substring(0, 8)}`,
      role: 'student',
      grade: provisionData.grade,
      section: provisionData.section,
      active_b2c_licenses: [],
      hearts_remaining: 5,
      last_heart_reset: new Date().toISOString(),
      emergency_contact: provisionData.emergencyContact,
      parent_id: 'PENDING',
      claim_code: claimCode,
      org_ids: [orgId],
      org_links: {
        [orgId]: {
          org_name: callerDoc.data()?.organization_name || "Organization",
          grade: provisionData.grade,
          section: provisionData.section,
          assigned_combos: provisionData.assignedCombos,
          status: 'approved'
        }
      },
      teacher_ids: [],
      status: 'pending',
      created_at: new Date().toISOString()
    };

    await placeholderRef.set(newStudent);

    return { 
      success: true, 
      studentId: kortexId,
      claimCode: claimCode,
      docId: placeholderRef.id 
    };
  } catch (error: unknown) {
    console.error("Error provisioning student placeholder:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function requestStudentImport(
  idToken: string,
  importData: {
    studentId: string;
    grade: string;
    section?: string;
    assignedCombos: string[];
  }
) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const callerUid = decodedToken.uid;
    const orgDoc = await adminDb.collection('users').doc(callerUid).get();
    
    if (!orgDoc.exists || orgDoc.data()?.role !== 'org_admin') {
      throw new Error("Unauthorized: Only Organization Admins can import students.");
    }

    const orgId = callerUid;
    
    const snapshot = await adminDb.collection('users')
      .where('role', '==', 'student')
      .where('kortex_id', '==', importData.studentId)
      .limit(1)
      .get();
      
    if (snapshot.empty) {
      throw new Error("Student not found. Please check the ID.");
    }
    
    const studentDoc = snapshot.docs[0];
    const studentData = studentDoc.data() as StudentProfile;
    
    if (studentData.org_ids?.includes(orgId)) {
      throw new Error("Student is already linked to your organization.");
    }
    
    await studentDoc.ref.update({
      [`org_links.${orgId}`]: {
        org_name: orgDoc.data()?.organization_name || "Organization",
        grade: importData.grade,
        section: importData.section || null,
        assigned_combos: importData.assignedCombos,
        status: 'pending',
        requested_at: new Date().toISOString()
      }
    });

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function updateStudentDetails(
  idToken: string,
  uid: string,
  updateData: {
    grade: string;
    section?: string;
    assignedCombos: string[];
    emergencyContact?: string;
  }
) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const orgId = decodedToken.uid;
    
    const studentRef = adminDb.collection('users').doc(uid);
    const doc = await studentRef.get();
    
    if (!doc.exists) throw new Error("Student not found");
    const data = doc.data() as StudentProfile;
    
    if (!data.org_ids?.includes(orgId)) {
      throw new Error("Unauthorized: Student does not belong to your organization.");
    }
    
    await studentRef.update({
      [`org_links.${orgId}.grade`]: updateData.grade,
      [`org_links.${orgId}.section`]: updateData.section || null,
      [`org_links.${orgId}.assigned_combos`]: updateData.assignedCombos,
      emergency_contact: updateData.emergencyContact || null
    });
    
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function revokeStudentAccess(idToken: string, uid: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const orgId = decodedToken.uid;
    
    const studentRef = adminDb.collection('users').doc(uid);
    const doc = await studentRef.get();
    
    if (!doc.exists) throw new Error("Student not found");
    const data = doc.data() as StudentProfile;
    
    if (!data.org_ids?.includes(orgId)) {
      throw new Error("Unauthorized: Student does not belong to your organization.");
    }
    
    await studentRef.update({
      org_ids: FieldValue.arrayRemove(orgId),
      [`org_links.${orgId}`]: FieldValue.delete()
    });
    
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function provisionChildAccount(
  idToken: string,
  childData: {
    fullName: string;
    grade: string;
    pin: string;
  }
) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const parentUid = decodedToken.uid;
    
    const parentDoc = await adminDb.collection('users').doc(parentUid).get();
    if (!parentDoc.exists || parentDoc.data()?.role !== 'parent') {
      throw new Error("Unauthorized: Only parents can create direct child accounts.");
    }
    const parentName = parentDoc.data()?.full_name || "Unknown Parent";
    const parentEmail = parentDoc.data()?.email || "";
    const parentContact = parentDoc.data()?.phone || parentDoc.data()?.contact_number || "";
    
    

    const studentId = await generateGlobalStudentId();
    const studentEmail = `${studentId.toLowerCase()}@student.kortex.app`;

    const userRecord = await adminAuth.createUser({
      email: studentEmail,
      password: childData.pin,
      displayName: childData.fullName,
    });
    
    const studentUid = userRecord.uid;

    const newStudent: StudentProfile = {
      uid: studentUid,
      kortex_id: studentId,
      full_name: childData.fullName,
      username: studentId, 
      plain_pin: childData.pin,
      role: 'student',
      grade: childData.grade,
      parent_id: parentUid,
      parent_name: parentName,
      parent_email: parentEmail,
      emergency_contact: parentContact,
      org_ids: [],
      org_links: {},
      teacher_ids: [],
      active_b2c_licenses: [],
      hearts_remaining: 5,
      last_heart_reset: new Date().toISOString(),
      status: 'active',
      accountStatus: 'ACTIVE',
      deletedBy: null,
      deletedAt: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const batch = adminDb.batch();
    
    const studentRef = adminDb.collection('users').doc(studentUid);
    batch.set(studentRef, newStudent);
    
    const parentRef = adminDb.collection('users').doc(parentUid);
    batch.update(parentRef, {
      children_ids: FieldValue.arrayUnion(studentUid),
      updated_at: new Date().toISOString()
    });
    
    await batch.commit();

    return { 
      success: true, 
      studentId: studentId, 
      uid: studentUid 
    };
  } catch (error: unknown) {
    console.error("Error provisioning child:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function claimProvisionedChild(
  idToken: string,
  claimData: {
    kortexId: string;
    claimCode: string;
    pin: string;
  }
) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const parentUid = decodedToken.uid;
    
    const parentDoc = await adminDb.collection('users').doc(parentUid).get();
    if (!parentDoc.exists || parentDoc.data()?.role !== 'parent') {
      throw new Error("Unauthorized: Only parents can claim child accounts.");
    }
    const parentName = parentDoc.data()?.full_name || "Unknown Parent";
    const parentEmail = parentDoc.data()?.email || "";
    const parentContact = parentDoc.data()?.phone || parentDoc.data()?.contact_number || "";
    
    const cleanKortexId = claimData.kortexId.toUpperCase().trim();

    const querySnap = await adminDb.collection('users')
      .where('role', '==', 'student')
      .where('kortex_id', '==', cleanKortexId)
      .where('parent_id', '==', 'PENDING')
      .limit(1)
      .get();

    if (querySnap.empty) {
      throw new Error("Invalid or already claimed Organization ID.");
    }
    const studentDoc = querySnap.docs[0];
    if (studentDoc.data().claim_code !== claimData.claimCode.toUpperCase().trim()) {
      throw new Error("Invalid Claim Code.");
    }

    const studentUid = studentDoc.id;
    const studentEmail = `${cleanKortexId.toLowerCase()}@student.kortex.app`;
    
    try {
      await adminAuth.getUser(studentUid);
      throw new Error("Auth user already exists for this placeholder.");
    } catch (e: any) {
      if (e.code !== 'auth/user-not-found') throw e;
    }

    await adminAuth.createUser({
      uid: studentUid,
      email: studentEmail,
      password: claimData.pin,
      displayName: studentDoc.data().full_name,
    });

    const batch = adminDb.batch();
    batch.update(studentDoc.ref, {
      parent_id: parentUid,
      claim_code: FieldValue.delete(),
      parent_name: parentName,
      parent_email: parentEmail,
      emergency_contact: parentContact,
      plain_pin: claimData.pin,
      status: 'active',
      accountStatus: 'ACTIVE',
      deletedBy: null,
      deletedAt: null,
      updated_at: new Date().toISOString()
    });
    
    const parentRef = adminDb.collection('users').doc(parentUid);
    batch.update(parentRef, {
      children_ids: FieldValue.arrayUnion(studentUid),
      updated_at: new Date().toISOString()
    });
    
    await batch.commit();

    return { 
      success: true, 
      studentId: cleanKortexId, 
      uid: studentUid 
    };
  } catch (error: unknown) {
    console.error("Error claiming child:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function resolveTransferRequest(
  idToken: string,
  studentUid: string,
  orgId: string,
  accept: boolean
) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const parentUid = decodedToken.uid;
    
    const studentRef = adminDb.collection('users').doc(studentUid);
    const studentDoc = await studentRef.get();
    
    if (!studentDoc.exists) throw new Error("Student not found.");
    if (studentDoc.data()?.parent_id !== parentUid) throw new Error("Unauthorized.");
    
    const parentDoc = await adminDb.collection('users').doc(parentUid).get();
    
    const parentName = parentDoc.data()?.full_name || "Unknown Parent";
    const parentEmail = parentDoc.data()?.email || "";
    const parentContact = parentDoc.data()?.phone || parentDoc.data()?.contact_number || "";
    
    
    const data = studentDoc.data()!;
    const link = data.org_links?.[orgId];
    
    if (!link || link.status !== 'pending') {
      throw new Error("No pending transfer request found for this organization.");
    }

    if (accept) {
      await studentRef.update({
        [`org_links.${orgId}.status`]: 'approved',
        parent_email: parentEmail,
        emergency_contact: parentContact,
        parent_name: parentName,
        updated_at: new Date().toISOString()
      });
    } else {
      await studentRef.update({
        org_ids: FieldValue.arrayRemove(orgId),
        [`org_links.${orgId}`]: FieldValue.delete(),
        updated_at: new Date().toISOString()
      });
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Error resolving transfer:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

import { generateComboId } from '../../kortex_users/org_admin/utils/comboParsers';

export async function getStudentAcademicDetails(idToken: string, studentUid: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const parentUid = decodedToken.uid;
    
    const studentDoc = await adminDb.collection('users').doc(studentUid).get();
    if (!studentDoc.exists) throw new Error("Student not found.");
    
    const studentData = studentDoc.data() as StudentProfile;
    
    if (studentData.parent_id !== parentUid) {
      throw new Error("Unauthorized access.");
    }

    const orgLinks = studentData.org_links || {};
    const approvedOrgIds = Object.keys(orgLinks).filter(id => orgLinks[id].status === 'approved');

    if (approvedOrgIds.length === 0) {
      return {
        success: true,
        orgAcademics: []
      };
    }

    const orgAcademics = [];

    for (const orgId of approvedOrgIds) {
      const linkData = orgLinks[orgId];
      const orgDoc = await adminDb.collection('users').doc(orgId).get();
      const orgData = orgDoc.data();
      if (!orgData) continue;
      
      const orgName = orgData.organization_name || "Organization";
      const orgKortexId = orgData.kortex_id || "";
      const allOrgCombos: string[] = orgData.approved_grade_subject_combos || [];

      const defaultPrefix = `${linkData.grade} - Section ${linkData.section || 'A'}`;
      const assignedComboIds = linkData.assigned_combos || [];
      
      let combinedList: { str: string, isExtra: boolean }[] = [];

      // Fallback for legacy students who don't have assigned_combos populated yet
      if (assignedComboIds.length === 0) {
        const defaultComboStrings = allOrgCombos.filter(c => c.startsWith(defaultPrefix));
        combinedList = defaultComboStrings.map(c => ({ str: c, isExtra: false }));
      } else {
        // New explicit logic: Only include exactly what's in assigned_combos
        const explicitlyAssignedStrings = allOrgCombos.filter(c => {
          const id = generateComboId(orgKortexId, c);
          return assignedComboIds.includes(id);
        });
        
        // We still determine 'isExtra' purely by whether it matches the default grade prefix
        // just for UI rendering purposes if needed.
        combinedList = explicitlyAssignedStrings.map(c => ({
          str: c,
          isExtra: !c.startsWith(defaultPrefix)
        }));
      }

      const teachersSnap = await adminDb.collection('users')
        .where('role', '==', 'teacher')
        .where('org_ids', 'array-contains', orgId)
        .get();
        
      const legacyTeachersSnap = await adminDb.collection('users')
        .where('role', '==', 'teacher')
        .where('org_id', '==', orgId)
        .get();
        
      const allTeachersDocs = [...teachersSnap.docs, ...legacyTeachersSnap.docs];
      const uniqueTeacherDocs = Array.from(new Map(allTeachersDocs.map(doc => [doc.id, doc])).values());
        
      const teachers = uniqueTeacherDocs.map(doc => ({
        uid: doc.id,
        name: doc.data().full_name,
        combos: doc.data().assigned_combos || []
      }));

      const subjects = combinedList.map(item => {
        const parts = item.str.split('-');
        const subjectName = parts.length > 2 ? parts[parts.length - 1].trim() : item.str;
        const comboId = generateComboId(orgKortexId, item.str);
        
        const teacher = teachers.find(t => t.combos.includes(comboId));
        
        return {
          subjectName,
          isExtra: item.isExtra,
          teacherName: teacher ? teacher.name : "Pending Assignment",
          comboString: item.str
        };
      });

      orgAcademics.push({
        orgId,
        orgName,
        grade: linkData.grade,
        section: linkData.section,
        subjects
      });
    }

    return {
      success: true,
      orgAcademics
    };

  } catch (error: unknown) {
    console.error("Error fetching academic details:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function checkAndResetDailyHearts(idToken: string, studentUid: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const callerUid = decodedToken.uid;
    if (callerUid !== studentUid) {
      throw new Error("Unauthorized to check hearts for this student");
    }

    const studentRef = adminDb.collection('users').doc(studentUid);
    const doc = await studentRef.get();
    if (!doc.exists) throw new Error("Student not found");
    const data = doc.data();

    if (!data?.last_heart_reset) return { success: true }; // Legacy data handling

    const lastReset = new Date(data.last_heart_reset);
    const now = new Date();
    
    // Check if 24 hours have passed or if it's a new calendar day
    const isNewDay = 
      now.getFullYear() > lastReset.getFullYear() ||
      now.getMonth() > lastReset.getMonth() ||
      now.getDate() > lastReset.getDate() ||
      (now.getTime() - lastReset.getTime()) > 24 * 60 * 60 * 1000;

    if (isNewDay) {
      await studentRef.update({
        hearts_remaining: 5,
        last_heart_reset: now.toISOString(),
        updated_at: now.toISOString()
      });
      return { success: true, hearts: 5, reset: true };
    }

    return { success: true, hearts: data.hearts_remaining, reset: false };
  } catch (error) {
    console.error("Error checking hearts:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function consumeHeart(idToken: string, studentUid: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const callerUid = decodedToken.uid;
    if (callerUid !== studentUid) {
      throw new Error("Unauthorized to consume heart for this student");
    }

    const studentRef = adminDb.collection('users').doc(studentUid);
    
    await adminDb.runTransaction(async (t) => {
      const doc = await t.get(studentRef);
      if (!doc.exists) throw new Error("Student not found");
      
      const currentHearts = doc.data()?.hearts_remaining || 0;
      if (currentHearts <= 0) {
        throw new Error("OUT_OF_ENERGY");
      }
      
      t.update(studentRef, {
        hearts_remaining: currentHearts - 1,
        updated_at: new Date().toISOString()
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Error consuming heart:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}


export async function deleteIndividualUser(idToken: string, uidToDelete: string, roleToDelete: string): Promise<{ success: boolean; error?: string }> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const caller = await adminAuth.getUser(decodedToken.uid);
    // Assuming 'krew' or 'admin' can do this, but usually just checking the db for role
    const callerDoc = await adminDb.collection('users').doc(caller.uid).get();
    if (!callerDoc.exists || (callerDoc.data()?.role !== 'admin' && callerDoc.data()?.role !== 'krew')) {
       return { success: false, error: 'Unauthorized. Only Admins can delete users.' };
    }

    if (roleToDelete === 'parent') {
      // Cascade delete children
      const studentsSnap = await adminDb.collection('users').where('parent_id', '==', uidToDelete).get();
      const batch = adminDb.batch();
      const childUids = [];
      studentsSnap.docs.forEach(doc => {
         batch.delete(doc.ref);
         childUids.push(doc.id);
      });
      if (childUids.length > 0) {
        await batch.commit();
        await adminAuth.deleteUsers(childUids);
      }
    }
    
    // Delete the target user
    await adminDb.collection('users').doc(uidToDelete).delete();
    await adminAuth.deleteUser(uidToDelete);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


export async function updateIndividualUser(idToken: string, uidToUpdate: string, updateData: any): Promise<{ success: boolean; error?: string }> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const caller = await adminAuth.getUser(decodedToken.uid);
    const callerDoc = await adminDb.collection('users').doc(caller.uid).get();
    if (!callerDoc.exists || (callerDoc.data()?.role !== 'admin' && callerDoc.data()?.role !== 'krew')) {
       return { success: false, error: 'Unauthorized. Only Admins can edit users.' };
    }

    // Clean data (prevent role escalation or critical uid changes)
    const safeData = { ...updateData };
    delete safeData.uid;
    delete safeData.role;
    delete safeData.org_id;
    delete safeData.org_ids;
    delete safeData.parent_id;
    
    // Update the target user in Firestore
    await adminDb.collection('users').doc(uidToUpdate).update(safeData);

    // If email is updated, update in Auth as well
    if (safeData.email) {
       await adminAuth.updateUser(uidToUpdate, { email: safeData.email });
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


export async function updateParentProfile(
  idToken: string,
  updateData: {
    fullName: string;
    contactNumber: string;
    email: string;
    city?: string;
    state?: string;
    country?: string;
  }
) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const parentUid = decodedToken.uid;
    
    const parentRef = adminDb.collection('users').doc(parentUid);
    const parentDoc = await parentRef.get();
    
    const currentData = parentDoc.data();
    if (!parentDoc.exists || currentData?.role !== 'parent') {
      throw new Error("Unauthorized: Not a parent.");
    }
    
    const batch = adminDb.batch();
    
    const parentUpdateObj: any = {
      full_name: updateData.fullName,
      phone: updateData.contactNumber,
      email: updateData.email,
      updated_at: new Date().toISOString()
    };

    // If the phone number changed, revoke verification
    const currentPhone = (currentData?.phone || currentData?.contact_number || '').replace(/\s/g, '');
    const newPhone = (updateData.contactNumber || '').replace(/\s/g, '');
    
    if (currentPhone !== newPhone) {
      // Check if the user successfully did inline verification which linked the phone to their Auth account
      const authUser = await adminAuth.getUser(parentUid);
      const linkedPhone = (authUser.phoneNumber || '').replace(/\s/g, '');
      
      if (linkedPhone === newPhone) {
        parentUpdateObj.phoneVerified = true;
        parentUpdateObj.onboardingStatus = 'ACTIVE';
      } else {
        parentUpdateObj.phoneVerified = false;
        parentUpdateObj.onboardingStatus = 'PENDING_PHONE';
      }
      

    }
    if (updateData.city !== undefined) parentUpdateObj.city = updateData.city;
    if (updateData.state !== undefined) parentUpdateObj.state = updateData.state;
    if (updateData.country !== undefined) parentUpdateObj.country = updateData.country;

    batch.update(parentRef, parentUpdateObj);
    
    // Update all linked children to sync the data for Org Admins!
    const childrenSnap = await adminDb.collection('users').where('parent_id', '==', parentUid).get();
    childrenSnap.docs.forEach(childDoc => {
      batch.update(childDoc.ref, {
        parent_name: updateData.fullName,
        parent_email: updateData.email,
        emergency_contact: updateData.contactNumber
      });
    });
    
    await batch.commit();

    // Finally update email in Firebase Auth
    if (updateData.email && decodedToken.email !== updateData.email) {
      await adminAuth.updateUser(parentUid, { email: updateData.email });
    }
    
    return { success: true };
  } catch (error: unknown) {
    console.error("Error updating parent profile:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}


export async function logStudentActivity(
  idToken: string,
  activityData: {
    toolId: string;
    chapterName: string;
    subjectId: string;
    score?: number;
    timeSpentSeconds?: number;
  }
) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const studentUid = decodedToken.uid;
    
    const studentRef = adminDb.collection('users').doc(studentUid);
    const studentDoc = await studentRef.get();
    
    if (!studentDoc.exists || studentDoc.data()?.role !== 'student') {
      throw new Error("Unauthorized: Only students can log progress.");
    }

    const data = studentDoc.data() as any;
    
    // 1. Calculate Streak
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
    let streak = data.current_streak_days || 0;
    const lastActive = data.last_active_date;
    
    if (lastActive !== dateString) {
       if (lastActive) {
         // Strictly compare just the dates at midnight UTC to prevent timezone/hour shifting
         const todayDate = new Date(dateString);
         const lastDate = new Date(lastActive);
         const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
         const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
         
         if (diffDays === 1) {
           streak += 1;
         } else {
           streak = 1;
         }
       } else {
         streak = 1;
       }
    }
    
    // 2. Award XP and check Badges
    const earnedXp = 50; 
    const totalXp = (data.total_xp || 0) + earnedXp;
    
    let achievements = data.achievements || [];
    if (!achievements.includes('first_game')) achievements.push('first_game');
    if (streak >= 3 && !achievements.includes('streak_3_days')) achievements.push('streak_3_days');
    if (streak >= 7 && !achievements.includes('streak_7_days')) achievements.push('streak_7_days');
    if (totalXp >= 500 && !achievements.includes('xp_500')) achievements.push('xp_500');

    const batch = adminDb.batch();

    batch.update(studentRef, {
      current_streak_days: streak,
      last_active_date: dateString,
      total_xp: totalXp,
      achievements: achievements,
      updated_at: new Date().toISOString()
    });

    // 3. Update Progress Document
    const progressRef = studentRef.collection('progress').doc(activityData.subjectId || 'general');
    const progressDoc = await progressRef.get();
    
    let progressData = progressDoc.exists ? progressDoc.data() : {
      subject_id: activityData.subjectId || 'general',
      xp: 0,
      total_time_spent_seconds: 0,
      completed_tools: {}
    };
    
    progressData.xp = (progressData.xp || 0) + earnedXp;
    progressData.total_time_spent_seconds = (progressData.total_time_spent_seconds || 0) + (activityData.timeSpentSeconds || 0);
    progressData.last_played_at = new Date().toISOString();
    
    const toolKey = activityData.toolId.replace(/\./g, '_'); // sanitize firestore keys
    const toolData = progressData.completed_tools[toolKey] || {
       chapter_name: activityData.chapterName,
       times_completed: 0,
    };
    
    toolData.times_completed += 1;
    toolData.last_played_at = new Date().toISOString();
    
    if (activityData.score !== undefined) {
       if (toolData.best_score === undefined || activityData.score > toolData.best_score) {
          toolData.best_score = activityData.score;
       }
    }
    
    progressData.completed_tools[toolKey] = toolData;
    
    if (progressDoc.exists) {
      batch.update(progressRef, progressData);
    } else {
      batch.set(progressRef, progressData);
    }

    // 4. Update Leaderboard
    if (activityData.score !== undefined) {
      const leaderboardRef = adminDb.collection('leaderboards').doc(toolKey).collection('scores').doc(studentUid);
      const lbDoc = await leaderboardRef.get();
      if (!lbDoc.exists || lbDoc.data()?.score < activityData.score) {
        batch.set(leaderboardRef, {
          score: activityData.score,
          student_name: data.full_name || 'Anonymous Student',
          updated_at: new Date().toISOString()
        });
      }
    }
    
    // 5. Intercept and auto-complete active assignments for this tool
    const assignmentSnap = await adminDb.collection('assignments')
      .where('assigned_to', 'array-contains', studentUid)
      .where('tool_id', '==', activityData.toolId)
      .where('status', '==', 'active')
      .get();
      
    assignmentSnap.docs.forEach(doc => {
       const subRef = studentRef.collection('submissions').doc(doc.id);
       batch.set(subRef, {
           assignment_id: doc.id,
           status: 'submitted',
           submitted_at: new Date().toISOString(),
           score: activityData.score !== undefined ? activityData.score : null
       }, { merge: true });
    });

    await batch.commit();

    return { 
      success: true, 
      streak, 
      xpEarned: earnedXp,
      totalXp,
      achievementsUnlocked: achievements.length > (data.achievements?.length || 0)
    };
  } catch (error: unknown) {
    console.error("Error logging student activity:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}


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


export async function getStudentOrgProfiles(idToken: string, orgIds: string[]) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const callerDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const callerData = callerDoc.data();
    
    const orgProfiles: Record<string, any> = {};
    for (const orgId of orgIds) {
      // Security Guard: Prevent scraping. Only allow fetching orgs the user belongs to.
      if (callerData?.role !== 'admin' && callerData?.role !== 'krew' && 
          callerData?.org_id !== orgId && !(callerData?.org_ids || []).includes(orgId)) {
          continue; 
      }
      
      const snap = await adminDb.collection('users').doc(orgId).get();
      if (snap.exists) {
         const data = snap.data() as any;
         orgProfiles[orgId] = {
           kortex_id: data.kortex_id,
           full_name: data.full_name,
           approved_grade_subject_combos: data.approved_grade_subject_combos || []
         };
      }
    }
    return { success: true, orgProfiles };
  } catch (error: unknown) {
    console.error("Error fetching org profiles:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getStudentAssignments(idToken: string, targetUid?: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    let studentUid = decodedToken.uid;
    
    if (targetUid && targetUid !== studentUid) {
       // Validate caller is parent of targetUid
       const docSnap = await adminDb.collection('users').doc(studentUid).get();
       const data = docSnap.data();
       if (data?.role === 'parent' && data?.children_ids?.includes(targetUid)) {
           studentUid = targetUid;
       } else {
           throw new Error("Unauthorized to view this student's assignments");
       }
    }
    
    // Fetch all active assignments assigned to this student
    const assignmentsSnap = await adminDb.collection('assignments')
      .where('assigned_to', 'array-contains', studentUid)
      .where('status', '==', 'active')
      .get();
      
    const assignmentDocs = assignmentsSnap.docs.map(d => {
       const data = d.data();
       // PII Sanitization: Do not leak the UIDs of other classmates to the client
       delete data.assigned_to; 
       return serializeFirebaseData({ id: d.id, ...data });
    });

    // Fetch student's submissions
    const subSnap = await adminDb.collection('users').doc(studentUid).collection('submissions').get();
    const subMap: Record<string, any> = {};
    subSnap.docs.forEach(doc => {
       subMap[doc.id] = doc.data();
    });

    const merged = assignmentDocs.map((a: any) => {
       const sub = subMap[a.id];
       let status = sub?.status || 'pending';
       const dueDateObj = new Date(a.due_date);
       
       if (status === 'submitted' && new Date() > dueDateObj) {
           if (sub?.score !== undefined && sub?.score !== null) {
               status = 'graded';
           }
       }
       
       let isOnTime = true;
       if (sub?.submitted_at) {
          isOnTime = new Date(sub.submitted_at) <= dueDateObj;
       } else if (status === 'pending') {
          isOnTime = new Date() <= dueDateObj;
       }

       return {
          id: a.id,
          title: a.title || 'Untitled',
          subject: a.chapter_name === 'Unknown' ? (a.tool_type !== 'unknown' ? a.tool_type : 'Task') : (a.chapter_name || a.combo_id),
          status: status,
          dueDate: a.due_date,
          link: a.tool_id,
          toolType: a.tool_type,
          submittedDate: sub?.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : undefined,
          isOnTime: isOnTime,
          score: sub?.score,
          totalPoints: 100,
          grade: sub?.score === 'N/A' ? 'Completed' : (sub?.score ? sub.score + '/100' : ''),
          instructions: a.instructions,
          externalLink: a.external_link
       };
    });

    return { success: true, assignments: merged };
  } catch (error: any) {
    console.error("Error fetching student assignments:", error);
    return { success: false, error: error.message };
  }
}

export async function updateUserSessionToken(idToken: string, sessionToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    await adminDb.collection('users').doc(decodedToken.uid).update({
      session_token: sessionToken,
      updated_at: new Date().toISOString()
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error updating session token:", error);
    return { success: false, error: error.message };
  }
}

export async function markAssignmentAsDone(idToken: string, assignmentId: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const studentUid = decodedToken.uid;
    
    const subRef = adminDb.collection('users').doc(studentUid).collection('submissions').doc(assignmentId);
    await subRef.set({
       assignment_id: assignmentId,
       status: 'submitted',
       submitted_at: new Date().toISOString(),
       score: null
    }, { merge: true });
    
    return { success: true };
  } catch (error: any) {
    console.error("Error marking assignment as done:", error);
    return { success: false, error: error.message };
  }
}

export async function bulkProvisionStudents(
  idToken: string,
  grade: string,
  section: string,
  assignedCombos: string[],
  students: { fullName: string; parentEmail?: string; parentPhone?: string }[]
) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const callerUid = decodedToken.uid;

    const callerDoc = await adminDb.collection('users').doc(callerUid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'org_admin') {
      throw new Error("Unauthorized: Only Organization Admins can bulk provision students.");
    }
    const orgId = callerUid;
    const orgName = callerDoc.data()?.organization_name || "Organization";

    if (students.length === 0) return { success: false, error: "No students provided." };
    if (students.length > 40) return { success: false, error: "Cannot upload more than 40 students at once." };

    // Strict Quota Check
    const existingStudentsSnap = await adminDb.collection('users')
      .where('role', '==', 'student')
      .where('org_ids', 'array-contains', orgId)
      .get();
      
    // Count how many match the exact grade and section
    let currentCount = 0;
    existingStudentsSnap.docs.forEach(doc => {
       const data = doc.data();
       const link = data.org_links?.[orgId];
       if (link && link.grade === grade && link.section === section) {
         currentCount++;
       }
    });

    if (currentCount + students.length > 40) {
      return { 
        success: false, 
        error: `Upload rejected. Grade ${grade} - ${section} currently has ${currentCount} students. Adding ${students.length} would exceed the strict 40-student limit.` 
      };
    }

    // Generate all IDs at once to prevent transaction collision
    const kortexIds = await generateMultipleGlobalStudentIds(students.length);

    // Batch write
    const batch = adminDb.batch();

    students.forEach((student, index) => {
      const placeholderRef = adminDb.collection('users').doc();
      const claimCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const kortexId = kortexIds[index];

      const newStudent: StudentProfile = {
        uid: placeholderRef.id,
        kortex_id: kortexId,
        full_name: student.fullName,
        username: `pending_${placeholderRef.id.substring(0, 8)}`,
        role: 'student',
        grade: grade,
        section: section,
        active_b2c_licenses: [],
        hearts_remaining: 5,
        last_heart_reset: new Date().toISOString(),
        emergency_contact: student.parentPhone || student.parentEmail || '',
        parent_id: 'PENDING',
        claim_code: claimCode,
        org_ids: [orgId],
        org_links: {
          [orgId]: {
            org_name: orgName,
            grade: grade,
            section: section,
            assigned_combos: assignedCombos,
            status: 'pending'
          }
        },
        teacher_ids: [],
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      batch.set(placeholderRef, newStudent);
    });

    await batch.commit();

    return { success: true, message: `Successfully provisioned ${students.length} students.` };
  } catch (error: any) {
    console.error("Error in bulkProvisionStudents:", error);
    return { success: false, error: error.message };
  }
}
export async function getChildProgressAndTotals(idToken: string, childUid: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const parentUid = decodedToken.uid;
    
    const studentDoc = await adminDb.collection('users').doc(childUid).get();
    if (!studentDoc.exists) throw new Error("Student not found.");
    
    const studentData = studentDoc.data();
    if (studentData?.parent_id !== parentUid) {
      throw new Error("Unauthorized access.");
    }
    
    const progressSnap = await adminDb.collection('users').doc(childUid).collection('progress').get();
    const progressData = progressSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const totalsDoc = await adminDb.collection('metadata').doc('curriculum_totals').get();
    const totals = totalsDoc.exists ? totalsDoc.data() : {};
    
    return {
      success: true,
      progressData,
      subjectTotals: totals
    };
  } catch (error: any) {
    console.error("Error fetching child progress:", error);
    return { success: false, error: error.message };
  }
}

export async function parentUnlinkChildFromOrg(idToken: string, childUid: string, orgId: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const parentUid = decodedToken.uid;
    
    const studentRef = adminDb.collection('users').doc(childUid);
    const studentDoc = await studentRef.get();
    
    if (!studentDoc.exists) throw new Error("Student not found.");
    if (studentDoc.data()?.parent_id !== parentUid) throw new Error("Unauthorized: Not your child.");

    const batch = adminDb.batch();
    batch.update(studentRef, {
      org_ids: FieldValue.arrayRemove(orgId),
      [`org_links.${orgId}`]: FieldValue.delete(),
      updated_at: new Date().toISOString()
    });

    const assignmentsSnap = await adminDb.collection('assignments')
      .where('assigned_to', 'array-contains', childUid)
      .where('org_id', '==', orgId)
      .get();
      
    assignmentsSnap.docs.forEach(doc => {
      batch.update(doc.ref, {
        assigned_to: FieldValue.arrayRemove(childUid)
      });
      const subRef = studentRef.collection('submissions').doc(doc.id);
      batch.delete(subRef);
    });

    await batch.commit();

    return { success: true };
  } catch (error: any) {
    console.error("Error unlinking child from org:", error);
    return { success: false, error: error.message };
  }
}

export async function parentDeleteChildAccount(idToken: string, childUid: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const parentUid = decodedToken.uid;
    
    const studentRef = adminDb.collection('users').doc(childUid);
    const studentDoc = await studentRef.get();
    
    if (!studentDoc.exists) throw new Error("Student not found.");
    if (studentDoc.data()?.parent_id !== parentUid) throw new Error("Unauthorized: Not your child.");

    const batch = adminDb.batch();

    const assignmentsSnap = await adminDb.collection('assignments')
      .where('assigned_to', 'array-contains', childUid)
      .get();
      
    assignmentsSnap.docs.forEach(doc => {
      batch.update(doc.ref, {
        assigned_to: FieldValue.arrayRemove(childUid)
      });
    });

    const parentRef = adminDb.collection('users').doc(parentUid);
    batch.update(parentRef, {
      children_ids: FieldValue.arrayRemove(childUid),
      updated_at: new Date().toISOString()
    });

    batch.delete(studentRef);

    await batch.commit();
    
    await adminAuth.deleteUser(childUid);

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting child account:", error);
    return { success: false, error: error.message };
  }
}

export async function grantHeart(idToken: string, studentUid: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Parent can grant to their children, student to themselves
    if (decodedToken.role === 'parent') {
      const parentDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
      const parentData = parentDoc.data();
      if (!parentData?.children?.includes(studentUid)) {
        throw new Error("Unauthorized to grant heart for this student");
      }
    } else if (decodedToken.uid !== studentUid) {
      throw new Error("Unauthorized to grant heart for this student");
    }

    const studentRef = adminDb.collection('users').doc(studentUid);
    
    await adminDb.runTransaction(async (transaction: any) => {
      const doc = await transaction.get(studentRef);
      if (!doc.exists) throw new Error("Student not found");
      
      const currentHearts = doc.data()?.hearts_remaining || 0;
      if (currentHearts < 5) {
        transaction.update(studentRef, {
          hearts_remaining: currentHearts + 1,
        });
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Error granting heart:", error);
    return { success: false, error: "Failed to grant heart" };
  }
}
