const fs = require('fs');
const file = 'kortex_landing_page/LessonPlayer.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `const handleNext = () => { \n      if (isLastStep) {`,
  `const handleNext = () => { \n      if (!isLoggedIn) {\n          setShowFinale(true);\n          return;\n      }\n      if (isLastStep) {`
);

fs.writeFileSync(file, code);
