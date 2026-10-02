const fs = require('fs');
const file = 'app/page.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldRender = `    if (currentView === 'lessons') return <LessonsView isLoggedIn={isLoggedIn} requireAuth={(fn: any) => fn()} onStartLesson={handleStartLesson} authProfile={authProfile} role={role} isPro={isPro} />;`;

const newRender = `    if (currentView?.startsWith('lessons')) {
        let defaultClass = "";
        let defaultSubject = "";
        if (currentView.includes(':')) {
             const combo = currentView.split(':')[1];
             const match = combo.match(/grade-(\\d+)-(.*)/i);
             if (match) {
                 defaultClass = \`Grade \${match[1]}\`;
                 defaultSubject = match[2];
             }
        }
        return <LessonsView isLoggedIn={isLoggedIn} requireAuth={(fn: any) => fn()} onStartLesson={handleStartLesson} authProfile={authProfile} role={role} isPro={isPro} defaultClass={defaultClass} defaultSubject={defaultSubject} />;
    }`;

code = code.replace(oldRender, newRender);

fs.writeFileSync(file, code);
