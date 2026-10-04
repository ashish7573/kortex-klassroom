const fs = require('fs');
let code = fs.readFileSync('kortex_users/student/StudentDashboard.tsx', 'utf8');

const oldState = `  const { assignments, loading: loadingAssignments } = useStudentAssignments(profile.uid);
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentStatus>('pending');
  const filteredAssignments = assignments.filter(a => a.status === assignmentFilter);

  const handleMarkAsDone = async (assignmentId: string) => {
     try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const res = await markAssignmentAsDone(token, assignmentId);
        if (res.success) {
           window.location.reload(); // Quick refresh to update hook
        } else {
           alert("Failed to mark as done: " + res.error);
        }
     } catch (e: any) {
        alert(e.message);
     }
  };`;

const newState = `  const { assignments, loading: loadingAssignments, refreshAssignments } = useStudentAssignments(profile.uid);
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentStatus>('pending');
  const filteredAssignments = assignments.filter(a => a.status === assignmentFilter);

  const handleMarkAsDone = async (assignmentId: string) => {
     try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const res = await markAssignmentAsDone(token, assignmentId);
        if (res.success) {
           refreshAssignments();
           setAssignmentFilter('submitted'); // Auto switch to submitted tab to show them their success
        } else {
           alert("Failed to mark as done: " + res.error);
        }
     } catch (e: any) {
        alert(e.message);
     }
  };`;

code = code.replace(oldState, newState);
fs.writeFileSync('kortex_users/student/StudentDashboard.tsx', code);
