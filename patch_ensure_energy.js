const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

const oldLogic = `       if (plays >= 3) {
          setAlertConfig({
             title: "Free Demos Exhausted",
             message: "You've used all your free guest passes! Create a free account to continue playing.",
             type: "warning"
          } as any);
          setAuthMode('signup');
          setShowAuthModal(true);
          return false;
       }`;

const newLogic = `       if (plays >= 3) {
          setAlertConfig({
             title: "Free Demos Exhausted",
             message: "You've used all your free guest passes! Create a free account to continue playing.",
             type: "warning",
             actionLabel: "Sign Up for Free",
             onAction: () => {
                setAlertConfig(null);
                setAuthMode('signup');
                setShowAuthModal(true);
             }
          } as any);
          return false;
       }`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('app/page.tsx', code);
