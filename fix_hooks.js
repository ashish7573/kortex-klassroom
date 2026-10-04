const fs = require('fs');
let code = fs.readFileSync('kortex_landing_page/LessonPlayer.tsx', 'utf8');

// Move finalScore up
code = code.replace(
    '  // UPDATED: Logic to trap the demo at the end and show the finale\n  const [finalScore, setFinalScore] = useState<number | undefined>(undefined);\n',
    ''
);

// Move drawing useEffect up
const oldDrawingHook = `// --- NEW: ANNOTATION DRAWING LOGIC ---
  useEffect(() => {
      if (isDrawingMode && canvasRef.current) {
          const canvas = canvasRef.current;
          canvas.width = canvas.offsetWidth;
          canvas.height = canvas.offsetHeight;
      }
  }, [isDrawingMode]);`;

code = code.replace(oldDrawingHook, `// --- NEW: ANNOTATION DRAWING LOGIC ---`);

// Inject them safely at the top
const injectionPoint = "  useEffect(() => {\n      if (isTimerActive) {";
const injectedCode = `  const [finalScore, setFinalScore] = useState<number | undefined>(undefined);
  
  useEffect(() => {
      if (isDrawingMode && canvasRef.current) {
          const canvas = canvasRef.current;
          canvas.width = canvas.offsetWidth;
          canvas.height = canvas.offsetHeight;
      }
  }, [isDrawingMode]);\n\n  useEffect(() => {\n      if (isTimerActive) {`;

code = code.replace(injectionPoint, injectedCode);

fs.writeFileSync('kortex_landing_page/LessonPlayer.tsx', code);
