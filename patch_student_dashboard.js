const fs = require('fs');
let code = fs.readFileSync('kortex_users/student/StudentDashboard.tsx', 'utf8');

// 1. Import the hook
code = code.replace(
  `import { db } from '../../backend_configurations/firebase';`,
  `import { db } from '../../backend_configurations/firebase';\nimport { useStudentAssignments, AssignmentStatus } from '../../hooks/useStudentAssignments';`
);

// 2. Remove the old inline Assignment types
const oldTypes = `  // --------------------------------------------------------------------------
  type AssignmentStatus = 'pending' | 'submitted' | 'graded';
  interface Assignment {
    id: string;
    title: string;
    subject: string;
    status: AssignmentStatus;
    dueDate: string;
    link?: string;
    submittedDate?: string;
    isOnTime?: boolean;
    score?: number;
    totalPoints?: number;
    grade?: string;
  }

  // Currently empty, but the UI is ready to receive data from Firestore
  const myAssignments: Assignment[] = [];
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentStatus>('pending');
  
  const filteredAssignments = myAssignments.filter(a => a.status === assignmentFilter);`;

const newTypes = `  // --------------------------------------------------------------------------
  const { assignments, loading: loadingAssignments } = useStudentAssignments(profile.uid);
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentStatus>('pending');
  const filteredAssignments = assignments.filter(a => a.status === assignmentFilter);`;

code = code.replace(oldTypes, newTypes);

fs.writeFileSync('kortex_users/student/StudentDashboard.tsx', code);
