"use server";
import crypto from 'crypto';
import { serializeFirebaseData } from "../../utils/serialize";

import { adminDb, adminAuth } from '../../backend_configurations/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { StudentProfile } from '../../types/user';
import { generateComboId } from '../../kortex_users/org_admin/utils/comboParsers';

function sanitizeAssignedCombos(
  requestedCombos: string[] | undefined,
  orgKortexId: string,
  approvedComboStrings: string[] | undefined
): string[] {
  if (!requestedCombos || !Array.isArray(requestedCombos) || requestedCombos.length === 0) {
    return [];
  }
  const allowedComboIdSet = new Set(
    (approvedComboStrings || []).map(comboStr => generateComboId(orgKortexId, comboStr))
  );
  return requestedCombos.filter(id => allowedComboIdSet.has(id));
}

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
      ids.push(`STU_${alphabets}_${number}`);
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
    rollNo?: string;
  }
) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const callerUid = decodedToken.uid;

    const callerDoc = await adminDb.collection('users').doc(callerUid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'org_admin') {
      throw new Error("Unauthorized: Only Organization Admins can provision students.");
    }

    const callerData = callerDoc.data();
    const orgId = callerUid;
    const orgKortexId = callerData?.kortex_id || "";
    const approvedCombos = callerData?.approved_grade_subject_combos || [];
    const safeAssignedCombos = sanitizeAssignedCombos(provisionData.assignedCombos, orgKortexId, approvedCombos);

    // Strict Quota Check per Combination (40 seats max)
    if (safeAssignedCombos.length > 0) {
      const existingStudentsSnap = await adminDb.collection('users')
        .where('role', '==', 'student')
        .where('org_ids', 'array-contains', orgId)
        .get();

      const comboEnrollmentCounts: Record<string, number> = {};
      existingStudentsSnap.docs.forEach(doc => {
        const link = doc.data()?.org_links?.[orgId];
        if (link && Array.isArray(link.assigned_combos)) {
          link.assigned_combos.forEach((cid: string) => {
            comboEnrollmentCounts[cid] = (comboEnrollmentCounts[cid] || 0) + 1;
          });
        }
      });

      for (const cid of safeAssignedCombos) {
        const currentAssigned = comboEnrollmentCounts[cid] || 0;
        if (currentAssigned >= 40) {
          return {
            success: false,
            error: `Provisioning rejected. Combination "${cid}" has reached its full 40-seat capacity.`
          };
        }
      }
    }

    const kortexId = await generateGlobalStudentId();
    const claimCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const cleanRollNo = (provisionData.rollNo || '').trim() || null;

    const placeholderRef = adminDb.collection('users').doc();
    
    const newStudent: StudentProfile = {
      uid: placeholderRef.id,
      kortex_id: kortexId,
      full_name: provisionData.fullName,
      username: `pending_${placeholderRef.id.substring(0, 8)}`,
      role: 'student',
      grade: provisionData.grade,
      section: provisionData.section,
      roll_no: cleanRollNo,
      active_b2c_licenses: [],
      hearts_remaining: 5,
      last_heart_reset: new Date().toISOString(),
      emergency_contact: provisionData.emergencyContact,
      parent_id: 'PENDING',
      claim_code: claimCode,
      org_ids: [orgId],
      org_links: {
        [orgId]: {
          org_name: callerData?.organization_name || "Organization",
          grade: provisionData.grade,
          section: provisionData.section,
          roll_no: cleanRollNo,
          assigned_combos: safeAssignedCombos,
          status: 'approved'
        }
      },
      teacher_ids: [],
      status: 'pending',
      created_at: new Date().toISOString()
    };

    await placeholderRef.set(newStudent);

    // Sync organization seat and headcount counters
    await adminDb.collection('users').doc(orgId).update({
      active_students_count: FieldValue.increment(1),
      consumed_seats_count: FieldValue.increment(safeAssignedCombos.length),
      updated_at: new Date().toISOString()
    }).catch(err => console.warn("Failed to increment org counters:", err));

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
    rollNo?: string;
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
    const orgData = orgDoc.data();
    const orgKortexId = orgData?.kortex_id || "";
    const approvedCombos = orgData?.approved_grade_subject_combos || [];
    const safeAssignedCombos = sanitizeAssignedCombos(importData.assignedCombos, orgKortexId, approvedCombos);

    const cleanStudentId = (importData.studentId || '').trim().toUpperCase();
    
    const snapshot = await adminDb.collection('users')
      .where('role', '==', 'student')
      .where('kortex_id', '==', cleanStudentId)
      .limit(1)
      .get();
      
    if (snapshot.empty) {
      throw new Error("Student not found. Please check the ID.");
    }
    
    const studentDoc = snapshot.docs[0];
    const studentData = studentDoc.data() as StudentProfile;
    
    if (studentData.org_ids?.includes(orgId) && studentData.org_links?.[orgId]?.status === 'approved') {
      throw new Error("Student is already linked to your organization.");
    }

    const cleanRollNo = (importData.rollNo || '').trim() || null;
    
    await studentDoc.ref.update({
      org_ids: FieldValue.arrayUnion(orgId),
      [`org_links.${orgId}`]: {
        org_name: orgData?.organization_name || "Organization",
        grade: importData.grade,
        section: importData.section || null,
        roll_no: cleanRollNo,
        assigned_combos: safeAssignedCombos,
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
    rollNo?: string;
  }
) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const orgId = decodedToken.uid;

    const callerDoc = await adminDb.collection('users').doc(orgId).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'org_admin') {
      throw new Error("Unauthorized: Only Organization Admins can update student details.");
    }
    const callerData = callerDoc.data();
    const orgKortexId = callerData?.kortex_id || "";
    const approvedCombos = callerData?.approved_grade_subject_combos || [];
    const safeAssignedCombos = sanitizeAssignedCombos(updateData.assignedCombos, orgKortexId, approvedCombos);
    
    const studentRef = adminDb.collection('users').doc(uid);
    const doc = await studentRef.get();
    
    if (!doc.exists) throw new Error("Student not found");
    const data = doc.data() as StudentProfile;
    
    if (!data.org_ids?.includes(orgId)) {
      throw new Error("Unauthorized: Student does not belong to your organization.");
    }
    
    const updates: Record<string, any> = {
      [`org_links.${orgId}.grade`]: updateData.grade,
      [`org_links.${orgId}.section`]: updateData.section || null,
      [`org_links.${orgId}.assigned_combos`]: safeAssignedCombos,
      emergency_contact: updateData.emergencyContact || null
    };

    if (updateData.rollNo !== undefined) {
      const cleanRoll = updateData.rollNo.trim() || null;
      updates[`org_links.${orgId}.roll_no`] = cleanRoll;
      updates.roll_no = cleanRoll;
    }
    
    await studentRef.update(updates);
    
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
    
    const link = data.org_links?.[orgId];
    const revokedCombosCount = Array.isArray(link?.assigned_combos) ? link.assigned_combos.length : 0;

    await studentRef.update({
      org_ids: FieldValue.arrayRemove(orgId),
      [`org_links.${orgId}`]: FieldValue.delete()
    });

    // Decrement organization counters
    await adminDb.collection('users').doc(orgId).update({
      active_students_count: FieldValue.increment(-1),
      consumed_seats_count: FieldValue.increment(-revokedCombosCount),
      updated_at: new Date().toISOString()
    }).catch(err => console.warn("Failed to decrement org counters:", err));
    
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
    const parentRoles: string[] = parentDoc.data()?.roles || (parentDoc.data()?.role ? [parentDoc.data()?.role] : []);
    if (!parentDoc.exists || !parentRoles.includes('parent')) {
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

    const isParentPro = Boolean(parentDoc.data()?.is_pro);
    const parentProTier = parentDoc.data()?.pro_tier || 'pro';

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
      is_pro: isParentPro,
      pro_tier: isParentPro ? parentProTier : undefined,
      hearts_remaining: isParentPro ? 999 : 5,
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
    const parentRoles: string[] = parentDoc.data()?.roles || (parentDoc.data()?.role ? [parentDoc.data()?.role] : []);
    if (!parentDoc.exists || !parentRoles.includes('parent')) {
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
    
    let authUserExists = false;
    try {
      await adminAuth.getUser(studentUid);
      authUserExists = true;
    } catch (e: any) {
      if (e.code !== 'auth/user-not-found') throw e;
    }

    if (authUserExists) {
      await adminAuth.updateUser(studentUid, {
        password: claimData.pin,
        displayName: studentDoc.data().full_name,
      });
    } else {
      await adminAuth.createUser({
        uid: studentUid,
        email: studentEmail,
        password: claimData.pin,
        displayName: studentDoc.data().full_name,
      });
    }

    const isParentPro = Boolean(parentDoc.data()?.is_pro);
    const parentProTier = parentDoc.data()?.pro_tier || 'pro';

    const batch = adminDb.batch();
    batch.update(studentDoc.ref, {
      parent_id: parentUid,
      parent_name: parentName,
      parent_email: parentEmail,
      emergency_contact: parentContact,
      plain_pin: claimData.pin,
      status: 'active',
      accountStatus: 'ACTIVE',
      is_pro: isParentPro,
      pro_tier: isParentPro ? parentProTier : null,
      hearts_remaining: isParentPro ? 999 : (studentDoc.data().hearts_remaining ?? 5),
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
      const orgLink = link;
      const updatePayload: any = {
        [`org_links.${orgId}.status`]: 'approved',
        org_ids: FieldValue.arrayUnion(orgId),
        parent_email: parentEmail,
        emergency_contact: parentContact,
        parent_name: parentName,
        updated_at: new Date().toISOString()
      };
      if (orgLink.roll_no !== undefined && orgLink.roll_no !== null) {
        updatePayload.roll_no = orgLink.roll_no;
      }
      if (orgLink.grade) {
        updatePayload.grade = orgLink.grade;
      }
      if (orgLink.section !== undefined && orgLink.section !== null) {
        updatePayload.section = orgLink.section;
      }

      await studentRef.update(updatePayload);

      // Increment active_students_count for the organization if present
      await adminDb.collection('users').doc(orgId).update({
        active_students_count: FieldValue.increment(1),
        updated_at: new Date().toISOString()
      }).catch(err => console.warn("Failed to increment active_students_count:", err));
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

/**
 * Self-healing synchronization action:
 * Finds any students linked to this organization (with status 'approved' or 'pending')
 * whose org_ids array is missing the organization's UID, and repairs them.
 */
export async function syncOrgStudents(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const orgId = decodedToken.uid;

    const callerDoc = await adminDb.collection('users').doc(orgId).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'org_admin') {
      return { success: false, error: "Unauthorized" };
    }

    const callerData = callerDoc.data();
    const orgKortexId = callerData?.kortex_id || "";
    const approvedCombos = callerData?.approved_grade_subject_combos || [];
    const allowedComboIdSet = new Set(
      approvedCombos.map((comboStr: string) => generateComboId(orgKortexId, comboStr))
    );

    const studentsSnap = await adminDb.collection('users')
      .where('role', '==', 'student')
      .get();

    const batch = adminDb.batch();
    let fixedCount = 0;

    studentsSnap.docs.forEach(doc => {
      const data = doc.data() as StudentProfile;
      const orgLink = data.org_links?.[orgId];
      if (orgLink && (orgLink.status === 'approved' || orgLink.status === 'pending')) {
        let hasChanges = false;
        const updateObj: any = {};

        const orgIds: string[] = data.org_ids || [];
        if (!orgIds.includes(orgId)) {
          updateObj.org_ids = FieldValue.arrayUnion(orgId);
          hasChanges = true;
        }
        if (orgLink.roll_no && !data.roll_no) {
          updateObj.roll_no = orgLink.roll_no;
          hasChanges = true;
        }
        if (orgLink.grade && !data.grade) {
          updateObj.grade = orgLink.grade;
          hasChanges = true;
        }
        if (orgLink.section && !data.section) {
          updateObj.section = orgLink.section;
          hasChanges = true;
        }

        // Sanitize assigned_combos: purge unapproved combos
        if (Array.isArray(orgLink.assigned_combos) && orgLink.assigned_combos.length > 0) {
          const sanitizedCombos = orgLink.assigned_combos.filter((cid: string) => allowedComboIdSet.has(cid));
          if (sanitizedCombos.length !== orgLink.assigned_combos.length) {
            updateObj[`org_links.${orgId}.assigned_combos`] = sanitizedCombos;
            hasChanges = true;
          }
        }

        if (hasChanges) {
          updateObj.updated_at = new Date().toISOString();
          batch.update(doc.ref, updateObj);
          fixedCount++;
        }
      }
    });

    if (fixedCount > 0) {
      await batch.commit();
      console.log(`[syncOrgStudents] Repaired ${fixedCount} student record(s) for org ${orgId}`);
    }

    return { success: true, fixed: fixedCount };
  } catch (error: unknown) {
    console.error("Error in syncOrgStudents:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

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


export async function generateUserPasswordResetLink(idToken: string, email: string): Promise<{ success: boolean; link?: string; error?: string }> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const callerDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (!callerDoc.exists || (callerDoc.data()?.role !== 'admin' && callerDoc.data()?.role !== 'krew')) {
       return { success: false, error: 'Unauthorized. Only Admins can generate reset links.' };
    }
    const cleanEmail = email.trim().toLowerCase();
    const link = await adminAuth.generatePasswordResetLink(cleanEmail);
    return { success: true, link };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to generate password reset link.' };
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
    const safeData: any = { ...updateData };
    delete safeData.uid;
    delete safeData.role; // keep role locked to prevent accidental escalation

    // Clean any undefined fields so Firestore doesn't reject the payload
    Object.keys(safeData).forEach(key => {
      if (safeData[key] === undefined) {
        delete safeData[key];
      }
    });

    // Handle soft delete or restore if accountStatus changed
    if (safeData.accountStatus === 'DELETED') {
      safeData.deletedBy = 'kortex_admin';
      safeData.deletedAt = new Date().toISOString();
      safeData.status = 'suspended';
    } else if (safeData.accountStatus === 'ACTIVE') {
      safeData.deletedBy = null;
      safeData.deletedAt = null;
      if (safeData.status === 'suspended') {
        safeData.status = 'active';
      }
    } else if (safeData.accountStatus === 'SUSPENDED') {
      safeData.status = 'suspended';
    }

    safeData.updated_at = new Date().toISOString();
    
    // Update the target user in Firestore
    await adminDb.collection('users').doc(uidToUpdate).update(safeData);

    // If is_pro was updated on a parent, cascade to all linked children
    if (safeData.is_pro !== undefined) {
      try {
        const childrenSnap = await adminDb.collection('users')
          .where('role', '==', 'student')
          .where('parent_id', '==', uidToUpdate)
          .get();

        if (!childrenSnap.empty) {
          const proBatch = adminDb.batch();
          childrenSnap.docs.forEach(docSnap => {
            proBatch.update(docSnap.ref, {
              is_pro: Boolean(safeData.is_pro),
              pro_tier: safeData.is_pro ? (safeData.pro_tier || 'pro') : null,
              hearts_remaining: safeData.is_pro ? 999 : 5,
              updated_at: new Date().toISOString()
            });
          });
          await proBatch.commit();
        }
      } catch (childErr) {
        console.warn("Failed to cascade is_pro to children:", childErr);
      }
    }

    // Sync auth credentials safely if provided
    try {
      const authUpdates: any = {};
      if (safeData.email) authUpdates.email = String(safeData.email).trim().toLowerCase();
      if (safeData.full_name) authUpdates.displayName = String(safeData.full_name).trim();
      if (safeData.plain_pin) {
        authUpdates.password = String(safeData.plain_pin);
      }
      if (Object.keys(authUpdates).length > 0) {
        await adminAuth.updateUser(uidToUpdate, authUpdates);
      }
    } catch (authErr: any) {
      console.warn("Auth sync notice:", authErr.message);
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
    const parentRoles: string[] = currentData?.roles || (currentData?.role ? [currentData?.role] : []);
    if (!parentDoc.exists || !parentRoles.includes('parent')) {
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

    // 2b. Atomic Daily Activity in IST (Asia/Kolkata)
    const istDateString = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());

    const dailyActivityRef = studentRef.collection('daily_activity').doc(istDateString);
    const secondsSpent = (activityData.timeSpentSeconds && activityData.timeSpentSeconds > 0) ? activityData.timeSpentSeconds : 60;
    const starsEarned = (activityData.score && activityData.score >= 80) ? 3 : (activityData.score && activityData.score >= 50) ? 2 : 1;

    batch.set(dailyActivityRef, {
      date: istDateString,
      active_seconds: FieldValue.increment(secondsSpent),
      lessons_completed: FieldValue.increment(1),
      stars_earned: FieldValue.increment(starsEarned),
      last_updated: FieldValue.serverTimestamp()
    }, { merge: true });

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
      
    if (!assignmentSnap.empty) {
      for (const doc of assignmentSnap.docs) {
        const subRef = studentRef.collection('submissions').doc(doc.id);
        const subDoc = await subRef.get();
        // Guard: If assignment has already been graded by a teacher, lock score & status
        if (subDoc.exists && subDoc.data()?.status === 'graded') {
          continue;
        }
        batch.set(subRef, {
            assignment_id: doc.id,
            status: 'submitted',
            submitted_at: new Date().toISOString(),
            score: activityData.score !== undefined ? activityData.score : null
        }, { merge: true });
      }
    }

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
           full_name: data.organization_name || data.full_name || 'School',
           address: data.address || data.address_line1 || '',
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
       const callerRoles: string[] = data?.roles || (data?.role ? [data.role] : []);
       if (callerRoles.includes('parent') && data?.children_ids?.includes(targetUid)) {
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
          orgId: a.org_id,
          comboId: a.combo_id,
          title: a.title || 'Untitled',
          subject: a.subject || a.combo_id || (a.chapter_name === 'Unknown' ? (a.tool_type !== 'unknown' ? a.tool_type : 'Task') : (a.chapter_name || 'Assignment')),
          chapterName: a.chapter_name,
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
    const subDoc = await subRef.get();
    if (subDoc.exists && subDoc.data()?.status === 'graded') {
      return { success: false, error: "This assignment has already been graded and cannot be marked again." };
    }
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
  students: { fullName: string; parentEmail?: string; parentPhone?: string; rollNo?: string }[]
) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const callerUid = decodedToken.uid;

    const callerDoc = await adminDb.collection('users').doc(callerUid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'org_admin') {
      throw new Error("Unauthorized: Only Organization Admins can bulk provision students.");
    }
    const callerData = callerDoc.data();
    const orgId = callerUid;
    const orgName = callerData?.organization_name || "Organization";
    const orgKortexId = callerData?.kortex_id || "";
    const approvedCombos = callerData?.approved_grade_subject_combos || [];
    const safeAssignedCombos = sanitizeAssignedCombos(assignedCombos, orgKortexId, approvedCombos);

    if (students.length === 0) return { success: false, error: "No students provided." };
    if (students.length > 40) return { success: false, error: "Cannot upload more than 40 students at once." };

    // Strict Quota Check
    const existingStudentsSnap = await adminDb.collection('users')
      .where('role', '==', 'student')
      .where('org_ids', 'array-contains', orgId)
      .get();
      
    // Count how many match the exact grade and section, and track combo seats
    let currentCount = 0;
    const comboEnrollmentCounts: Record<string, number> = {};

    existingStudentsSnap.docs.forEach(doc => {
       const data = doc.data();
       const link = data.org_links?.[orgId];
       if (link && link.grade === grade && link.section === section) {
         currentCount++;
       }
       if (link && Array.isArray(link.assigned_combos)) {
         link.assigned_combos.forEach((cid: string) => {
           comboEnrollmentCounts[cid] = (comboEnrollmentCounts[cid] || 0) + 1;
         });
       }
    });

    if (currentCount + students.length > 40) {
      return { 
        success: false, 
        error: `Upload rejected. Grade ${grade} - Section ${section} currently has ${currentCount} students. Adding ${students.length} would exceed the 40-student classroom limit.` 
      };
    }

    // Check each assigned combo does not exceed 40 seats
    for (const cid of safeAssignedCombos) {
      const currentAssigned = comboEnrollmentCounts[cid] || 0;
      if (currentAssigned + students.length > 40) {
        return {
          success: false,
          error: `Upload rejected. Combination "${cid}" already has ${currentAssigned}/40 seats allocated. Adding ${students.length} students would exceed the 40-seat limit.`
        };
      }
    }

    // Generate all IDs at once to prevent transaction collision
    const kortexIds = await generateMultipleGlobalStudentIds(students.length);

    // Batch write
    const batch = adminDb.batch();

    students.forEach((student, index) => {
      const placeholderRef = adminDb.collection('users').doc();
      const claimCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const kortexId = kortexIds[index];
      const cleanRollNo = (student.rollNo || '').trim() || null;

      const newStudent: StudentProfile = {
        uid: placeholderRef.id,
        kortex_id: kortexId,
        full_name: student.fullName,
        username: `pending_${placeholderRef.id.substring(0, 8)}`,
        role: 'student',
        grade: grade,
        section: section,
        roll_no: cleanRollNo,
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
            roll_no: cleanRollNo,
            assigned_combos: safeAssignedCombos,
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

    // Sync organization seat and headcount counters
    await adminDb.collection('users').doc(orgId).update({
      active_students_count: FieldValue.increment(students.length),
      consumed_seats_count: FieldValue.increment(students.length * safeAssignedCombos.length),
      updated_at: new Date().toISOString()
    }).catch(err => console.warn("Failed to increment org counters:", err));

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
    const callerDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const callerData = callerDoc.data();
    const callerRoles: string[] = callerData?.roles || (callerData?.role ? [callerData?.role] : []);
    if (callerRoles.includes('parent')) {
      const parentChildren = callerData?.children_ids || callerData?.children || [];
      if (!parentChildren.includes(studentUid)) {
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

export async function getCurriculumTotals() {
  try {
    const totalsDoc = await adminDb.collection('metadata').doc('curriculum_totals').get();
    return { 
      success: true, 
      totals: totalsDoc.exists ? (totalsDoc.data() as Record<string, number>) : {} 
    };
  } catch (error: any) {
    console.error("Error fetching curriculum totals:", error);
    return { success: false, error: error.message };
  }
}

export async function registerCourseInterest(
  idToken: string,
  payload: {
    programId: string;
    programTitle: string;
    targetChildUid?: string;
    targetChildName?: string;
  }
) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const callerUid = decodedToken.uid;
    const callerDoc = await adminDb.collection('users').doc(callerUid).get();
    const callerData = callerDoc.data() || {};
    const callerRoles: string[] = callerData.roles || (callerData.role ? [callerData.role] : []);

    let childUid = payload.targetChildUid || callerUid;
    let childName = payload.targetChildName || callerData.full_name || 'Student';

    // If caller is parent, verify ownership of child
    if (callerRoles.includes('parent') && payload.targetChildUid) {
      const childDoc = await adminDb.collection('users').doc(payload.targetChildUid).get();
      if (childDoc.exists) {
        const cd = childDoc.data()!;
        if (cd.parent_id !== callerUid && !(callerData.children_ids || []).includes(payload.targetChildUid)) {
          throw new Error("Unauthorized: Child does not belong to this parent account");
        }
        childName = cd.full_name || childName;
      }
    }

    const interestRef = adminDb.collection('course_interests').doc();
    await interestRef.set({
      id: interestRef.id,
      program_id: payload.programId,
      program_title: payload.programTitle,
      caller_uid: callerUid,
      caller_name: callerData.full_name || 'User',
      caller_email: callerData.email || decodedToken.email || '',
      caller_phone: callerData.phone || '',
      caller_role: callerRoles[0] || 'user',
      child_uid: childUid,
      child_name: childName,
      created_at: new Date().toISOString(),
      status: 'interested'
    });

    return { success: true, message: `Successfully registered interest for ${childName}` };
  } catch (error: any) {
    console.error("Error registering course interest:", error);
    return { success: false, error: error.message };
  }
}

export async function lookupStudentByClaimCode(code: string) {
  try {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 4) {
      return { success: false, error: "Please enter a valid Claim Code." };
    }

    const snap = await adminDb.collection('users')
      .where('role', '==', 'student')
      .where('claim_code', '==', cleanCode)
      .limit(1)
      .get();

    if (snap.empty) {
      return { success: false, error: "Invalid Claim Code. Please check with your school teacher or administrator." };
    }

    const studentDoc = snap.docs[0];
    const data = studentDoc.data();

    // Resolve organization name
    let orgName = 'School / Organization';
    const orgId = (data.org_ids && data.org_ids.length > 0) 
      ? data.org_ids[0] 
      : (data.org_links ? Object.keys(data.org_links)[0] : null);

    if (orgId) {
      try {
        const orgDoc = await adminDb.collection('users').doc(orgId).get();
        if (orgDoc.exists) {
          orgName = orgDoc.data()?.organization_name || orgDoc.data()?.full_name || orgName;
        }
      } catch (e) {
        console.warn("Could not fetch org name:", e);
      }
    }

    return {
      success: true,
      student: {
        uid: studentDoc.id,
        fullName: data.full_name || 'Student',
        grade: data.grade || 'Unassigned',
        section: data.section || (data.org_links && orgId ? data.org_links[orgId]?.section : '') || '',
        kortexId: data.kortex_id || '',
        claimCode: data.claim_code,
        orgName,
        parentConsentVerified: Boolean(data.parent_consent_verified),
        parentName: data.parent_name || '',
        emergencyContact: data.emergency_contact || ''
      }
    };
  } catch (error: any) {
    console.error("Error looking up claim code:", error);
    return { success: false, error: error.message };
  }
}

export async function activateStudentWithConsent(params: {
  claimCode: string;
  parentName?: string;
  emergencyContact?: string;
  pin?: string;
}) {
  try {
    const cleanCode = (params.claimCode || '').trim().toUpperCase();
    if (!cleanCode) return { success: false, error: "Claim code is required." };

    const snap = await adminDb.collection('users')
      .where('role', '==', 'student')
      .where('claim_code', '==', cleanCode)
      .limit(1)
      .get();

    if (snap.empty) {
      return { success: false, error: "Student not found with this claim code." };
    }

    const studentDoc = snap.docs[0];
    const studentData = studentDoc.data();
    const studentUid = studentDoc.id;

    // Check if returning student (already verified)
    const isAlreadyVerified = Boolean(studentData.parent_consent_verified);
    const finalParentName = params.parentName?.trim() || studentData.parent_name || '';
    const finalEmergencyContact = params.emergencyContact?.trim() || studentData.emergency_contact || '';
    const cleanPin = params.pin?.trim();

    if (!isAlreadyVerified) {
      if (!finalParentName) {
        return { success: false, error: "Parent or Guardian name is required to activate." };
      }
      const cleanPhone = finalEmergencyContact.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        return { success: false, error: "A valid 10-digit parent mobile number is required to activate." };
      }
      if (!cleanPin || cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
        return { success: false, error: "A 6-digit numeric login PIN is required." };
      }
    }

    // Generate single-device session token
    const sessionToken = crypto.randomUUID();

    const updates: any = {
      status: 'active',
      accountStatus: 'ACTIVE',
      parent_consent_verified: true,
      parent_consent_at: studentData.parent_consent_at || new Date().toISOString(),
      session_token: sessionToken,
      session_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (finalParentName) updates.parent_name = finalParentName;
    if (finalEmergencyContact) updates.emergency_contact = finalEmergencyContact;
    if (cleanPin && cleanPin.length === 6) updates.plain_pin = cleanPin;

    // Approve all organization links so school cards and combos display in Student Dashboard
    if (studentData.org_ids && Array.isArray(studentData.org_ids)) {
      studentData.org_ids.forEach((orgId: string) => {
        updates[`org_links.${orgId}.status`] = 'approved';
      });

      // Increment active_students_count on initial consent verification
      if (!isAlreadyVerified) {
        for (const orgId of studentData.org_ids) {
          adminDb.collection('users').doc(orgId).update({
            active_students_count: FieldValue.increment(1),
            updated_at: new Date().toISOString()
          }).catch(err => console.warn("Failed to increment org active_students_count:", err));
        }
      }
    }

    // Crucial: preserve pending state so a parent can later claim via full parent portal
    if (!studentData.parent_id) {
      updates.parent_id = 'PENDING';
    }

    await studentDoc.ref.update(updates);

    // Ensure Firebase Auth account exists for this student
    const studentEmail = `${(studentData.kortex_id || studentUid).toLowerCase()}@student.kortex.app`;
    try {
      await adminAuth.getUser(studentUid);
      if (cleanPin && cleanPin.length === 6) {
        await adminAuth.updateUser(studentUid, {
          password: cleanPin,
          displayName: studentData.full_name || 'Student'
        });
      }
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        const createPayload: any = {
          uid: studentUid,
          email: studentEmail,
          displayName: studentData.full_name || 'Student',
          password: cleanPin || studentData.plain_pin || '123456'
        };
        await adminAuth.createUser(createPayload);
      }
    }

    // Create Firebase Custom Token for silent student login
    const customToken = await adminAuth.createCustomToken(studentUid, {
      role: 'student',
      claim_code: cleanCode
    });

    return {
      success: true,
      customToken,
      sessionToken,
      studentUid,
      studentName: studentData.full_name || 'Student'
    };
  } catch (error: any) {
    console.error("Error activating student with consent:", error);
    return { success: false, error: error.message };
  }
}

export async function getStudentDailyActivity(idToken: string, studentUid: string, days = 7) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const callerUid = decodedToken.uid;

    const studentDoc = await adminDb.collection('users').doc(studentUid).get();
    if (!studentDoc.exists) throw new Error("Student not found.");
    const studentData = studentDoc.data()!;

    // Caller must be linked parent, the student themselves, or admin/krew
    const callerDoc = await adminDb.collection('users').doc(callerUid).get();
    const callerData = callerDoc.data() || {};
    const callerRoles: string[] = callerData.roles || (callerData.role ? [callerData.role] : []);

    const isParent = studentData.parent_id === callerUid || (callerData.children_ids || []).includes(studentUid);
    const isSelf = callerUid === studentUid;
    const isStaff = callerRoles.includes('admin') || callerRoles.includes('krew');

    if (!isParent && !isSelf && !isStaff) {
      throw new Error("Unauthorized access to student activity.");
    }

    const today = new Date();
    const dayFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const weekdayFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short'
    });

    // Generate past N days in IST
    const dateList: { dateStr: string; dayName: string }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = dayFormatter.format(d);
      const dayName = weekdayFormatter.format(d);
      dateList.push({ dateStr, dayName });
    }

    const activityColl = adminDb.collection('users').doc(studentUid).collection('daily_activity');
    const docSnaps = await Promise.all(
      dateList.map(({ dateStr }) => activityColl.doc(dateStr).get())
    );

    const history = dateList.map(({ dateStr, dayName }, idx) => {
      const snap = docSnaps[idx];
      const data = snap.exists ? snap.data() : null;
      const activeSeconds = data?.active_seconds || 0;
      const activeMinutes = Math.round((activeSeconds / 60) * 10) / 10;
      const lessonsCompleted = data?.lessons_completed || 0;
      const starsEarned = data?.stars_earned || 0;

      return {
        date: dateStr,
        dayName,
        active_seconds: activeSeconds,
        active_minutes: activeMinutes,
        lessons_completed: lessonsCompleted,
        stars_earned: starsEarned
      };
    });

    const totalSeconds = history.reduce((acc, curr) => acc + curr.active_seconds, 0);
    const totalMinutes = Math.round((totalSeconds / 60) * 10) / 10;
    const totalLessons = history.reduce((acc, curr) => acc + curr.lessons_completed, 0);
    const totalStars = history.reduce((acc, curr) => acc + curr.stars_earned, 0);

    return {
      success: true,
      history,
      totals: {
        totalMinutes,
        totalLessons,
        totalStars
      }
    };
  } catch (error: any) {
    console.error("Error fetching student daily activity:", error);
    return { success: false, error: error.message };
  }
}


