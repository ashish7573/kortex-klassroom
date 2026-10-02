import { adminDb } from './backend_configurations/firebase-admin';

async function migrate() {
    console.log("Fetching students...");
    const snapshot = await adminDb.collection('users').where('role', '==', 'student').get();
    let migrated = 0;
    
    for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.org_id && !data.org_ids) {
            console.log(`Migrating student: ${data.full_name} (${doc.id})`);
            await doc.ref.update({
                org_ids: [data.org_id],
                org_links: {
                    [data.org_id]: {
                        org_name: "Legacy Migration",
                        grade: data.grade || "Unknown",
                        section: data.section || null,
                        assigned_combos: data.assigned_combos || []
                    }
                }
            });
            migrated++;
        } else if (!data.org_ids) {
            console.log(`Fixing independent student: ${data.full_name} (${doc.id})`);
            await doc.ref.update({
                org_ids: [],
                org_links: {}
            });
            migrated++;
        }
    }
    console.log(`Migration complete. Updated ${migrated} students.`);
}

migrate().catch(console.error);
