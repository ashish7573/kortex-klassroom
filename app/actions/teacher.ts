"use server";

import { adminAuth, adminDb } from '../../backend_configurations/firebase-admin';
import { TeacherProfile, TeacherComboData, ClassStudentData } from '../../types/user';
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

    // Fetch Curriculum Total & Tools for this grade/subject directly from database
    const cleanSubj = (subjectStr || '').trim().toLowerCase();
    const subjectFilters = [subjectStr, subjectStr.toLowerCase()];
    if (cleanSubj.includes('math') || cleanSubj === 'mathematics') {
      subjectFilters.push('FLN Maths', 'fln maths', 'Maths', 'maths', 'Mathematics', 'mathematics');
    } else if (cleanSubj.includes('hindi')) {
      subjectFilters.push('FLN Hindi', 'fln hindi', 'Hindi', 'hindi');
    } else if (cleanSubj.includes('eng')) {
      subjectFilters.push('FLN English', 'fln english', 'English', 'english');
    }

    const toolsQuery = adminDb.collection('learning_tools').where('subject', 'in', Array.from(new Set(subjectFilters)));
    const toolsSnap = await toolsQuery.get().catch(() => ({ docs: [] })); // Fallback if IN query fails
    let totalCurriculumTools = 0;
    const curriculumTools: any[] = [];
    
    if (toolsSnap.docs && toolsSnap.docs.length > 0) {
        toolsSnap.docs.forEach((doc: any) => {
            const data = doc.data();
            const g = (data.grade || '').trim().toLowerCase();
            const s = (data.subject || '').trim().toLowerCase();
            const tg = gradeStr.trim().toLowerCase();
            const isGradeMatch = !g || g === 'all grades' || g === 'all' || g === tg ||
              (tg.includes('fln') && g.includes('fln')) ||
              (Boolean(tg.match(/\d+/)?.[0] && g.match(/\d+/)?.[0] && tg.match(/\d+/)?.[0] === g.match(/\d+/)?.[0]));
            const isSubjMatch = s === subjectStr.toLowerCase() || 
              (cleanSubj.includes('math') && (s.includes('math') || s === 'mathematics')) ||
              (cleanSubj.includes('hindi') && s.includes('hindi')) ||
              (cleanSubj.includes('eng') && s.includes('eng'));

            if (isGradeMatch && isSubjMatch) {
                totalCurriculumTools++;
                curriculumTools.push({
                   id: doc.id,
                   title: data.title || '',
                   chapter_name: data.chapter_name || data.chapter || '',
                   chapter: data.chapter || data.chapter_name || '',
                   chapter_number: data.chapter_number !== undefined ? Number(data.chapter_number) : 1,
                   subtopic: data.subtopic || data.subtopic_name || '',
                   subtopic_name: data.subtopic_name || data.subtopic || '',
                   subtopic_order: data.subtopic_order !== undefined ? Number(data.subtopic_order) : 1,
                   subtopicId: data.subtopicId || data.subtopic_id || '',
                   content_type: data.content_type || data.type || ''
                });
            }
        });
    } else {
        totalCurriculumTools = 0;
    }

    // Fetch Students assigned to this combo in the Org
    const studentsSnap = await adminDb.collection('users')
      .where('role', '==', 'student')
      .where(`org_links.${orgId}.assigned_combos`, 'array-contains', comboId)
      .get();
      
    const roster: ClassStudentData[] = [];
    const cKey = `${gradeStr.toLowerCase()}_${subjectStr.toLowerCase()}`;

    // --- OPTIMIZED BATCHED PROGRESS READS ---
    const studentRefs = studentsSnap.docs.map((doc: any) => adminDb.collection('users').doc(doc.id).collection('progress').doc(cKey));
    const legacyRefs = studentsSnap.docs.map((doc: any) => adminDb.collection('users').doc(doc.id).collection('progress').doc(subjectStr.toLowerCase()));
    
    const chunkArray = (arr: any[], size: number) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));
    const progressMap = new Map<string, number>();
    const completedToolsMap = new Map<string, Record<string, any>>();

    if (studentsSnap.docs.length > 0) {
        const refsChunked = chunkArray([...studentRefs, ...legacyRefs], 100);
        for (const chunk of refsChunked) {
             const docs = await adminDb.getAll(...chunk);
             for (const pDoc of docs) {
                 if (pDoc.exists) {
                      const data = pDoc.data();
                      const pathParts = pDoc.ref.path.split('/');
                      const uid = pathParts[1]; // users/{uid}/progress/{cKey}
                      const tools = data?.completed_tools || {};
                      const completedCount = Object.keys(tools).length;
                      
                      const existingCount = progressMap.get(uid) || 0;
                      progressMap.set(uid, Math.max(existingCount, completedCount));

                      const prevTools = completedToolsMap.get(uid) || {};
                      completedToolsMap.set(uid, { ...prevTools, ...tools });
                 }
             }
        }
    }

    for (const sDoc of studentsSnap.docs) {
       const sData = sDoc.data();
       const completedCount = progressMap.get(sDoc.id) || 0;
       const pct = totalCurriculumTools > 0 ? Math.min(100, Math.round((completedCount / totalCurriculumTools) * 100)) : 0;

       roster.push({
          uid: sDoc.id,
          fullName: sData.full_name || 'Unknown Student',
          kortexId: sData.kortex_id || '',
          rollNo: sData.roll_no || sData.org_links?.[orgId]?.roll_no || '',
          avatar: sData.avatar || '',
          completedToolsCount: completedCount,
          totalTools: totalCurriculumTools,
          progressPercentage: pct,
          completedTools: completedToolsMap.get(sDoc.id) || {}
       });
    }

    // Sort alphabetically
    roster.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
    
    return { success: true, roster, curriculumTools };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function generateTeacherPasswordLink(idToken: string, email: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const callerUid = decodedToken.uid;
    const callerDoc = await adminDb.collection('users').doc(callerUid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'org_admin') {
      throw new Error("Unauthorized");
    }
    const link = await adminAuth.generatePasswordResetLink(email);
    return { success: true, link };
  } catch (error: any) {
    console.error("Link Generation Error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateStudentMasteryLevel(
  idToken: string,
  studentUid: string,
  comboId: string,
  gradeStr: string,
  subjectStr: string,
  targetLevel: number,
  milestones: Array<{
    level: number;
    chapterNumber: number;
    chapterName: string;
    subtopicName: string;
    toolIds: string[];
    id?: string;
  }>
) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const teacherUid = decodedToken.uid;
    const teacherDoc = await adminDb.collection('users').doc(teacherUid).get();
    if (!teacherDoc.exists) throw new Error("Teacher not found");
    const teacherData = teacherDoc.data() as any;
    if (teacherData.role !== 'teacher' && teacherData.role !== 'org_admin' && teacherData.role !== 'admin' && teacherData.role !== 'super_admin') {
      throw new Error("Unauthorized: Only teachers or admins can update student mastery levels.");
    }

    const cKey = `${gradeStr.toLowerCase()}_${subjectStr.toLowerCase()}`;
    const progressRef = adminDb.collection('users').doc(studentUid).collection('progress').doc(cKey);
    const legacyRef = adminDb.collection('users').doc(studentUid).collection('progress').doc(subjectStr.toLowerCase());

    const pDoc = await progressRef.get();
    const currentData = pDoc.exists ? pDoc.data() || {} : {};
    let completedTools = { ...(currentData.completed_tools || {}) };

    const legacyDoc = await legacyRef.get();
    if (legacyDoc.exists) {
      completedTools = { ...(legacyDoc.data()?.completed_tools || {}), ...completedTools };
    }

    const nowIso = new Date().toISOString();
    const norm = (s: string) => (s || '').toLowerCase().replace(/[-_]/g, '').trim();

    // 1. Process Milestones <= targetLevel: ensure milestone tools exist with score >= 90
    milestones.forEach(m => {
      if (m.level <= targetLevel) {
        let hasPassingTool = false;
        for (const tId of m.toolIds) {
          const normT = norm(tId);
          for (const k of Object.keys(completedTools)) {
            if (norm(k) === normT) {
              const currentScore = completedTools[k]?.best_score ?? 0;
              if (currentScore >= 90) {
                hasPassingTool = true;
                break;
              }
            }
          }
          if (hasPassingTool) break;
        }

        if (!hasPassingTool) {
          const primaryKey = m.toolIds[0] || m.id || `milestone_${m.level}`;
          completedTools[primaryKey] = {
            best_score: 100,
            times_completed: completedTools[primaryKey]?.times_completed ? completedTools[primaryKey].times_completed + 1 : 1,
            last_played_at: nowIso,
            chapter_name: m.chapterName,
            subtopic_name: m.subtopicName,
            teacher_override: true,
            updated_by_teacher_uid: teacherUid,
            updated_at: nowIso
          };
        }
      } else {
        // m.level > targetLevel (Demotion): remove tools for higher milestones
        const allToolKeysToRemove = new Set<string>();
        m.toolIds.forEach(tId => {
          allToolKeysToRemove.add(tId);
          const normT = norm(tId);
          Object.keys(completedTools).forEach(k => {
            if (norm(k) === normT) {
              allToolKeysToRemove.add(k);
            }
          });
        });
        if (m.id) allToolKeysToRemove.add(m.id);

        allToolKeysToRemove.forEach(k => {
          delete completedTools[k];
        });
      }
    });

    // If targetLevel === 0, clear all milestone tools
    if (targetLevel === 0) {
      milestones.forEach(m => {
        m.toolIds.forEach(tId => {
          delete completedTools[tId];
          const normT = norm(tId);
          Object.keys(completedTools).forEach(k => {
            if (norm(k) === normT) {
              delete completedTools[k];
            }
          });
        });
        if (m.id) delete completedTools[m.id];
      });
    }

    const updatedProgress = {
      ...currentData,
      completed_tools: completedTools,
      last_played_at: nowIso,
      manual_mastery_level: targetLevel,
      last_level_updated_by: teacherUid,
      last_level_updated_at: nowIso
    };

    await progressRef.set(updatedProgress, { merge: true });
    if (legacyDoc.exists) {
      await legacyRef.set({ completed_tools: completedTools }, { merge: true });
    }

    return { success: true, updatedCompletedTools: completedTools };
  } catch (error: any) {
    console.error("Error updating student mastery level:", error);
    return { success: false, error: error.message };
  }
}

