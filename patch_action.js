const fs = require('fs');
let code = fs.readFileSync('app/actions/teacher_assignments.ts', 'utf8');

const newAction = `export async function getAssignmentSubmissions(idToken: string, assignmentId: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const teacherUid = decodedToken.uid;
    
    // Verify teacher role
    const teacherDoc = await adminDb.collection('users').doc(teacherUid).get();
    if (teacherDoc.data()?.role !== 'teacher') throw new Error("Unauthorized");
    
    // Get Assignment
    const assignmentDoc = await adminDb.collection('assignments').doc(assignmentId).get();
    if (!assignmentDoc.exists) throw new Error("Assignment not found");
    const assignmentData = assignmentDoc.data() as any;
    
    if (assignmentData.teacher_uid !== teacherUid) {
        throw new Error("Unauthorized: You do not own this assignment");
    }

    const assignedUids = assignmentData.assigned_to || [];
    if (assignedUids.length === 0) return { success: true, submissions: [] };

    // Fetch all student profiles and their submission docs in parallel
    const submissions = await Promise.all(assignedUids.map(async (studentUid: string) => {
        const studentDocP = adminDb.collection('users').doc(studentUid).get();
        const subDocP = adminDb.collection('users').doc(studentUid).collection('submissions').doc(assignmentId).get();
        
        const [studentDoc, subDoc] = await Promise.all([studentDocP, subDocP]);
        
        return {
           studentUid,
           studentName: studentDoc.data()?.full_name || 'Unknown Student',
           status: subDoc.exists ? subDoc.data()?.status : 'pending',
           score: subDoc.exists ? subDoc.data()?.score : null,
           submittedAt: subDoc.exists ? subDoc.data()?.submitted_at : null,
           gradedAt: subDoc.exists ? subDoc.data()?.graded_at : null
        };
    }));

    return { success: true, submissions };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
`;

code = code + '\n' + newAction;
fs.writeFileSync('app/actions/teacher_assignments.ts', code);
