const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

const routeOld = `       if (role === 'student') return <UserPortalDispatcher profile={authProfile!} onNavigateHome={() => setCurrentView('home')} onExploreTier={(tierId: any) => setCurrentView(tierId)} onOpenCMS={() => setCurrentView('home')} />;
       if (role === 'parent') return <UserPortalDispatcher profile={authProfile!} onNavigateHome={() => setCurrentView('home')} onExploreTier={(tierId: any) => setCurrentView(tierId)} onOpenCMS={() => setCurrentView('home')} />;
       if (role === 'org_admin') return <UserPortalDispatcher profile={authProfile!} onNavigateHome={() => setCurrentView('home')} onExploreTier={(tierId: any) => setCurrentView(tierId)} onOpenCMS={() => setCurrentView('home')} />;
       if (role === 'krew') return <UserPortalDispatcher profile={authProfile!} onNavigateHome={() => setCurrentView('home')} onExploreTier={(tierId: any) => setCurrentView(tierId)} onOpenCMS={() => setCurrentView('home')} />;\n    }`;

const routeNew = `       if (role === 'student') return <UserPortalDispatcher profile={authProfile!} onNavigateHome={() => setCurrentView('home')} onExploreTier={(tierId: any) => setCurrentView(tierId)} onOpenCMS={() => setCurrentView('home')} />;
       if (role === 'parent') return <UserPortalDispatcher profile={authProfile!} onNavigateHome={() => setCurrentView('home')} onExploreTier={(tierId: any) => setCurrentView(tierId)} onOpenCMS={() => setCurrentView('home')} />;
       if (role === 'org_admin') return <UserPortalDispatcher profile={authProfile!} onNavigateHome={() => setCurrentView('home')} onExploreTier={(tierId: any) => setCurrentView(tierId)} onOpenCMS={() => setCurrentView('home')} />;
       if (role === 'krew') return <UserPortalDispatcher profile={authProfile!} onNavigateHome={() => setCurrentView('home')} onExploreTier={(tierId: any) => setCurrentView(tierId)} onOpenCMS={() => setCurrentView('home')} />;
       if (role === 'teacher') return <UserPortalDispatcher profile={authProfile!} onNavigateHome={() => setCurrentView('home')} onExploreTier={(tierId: any) => setCurrentView(tierId)} onOpenCMS={() => setCurrentView('home')} />;\n    }`;

code = code.replace(routeOld, routeNew);
fs.writeFileSync('app/page.tsx', code);
