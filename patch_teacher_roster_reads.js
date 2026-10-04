const fs = require('fs');
let code = fs.readFileSync('app/actions/teacher.ts', 'utf8');

const oldReads = `    // Fetch Curriculum Total for this grade/subject
    const toolsSnap = await adminDb.collection('learning_tools').get();
    let totalCurriculumTools = 0;
    toolsSnap.docs.forEach((doc: any) => {
        const data = doc.data();
        const g = (data.grade || '').trim().toLowerCase();
        const s = (data.subject || '').trim().toLowerCase();
        if (g === gradeStr.toLowerCase() && s === subjectStr.toLowerCase()) {
            totalCurriculumTools++;
        }
    });`;

const newReads = `    // Fetch Curriculum Total for this grade/subject (Optimized to prevent Quota Exhaustion)
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
    }`;

code = code.replace(oldReads, newReads);
fs.writeFileSync('app/actions/teacher.ts', code);
