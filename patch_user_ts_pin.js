const fs = require('fs');
const file = 'types/user.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `  username: string;`,
  `  username: string;\n  plain_pin?: string;`
);

fs.writeFileSync(file, code);
