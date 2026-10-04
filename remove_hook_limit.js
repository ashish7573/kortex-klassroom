const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

const hookCheck = `      // 🔒 GUEST LIMIT PATCH
      if (!authIsLoggedIn) {
         const plays = parseInt(localStorage.getItem('kortex_guest_plays') || '0');
         if (plays >= 3) {
            setAlertConfig({
               title: "Free Demos Exhausted",
               message: "You've used all your free guest passes! Create a free account to continue playing.",
               type: "warning"
            });
            setAuthMode('signup');
            setShowAuthModal(true);
            return;
         }
         localStorage.setItem('kortex_guest_plays', (plays + 1).toString());
      }`;

code = code.replace(hookCheck, `      // Limit is now enforced centrally by ensureEnergy inside fetchSharedTool`);

const oldFetch = `          if (itemData) {
            setPlayingLesson({`;

const newFetch = `          if (itemData) {
            // Check central energy/guest limits
            const toolSubject = itemData.subject || 'unknown';
            const hasEnergy = await ensureEnergy(toolSubject);
            if (!hasEnergy) return;
            
            setPlayingLesson({`;

code = code.replace(oldFetch, newFetch);

fs.writeFileSync('app/page.tsx', code);
