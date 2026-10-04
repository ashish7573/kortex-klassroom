const fs = require('fs');
let code = fs.readFileSync('kortex_users/teacher/AssignmentBuilderModal.tsx', 'utf8');

const oldState = `  const [step, setStep] = useState(1);
  const [tools, setTools] = useState<any[]>([]);
  const [loadingTools, setLoadingTools] = useState(true);`;

const newState = `  const [step, setStep] = useState(1);
  const [allTools, setAllTools] = useState<any[]>([]);
  const [hierarchy, setHierarchy] = useState<any>({});
  const [loadingTools, setLoadingTools] = useState(true);
  
  // Drill-down State
  const [searchQuery, setSearchQuery] = useState('');
  const [navChapter, setNavChapter] = useState<string | null>(null);
  const [navSubtopic, setNavSubtopic] = useState<string | null>(null);`;

code = code.replace(oldState, newState);

// Update fetchCurriculum
const oldFetch = `        // Group by Chapter for UI
        const grouped = matched.reduce((acc: any, tool: any) => {
          const ch = tool.chapter_name || 'General';
          if (!acc[ch]) acc[ch] = [];
          acc[ch].push(tool);
          return acc;
        }, {});
        
        setTools(grouped);`;

const newFetch = `        setAllTools(matched);
        
        // Group by Chapter -> Subtopic for UI
        const grouped = matched.reduce((acc: any, tool: any) => {
          const ch = tool.chapter_name || 'General';
          const sub = tool.subtopic_name || 'General Subtopic';
          if (!acc[ch]) acc[ch] = {};
          if (!acc[ch][sub]) acc[ch][sub] = [];
          acc[ch][sub].push(tool);
          return acc;
        }, {});
        
        setHierarchy(grouped);`;

code = code.replace(oldFetch, newFetch);

// Import ChevronRight, Search, ArrowLeft
code = code.replace(
  `import { X, ChevronRight, CheckCircle2, Calendar, Users, BookOpen } from 'lucide-react';`,
  `import { X, ChevronRight, CheckCircle2, Calendar, Users, BookOpen, Search, ArrowLeft } from 'lucide-react';`
);

fs.writeFileSync('kortex_users/teacher/AssignmentBuilderModal.tsx', code);
