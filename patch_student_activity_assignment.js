const fs = require('fs');
let code = fs.readFileSync('app/actions/student.ts', 'utf8');

const oldBatchCommit = `      }
    }

    await batch.commit();`;

const newBatchCommit = `      }
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

    await batch.commit();`;

code = code.replace(oldBatchCommit, newBatchCommit);

// Also add markAssignmentAsDone
const markAsDoneFn = `\nexport async function markAssignmentAsDone(idToken: string, assignmentId: string) {
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
}\n`;

code = code + markAsDoneFn;

fs.writeFileSync('app/actions/student.ts', code);
