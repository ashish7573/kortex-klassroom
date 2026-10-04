const fs = require('fs');
let code = fs.readFileSync('kortex_users/parent/ChildAcademicView.tsx', 'utf8');

code = code.replace(
  `import { orgData } from '../../app/actions/student';`,
  `import { orgData } from '../../app/actions/student';\nimport { useStudentAssignments, AssignmentStatus } from '../../hooks/useStudentAssignments';`
);

const oldTypes = `  type AssignmentStatus = 'pending' | 'submitted' | 'graded';
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

const newTypes = `  const { assignments, loading: loadingAssignments } = useStudentAssignments(child.uid);
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentStatus>('pending');
  const filteredAssignments = assignments.filter(a => a.status === assignmentFilter);`;

code = code.replace(oldTypes, newTypes);

fs.writeFileSync('kortex_users/parent/ChildAcademicView.tsx', code);
