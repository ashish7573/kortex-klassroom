const fs = require('fs');
let code = fs.readFileSync('app/actions/teacher_assignments.ts', 'utf8');

// Patch createAssignment
const oldCreate = `    // Verify teacher
    const docSnap = await adminDb.collection('users').doc(teacherUid).get();
    const teacherData = docSnap.data() as any;
    if (teacherData.role !== 'teacher') throw new Error("Unauthorized");

    // Construct the assignment document`;

const newCreate = `    // Verify teacher and classroom ownership
    const docSnap = await adminDb.collection('users').doc(teacherUid).get();
    const teacherData = docSnap.data() as any;
    if (teacherData.role !== 'teacher') throw new Error("Unauthorized");
    
    const assignedCombos = teacherData.assigned_combos || [];
    if (!assignedCombos.includes(payload.comboId)) {
        throw new Error("Unauthorized: You are not assigned to this classroom.");
    }

    // Construct the assignment document`;
code = code.replace(oldCreate, newCreate);

// Patch gradeSubmission
const oldGrade = `    // Verify teacher
    const docSnap = await adminDb.collection('users').doc(teacherUid).get();
    if (docSnap.data()?.role !== 'teacher') throw new Error("Unauthorized");

    await adminDb.collection('users').doc(studentUid).collection('submissions').doc(assignmentId).update({`;

const newGrade = `    // Verify teacher role
    const docSnap = await adminDb.collection('users').doc(teacherUid).get();
    if (docSnap.data()?.role !== 'teacher') throw new Error("Unauthorized");
    
    // Security Guard: Verify this teacher actually owns the assignment!
    const assignmentDoc = await adminDb.collection('assignments').doc(assignmentId).get();
    if (!assignmentDoc.exists || assignmentDoc.data()?.teacher_uid !== teacherUid) {
        throw new Error("Unauthorized: You do not have permission to grade this assignment.");
    }

    await adminDb.collection('users').doc(studentUid).collection('submissions').doc(assignmentId).update({`;
code = code.replace(oldGrade, newGrade);

// Patch revertSubmission
const oldRevert = `    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if ((await adminDb.collection('users').doc(decodedToken.uid).get()).data()?.role !== 'teacher') throw new Error("Unauthorized");

    await adminDb.collection('users').doc(studentUid).collection('submissions').doc(assignmentId).update({`;

const newRevert = `    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const teacherUid = decodedToken.uid;
    if ((await adminDb.collection('users').doc(teacherUid).get()).data()?.role !== 'teacher') throw new Error("Unauthorized");
    
    // Security Guard: Verify this teacher actually owns the assignment!
    const assignmentDoc = await adminDb.collection('assignments').doc(assignmentId).get();
    if (!assignmentDoc.exists || assignmentDoc.data()?.teacher_uid !== teacherUid) {
        throw new Error("Unauthorized: You do not have permission to revert this assignment.");
    }

    await adminDb.collection('users').doc(studentUid).collection('submissions').doc(assignmentId).update({`;
code = code.replace(oldRevert, newRevert);

fs.writeFileSync('app/actions/teacher_assignments.ts', code);
