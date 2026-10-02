const fs = require('fs');
const file = 'app/page.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `return <TierLibraryView activeTier={activeTierObj} isLoggedIn={isLoggedIn} requireAuth={(fn: any) => fn()} onOpenTool={handleOpenFeatured} />;`,
  `return <TierLibraryView activeTier={activeTierObj} isLoggedIn={isLoggedIn} requireAuth={(fn: any) => fn()} onOpenTool={handleOpenFeatured} authProfile={authProfile} role={role} isPro={isPro} />;`
);

code = code.replace(
  `if (currentView === 'lessons') return <LessonsView isLoggedIn={isLoggedIn} requireAuth={(fn: any) => fn()} onStartLesson={handleStartLesson} />;`,
  `if (currentView === 'lessons') return <LessonsView isLoggedIn={isLoggedIn} requireAuth={(fn: any) => fn()} onStartLesson={handleStartLesson} authProfile={authProfile} role={role} isPro={isPro} />;`
);

fs.writeFileSync(file, code);
