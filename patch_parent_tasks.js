const fs = require('fs');
const file = 'kortex_users/parent/ChildAcademicView.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Remove mockTasks and Tasks Summary from inside orgAcademics.map
const startMock = `const mockTasks: TaskItem[] = subjects.length > 0`;
const endMock = `] : [];`;
const mockIdx1 = code.indexOf(startMock);
const mockIdx2 = code.indexOf(endMock, mockIdx1);
if(mockIdx1 !== -1 && mockIdx2 !== -1) {
    code = code.substring(0, mockIdx1) + code.substring(mockIdx2 + endMock.length);
}

const startTasksUI = `{/* Tasks Summary */}`;
const endTasksUI = `</div>\n          </div>\n        );\n      })}`;
const uiIdx1 = code.indexOf(startTasksUI);
const uiIdx2 = code.indexOf(endTasksUI, uiIdx1);
if(uiIdx1 !== -1 && uiIdx2 !== -1) {
    code = code.substring(0, uiIdx1) + code.substring(uiIdx2);
}

// 2. Add assignmentFilter state and Unified Assignments UI at the top
code = code.replace(
  `const [showUpsellModal, setShowUpsellModal] = useState(false);`,
  `const [showUpsellModal, setShowUpsellModal] = useState(false);\n  type AssignmentStatus = 'pending' | 'submitted' | 'graded';\n  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentStatus>('pending');`
);

// We need ClipboardList, CircleDashed, CheckCircle2, Award
// Check if they are imported
if (!code.includes('ClipboardList')) {
    code = code.replace(
      `Building, AlertCircle, Sparkles, TrendingUp, Clock, CheckCircle2, FileText, BarChart2, Lock, X } from 'lucide-react';`,
      `Building, AlertCircle, Sparkles, TrendingUp, Clock, CheckCircle2, FileText, BarChart2, Lock, X, ClipboardList, CircleDashed, Award } from 'lucide-react';`
    );
}

const unifiedTasksUI = `
      {/* -------------------------------------------------------------------------- */}
      {/* UNIFIED ASSIGNMENTS SECTION                                                */}
      {/* -------------------------------------------------------------------------- */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
           <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
             <ClipboardList className="text-indigo-500" size={24} /> Child's Assignments
           </h2>
           
           <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
             {(['pending', 'submitted', 'graded'] as AssignmentStatus[]).map(status => (
                <button 
                  key={status}
                  onClick={() => setAssignmentFilter(status)}
                  className={\`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all \${assignmentFilter === status ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
                >
                  {status}
                </button>
             ))}
           </div>
        </div>

        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
               <ClipboardList size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">No {assignmentFilter} assignments</h3>
            <p className="text-sm font-semibold text-slate-500 max-w-sm">
              {assignmentFilter === 'pending' ? "The student is all caught up! There are no pending tasks right now." : 
               assignmentFilter === 'submitted' ? "No submitted assignments available." : 
               "No graded assignments to display."}
            </p>
         </div>
      </div>
`;

code = code.replace(
  `return (
    <div className="space-y-12 animate-fade-in relative">
      
      {/* Organizations Map */}`,
  `return (
    <div className="space-y-12 animate-fade-in relative">
      
${unifiedTasksUI}

      {/* Organizations Map */}`
);

fs.writeFileSync(file, code);
