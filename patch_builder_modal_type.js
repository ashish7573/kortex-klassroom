const fs = require('fs');
let code = fs.readFileSync('kortex_users/teacher/AssignmentBuilderModal.tsx', 'utf8');

code = code.replace(
  `toolType: selectedTool.type || 'unknown',`,
  `toolType: selectedTool.type || selectedTool.content_type || 'Task',`
);

fs.writeFileSync('kortex_users/teacher/AssignmentBuilderModal.tsx', code);
