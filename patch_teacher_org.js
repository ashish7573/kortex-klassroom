const fs = require('fs');
let code = fs.readFileSync('app/actions/teacher.ts', 'utf8');

const oldCode = `    // Verify teacher is authorized
    const docSnap = await adminDb.collection('users').doc(teacherUid).get();
    const teacherData = docSnap.data() as any;
    if (teacherData.role !== 'teacher') throw new Error("Unauthorized");
    
    const assigned = teacherData.assigned_combos || [];`;

const newCode = `    // Verify teacher is authorized
    const docSnap = await adminDb.collection('users').doc(teacherUid).get();
    const teacherData = docSnap.data() as any;
    if (teacherData.role !== 'teacher') throw new Error("Unauthorized");
    
    // Security Guard: Verify teacher actually belongs to the requested Org
    if (teacherData.org_id !== orgId && !(teacherData.org_ids && teacherData.org_ids.includes(orgId))) {
        throw new Error("Unauthorized: Teacher does not belong to this organization");
    }
    
    const assigned = teacherData.assigned_combos || [];`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('app/actions/teacher.ts', code);
