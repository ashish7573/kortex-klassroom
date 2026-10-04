const admin = require('firebase-admin');
const serviceAccount = require('./backend_configurations/serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function run() {
    const assignmentsSnap = await db.collection('assignments').where('tool_type', '==', 'unknown').get();
    let count = 0;
    
    for (const doc of assignmentsSnap.docs) {
        const assignment = doc.data();
        
        // Fetch the tool to find its actual type
        const toolDoc = await db.collection('learning_tools').doc(assignment.tool_id).get();
        let actualType = 'Task';
        if (toolDoc.exists) {
            const tool = toolDoc.data();
            actualType = tool.type || tool.content_type || 'Task';
        }
        
        await doc.ref.update({ tool_type: actualType });
        count++;
    }
    
    console.log(`Updated ${count} unknown assignments.`);
    process.exit(0);
}

run();
