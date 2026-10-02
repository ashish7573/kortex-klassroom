const fs = require('fs');
const file = 'kortex_landing_page/all_lessons_page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Chapter Card Progress
const oldChapterProg = `const subjProg = studentProgress.find(p => p.id?.toLowerCase() === lesson.subject?.toLowerCase() || p.subject_id?.toLowerCase() === lesson.subject?.toLowerCase());`;
const newChapterProg = `const cKey = \`\${lesson.grade}_\${lesson.subject}\`.toLowerCase();\n                           const subjProg = studentProgress.find(p => p.id?.toLowerCase() === cKey || p.id?.toLowerCase() === lesson.subject?.toLowerCase());`;
code = code.replace(oldChapterProg, newChapterProg);

// 2. Subtopic Row Progress
const oldSubtopicProg = `const subjProg = studentProgress.find(p => p.id?.toLowerCase() === activeLesson.subject?.toLowerCase() || p.subject_id?.toLowerCase() === activeLesson.subject?.toLowerCase());`;
const newSubtopicProg = `const cKey = \`\${activeLesson.grade}_\${activeLesson.subject}\`.toLowerCase();\n                                     const subjProg = studentProgress.find(p => p.id?.toLowerCase() === cKey || p.id?.toLowerCase() === activeLesson.subject?.toLowerCase());`;
code = code.replace(oldSubtopicProg, newSubtopicProg);

// 3. Tool Row Progress
const oldToolProg = `const subjProg = studentProgress.find(p => p.id?.toLowerCase() === activeLesson.subject?.toLowerCase() || p.subject_id?.toLowerCase() === activeLesson.subject?.toLowerCase());`;
const newToolProg = `const cKey = \`\${activeLesson.grade}_\${activeLesson.subject}\`.toLowerCase();\n                                                    const subjProg = studentProgress.find(p => p.id?.toLowerCase() === cKey || p.id?.toLowerCase() === activeLesson.subject?.toLowerCase());`;
code = code.replace(oldToolProg, newToolProg);

fs.writeFileSync(file, code);
