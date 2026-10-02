const fs = require('fs');
const file = 'app/actions/student.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /const parentName = parentDoc\.data\(\)\?\.full_name \|\| "Unknown Parent";/g,
  `const parentName = parentDoc.data()?.full_name || "Unknown Parent";
    const parentEmail = parentDoc.data()?.email || "";
    const parentContact = parentDoc.data()?.contact_number || "";`
);

fs.writeFileSync(file, code);
