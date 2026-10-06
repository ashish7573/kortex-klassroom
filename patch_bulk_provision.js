const fs = require('fs');
let code = fs.readFileSync('app/actions/student.ts', 'utf8');

const newAction = `
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
        error: \`Upload rejected. Grade \${grade} - \${section} currently has \${currentCount} students. Adding \${students.length} would exceed the strict 40-student limit.\` 
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
        username: \`pending_\${placeholderRef.id.substring(0, 8)}\`,
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
            parent_email: student.parentEmail || '',
            parent_phone: student.parentPhone || ''
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

    return { success: true, message: \`Successfully provisioned \${students.length} students.\` };
  } catch (error: any) {
    console.error("Error in bulkProvisionStudents:", error);
    return { success: false, error: error.message };
  }
}
`;

if (!code.includes('bulkProvisionStudents')) {
  fs.appendFileSync('app/actions/student.ts', newAction);
  console.log("bulkProvisionStudents added.");
}
