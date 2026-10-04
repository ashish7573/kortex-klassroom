const fs = require('fs');

const code = `
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
           const cleanCombo = comboStr.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
           const generatedId = \`\${kortexId}_\${cleanCombo}\`;
           
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

    // Fetch Syllabus Progress and Curriculum Totals
    const toolsSnap = await adminDb.collection('learning_tools').get();
    const curriculumTotals: Record<string, number> = {};
    toolsSnap.docs.forEach((doc: any) => {
        const data = doc.data();
        const grade = (data.grade || '').trim().toLowerCase();
        const subj = (data.subject || '').trim().toLowerCase();
        const key = \`\${grade}_\${subj}\`;
        curriculumTotals[key] = (curriculumTotals[key] || 0) + 1;
    });

    for (const combo of combos) {
        const syllabusDoc = await adminDb.collection('users').doc(teacherUid).collection('syllabus_progress').doc(combo.comboId).get();
        if (syllabusDoc.exists) {
            const data = syllabusDoc.data();
            combo.totalToolsAssigned = data?.completed_tools?.length || 0;
        }

        const key = \`\${combo.gradeStr.toLowerCase()}_\${combo.subjectStr.toLowerCase()}\`;
        combo.totalCurriculumTools = curriculumTotals[key] || 0;
    }
    
    return {
       success: true,
       combos
    };

  } catch (error: any) {
     console.error("Error fetching teacher dashboard data:", error);
     return { success: false, error: error.message };
  }
}
`;

fs.appendFileSync('app/actions/teacher.ts', code);
