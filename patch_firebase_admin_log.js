const fs = require('fs');
let code = fs.readFileSync('backend_configurations/firebase-admin.ts', 'utf8');

code = code.replace(
  `if (!projectId || !clientEmail || !privateKey) {`,
  `if (!projectId || !clientEmail || !privateKey) {
  console.error("DEBUG ENV:", { 
    hasProjectId: !!projectId, 
    hasClientEmail: !!clientEmail, 
    hasPrivateKey: !!privateKey 
  });`
);

fs.writeFileSync('backend_configurations/firebase-admin.ts', code);
console.log("firebase-admin.ts patched with debug logs.");
