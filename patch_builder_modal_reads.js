const fs = require('fs');
let code = fs.readFileSync('kortex_users/teacher/AssignmentBuilderModal.tsx', 'utf8');

const oldReads = `    async function fetchCurriculum() {
      try {
        const snap = await getDocs(collection(db, 'learning_tools'));
        const matched = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((t: any) => 
          (t.grade || '').trim().toLowerCase() === combo.gradeStr.toLowerCase() &&
          (t.subject || '').trim().toLowerCase() === combo.subjectStr.toLowerCase()
        );`;

const newReads = `    async function fetchCurriculum() {
      try {
        // Optimized to prevent Quota Exhaustion
        const q = query(collection(db, 'learning_tools'), where('subject', 'in', [combo.subjectStr, combo.subjectStr.toLowerCase(), 'Mathematics', 'mathematics', 'Maths', 'maths']));
        const snap = await getDocs(q).catch(() => ({ docs: [] }));
        
        const matched = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })).filter((t: any) => 
          (t.grade || '').trim().toLowerCase() === combo.gradeStr.toLowerCase() &&
          (t.subject || '').trim().toLowerCase() === combo.subjectStr.toLowerCase() || (t.subject || '').trim().toLowerCase() === 'mathematics' && combo.subjectStr.toLowerCase() === 'maths'
        );`;

code = code.replace(oldReads, newReads);
fs.writeFileSync('kortex_users/teacher/AssignmentBuilderModal.tsx', code);
