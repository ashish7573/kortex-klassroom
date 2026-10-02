const fs = require('fs');
const file = 'app/actions/student.ts';
let code = fs.readFileSync(file, 'utf8');

// Add parent email and contact to resolveTransferRequest
code = code.replace(
  `    const data = studentDoc.data()!;`,
  `    const parentDoc = await adminDb.collection('users').doc(parentUid).get();
    const parentEmail = parentDoc.data()?.email || "";
    const parentContact = parentDoc.data()?.contact_number || "";
    const parentName = parentDoc.data()?.full_name || "Unknown Parent";
    
    const data = studentDoc.data()!;`
);

code = code.replace(
  `    if (accept) {
      await studentRef.update({
        [\`org_links.\${orgId}.status\`]: 'approved',
        updated_at: new Date().toISOString()
      });`,
  `    if (accept) {
      await studentRef.update({
        [\`org_links.\${orgId}.status\`]: 'approved',
        parent_email: parentEmail,
        emergency_contact: parentContact,
        parent_name: parentName,
        updated_at: new Date().toISOString()
      });`
);

fs.writeFileSync(file, code);
