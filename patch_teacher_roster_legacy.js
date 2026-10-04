const fs = require('fs');
let code = fs.readFileSync('app/actions/teacher.ts', 'utf8');

const oldFetch = `    // Fetch 1: Students whose default grade & section matches
    let defaultSnap = { docs: [] as any[] };
    if (sectionStr) {
       const q1 = adminDb.collection('users')
          .where('role', '==', 'student')
          .where(\`org_links.\${orgId}.grade\`, '==', gradeStr)
          .where(\`org_links.\${orgId}.section\`, '==', sectionStr);
       defaultSnap = await q1.get();
    }`;

const newFetch = `    // Fetch 1: Students whose default grade & section matches (Modern Org Links)
    let defaultSnap = { docs: [] as any[] };
    let legacySnap = { docs: [] as any[] };
    if (sectionStr) {
       const q1 = adminDb.collection('users')
          .where('role', '==', 'student')
          .where(\`org_links.\${orgId}.grade\`, '==', gradeStr)
          .where(\`org_links.\${orgId}.section\`, '==', sectionStr);
       defaultSnap = await q1.get();
       
       // Fallback for legacy students without org_links
       const qLegacy = adminDb.collection('users')
          .where('role', '==', 'student')
          .where('org_id', '==', orgId)
          .where('grade', '==', gradeStr)
          .where('section', '==', sectionStr);
       legacySnap = await qLegacy.get();
    }`;

code = code.replace(oldFetch, newFetch);

const oldMerge = `    defaultSnap.docs.forEach((doc: any) => { rosterMap[doc.id] = doc; });
    explicitSnap.docs.forEach((doc: any) => { rosterMap[doc.id] = doc; });`;

const newMerge = `    defaultSnap.docs.forEach((doc: any) => { rosterMap[doc.id] = doc; });
    legacySnap.docs.forEach((doc: any) => { rosterMap[doc.id] = doc; });
    explicitSnap.docs.forEach((doc: any) => { rosterMap[doc.id] = doc; });`;

code = code.replace(oldMerge, newMerge);
fs.writeFileSync('app/actions/teacher.ts', code);
