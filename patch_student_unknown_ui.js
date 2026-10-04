const fs = require('fs');
let code = fs.readFileSync('app/actions/student.ts', 'utf8');

code = code.replace(
  `subject: a.chapter_name || a.combo_id,`,
  `subject: a.chapter_name === 'Unknown' ? (a.tool_type !== 'unknown' ? a.tool_type : 'Task') : (a.chapter_name || a.combo_id),`
);

fs.writeFileSync('app/actions/student.ts', code);
