const fs = require('fs');
let code = fs.readFileSync('app/actions/provision.ts', 'utf8');

const oldCode = `    // 5. Create the Firestore Profile
    const profileData: OrgAdminProfile = {
      uid: userRecord.uid,
      kortex_id: cleanKortexId,
      email: cleanEmail,
      full_name: "Pending Setup",
      organization_name: orgName.trim(),`;

const newCode = `    // 5. Create the Firestore Profile
    const profileData: OrgAdminProfile = {
      uid: userRecord.uid,
      kortex_id: cleanKortexId,
      email: cleanEmail,
      full_name: orgName.trim(),
      organization_name: orgName.trim(),`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('app/actions/provision.ts', code);
