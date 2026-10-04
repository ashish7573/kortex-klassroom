const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

const oldAuth = `  const { 
    user: authUser, 
    profile: authProfile, 
    role: authRole, 
    isLoggedIn: authIsLoggedIn, 
    isPro: authIsPro, 
    logout: authLogout, 
    sessionAlert 
  } = useAuth();`;

const newAuth = `  const { 
    user: authUser, 
    profile: authProfile, 
    role: authRole, 
    isLoggedIn: authIsLoggedIn, 
    isPro: authIsPro, 
    logout: authLogout, 
    sessionAlert,
    loading: authLoading
  } = useAuth();`;

code = code.replace(oldAuth, newAuth);

const oldEffect = `  // Automatically open shared links
  useEffect(() => {
    if (sharedToolId && !playingLesson) {
      const fetchSharedTool = async () => {`;

const newEffect = `  // Automatically open shared links
  useEffect(() => {
    if (authLoading) return; // Wait for auth state to resolve

    if (sharedToolId && !playingLesson) {
      // 🔒 GUEST LIMIT PATCH
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
      }

      const fetchSharedTool = async () => {`;

code = code.replace(oldEffect, newEffect);

const oldDeps = `      };
      fetchSharedTool();
    }
  }, [sharedToolId]);`;

const newDeps = `      };
      fetchSharedTool();
    }
  }, [sharedToolId, authLoading, authIsLoggedIn, playingLesson]);`;

code = code.replace(oldDeps, newDeps);

fs.writeFileSync('app/page.tsx', code);
