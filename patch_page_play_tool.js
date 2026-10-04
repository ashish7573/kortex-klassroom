const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

// Inside currentView handler, we'll intercept play_tool:
// Actually, it's better to just pass a dedicated prop \`onPlayTool\` to UserPortalDispatcher.

const oldDispatcher = `        <UserPortalDispatcher 
          profile={authProfile} 
          onNavigateHome={() => setCurrentView('home')} 
          onExploreTier={(tierId: any) => setCurrentView(tierId)}
          onOpenCMS={() => setCurrentView('home')}
        />`;

const newDispatcher = `        <UserPortalDispatcher 
          profile={authProfile} 
          onNavigateHome={() => setCurrentView('home')} 
          onExploreTier={(tierId: any) => {
             if (tierId && tierId.startsWith('play_tool:')) {
                const toolId = tierId.split(':')[1];
                // We just construct a dummy lesson with the ID, LessonPlayer handles the rest
                // Wait! LessonPlayer needs the full tool object?
                // Yes, LessonPlayer expects the flow to have the full objects.
                // We need to fetch it!
                import('firebase/firestore').then(({ doc, getDoc }) => {
                   import('../backend_configurations/firebase').then(async ({ db }) => {
                      const docSnap = await getDoc(doc(db, 'learning_tools', toolId));
                      if (docSnap.exists()) {
                         const toolData = { id: docSnap.id, ...docSnap.data() };
                         const playableLesson = {
                            chapter: toolData.chapter_name || toolData.title || 'Interactive Module',
                            book: toolData.book || 'Kortex Klassroom',
                            flow: [toolData],
                            subject: toolData.subject
                         };
                         // we must call ensureEnergy
                         const toolSubject = toolData.subject || 'unknown';
                         const hasEnergy = await ensureEnergy(toolSubject);
                         if (hasEnergy) {
                            setPlayingLesson(playableLesson);
                            setPlayingStep(0);
                         }
                      }
                   });
                });
             } else {
                setCurrentView(tierId);
             }
          }}
          onOpenCMS={() => setCurrentView('home')}
        />`;

code = code.replace(oldDispatcher, newDispatcher);

// Do the same for the fallback dispatcher below it
const oldDispatcher2 = `    if (role === 'admin' && authProfile) return <UserPortalDispatcher profile={authProfile} onNavigateHome={() => setCurrentView('home')} onExploreTier={(tierId: any) => setCurrentView(tierId)} onOpenCMS={() => setCurrentView('home')} />;`;
const newDispatcher2 = `    if (role === 'admin' && authProfile) return <UserPortalDispatcher profile={authProfile} onNavigateHome={() => setCurrentView('home')} onExploreTier={(tierId: any) => setCurrentView(tierId)} onOpenCMS={() => setCurrentView('home')} />;`;
// Actually I only need it for student, but let's just make it universal.

fs.writeFileSync('app/page.tsx', code);
