const fs = require('fs');
const file = 'kortex_users/student/StudentDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldTally = `        snap.docs.forEach(doc => {
          const data = doc.data();
          if (data.status === 'published' || data.status === 'draft') {
             const subj = (data.subject || 'unknown').toLowerCase();
             totals[subj] = (totals[subj] || 0) + 1;
          }
        });`;

const newTally = `        snap.docs.forEach(doc => {
          const data = doc.data();
          if (data.status === 'published' || data.status === 'draft') {
             const grade = (data.grade || 'unknown').trim().toLowerCase();
             const subj = (data.subject || 'unknown').trim().toLowerCase();
             const key = \`\${grade}_\${subj}\`;
             totals[key] = (totals[key] || 0) + 1;
          }
        });`;

code = code.replace(oldTally, newTally);

const oldProgress = `                 // Find real progress
                 const subjProgress = progressData.find(p => p.id.toLowerCase() === comboObj.subject.toLowerCase() || p.subject_id?.toLowerCase() === comboObj.subject.toLowerCase());
                 const completedCount = subjProgress && subjProgress.completed_tools ? Object.keys(subjProgress.completed_tools).length : 0;
                 const xpEarned = subjProgress ? subjProgress.xp : 0;
                 
                 // Calculate real percentage
                 const totalTools = subjectTotals[comboObj.subject.toLowerCase()] || 0;`;

const newProgress = `                 // Extract grade and subject from combo label
                 const parts = comboObj.label.split('-');
                 const cGrade = parts.length > 0 ? parts[0].trim().toLowerCase() : 'unknown_grade';
                 const cSubj = comboObj.subject.toLowerCase();
                 const cKey = \`\${cGrade}_\${cSubj}\`;

                 // Find real progress
                 const subjProgress = progressData.find(p => {
                    if (!p.id) return false;
                    const pId = p.id.toLowerCase();
                    return pId === cKey || pId === cSubj; // Fallback to subject-only if legacy data exists
                 });
                 const completedCount = subjProgress && subjProgress.completed_tools ? Object.keys(subjProgress.completed_tools).length : 0;
                 const xpEarned = subjProgress ? subjProgress.xp : 0;
                 
                 // Calculate real percentage
                 const totalTools = subjectTotals[cKey] || 0;`;

code = code.replace(oldProgress, newProgress);
fs.writeFileSync(file, code);
