const fs = require('fs');
let code = fs.readFileSync('app/actions/migration.ts', 'utf8');

code = code.replace(
  /const toolsRef = adminDb.collection\('tools'\);/,
  "const toolsRef = adminDb.collection('learning_tools');"
);

fs.writeFileSync('app/actions/migration.ts', code);
console.log("Fixed migration collection.");
