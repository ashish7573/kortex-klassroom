const fs = require('fs');
const file = 'kortex_landing_page/LessonPlayer.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `const LessonPlayer = ({ lesson, initialStep, isLoggedIn, onClose, onFinish }: any) => {`,
  `const LessonPlayer = ({ lesson, initialStep, isLoggedIn, onClose, onFinish, onStepComplete }: any) => {`
);

fs.writeFileSync(file, code);
