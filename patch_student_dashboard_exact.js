const fs = require('fs');
let code = fs.readFileSync('kortex_users/student/StudentDashboard.tsx', 'utf8');

const target1 = `                 const subjProgress = progressData.find(p => {
                    if (!p.id) return false;
                    const pId = p.id.toLowerCase();
                    return pId === cKey || pId === cSubj; // Fallback to subject-only if legacy data exists
                 });`;

const replacement1 = `                 const subjProgress = progressData.find(p => {
                    if (!p.id) return false;
                    const pId = p.id.toLowerCase();
                    return pId === cKey || pId === cSubj || pId === \`all grades_\${cSubj}\`; // Fallback to All Grades
                 });`;

const target2 = `const totalTools = subjectTotals[cKey] || 0;`;
const replacement2 = `const totalTools = subjectTotals[cKey] || subjectTotals[\`all grades_\${cSubj}\`] || 0;`;

if(code.includes(target1) && code.includes(target2)) {
    code = code.replace(target1, replacement1);
    code = code.replace(target2, replacement2);
    fs.writeFileSync('kortex_users/student/StudentDashboard.tsx', code);
    console.log("Successfully patched StudentDashboard.tsx");
} else {
    console.log("Could not find targets");
}
