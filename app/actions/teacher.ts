"use server";

import { adminAuth, adminDb } from '../../backend_configurations/firebase-admin';
import { TeacherProfile } from '../../types/user';
import { generateComboId } from '../../kortex_users/org_admin/utils/comboParsers';

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

export interface TeacherComboData {
  orgId: string;
  orgName: string;
  comboId: string;
  comboLabel: string;
  gradeStr: string;
  subjectStr: string;
  totalToolsAssigned: number;
  totalCurriculumTools: number;
}

export async function getTeacherDashboardData(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const teacherUid = decodedToken.uid;
    
    const docSnap = await adminDb.collection('users').doc(teacherUid).get();
    if (!docSnap.exists) throw new Error("Teacher not found");
    
    const teacherData = docSnap.data() as any;
    if (teacherData.role !== 'teacher') throw new Error("Unauthorized");
    
    // Fetch all related organizations
    const orgsToFetch = teacherData.org_ids || [];
    if (teacherData.org_id && !orgsToFetch.includes(teacherData.org_id)) {
        orgsToFetch.push(teacherData.org_id);
    }
    
    const orgDataMap: Record<string, any> = {};
    for (const oid of orgsToFetch) {
       const oDoc = await adminDb.collection('users').doc(oid).get();
       if (oDoc.exists) orgDataMap[oid] = oDoc.data();
    }
    
    // Reverse Map Combos
    const combos: TeacherComboData[] = [];
    const assignedIds = teacherData.assigned_combos || [];
    
    for (const orgId of Object.keys(orgDataMap)) {
       const orgData = orgDataMap[orgId];
       const allOrgCombos: string[] = orgData.approved_grade_subject_combos || [];
       const kortexId = orgData.kortex_id;
       
       for (const comboStr of allOrgCombos) {
           const generatedId = generateComboId(kortexId, comboStr);
           
           if (assignedIds.includes(generatedId)) {
               const parts = comboStr.split('-');
               const gradeStr = parts.length > 0 ? parts[0].trim() : 'Unknown';
               const subjectStr = parts.length > 1 ? parts[parts.length - 1].trim() : comboStr;
               
               combos.push({
                   orgId: orgId,
                   orgName: orgData.organization_name || 'Organization',
                   comboId: generatedId,
                   comboLabel: comboStr,
                   gradeStr: gradeStr,
                   subjectStr: subjectStr,
                   totalToolsAssigned: 0,
                   totalCurriculumTools: 0
               });
           }
       }
    }

    // Fetch Curriculum Totals (Optimized)
    const curriculumTotals: Record<string, number> = {};
    
    // We only need totals for the subjects this teacher actually teaches!
    const subjectsToFetch = [...new Set(combos.map(c => c.subjectStr))];
    for (const subj of subjectsToFetch) {
       // Query by subject to reduce reads
       const toolsQuery = adminDb.collection('learning_tools')
          .where('subject', 'in', [subj, subj.toLowerCase(), 'Mathematics', 'mathematics', 'Maths', 'maths']);
       
       try {
           const toolsSnap = await toolsQuery.get();
           toolsSnap.docs.forEach((doc: any) => {
               const data = doc.data();
               const grade = (data.grade || '').trim().toLowerCase();
               const dbSubj = (data.subject || '').trim().toLowerCase();
               
               // Normalize maths to match combo keys
               const normalizedSubj = (dbSubj === 'mathematics' || dbSubj === 'maths') ? 'maths' : dbSubj;
               
               const key = `${grade}_${normalizedSubj}`;
               curriculumTotals[key] = (curriculumTotals[key] || 0) + 1;
           });
       } catch (e) {
           console.error("Optimized fetch failed, falling back", e);
       }
    }

    for (const combo of combos) {
        const syllabusDoc = await adminDb.collection('users').doc(teacherUid).collection('syllabus_progress').doc(combo.comboId).get();
        if (syllabusDoc.exists) {
            const data = syllabusDoc.data();
            combo.totalToolsAssigned = data?.completed_tools?.length || 0;
        }

        const key = `${combo.gradeStr.toLowerCase()}_${combo.subjectStr.toLowerCase()}`;
        combo.totalCurriculumTools = curriculumTotals[key] || 0;
    }
    
    return {
       success: true,
       combos,
       orgName: orgsToFetch.length > 0 ? orgDataMap[orgsToFetch[0]]?.organization_name || 'Your Organization' : 'Your Organization'
    };

  } catch (error: any) {
     console.error("Error fetching teacher dashboard data:", error);
     return { success: false, error: error.message };
  }
}

export interface ClassStudentData {
  uid: string;
  fullName: string;
  kortexId: string;
  avatar: string;
  completedToolsCount: number;
  totalTools: number;
  progressPercentage: number;
}

export async function getClassroomRoster(idToken: string, orgId: string, comboId: string, gradeStr: string, subjectStr: string, comboLabel: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const teacherUid = decodedToken.uid;
    
    // Verify teacher is authorized
    const docSnap = await adminDb.collection('users').doc(teacherUid).get();
    const teacherData = docSnap.data() as any;
    if (teacherData.role !== 'teacher') throw new Error("Unauthorized");
    
    // Security Guard: Verify teacher actually belongs to the requested Org
    if (teacherData.org_id !== orgId && !(teacherData.org_ids && teacherData.org_ids.includes(orgId))) {
        throw new Error("Unauthorized: Teacher does not belong to this organization");
    }
    
    const assigned = teacherData.assigned_combos || [];
    if (!assigned.includes(comboId)) throw new Error("Not assigned to this classroom");

    // Fetch Curriculum Total for this grade/subject (Optimized to prevent Quota Exhaustion)
    // We filter by subject first to drastically reduce reads.
    const toolsQuery = adminDb.collection('learning_tools').where('subject', 'in', [subjectStr, subjectStr.toLowerCase(), 'Mathematics', 'mathematics', 'Maths', 'maths']);
    const toolsSnap = await toolsQuery.get().catch(() => ({ docs: [] })); // Fallback if IN query fails
    let totalCurriculumTools = 0;
    
    if (toolsSnap.docs && toolsSnap.docs.length > 0) {
        toolsSnap.docs.forEach((doc: any) => {
            const data = doc.data();
            const g = (data.grade || '').trim().toLowerCase();
            const s = (data.subject || '').trim().toLowerCase();
            if (g === gradeStr.toLowerCase() && (s === subjectStr.toLowerCase() || (s === 'mathematics' && subjectStr.toLowerCase() === 'maths'))) {
                totalCurriculumTools++;
            }
        });
    } else {
        // Fallback: If the above failed or was empty, we don't crash. We just report 0.
        totalCurriculumTools = 0;
    }

    // Fetch Students assigned to this combo in the Org
    const studentsSnap = await adminDb.collection('users')
      .where('role', '==', 'student')
      .where(`org_links.${orgId}.assigned_combos`, 'array-contains', comboId)
      .get();
      
    const roster: ClassStudentData[] = [];
    const cKey = `${gradeStr.toLowerCase()}_${subjectStr.toLowerCase()}`;

    for (const sDoc of studentsSnap.docs) {
       const sData = sDoc.data();
       
       // Fetch student's progress for this subject
       let completedCount = 0;
       const pDoc = await adminDb.collection('users').doc(sDoc.id).collection('progress').doc(cKey).get();
       
       if (pDoc.exists) {
           const pData = pDoc.data();
           completedCount = pData?.completed_tools ? Object.keys(pData.completed_tools).length : 0;
       } else {
           // Fallback to legacy subject string
           const pDocLegacy = await adminDb.collection('users').doc(sDoc.id).collection('progress').doc(subjectStr.toLowerCase()).get();
           if (pDocLegacy.exists) {
               const pDataLegacy = pDocLegacy.data();
               completedCount = pDataLegacy?.completed_tools ? Object.keys(pDataLegacy.completed_tools).length : 0;
           }
       }

       const pct = totalCurriculumTools > 0 ? Math.min(100, Math.round((completedCount / totalCurriculumTools) * 100)) : 0;

       roster.push({
          uid: sDoc.id,
          fullName: sData.full_name || 'Unknown Student',
          kortexId: sData.kortex_id || '',
          avatar: sData.avatar || '',
          completedToolsCount: completedCount,
          totalTools: totalCurriculumTools,
          progressPercentage: pct
       });
    }

    // Sort alphabetically
    roster.sort((a, b) => a.fullName.localeCompare(b.fullName));

    return {
       success: true,
       roster,
       totalCurriculumTools
    };
  } catch (error: any) {
     console.error("Error fetching classroom roster:", error);
     return { success: false, error: error.message };
  }
}
