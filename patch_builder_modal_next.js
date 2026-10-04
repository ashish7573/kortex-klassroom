const fs = require('fs');
let code = fs.readFileSync('kortex_users/teacher/AssignmentBuilderModal.tsx', 'utf8');

const oldDisabled = `disabled={step === 1 && !selectedTool}`;
const newDisabled = `disabled={step === 1 && (sourceType === 'kortex' ? !selectedTool : (!title.trim() || !externalLink.trim()))}`;

code = code.replace(oldDisabled, newDisabled);
fs.writeFileSync('kortex_users/teacher/AssignmentBuilderModal.tsx', code);
