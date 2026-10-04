const fs = require('fs');
let code = fs.readFileSync('kortex_landing_page/LessonPlayer.tsx', 'utf8');

// 1. Remove finalScore useState
code = code.replace(
    '  // UPDATED: Logic to trap the demo at the end and show the finale\n  const [finalScore, setFinalScore] = useState<number | undefined>(undefined);\n',
    ''
);

// 2. Remove Drawing Logic block
const drawingLogicStart = code.indexOf('// --- NEW: ANNOTATION DRAWING LOGIC ---');
const drawingLogicEnd = code.indexOf('  // ------------------------------------', drawingLogicStart) + 41;

const drawingLogic = code.substring(drawingLogicStart, drawingLogicEnd);
code = code.replace(drawingLogic + '\n', '');

// 3. Insert both right before the first IF return
const injectionPoint = '  const handleShare = () => {';
const newCode = `  const [finalScore, setFinalScore] = useState<number | undefined>(undefined);\n\n${drawingLogic}\n\n  const handleShare = () => {`;
code = code.replace(injectionPoint, newCode);

fs.writeFileSync('kortex_landing_page/LessonPlayer.tsx', code);
