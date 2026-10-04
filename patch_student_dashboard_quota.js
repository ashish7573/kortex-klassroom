const fs = require('fs');
let code = fs.readFileSync('kortex_users/student/StudentDashboard.tsx', 'utf8');

const oldCode = `        const subjectsToFetch = [...new Set(allDisplayCombos.map(c => c.subject))];
        const totals: Record<string, number> = {};
        
        for (const subj of subjectsToFetch) {
            const q = query(
               collection(db, 'learning_tools'), 
               where('subject', 'in', [subj, subj.toLowerCase(), 'Mathematics', 'mathematics', 'Maths', 'maths'])
            );
            const snap = await getDocs(q).catch(() => ({ docs: [] }));
            
            snap.docs.forEach((doc: any) => {
              const data = doc.data();
              const grade = (data.grade || 'unknown').trim().toLowerCase();
              const dbSubj = (data.subject || 'unknown').trim().toLowerCase();
              const normalizedSubj = (dbSubj === 'mathematics' || dbSubj === 'maths') ? 'maths' : dbSubj;
              
              const key = \`\${grade}_\${normalizedSubj}\`;
              totals[key] = (totals[key] || 0) + 1;
            });
        }`;

const newCode = `        // QUOTA OPTIMIZATION: Read from single aggregation document!
        const docRef = doc(db, 'metadata', 'curriculum_totals');
        const docSnap = await getDoc(docRef);
        const totals = docSnap.exists() ? docSnap.data() as Record<string, number> : {};`;

if (!code.includes('curriculum_totals')) {
    code = code.replace(oldCode, newCode);
    code = code.replace("import { collection, onSnapshot, getDocs, query, orderBy, limit, where } from 'firebase/firestore';", "import { collection, onSnapshot, getDocs, query, orderBy, limit, where, doc, getDoc } from 'firebase/firestore';");
    fs.writeFileSync('kortex_users/student/StudentDashboard.tsx', code);
}
