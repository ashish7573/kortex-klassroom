const fs = require('fs');
const file = 'app/actions/student.ts';
let code = fs.readFileSync(file, 'utf8');

const logActivityFunc = `
export async function logStudentActivity(
  idToken: string,
  activityData: {
    toolId: string;
    chapterName: string;
    subjectId: string;
    score?: number;
    timeSpentSeconds?: number;
  }
) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const studentUid = decodedToken.uid;
    
    const studentRef = adminDb.collection('users').doc(studentUid);
    const studentDoc = await studentRef.get();
    
    if (!studentDoc.exists || studentDoc.data()?.role !== 'student') {
      throw new Error("Unauthorized: Only students can log progress.");
    }

    const data = studentDoc.data() as any;
    
    // 1. Calculate Streak
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
    let streak = data.current_streak_days || 0;
    const lastActive = data.last_active_date;
    
    if (lastActive !== dateString) {
       if (lastActive) {
         const lastDate = new Date(lastActive);
         const diffTime = Math.abs(today.getTime() - lastDate.getTime());
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
         if (diffDays === 1) {
           streak += 1;
         } else {
           streak = 1;
         }
       } else {
         streak = 1;
       }
    }
    
    // 2. Award XP and check Badges
    const earnedXp = 50; 
    const totalXp = (data.total_xp || 0) + earnedXp;
    
    let achievements = data.achievements || [];
    if (!achievements.includes('first_game')) achievements.push('first_game');
    if (streak >= 3 && !achievements.includes('streak_3_days')) achievements.push('streak_3_days');
    if (streak >= 7 && !achievements.includes('streak_7_days')) achievements.push('streak_7_days');
    if (totalXp >= 500 && !achievements.includes('xp_500')) achievements.push('xp_500');

    const batch = adminDb.batch();

    batch.update(studentRef, {
      current_streak_days: streak,
      last_active_date: dateString,
      total_xp: totalXp,
      achievements: achievements,
      updated_at: new Date().toISOString()
    });

    // 3. Update Progress Document
    const progressRef = studentRef.collection('progress').doc(activityData.subjectId || 'general');
    const progressDoc = await progressRef.get();
    
    let progressData = progressDoc.exists ? progressDoc.data() : {
      subject_id: activityData.subjectId || 'general',
      xp: 0,
      total_time_spent_seconds: 0,
      completed_tools: {}
    };
    
    progressData.xp = (progressData.xp || 0) + earnedXp;
    progressData.total_time_spent_seconds = (progressData.total_time_spent_seconds || 0) + (activityData.timeSpentSeconds || 0);
    progressData.last_played_at = new Date().toISOString();
    
    const toolKey = activityData.toolId.replace(/\\./g, '_'); // sanitize firestore keys
    const toolData = progressData.completed_tools[toolKey] || {
       chapter_name: activityData.chapterName,
       times_completed: 0,
    };
    
    toolData.times_completed += 1;
    toolData.last_played_at = new Date().toISOString();
    
    if (activityData.score !== undefined) {
       if (toolData.best_score === undefined || activityData.score > toolData.best_score) {
          toolData.best_score = activityData.score;
       }
    }
    
    progressData.completed_tools[toolKey] = toolData;
    
    if (progressDoc.exists) {
      batch.update(progressRef, progressData);
    } else {
      batch.set(progressRef, progressData);
    }

    // 4. Update Leaderboard
    if (activityData.score !== undefined) {
      const leaderboardRef = adminDb.collection('leaderboards').doc(toolKey).collection('scores').doc(studentUid);
      const lbDoc = await leaderboardRef.get();
      if (!lbDoc.exists || lbDoc.data()?.score < activityData.score) {
        batch.set(leaderboardRef, {
          score: activityData.score,
          student_name: data.full_name || 'Anonymous Student',
          updated_at: new Date().toISOString()
        });
      }
    }

    await batch.commit();

    return { 
      success: true, 
      streak, 
      xpEarned: earnedXp,
      totalXp,
      achievementsUnlocked: achievements.length > (data.achievements?.length || 0)
    };
  } catch (error: unknown) {
    console.error("Error logging student activity:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
`;

code += "\n" + logActivityFunc;
fs.writeFileSync(file, code);
