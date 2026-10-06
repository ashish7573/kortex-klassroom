const fs = require('fs');
let code = fs.readFileSync('kortex_users/kortex_admin/SystemConfig.tsx', 'utf8');

code = code.replace(
  /\)\n       \)\}/,
  ")}"
);

fs.writeFileSync('kortex_users/kortex_admin/SystemConfig.tsx', code);
console.log("Fixed SystemConfig syntax.");
