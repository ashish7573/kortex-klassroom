const fs = require('fs');
const file = 'kortex_landing_page/all_lessons_page.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add import for onSnapshot
code = code.replace(
  `import { collection, getDocs } from 'firebase/firestore';`,
  `import { collection, getDocs, onSnapshot } from 'firebase/firestore';`
);

// Add authProfile to props destructuring
code = code.replace(
  `const LessonsView = ({ isLoggedIn, requireAuth, onStartLesson, defaultClass, defaultSubject }: any) => {`,
  `const LessonsView = ({ isLoggedIn, requireAuth, onStartLesson, defaultClass, defaultSubject, authProfile }: any) => {`
);

// Add state for progress
code = code.replace(
  `  const [expandedSubTopics, setExpandedSubTopics] = useState({});`,
  `  const [expandedSubTopics, setExpandedSubTopics] = useState({});\n  const [studentProgress, setStudentProgress] = useState<any[]>([]);`
);

// Add useEffect for fetching progress
const progressEffect = `
  useEffect(() => {
    if (!authProfile?.uid) return;
    const unsubscribe = onSnapshot(collection(db, 'users', authProfile.uid, 'progress'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudentProgress(data);
    });
    return () => unsubscribe();
  }, [authProfile]);
`;

code = code.replace(
  `  const toggleSubTopic = (id: any) => setExpandedSubTopics(prev => ({ ...prev, [id]: !prev[id] }));`,
  `  const toggleSubTopic = (id: any) => setExpandedSubTopics(prev => ({ ...prev, [id]: !prev[id] }));\n${progressEffect}`
);

fs.writeFileSync(file, code);
