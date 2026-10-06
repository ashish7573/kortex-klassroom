const fs = require('fs');
let code = fs.readFileSync('kortex_users/student/StudentDashboard.tsx', 'utf8');

// The corrupted header
const badHeaderRegex = /^const totalTools = subjectTotals\[cKey\] \|\| subjectTotals\[`all grades_\$\{cSubj\}`\] \|\| 0;const subjProgress = progressData\.find\(p => \{\n\s*if \(\!p\.id\) return false;\n\s*const pId = p\.id\.toLowerCase\(\);\n\s*return pId === cKey \|\| pId === cSubj \|\| pId === `all grades_\$\{cSubj\}`; \/\/ Fallback to subject-only and All Grades\n\s*\}\);/m;

code = code.replace(badHeaderRegex, '');

fs.writeFileSync('kortex_users/student/StudentDashboard.tsx', code);
console.log("Restored header.");
