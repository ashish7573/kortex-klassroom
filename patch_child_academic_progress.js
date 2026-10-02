const fs = require('fs');
const file = 'kortex_users/parent/ChildAcademicView.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add progressData state and onSnapshot import
code = code.replace(
  `import { auth } from '../../backend_configurations/firebase';`,
  `import { auth, db } from '../../backend_configurations/firebase';\nimport { collection, onSnapshot } from 'firebase/firestore';`
);

code = code.replace(
  `  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentStatus>('pending');`,
  `  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentStatus>('pending');\n  const [progressData, setProgressData] = useState<any[]>([]);`
);

// 2. Add useEffect to listen to progress
const progressEffect = `
  useEffect(() => {
    if (!child.uid) return;
    const unsubscribe = onSnapshot(collection(db, 'users', child.uid, 'progress'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProgressData(data);
    });
    return () => unsubscribe();
  }, [child.uid]);
`;

code = code.replace(
  `  useEffect(() => {
    async function loadData() {`,
  progressEffect + `\n  useEffect(() => {\n    async function loadData() {`
);

// 3. Replace mockPerformance with real progress mapping
const mockPerfCode = `        const mockPerformance: SubjectPerformance[] = subjects.map((sub, idx) => {
          const baseScore = 65 + (idx * 7 + index * 3) % 30; 
          return {
            subjectName: sub.subjectName,
            childScore: baseScore,
            classAvg: Math.max(50, baseScore - 5 + (idx % 10)),
            baseline: 60,
            isLocked: false // Org subjects are paid by the org, always unlocked
          };
        });`;

const realPerfCode = `        const mockPerformance: SubjectPerformance[] = subjects.map((sub) => {
          // Find real progress
          const subjProgress = progressData.find(p => p.id.toLowerCase() === sub.subjectName.toLowerCase() || p.subject_id?.toLowerCase() === sub.subjectName.toLowerCase());
          
          let childScore = 0;
          if (subjProgress && subjProgress.completed_tools) {
             const tools = Object.values(subjProgress.completed_tools) as any[];
             const scoredTools = tools.filter(t => t.best_score !== undefined);
             if (scoredTools.length > 0) {
                 childScore = Math.round(scoredTools.reduce((acc, t) => acc + (t.best_score || 0), 0) / scoredTools.length);
             }
          }

          return {
            subjectName: sub.subjectName,
            childScore: childScore, // Actual average score from completed quizzes/games
            classAvg: 0, // Need backend aggregation for this
            baseline: 60,
            isLocked: false
          };
        });`;

code = code.replace(mockPerfCode, realPerfCode);

// 4. Do the same for independent subjects
const indepMockCode = `  const independentPerformance: SubjectPerformance[] = independentSubjectsMock.map((sub, idx) => {
    // Locked if NOT pro and NOT explicitly bought via a B2C license
    const isLocked = !isPro && !b2cLicenses.includes(sub.comboId);
    return {
      subjectName: sub.name,
      childScore: 70 + (idx * 5),
      classAvg: 65,
      baseline: 60,
      isLocked
    };
  });`;

const indepRealCode = `  const independentPerformance: SubjectPerformance[] = independentSubjectsMock.map((sub) => {
    const isLocked = !isPro && !b2cLicenses.includes(sub.comboId);
    
    // Find real progress
    const subjProgress = progressData.find(p => p.id.toLowerCase() === sub.name.toLowerCase() || p.subject_id?.toLowerCase() === sub.name.toLowerCase());
    
    let childScore = 0;
    if (subjProgress && subjProgress.completed_tools) {
       const tools = Object.values(subjProgress.completed_tools) as any[];
       const scoredTools = tools.filter(t => t.best_score !== undefined);
       if (scoredTools.length > 0) {
           childScore = Math.round(scoredTools.reduce((acc, t) => acc + (t.best_score || 0), 0) / scoredTools.length);
       }
    }

    return {
      subjectName: sub.name,
      childScore: childScore,
      classAvg: 0,
      baseline: 60,
      isLocked
    };
  });`;

code = code.replace(indepMockCode, indepRealCode);

fs.writeFileSync(file, code);
