const fs = require('fs');
const file = 'app/page.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes("import { consumeHeart }")) {
  code = code.replace(
    `import { signOut, onAuthStateChanged } from 'firebase/auth';`,
    `import { signOut, onAuthStateChanged } from 'firebase/auth';\nimport { consumeHeart } from '../app/actions/student';`
  );
}

const energyCheckLogic = `  const ensureEnergy = async () => {
    if (role === 'student' && !isPro && authProfile) {
        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) return false;
            if (authProfile.hearts_remaining <= 0) {
                 setAlertConfig({
                    title: "Out of Energy!",
                    message: "You've used all 5 hearts today. Come back tomorrow for more, or ask your parents to unlock Kortex Pro!",
                    type: "warning"
                 });
                 return false;
            }
            const result = await consumeHeart(token, authProfile.uid);
            if (!result.success) {
                 setAlertConfig({
                    title: "Out of Energy!",
                    message: "You've used all your hearts for today.",
                    type: "warning"
                 });
                 return false;
            }
        } catch (e) { return false; }
    }
    return true;
  };

  const handleOpenFeatured = async (item: any) => {`;

code = code.replace(`  const handleOpenFeatured = (item: any) => {`, energyCheckLogic);
code = code.replace(`handleOpenFeatured = async (item: any) => {`, `handleOpenFeatured = async (item: any) => {\n      const hasEnergy = await ensureEnergy();\n      if (!hasEnergy) return;`);
code = code.replace(`const handleStartLesson = (lesson: any, stepIndex: any) => {`, `const handleStartLesson = async (lesson: any, stepIndex: any) => {\n       const hasEnergy = await ensureEnergy();\n       if (!hasEnergy) return;`);

fs.writeFileSync(file, code);
