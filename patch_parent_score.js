const fs = require('fs');
const file = 'kortex_users/parent/ChildAcademicView.tsx';
let code = fs.readFileSync(file, 'utf8');

// For orgAcademics subjects
const oldOrgScore = `          let childScore = 0;
          if (subjProgress && subjProgress.completed_tools) {
             const tools = Object.values(subjProgress.completed_tools) as any[];
             const scoredTools = tools.filter(t => t.best_score !== undefined);
             if (scoredTools.length > 0) {
                 childScore = Math.round(scoredTools.reduce((acc, t) => acc + (t.best_score || 0), 0) / scoredTools.length);
             }
          }`;

const newOrgScore = `          let childScore = 0;
          const completedCount = subjProgress && subjProgress.completed_tools ? Object.keys(subjProgress.completed_tools).length : 0;
          const totalTools = subjectTotals[cKey] || 0;
          if (totalTools > 0) {
             childScore = Math.min(100, Math.round((completedCount / totalTools) * 100));
          }`;

code = code.replace(oldOrgScore, newOrgScore);

// For b2cSubjects
const oldIndepScore = `    let childScore = 0;
    if (subjProgress && subjProgress.completed_tools) {
       const tools = Object.values(subjProgress.completed_tools) as any[];
       const scoredTools = tools.filter(t => t.best_score !== undefined);
       if (scoredTools.length > 0) {
           childScore = Math.round(scoredTools.reduce((acc, t) => acc + (t.best_score || 0), 0) / scoredTools.length);
       }
    }`;

const newIndepScore = `    let childScore = 0;
    const completedCount = subjProgress && subjProgress.completed_tools ? Object.keys(subjProgress.completed_tools).length : 0;
    const totalTools = subjectTotals[cKey] || 0;
    if (totalTools > 0) {
       childScore = Math.min(100, Math.round((completedCount / totalTools) * 100));
    }`;

code = code.replace(oldIndepScore, newIndepScore);

fs.writeFileSync(file, code);
