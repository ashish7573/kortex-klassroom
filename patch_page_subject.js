const fs = require('fs');
const file = 'app/page.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldLogic = `                    const tool = playingLesson.flow?.[playingStep] || playingLesson;
                    const toolId = tool.id || tool.title || 'unknown_tool';
                    const subjectId = currentView; // current tier/view`;

const newLogic = `                    const tool = playingLesson.flow?.[playingStep] || playingLesson;
                    const toolId = tool.id || tool.title || 'unknown_tool';
                    // We must use the tool's subject so it matches the curriculum precisely!
                    const subjectId = tool.subject || (typeof currentView === 'string' && currentView.includes(':') ? currentView.split(':')[1] : currentView);`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync(file, code);
