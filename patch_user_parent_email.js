const fs = require('fs');
const file = 'types/user.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `  parent_name?: string;                    // Parent's name for easy dashboard reads
  emergency_contact?: string | null;       // Emergency contact number`,
  `  parent_name?: string;                    // Parent's name for easy dashboard reads
  parent_email?: string;                   // Parent's email for Org Admins
  emergency_contact?: string | null;       // Emergency contact number`
);
fs.writeFileSync(file, code);
