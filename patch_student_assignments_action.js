const fs = require('fs');
let code = fs.readFileSync('app/actions/student.ts', 'utf8');

const oldDecl = `export async function getStudentAssignments(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const studentUid = decodedToken.uid;`;

const newDecl = `export async function getStudentAssignments(idToken: string, targetUid?: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    let studentUid = decodedToken.uid;
    
    if (targetUid && targetUid !== studentUid) {
       // Validate caller is parent of targetUid
       const docSnap = await adminDb.collection('users').doc(studentUid).get();
       const data = docSnap.data();
       if (data?.role === 'parent' && data?.children?.includes(targetUid)) {
           studentUid = targetUid;
       } else {
           throw new Error("Unauthorized to view this student's assignments");
       }
    }`;

code = code.replace(oldDecl, newDecl);
fs.writeFileSync('app/actions/student.ts', code);
