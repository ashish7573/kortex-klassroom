const fs = require('fs');
const file = 'app/page.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldOnFinish = `          onFinish={() => {
             // 🎯 TRACKING: Lesson Completed!
             trackEvent('lesson_completed', { chapter: playingLesson.chapter });
             setPlayingLesson(null);
          }} `;

const newOnFinish = `          onFinish={async (data: any = {}) => {
             // 🎯 TRACKING: Lesson Completed!
             trackEvent('lesson_completed', { chapter: playingLesson.chapter });
             
             if (authProfile && authProfile.role === 'student') {
                try {
                  const user = auth.currentUser;
                  if (user) {
                    const token = await user.getIdToken();
                    
                    // We need to figure out toolId. 
                    // playingLesson.flow might be an array of tools.
                    const tool = playingLesson.flow?.[playingStep] || playingLesson;
                    const toolId = tool.id || tool.title || 'unknown_tool';
                    const subjectId = currentView; // current tier/view
                    
                    await logStudentActivity(token, {
                      toolId: toolId,
                      chapterName: playingLesson.chapter,
                      subjectId: subjectId,
                      score: data.score
                    });
                  }
                } catch (e) {
                  console.error("Failed to log activity", e);
                }
             }
             
             setPlayingLesson(null);
          }} `;

code = code.replace(oldOnFinish, newOnFinish);

// I need to import logStudentActivity
if (!code.includes('logStudentActivity')) {
  code = code.replace(
    `import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';`,
    `import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';\nimport { logStudentActivity } from './actions/student';`
  );
}

fs.writeFileSync(file, code);
