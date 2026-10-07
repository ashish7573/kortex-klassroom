import { adminDb } from './backend_configurations/firebase-admin';

async function test() {
  const snapshot = await adminDb.collection('learning_tools').where('content_type', '==', 'pdf').limit(5).get();
  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });
}
test().catch(console.error);
