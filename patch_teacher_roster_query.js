const fs = require('fs');
let code = fs.readFileSync('app/actions/teacher.ts', 'utf8');

const oldQuery = `    // Fetch Students assigned to this combo in the Org
    const studentsSnap = await adminDb.collection('users')
      .where('role', '==', 'student')
      .where('org_id', '==', orgId)
      .where('assigned_combos', 'array-contains', comboId)
      .get();`;

const newQuery = `    // Fetch Students assigned to this combo in the Org
    const studentsSnap = await adminDb.collection('users')
      .where('role', '==', 'student')
      .where(\`org_links.\${orgId}.assigned_combos\`, 'array-contains', comboId)
      .get();`;

code = code.replace(oldQuery, newQuery);
fs.writeFileSync('app/actions/teacher.ts', code);
