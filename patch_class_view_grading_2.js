const fs = require('fs');
let code = fs.readFileSync('kortex_users/teacher/TeacherClassView.tsx', 'utf8');

const injectionPoint = "  const [loadingAssignments, setLoadingAssignments] = useState(false);";
const injectedCode = "  const [loadingAssignments, setLoadingAssignments] = useState(false);\n  const [gradingAssignment, setGradingAssignment] = useState<any>(null);";
if (!code.includes('gradingAssignment')) {
   code = code.replace(injectionPoint, injectedCode);
   fs.writeFileSync('kortex_users/teacher/TeacherClassView.tsx', code);
}
