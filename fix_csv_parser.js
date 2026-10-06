const fs = require('fs');
let code = fs.readFileSync('kortex_users/kortex_admin/SystemConfig.tsx', 'utf8');

code = code.replace(
  /const rowMatch = rows\[i\]\.match\(\/\(".*?"\|\[\^",\\s\]\+\)\(\?=\\s\*,\|\\s\*\$\)\/g\) \|\| \[\];\n\s*const row = rowMatch\.map\(val => val\.replace\(\/\^"\|"\$\/g, ''\)\.replace\(\/""\/g, '"'\)\);/,
  `const row = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val.replace(/^"|"$/g, '').replace(/""/g, '"'));`
);

fs.writeFileSync('kortex_users/kortex_admin/SystemConfig.tsx', code);
console.log("Fixed CSV parser.");
