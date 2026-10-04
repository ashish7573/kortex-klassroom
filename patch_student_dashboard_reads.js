const fs = require('fs');
let code = fs.readFileSync('kortex_users/student/StudentDashboard.tsx', 'utf8');

const oldCode = `  useEffect(() => {
    async function loadTotals() {
      try {
        const snap = await getDocs(collection(db, 'learning_tools'));
        const totals: Record<string, number> = {};
        snap.docs.forEach(doc => {
          const data = doc.data();
          const grade = (data.grade || 'unknown').trim().toLowerCase();
          const subj = (data.subject || 'unknown').trim().toLowerCase();
          const key = \`\${grade}_\${subj}\`;
          totals[key] = (totals[key] || 0) + 1;
        });
        setSubjectTotals(totals);
      } catch (e) {
        console.error("Error loading tools:", e);
      }
    }
    loadTotals();
  }, []);`;

const newCode = `  useEffect(() => {
    async function loadTotals() {
      if (allDisplayCombos.length === 0) return;
      try {
        const subjectsToFetch = [...new Set(allDisplayCombos.map(c => c.subject))];
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
        }
        
        setSubjectTotals(totals);
      } catch (e) {
        console.error("Error loading tools:", e);
      }
    }
    loadTotals();
  }, [allDisplayCombos]);`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('kortex_users/student/StudentDashboard.tsx', code);
