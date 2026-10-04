const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

const oldEnsureEnergy = `  const ensureEnergy = async (toolSubject?: string) => {
    if (role === 'student' && !isPro && authProfile) {`;

const newEnsureEnergy = `  const ensureEnergy = async (toolSubject?: string) => {
    // 🔒 GUEST LIMIT CHECK
    if (!authIsLoggedIn) {
       const plays = parseInt(localStorage.getItem('kortex_guest_plays') || '0');
       if (plays >= 3) {
          setAlertConfig({
             title: "Free Demos Exhausted",
             message: "You've used all your free guest passes! Create a free account to continue playing.",
             type: "warning"
          } as any);
          setAuthMode('signup');
          setShowAuthModal(true);
          return false;
       }
       localStorage.setItem('kortex_guest_plays', (plays + 1).toString());
       return true;
    }

    if (role === 'student' && !isPro && authProfile) {`;

code = code.replace(oldEnsureEnergy, newEnsureEnergy);
fs.writeFileSync('app/page.tsx', code);
