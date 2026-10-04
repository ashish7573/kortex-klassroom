const fs = require('fs');
let code = fs.readFileSync('kortex_landing_page/all_lessons_page.tsx', 'utf8');

// Ensure query, where are imported
if (!code.includes('query')) {
    code = code.replace(
        `import { collection, getDocs, onSnapshot } from 'firebase/firestore';`,
        `import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';`
    );
}

const oldCode = `        // Fetch the new flat collection
        const snapshot = await getDocs(collection(db, 'learning_tools'));
        const flatTools = snapshot.docs.map(d => ({id: d.id, ...d.data()}));`;

const newCode = `        // Fetch the new flat collection (Optimized)
        let toolsQuery = collection(db, 'learning_tools') as any;
        if (selectedClass && selectedClass !== '') {
            toolsQuery = query(collection(db, 'learning_tools'), where('grade', 'in', [selectedClass, selectedClass.toUpperCase(), selectedClass.toLowerCase()]));
        }
        
        const snapshot = await getDocs(toolsQuery).catch(() => ({ docs: [] }));
        let flatTools = snapshot.docs.map((d: any) => ({id: d.id, ...d.data()}));
        
        // If subject is selected, filter in memory
        if (selectedSubject && selectedSubject !== '') {
           flatTools = flatTools.filter((t: any) => {
               const s = (t.subject || '').trim().toLowerCase();
               const queryS = selectedSubject.toLowerCase();
               return s === queryS || (queryS === 'maths' && s === 'mathematics') || (queryS === 'mathematics' && s === 'maths');
           });
        }`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('kortex_landing_page/all_lessons_page.tsx', code);
