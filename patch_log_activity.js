const fs = require('fs');
let code = fs.readFileSync('app/actions/student.ts', 'utf8');

const anchor = `    await progressRef.set({
      id: subjectId,
      subject_id: subjectId,
      completed_tools: newTools,
      xp: newXp,
      updated_at: dateString
    }, { merge: true });`;

const insertion = `    await progressRef.set({
      id: subjectId,
      subject_id: subjectId,
      completed_tools: newTools,
      xp: newXp,
      updated_at: dateString
    }, { merge: true });

    // ==========================================
    // PHASE 4: ASSIGNMENT AUTO-GRADING ENGINE
    // ==========================================
    const submissionsSnap = await adminDb.collection('users').doc(studentUid).collection('submissions')
       .where('tool_id', '==', toolId)
       .get();

    for (const subDoc of submissionsSnap.docs) {
       const subData = subDoc.data();
       const assignmentDoc = await adminDb.collection('assignments').doc(subData.assignment_id).get();
       
       if (assignmentDoc.exists) {
          const assignmentData = assignmentDoc.data();
          const dueDateObj = new Date(assignmentData?.due_date || new Date());
          
          // Only allow updates if the deadline hasn't passed
          if (new Date() <= dueDateObj) {
              const toolType = assignmentData?.tool_type || 'unknown';
              let newScore: number | 'N/A' = 'N/A';
              
              if (['quiz', 'game'].includes(toolType.toLowerCase())) {
                  const currentSubScore = typeof subData.score === 'number' ? subData.score : -1;
                  const newIncomingScore = typeof activityData.score === 'number' ? activityData.score : 0;
                  newScore = Math.max(currentSubScore, newIncomingScore);
              }

              await subDoc.ref.update({
                 status: 'submitted',
                 score: newScore,
                 submitted_at: new Date().toISOString()
              });
          }
       }
    }
    // ==========================================
`;

code = code.replace(anchor, insertion);
fs.writeFileSync('app/actions/student.ts', code);
