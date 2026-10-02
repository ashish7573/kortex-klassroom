const fs = require('fs');
const file = 'app/actions/student.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `      parent_name: parentName,
      org_ids: [],`,
  `      parent_name: parentName,
      parent_email: parentEmail,
      emergency_contact: parentContact,
      org_ids: [],`
);
fs.writeFileSync(file, code);
