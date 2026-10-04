const fs = require('fs');
let code = fs.readFileSync('app/actions/student.ts', 'utf8');

const oldRequest = `    await studentDoc.ref.update({
      org_ids: FieldValue.arrayUnion(orgId),
      [\`org_links.\${orgId}\`]: {
        org_name: orgDoc.data()?.organization_name || "Organization",
        grade: importData.grade,
        section: importData.section || null,
        assigned_combos: importData.assignedCombos,
        status: 'pending',
        requested_at: new Date().toISOString()
      }
    });`;

const newRequest = `    await studentDoc.ref.update({
      [\`org_links.\${orgId}\`]: {
        org_name: orgDoc.data()?.organization_name || "Organization",
        grade: importData.grade,
        section: importData.section || null,
        assigned_combos: importData.assignedCombos,
        status: 'pending',
        requested_at: new Date().toISOString()
      }
    });`;

code = code.replace(oldRequest, newRequest);

const oldResolve = `    if (accept) {
      await studentRef.update({
        [\`org_links.\${orgId}.status\`]: 'approved',
        parent_email: parentEmail,
        emergency_contact: parentContact,
        parent_name: parentName,
        updated_at: new Date().toISOString()
      });
    } else {
      await studentRef.update({
        org_ids: FieldValue.arrayRemove(orgId),
        [\`org_links.\${orgId}\`]: FieldValue.delete()
      });
    }`;

const newResolve = `    if (accept) {
      await studentRef.update({
        org_ids: FieldValue.arrayUnion(orgId), // Security Guard: Only grant DB access after parent approval
        [\`org_links.\${orgId}.status\`]: 'approved',
        parent_email: parentEmail,
        emergency_contact: parentContact,
        parent_name: parentName,
        updated_at: new Date().toISOString()
      });
    } else {
      await studentRef.update({
        [\`org_links.\${orgId}\`]: FieldValue.delete()
      });
    }`;

code = code.replace(oldResolve, newResolve);

fs.writeFileSync('app/actions/student.ts', code);
