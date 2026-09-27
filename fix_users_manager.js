const fs = require('fs');
let content = fs.readFileSync('components/users/admin/UsersManager.tsx', 'utf8');

content = content.replace(
  'console.error("Firestore Permission Denied (Organizations):", error);',
  'if (error.code !== "permission-denied") console.error("Firestore Error (Organizations):", error);'
);

content = content.replace(
  'console.error("Firestore Permission Denied (Individuals):", error);',
  'if (error.code !== "permission-denied") console.error("Firestore Error (Individuals):", error);'
);

fs.writeFileSync('components/users/admin/UsersManager.tsx', content);
console.log('Fixed snapshot listener errors');
