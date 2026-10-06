const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function check() {
  console.log("Checking Org Combos...");
  const orgs = await db.collection('users').where('role', '==', 'org_admin').get();
  orgs.forEach(doc => {
    const data = doc.data();
    if (data.approved_grade_subject_combos) {
      data.approved_grade_subject_combos.forEach(c => {
        if (c.includes('FLN')) console.log("Found in org:", data.kortex_id, c);
      });
    }
  });

  console.log("Checking Teachers...");
  const teachers = await db.collection('users').where('role', '==', 'teacher').get();
  teachers.forEach(doc => {
    const data = doc.data();
    if (data.assigned_combos) {
      data.assigned_combos.forEach(c => {
        if (c.endsWith('FLN')) console.log("Found teacher:", data.email, c);
      });
    }
  });

  console.log("Checking Students...");
  const students = await db.collection('users').where('role', '==', 'student').get();
  students.forEach(doc => {
    const data = doc.data();
    if (data.assigned_combos) {
      data.assigned_combos.forEach(c => {
        if (c.endsWith('FLN')) console.log("Found student:", data.email, c);
      });
    }
  });
}
check().then(() => process.exit(0)).catch(console.error);
