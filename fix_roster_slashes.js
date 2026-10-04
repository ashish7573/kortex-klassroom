const fs = require('fs');
let code = fs.readFileSync('app/actions/teacher.ts', 'utf8');

// The issue is I literally wrote:
// const cKey = \`\${gradeStr.toLowerCase()}_\${subjectStr.toLowerCase()}\`;

code = code.replace(/const cKey = \\`\\\\\${gradeStr/g, 'const cKey = `${gradeStr');
code = code.replace(/\\\\\${subjectStr/g, '${subjectStr');
code = code.replace(/\\`;/g, '`;');

// Wait, the backslashes were probably: const cKey = \`\${gradeStr...
// Let's just do a blanket regex:
code = code.replace(/\\`/g, '`');
code = code.replace(/\\\$/g, '$');

fs.writeFileSync('app/actions/teacher.ts', code);
