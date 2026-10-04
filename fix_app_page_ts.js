const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

code = code.replace(
  `const toolData = { id: docSnap.id, ...docSnap.data() };`,
  `const toolData = { id: docSnap.id, ...docSnap.data() } as any;`
);

fs.writeFileSync('app/page.tsx', code);
