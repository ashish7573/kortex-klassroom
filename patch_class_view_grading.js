const fs = require('fs');
let code = fs.readFileSync('kortex_users/teacher/TeacherClassView.tsx', 'utf8');

// 1. Import
const importModal = `import GradeSubmissionsModal from './GradeSubmissionsModal';`;
if (!code.includes('GradeSubmissionsModal')) {
   code = code.replace("import AssignmentBuilderModal from './AssignmentBuilderModal';",
                       "import AssignmentBuilderModal from './AssignmentBuilderModal';\n" + importModal);
}

// 2. State
const stateInjectionPoint = `  const { assignments, loading: assignmentsLoading, refreshAssignments } = useTeacherAssignments(combo.comboId);`;
const stateInjectedCode = `  const { assignments, loading: assignmentsLoading, refreshAssignments } = useTeacherAssignments(combo.comboId);
  const [gradingAssignment, setGradingAssignment] = useState<any>(null);`;
if (!code.includes('gradingAssignment')) {
   code = code.replace(stateInjectionPoint, stateInjectedCode);
}

// 3. Button onClick
const oldBtn = `<button className="text-sky-500 hover:text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg transition-colors">Grade Submissions</button>`;
const newBtn = `<button onClick={() => setGradingAssignment(a)} className="text-sky-500 hover:text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg transition-colors">Grade Submissions</button>`;
code = code.replace(oldBtn, newBtn);

// 4. Render modal at bottom
const oldRender = `      {showAssignModal && (`;
const newRender = `      {gradingAssignment && (
        <GradeSubmissionsModal 
          assignment={gradingAssignment} 
          onClose={() => setGradingAssignment(null)} 
          onGraded={() => {}} 
        />
      )}
      
      {showAssignModal && (`;
if (!code.includes('<GradeSubmissionsModal')) {
   code = code.replace(oldRender, newRender);
}

fs.writeFileSync('kortex_users/teacher/TeacherClassView.tsx', code);
