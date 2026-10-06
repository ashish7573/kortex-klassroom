const fs = require('fs');
let code = fs.readFileSync('kortex_users/teacher/AssignmentBuilderModal.tsx', 'utf8');

code = code.replace(
  /\(t\.grade \|\| ''\)\.trim\(\)\.toLowerCase\(\) === combo\.gradeStr\.toLowerCase\(\) &&/,
  `((t.grade || '').trim().toLowerCase() === combo.gradeStr.toLowerCase() || (t.grade || '').trim().toLowerCase() === 'all grades' || (t.grade || '').trim().toLowerCase() === 'all') &&`
);

fs.writeFileSync('kortex_users/teacher/AssignmentBuilderModal.tsx', code);
console.log("Patched AssignmentBuilderModal.");
