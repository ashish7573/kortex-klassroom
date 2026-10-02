const fs = require('fs');
const file = 'kortex_landing_page/LessonPlayer.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add onStepComplete to props
code = code.replace(
  `export default function LessonPlayer({ lesson, initialStep = 0, isPro = false, isLoggedIn = false, onClose, onFinish }: any) {`,
  `export default function LessonPlayer({ lesson, initialStep = 0, isPro = false, isLoggedIn = false, onClose, onFinish, onStepComplete }: any) {`
);

// 2. Add onStepComplete call inside handleNext
const oldHandleNext = `  const handleNext = (data?: any) => {
      if (data && data.score !== undefined) setFinalScore(data.score);
      if (!isLoggedIn) {`;

const newHandleNext = `  const handleNext = (data?: any) => {
      if (data && data.score !== undefined) setFinalScore(data.score);
      
      // LOG IMMEDIATE PROGRESS!
      if (onStepComplete) {
         onStepComplete({ step: currentStep, score: data?.score !== undefined ? data.score : finalScore });
      }

      if (!isLoggedIn) {`;

code = code.replace(oldHandleNext, newHandleNext);

fs.writeFileSync(file, code);
