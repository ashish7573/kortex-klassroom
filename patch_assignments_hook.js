const fs = require('fs');
let code = fs.readFileSync('hooks/useStudentAssignments.ts', 'utf8');

const oldHook = `export function useStudentAssignments(studentUid: string) {
  const [assignments, setAssignments] = useState<MergedAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {`;

const newHook = `export function useStudentAssignments(studentUid: string) {
  const [assignments, setAssignments] = useState<MergedAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {`;

code = code.replace(oldHook, newHook);

const oldDeps = `    loadAssignments();
  }, [studentUid]);

  return { assignments, loading };
}`;

const newDeps = `    loadAssignments();
  }, [studentUid, trigger]);

  const refreshAssignments = () => setTrigger(t => t + 1);

  return { assignments, loading, refreshAssignments };
}`;

code = code.replace(oldDeps, newDeps);
fs.writeFileSync('hooks/useStudentAssignments.ts', code);
