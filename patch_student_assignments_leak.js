const fs = require('fs');
let code = fs.readFileSync('app/actions/student.ts', 'utf8');

const oldCode = `    // Fetch all active assignments assigned to this student
    const assignmentsSnap = await adminDb.collection('assignments')
      .where('assigned_to', 'array-contains', studentUid)
      .where('status', '==', 'active')
      .get();
      
    const assignmentDocs = assignmentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));`;

const newCode = `    // Fetch all active assignments assigned to this student
    const assignmentsSnap = await adminDb.collection('assignments')
      .where('assigned_to', 'array-contains', studentUid)
      .where('status', '==', 'active')
      .get();
      
    const assignmentDocs = assignmentsSnap.docs.map(d => {
       const data = d.data();
       // PII Sanitization: Do not leak the UIDs of other classmates to the client
       delete data.assigned_to; 
       return { id: d.id, ...data };
    });`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('app/actions/student.ts', code);
