const fs = require('fs');
const file = 'kortex_users/student/StudentDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldTally = `        snap.docs.forEach(doc => {
          const data = doc.data();
          if (data.status === 'published' || data.status === 'draft') {
             const grade = (data.grade || 'unknown').trim().toLowerCase();
             const subj = (data.subject || 'unknown').trim().toLowerCase();
             const key = \`\${grade}_\${subj}\`;
             totals[key] = (totals[key] || 0) + 1;
          }
        });`;

const newTally = `        snap.docs.forEach(doc => {
          const data = doc.data();
          const grade = (data.grade || 'unknown').trim().toLowerCase();
          const subj = (data.subject || 'unknown').trim().toLowerCase();
          const key = \`\${grade}_\${subj}\`;
          totals[key] = (totals[key] || 0) + 1;
        });`;

code = code.replace(oldTally, newTally);

fs.writeFileSync(file, code);
