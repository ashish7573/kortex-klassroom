const fs = require('fs');
const file = 'app/actions/teacher.ts';
let code = fs.readFileSync(file, 'utf8');

const fetchToolsCode = `
    // Fetch Syllabus Progress and Curriculum Totals
    const toolsSnap = await adminDb.collection('learning_tools').get();
    const curriculumTotals: Record<string, number> = {};
    toolsSnap.docs.forEach(doc => {
        const data = doc.data();
        const grade = (data.grade || '').trim().toLowerCase();
        const subj = (data.subject || '').trim().toLowerCase();
        const key = \`\${grade}_\${subj}\`;
        curriculumTotals[key] = (curriculumTotals[key] || 0) + 1;
    });

    for (const combo of combos) {
        // Fetch teacher's specific completed syllabus for this combo
        const syllabusDoc = await adminDb.collection('users').doc(teacherUid).collection('syllabus_progress').doc(combo.comboId).get();
        if (syllabusDoc.exists) {
            const data = syllabusDoc.data();
            combo.totalToolsAssigned = data?.completed_tools?.length || 0;
        }

        const key = \`\${combo.gradeStr.toLowerCase()}_\${combo.subjectStr.toLowerCase()}\`;
        combo.totalCurriculumTools = curriculumTotals[key] || 0;
    }
    
    return {
`;

code = code.replace(`    return {\n       success: true,\n       combos\n    };`, fetchToolsCode + `       success: true,\n       combos\n    };\n`);

fs.writeFileSync(file, code);
