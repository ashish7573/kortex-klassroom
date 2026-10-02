const fs = require('fs');
const file = 'app/actions/student.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `    const parentName = parentDoc.data()?.full_name || "Unknown Parent";`,
  `    const parentName = parentDoc.data()?.full_name || "Unknown Parent";\n    const parentEmail = parentDoc.data()?.email || "";\n    const parentContact = parentDoc.data()?.contact_number || "";`
);

code = code.replace(
  `    batch.update(studentDoc.ref, {
      parent_id: parentUid,
      claim_code: FieldValue.delete(),
      parent_name: parentName,
      status: 'active',
      updated_at: new Date().toISOString()
    });`,
  `    batch.update(studentDoc.ref, {
      parent_id: parentUid,
      claim_code: FieldValue.delete(),
      parent_name: parentName,
      parent_email: parentEmail,
      emergency_contact: parentContact,
      status: 'active',
      updated_at: new Date().toISOString()
    });`
);
fs.writeFileSync(file, code);
