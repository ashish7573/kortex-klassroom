"use server";
import { adminDb } from '../../backend_configurations/firebase-admin';

export async function migrateLegacyFLNContent() {
  try {
    const toolsRef = adminDb.collection('learning_tools');
    const snapshot = await toolsRef.where('grade', '==', 'FLN').get();
    
    if (snapshot.empty) {
      return { success: true, message: "No legacy FLN content found. Migration complete." };
    }
    
    const batch = adminDb.batch();
    let count = 0;
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      let newSubject = data.subject || 'Unknown';
      if (newSubject && !newSubject.startsWith('FLN')) {
        newSubject = 'FLN ' + newSubject;
      }
      
      batch.update(doc.ref, {
        grade: 'All Grades',
        subject: newSubject
      });
      count++;
    });
    
    await batch.commit();
    return { success: true, message: 'Successfully migrated ' + count + ' FLN tools.' };
  } catch (error: any) {
    console.error("Migration Error:", error);
    return { success: false, error: error.message };
  }
}
