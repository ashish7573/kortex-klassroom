const fs = require('fs');
let code = fs.readFileSync('kortex_landing_page/all_lessons_page.tsx', 'utf8');

const regexToReplace = /toolsQuery = query\(collection\(db, 'learning_tools'\), where\('grade', 'in', \[selectedClass, selectedClass\.toUpperCase\(\), selectedClass\.toLowerCase\(\)\]\)\);/;

const replacement = `toolsQuery = query(collection(db, 'learning_tools'), where('grade', 'in', [
                selectedClass, 
                selectedClass.toUpperCase(), 
                selectedClass.toLowerCase(), 
                'All Grades', 
                'all grades', 
                'ALL GRADES'
            ]));`;

code = code.replace(regexToReplace, replacement);

fs.writeFileSync('kortex_landing_page/all_lessons_page.tsx', code);
console.log("Patched fetchLessons in all_lessons_page.tsx");
