const fs = require('fs');
const file = 'kortex_users/parent/ChildAcademicView.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add getDocs and db
code = code.replace(
  `import { collection, onSnapshot } from 'firebase/firestore';`,
  `import { collection, onSnapshot, getDocs } from 'firebase/firestore';`
);

// 2. Add subjectTotals state
code = code.replace(
  `const [progressData, setProgressData] = useState<any[]>([]);`,
  `const [progressData, setProgressData] = useState<any[]>([]);\n  const [subjectTotals, setSubjectTotals] = useState<Record<string, number>>({});`
);

// 3. Add useEffect to fetch learning_tools
const fetchToolsCode = `
  useEffect(() => {
    async function loadTotals() {
      try {
        const snap = await getDocs(collection(db, 'learning_tools'));
        const totals: Record<string, number> = {};
        snap.docs.forEach(doc => {
          const data = doc.data();
          const grade = (data.grade || 'unknown').trim().toLowerCase();
          const subj = (data.subject || 'unknown').trim().toLowerCase();
          const key = \`\${grade}_\${subj}\`;
          totals[key] = (totals[key] || 0) + 1;
        });
        setSubjectTotals(totals);
      } catch (e) {
        console.error("Error loading tools:", e);
      }
    }
    loadTotals();
  }, []);
`;

code = code.replace(
  `  useEffect(() => {
    if (!child.uid) return;`,
  fetchToolsCode + `\n  useEffect(() => {\n    if (!child.uid) return;`
);

fs.writeFileSync(file, code);
