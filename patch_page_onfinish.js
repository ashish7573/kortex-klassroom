const fs = require('fs');
const file = 'app/page.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldLessonPlayer = `      {playingLesson && (
        <LessonPlayer 
          lesson={playingLesson} initialStep={playingStep} isPro={isPro} isLoggedIn={isLoggedIn} 
          onClose={() => setPlayingLesson(null)} 
          onFinish={async (data: any = {}) => {
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
                    // We must use the tool's subject so it matches the curriculum precisely!
                    const subjectId = tool.subject || (typeof currentView === 'string' && currentView.includes(':') ? currentView.split(':')[1] : currentView);
                    
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
          }} 
        />
      )}`;

const newLessonPlayer = `      {playingLesson && (
        <LessonPlayer 
          lesson={playingLesson} initialStep={playingStep} isPro={isPro} isLoggedIn={isLoggedIn} 
          onClose={() => setPlayingLesson(null)} 
          onStepComplete={async (data: any = {}) => {
             // Log immediate progress for the specific tool!
             if (authProfile && authProfile.role === 'student') {
                try {
                  const user = auth.currentUser;
                  if (user) {
                    const token = await user.getIdToken();
                    
                    const tool = playingLesson.flow?.[data.step] || playingLesson;
                    const toolId = tool.id || tool.title || 'unknown_tool';
                    // We must use the tool's subject so it matches the curriculum precisely!
                    const subjectId = tool.subject || (typeof currentView === 'string' && currentView.includes(':') ? currentView.split(':')[1] : currentView);
                    
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
          }}
          onFinish={async (data: any = {}) => {
             // 🎯 TRACKING: Playlist Completed!
             trackEvent('lesson_completed', { chapter: playingLesson.chapter });
             setPlayingLesson(null);
          }} 
        />
      )}`;

code = code.replace(oldLessonPlayer, newLessonPlayer);

fs.writeFileSync(file, code);
