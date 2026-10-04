const admin = require('firebase-admin');
const serviceAccount = require('./backend_configurations/serviceAccountKey.json');
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function run() {
    const snap = await db.collection('users').where('role', '==', 'teacher').get();
    snap.docs.forEach(d => console.log(d.id, d.data()));
    process.exit(0);
}
run();
