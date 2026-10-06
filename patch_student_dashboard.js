const fs = require('fs');
let code = fs.readFileSync('kortex_users/student/StudentDashboard.tsx', 'utf8');

// Replace the subjProgress finding logic
const regexProgress = /const subjProgress = progressData\.find\(p => \{\n\s*if \(\!p\.id\) return false;\n\s*const pId = p\.id\.toLowerCase\(\);\n\s*return pId === cKey || pId === cSubj; \/\/ Fallback to subject-only if legacy data exists\n\s*\}\);/;

const replacementProgress = `const subjProgress = progressData.find(p => {
                    if (!p.id) return false;
                    const pId = p.id.toLowerCase();
                    return pId === cKey || pId === cSubj || pId === \`all grades_\${cSubj}\`; // Fallback to subject-only and All Grades
                 });`;

code = code.replace(regexProgress, replacementProgress);

// Replace the totalTools calculation logic
const regexTotal = /const totalTools = subjectTotals\[cKey\] || 0;/;

const replacementTotal = `const totalTools = subjectTotals[cKey] || subjectTotals[\`all grades_\${cSubj}\`] || 0;`;

code = code.replace(regexTotal, replacementTotal);

fs.writeFileSync('kortex_users/student/StudentDashboard.tsx', code);
console.log("Patched StudentDashboard.tsx");
