const fs = require('fs');
const file = 'app/page.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `useEffect(() => {
    const handleNav = (e: any) => setCurrentView(e.detail);
    window.addEventListener('navigate-tab', handleNav);
    return () => window.removeEventListener('navigate-tab', handleNav);
  }, []);`,
  `useEffect(() => {
    const handleNav = (e: any) => setCurrentView(e.detail);
    window.addEventListener('navigate-tab', handleNav);
    
    const handleAuth = (e: any) => {
       setAuthMode(e.detail || 'signin');
       setShowAuthModal(true);
    };
    window.addEventListener('open-auth-modal', handleAuth);
    
    return () => {
      window.removeEventListener('navigate-tab', handleNav);
      window.removeEventListener('open-auth-modal', handleAuth);
    };
  }, []);`
);

fs.writeFileSync(file, code);
