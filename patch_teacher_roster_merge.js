const fs = require('fs');
let code = fs.readFileSync('app/actions/teacher.ts', 'utf8');

// 1. We need to pass comboStr to getClassroomRoster to parse section
// Let's modify TeacherClassView to pass combo.comboLabel

let viewCode = fs.readFileSync('kortex_users/teacher/TeacherClassView.tsx', 'utf8');
viewCode = viewCode.replace(
  `const res = await getClassroomRoster(token, combo.orgId, combo.comboId, combo.gradeStr, combo.subjectStr);`,
  `const res = await getClassroomRoster(token, combo.orgId, combo.comboId, combo.gradeStr, combo.subjectStr, combo.comboLabel);`
);
fs.writeFileSync('kortex_users/teacher/TeacherClassView.tsx', viewCode);

// 2. Modify getClassroomRoster to accept comboLabel and merge students
const oldRosterDef = `export async function getClassroomRoster(idToken: string, orgId: string, comboId: string, gradeStr: string, subjectStr: string) {`;
const newRosterDef = `export async function getClassroomRoster(idToken: string, orgId: string, comboId: string, gradeStr: string, subjectStr: string, comboLabel: string) {`;
code = code.replace(oldRosterDef, newRosterDef);

const oldQueryBlock = `    // Fetch Students assigned to this combo in the Org
    const studentsSnap = await adminDb.collection('users')
      .where('role', '==', 'student')
      .where(\`org_links.\${orgId}.assigned_combos\`, 'array-contains', comboId)
      .get();
      
    const roster: ClassStudentData[] = [];
    studentsSnap.docs.forEach((doc: any) => {`;

const newQueryBlock = `    // Extract section from comboLabel (e.g. "Grade 1 - Section A - Maths")
    const parts = comboLabel.split('-');
    let sectionStr = '';
    if (parts.length > 2) {
       sectionStr = parts[1].trim(); // "Section A"
    }
    
    // Fetch 1: Students whose default grade & section matches
    let defaultSnap = { docs: [] as any[] };
    if (sectionStr) {
       const q1 = adminDb.collection('users')
          .where('role', '==', 'student')
          .where(\`org_links.\${orgId}.grade\`, '==', gradeStr)
          .where(\`org_links.\${orgId}.section\`, '==', sectionStr);
       defaultSnap = await q1.get();
    }

    // Fetch 2: Students explicitly assigned this extra combo
    const q2 = adminDb.collection('users')
      .where('role', '==', 'student')
      .where(\`org_links.\${orgId}.assigned_combos\`, 'array-contains', comboId);
    const explicitSnap = await q2.get();
      
    const rosterMap: Record<string, any> = {};
    
    defaultSnap.docs.forEach((doc: any) => { rosterMap[doc.id] = doc; });
    explicitSnap.docs.forEach((doc: any) => { rosterMap[doc.id] = doc; });
    
    const roster: ClassStudentData[] = [];
    Object.values(rosterMap).forEach((doc: any) => {`;

code = code.replace(oldQueryBlock, newQueryBlock);

fs.writeFileSync('app/actions/teacher.ts', code);
