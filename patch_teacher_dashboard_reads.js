const fs = require('fs');
let code = fs.readFileSync('app/actions/teacher.ts', 'utf8');

const oldCode = `    // Fetch Syllabus Progress and Curriculum Totals
    const toolsSnap = await adminDb.collection('learning_tools').get();
    const curriculumTotals: Record<string, number> = {};
    toolsSnap.docs.forEach((doc: any) => {
        const data = doc.data();
        const grade = (data.grade || '').trim().toLowerCase();
        const subj = (data.subject || '').trim().toLowerCase();
        const key = \`\${grade}_\${subj}\`;
        curriculumTotals[key] = (curriculumTotals[key] || 0) + 1;
    });`;

const newCode = `    // Fetch Curriculum Totals (Optimized)
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
               
               const key = \`\${grade}_\${normalizedSubj}\`;
               curriculumTotals[key] = (curriculumTotals[key] || 0) + 1;
           });
       } catch (e) {
           console.error("Optimized fetch failed, falling back", e);
       }
    }`;

code = code.replace(oldCode, newCode);

fs.writeFileSync('app/actions/teacher.ts', code);
