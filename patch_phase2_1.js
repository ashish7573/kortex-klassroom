const fs = require('fs');
let code = fs.readFileSync('app/actions/student.ts', 'utf8');

const oldParentId = `export async function generateParentId(): Promise<string> {
  const counterRef = adminDb.collection('system').doc('parent_counter');`;

const newParentId = `export async function generateParentId(idToken: string): Promise<string> {
  // 🔒 PATCH: Block unauthenticated DDOS attacks
  await adminAuth.verifyIdToken(idToken);
  
  const counterRef = adminDb.collection('system').doc('parent_counter');`;

code = code.replace(oldParentId, newParentId);

fs.writeFileSync('app/actions/student.ts', code);
