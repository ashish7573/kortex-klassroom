const fs = require('fs');
let code = fs.readFileSync('app/actions/teacher_assignments.ts', 'utf8');

code = code.replaceAll(
  `const assignments = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));`,
  `const assignments = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));`
);

fs.writeFileSync('app/actions/teacher_assignments.ts', code);
