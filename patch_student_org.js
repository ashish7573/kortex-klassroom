const fs = require('fs');
let code = fs.readFileSync('app/actions/student.ts', 'utf8');

const oldCode = `export async function getStudentOrgProfiles(idToken: string, orgIds: string[]) {
  try {
    await adminAuth.verifyIdToken(idToken);
    
    const orgProfiles: Record<string, any> = {};
    for (const orgId of orgIds) {
      const snap = await adminDb.collection('users').doc(orgId).get();`;

const newCode = `export async function getStudentOrgProfiles(idToken: string, orgIds: string[]) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const callerDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const callerData = callerDoc.data();
    
    const orgProfiles: Record<string, any> = {};
    for (const orgId of orgIds) {
      // Security Guard: Prevent scraping. Only allow fetching orgs the user belongs to.
      if (callerData?.role !== 'admin' && callerData?.role !== 'krew' && 
          callerData?.org_id !== orgId && !(callerData?.org_ids || []).includes(orgId)) {
          continue; 
      }
      
      const snap = await adminDb.collection('users').doc(orgId).get();`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('app/actions/student.ts', code);
