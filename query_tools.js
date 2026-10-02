const admin = require('firebase-admin');
const serviceAccount = require('./backend_configurations/serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

async function check() {
  const snap = await admin.firestore().collection('learning_tools').limit(5).get();
  snap.forEach(doc => {
     console.log(doc.id, doc.data().grade, doc.data().subject, doc.data().status);
  });
  process.exit(0);
}
check();
