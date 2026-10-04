"use server";
import { adminAuth, adminDb } from '../../backend_configurations/firebase-admin';

export interface CreateAssignmentPayload {
  orgId: string;
  comboId: string;
  toolId: string;
  toolType: string;
  chapterName: string;
  toolTitle: string;
  dueDate: string;
  assignedStudentIds: string[];
  instructions?: string;
  externalLink?: string;
}

export async function createAssignment(idToken: string, payload: CreateAssignmentPayload) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const teacherUid = decodedToken.uid;
    
    // Verify teacher
    const docSnap = await adminDb.collection('users').doc(teacherUid).get();
    const teacherData = docSnap.data() as any;
    if (teacherData.role !== 'teacher') throw new Error("Unauthorized");

    // Construct the assignment document
    const assignmentRef = adminDb.collection('assignments').doc();
    const assignmentData = {
       id: assignmentRef.id,
       org_id: payload.orgId,
       teacher_uid: teacherUid,
       combo_id: payload.comboId,
       tool_id: payload.toolId,
       tool_type: payload.toolType || 'unknown',
       chapter_name: payload.chapterName || 'Unknown Chapter',
       title: payload.toolTitle || 'Untitled Task',
       due_date: payload.dueDate,
       assigned_to: payload.assignedStudentIds,
       instructions: payload.instructions || '',
       external_link: payload.externalLink || '',
       created_at: new Date().toISOString(),
       status: 'active'
    };

    await assignmentRef.set(assignmentData);

    // Also initialize the submission state for each student
    const batch = adminDb.batch();
    for (const sUid of payload.assignedStudentIds) {
       const subRef = adminDb.collection('users').doc(sUid).collection('submissions').doc(assignmentRef.id);
       batch.set(subRef, {
           assignment_id: assignmentRef.id,
           tool_id: payload.toolId,
           status: 'pending', // pending, submitted, graded
           score: null,
           submitted_at: null,
           graded_at: null
       });
    }
    await batch.commit();

    // Mark as taught in the teacher's syllabus progress
    const syllabusRef = adminDb.collection('users').doc(teacherUid).collection('syllabus_progress').doc(payload.comboId);
    const syllabusDoc = await syllabusRef.get();
    if (syllabusDoc.exists) {
        const existingTools = syllabusDoc.data()?.completed_tools || [];
        if (!existingTools.includes(payload.toolId)) {
            await syllabusRef.update({
               completed_tools: [...existingTools, payload.toolId]
            });
        }
    } else {
        await syllabusRef.set({
           completed_tools: [payload.toolId]
        });
    }

    return { success: true, assignmentId: assignmentRef.id };
  } catch (error: any) {
    console.error("Error creating assignment:", error);
    return { success: false, error: error.message };
  }
}

export async function fetchTeacherAssignments(idToken: string, comboId: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const teacherUid = decodedToken.uid;
    
    const snapshot = await adminDb.collection('assignments')
        .where('teacher_uid', '==', teacherUid)
        .where('combo_id', '==', comboId)
        .get();
        
    const assignments = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
    assignments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { success: true, assignments };
  } catch (error: any) {
    console.error("Error fetching assignments:", error);
    return { success: false, error: error.message };
  }
}

export async function gradeSubmission(idToken: string, studentUid: string, assignmentId: string, score: number) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const teacherUid = decodedToken.uid;
    
    // Verify teacher
    const docSnap = await adminDb.collection('users').doc(teacherUid).get();
    if (docSnap.data()?.role !== 'teacher') throw new Error("Unauthorized");

    await adminDb.collection('users').doc(studentUid).collection('submissions').doc(assignmentId).update({
       score: score,
       status: 'graded',
       graded_at: new Date().toISOString()
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error grading submission:", error);
    return { success: false, error: error.message };
  }
}

export async function revertSubmission(idToken: string, studentUid: string, assignmentId: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if ((await adminDb.collection('users').doc(decodedToken.uid).get()).data()?.role !== 'teacher') throw new Error("Unauthorized");

    await adminDb.collection('users').doc(studentUid).collection('submissions').doc(assignmentId).update({
       status: 'pending',
       score: null,
       submitted_at: null,
       graded_at: null
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function fetchAllTeacherAssignments(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const teacherUid = decodedToken.uid;
    
    const snapshot = await adminDb.collection('assignments')
        .where('teacher_uid', '==', teacherUid)
        .get();
        
    const assignments = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
    assignments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { success: true, assignments };
  } catch (error: any) {
    console.error("Error fetching all assignments:", error);
    return { success: false, error: error.message };
  }
}
