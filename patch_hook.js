const fs = require('fs');
let code = fs.readFileSync('hooks/useStudentAssignments.ts', 'utf8');

code = code.replace(
  `score?: number | 'N/A';`,
  `score?: number | 'N/A';\n  totalPoints?: number;\n  grade?: string;`
);

code = code.replace(
  `score: sub?.score`,
  `score: sub?.score,\n                 totalPoints: 100,\n                 grade: sub?.score === 'N/A' ? 'Completed' : (sub?.score ? sub.score + '/100' : '')`
);

fs.writeFileSync('hooks/useStudentAssignments.ts', code);
