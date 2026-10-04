const fs = require('fs');
let code = fs.readFileSync('app/actions/teacher_assignments.ts', 'utf8');

const oldFetch1 = `    const snapshot = await adminDb.collection('assignments')
        .where('teacher_uid', '==', teacherUid)
        .where('combo_id', '==', comboId)
        .orderBy('created_at', 'desc')
        .get();
        
    const assignments = snapshot.docs.map(d => d.data());`;

const newFetch1 = `    const snapshot = await adminDb.collection('assignments')
        .where('teacher_uid', '==', teacherUid)
        .where('combo_id', '==', comboId)
        .get();
        
    const assignments = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    assignments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());`;

code = code.replace(oldFetch1, newFetch1);

const oldFetch2 = `    const snapshot = await adminDb.collection('assignments')
        .where('teacher_uid', '==', teacherUid)
        .orderBy('created_at', 'desc')
        .get();
        
    const assignments = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));`;

const newFetch2 = `    const snapshot = await adminDb.collection('assignments')
        .where('teacher_uid', '==', teacherUid)
        .get();
        
    const assignments = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    assignments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());`;

code = code.replace(oldFetch2, newFetch2);

fs.writeFileSync('app/actions/teacher_assignments.ts', code);
