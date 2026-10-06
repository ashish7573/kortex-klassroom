const fs = require('fs');
let code = fs.readFileSync('kortex_landing_page/all_lessons_page.tsx', 'utf8');

const regexToReplace = /const matchClass = selectedClass \? lesson\.grade\?\.toLowerCase\(\)\.trim\(\) === selectedClass\.toLowerCase\(\)\.trim\(\) : true;/;

const replacement = `const matchClass = selectedClass 
      ? lesson.grade?.toLowerCase().trim() === selectedClass.toLowerCase().trim() || 
        lesson.grade?.toLowerCase().trim() === 'all grades'
      : true;`;

code = code.replace(regexToReplace, replacement);

fs.writeFileSync('kortex_landing_page/all_lessons_page.tsx', code);
console.log("Patched all_lessons_page.tsx");
