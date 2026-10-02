const fs = require('fs');
const file = 'app/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace in onStepComplete
const oldStepComplete = `                    const tool = playingLesson.flow?.[data.step] || playingLesson;
                    const toolId = tool.id || tool.title || 'unknown_tool';
                    // We must use the tool's subject so it matches the curriculum precisely!
                    const subjectId = tool.subject || (typeof currentView === 'string' && currentView.includes(':') ? currentView.split(':')[1] : currentView);`;

const newStepComplete = `                    const tool = playingLesson.flow?.[data.step] || playingLesson;
                    const toolId = tool.id || tool.title || 'unknown_tool';
                    const gradeStr = tool.grade ? tool.grade.trim() : 'unknown_grade';
                    const subjStr = tool.subject ? tool.subject.trim() : 'unknown_subject';
                    const subjectId = \`\${gradeStr}_\${subjStr}\`;`;

code = code.replace(oldStepComplete, newStepComplete);

fs.writeFileSync(file, code);
