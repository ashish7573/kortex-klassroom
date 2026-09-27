const fs = require('fs');
let content = fs.readFileSync('lib/firebase-admin.ts', 'utf8');
content = content.replace(
  "const privateKey = process.env.FIREBASE_PRIVATE_KEY\n  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\\\n/g, '\\n')\n  : undefined;",
  "let privateKey = process.env.FIREBASE_PRIVATE_KEY;\nif (privateKey) {\n  privateKey = privateKey.replace(/^[\"']|[\"']$/g, '');\n  privateKey = privateKey.replace(/\\\\n/g, '\\n');\n}"
);
fs.writeFileSync('lib/firebase-admin.ts', content);
console.log('Fixed private key parser');
