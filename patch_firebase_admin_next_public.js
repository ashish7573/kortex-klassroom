const fs = require('fs');
let code = fs.readFileSync('backend_configurations/firebase-admin.ts', 'utf8');

code = code.replace(
  'const clientEmail = cleanEnvStr(process.env.FIREBASE_CLIENT_EMAIL);',
  'const clientEmail = cleanEnvStr(process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL) || cleanEnvStr(process.env.FIREBASE_CLIENT_EMAIL);'
);

code = code.replace(
  'let privateKey = process.env.FIREBASE_PRIVATE_KEY;',
  'let privateKey = process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;'
);

fs.writeFileSync('backend_configurations/firebase-admin.ts', code);
console.log("firebase-admin.ts patched to allow NEXT_PUBLIC_ prefixes.");
