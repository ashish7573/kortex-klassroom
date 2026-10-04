const fs = require('fs');
let code = fs.readFileSync('kortex_users/parent/ChildAcademicView.tsx', 'utf8');

const oldReads = `        const snap = await getDocs(collection(db, 'learning_tools'));
        const totals: Record<string, number> = {};
        snap.docs.forEach(doc => {
          const data = doc.data();
          const grade = (data.grade || 'unknown').trim().toLowerCase();
          const subj = (data.subject || 'unknown').trim().toLowerCase();
          
          if (grade === child.grade?.toLowerCase()) {
             totals[subj] = (totals[subj] || 0) + 1;
             // also normalize maths/mathematics
             if (subj === 'mathematics') totals['maths'] = (totals['maths'] || 0) + 1;
             if (subj === 'maths') totals['mathematics'] = (totals['mathematics'] || 0) + 1;
          }
        });`;

const newReads = `        // Optimized to prevent Quota Exhaustion
        const q = query(collection(db, 'learning_tools'), where('grade', 'in', [child.grade, child.grade?.toUpperCase(), child.grade?.toLowerCase()]));
        const snap = await getDocs(q).catch(() => ({ docs: [] }));
        const totals: Record<string, number> = {};
        
        if (snap.docs && snap.docs.length > 0) {
          snap.docs.forEach((doc: any) => {
            const data = doc.data();
            const grade = (data.grade || 'unknown').trim().toLowerCase();
            const subj = (data.subject || 'unknown').trim().toLowerCase();
            
            if (grade === child.grade?.toLowerCase()) {
               totals[subj] = (totals[subj] || 0) + 1;
               if (subj === 'mathematics') totals['maths'] = (totals['maths'] || 0) + 1;
               if (subj === 'maths') totals['mathematics'] = (totals['mathematics'] || 0) + 1;
            }
          });
        }`;

code = code.replace(oldReads, newReads);
fs.writeFileSync('kortex_users/parent/ChildAcademicView.tsx', code);
