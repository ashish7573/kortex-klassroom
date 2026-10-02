const fs = require('fs');
const file = 'kortex_users/parent/ChildAcademicView.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldParentProg = `const subjProgress = progressData.find(p => p.id.toLowerCase() === sub.subjectName.toLowerCase() || p.subject_id?.toLowerCase() === sub.subjectName.toLowerCase());`;
const newParentProg = `const cKey = \`\${orgData.grade}_\${sub.subjectName}\`.toLowerCase();
          const subjProgress = progressData.find(p => {
             if (!p.id) return false;
             return p.id.toLowerCase() === cKey || p.id.toLowerCase() === sub.subjectName.toLowerCase();
          });`;

code = code.replace(oldParentProg, newParentProg);

// B2C Independent Subjects in Parent Dashboard
const oldIndepProg = `const subjProgress = progressData.find(p => p.id.toLowerCase() === sub.name.toLowerCase() || p.subject_id?.toLowerCase() === sub.name.toLowerCase());`;
const newIndepProg = `const parts = sub.name.split('-');
    const cGrade = parts.length > 0 ? parts[0].trim().toLowerCase() : 'unknown_grade';
    const cSubj = parts[parts.length - 1].trim().toLowerCase();
    const cKey = \`\${cGrade}_\${cSubj}\`;
    
    const subjProgress = progressData.find(p => {
        if (!p.id) return false;
        return p.id.toLowerCase() === cKey || p.id.toLowerCase() === cSubj;
    });`;

code = code.replace(oldIndepProg, newIndepProg);

fs.writeFileSync(file, code);
