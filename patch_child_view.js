const fs = require('fs');
let code = fs.readFileSync('kortex_users/parent/ChildAcademicView.tsx', 'utf8');

// Add import
const importHook = "import { useStudentAssignments } from '../../hooks/useStudentAssignments';";
if (!code.includes('useStudentAssignments')) {
    code = code.replace("import { doc, getDoc, collection, getDocs } from 'firebase/firestore';", 
                        "import { doc, getDoc, collection, getDocs } from 'firebase/firestore';\n" + importHook);
}

// Add state hook inside component
const injectionPoint = "  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentStatus>('pending');";
const injectedCode = `  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentStatus>('pending');
  const { assignments, loading: loadingAssignments } = useStudentAssignments(child.uid);
  const filteredAssignments = assignments.filter((a: any) => a.status === assignmentFilter);`;
code = code.replace(injectionPoint, injectedCode);

// Replace the UI block
const oldUI = `        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
               <ClipboardList size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">No {assignmentFilter} assignments</h3>
            <p className="text-sm font-semibold text-slate-500 max-w-sm">
              {assignmentFilter === 'pending' ? "The student is all caught up! There are no pending tasks right now." : 
               assignmentFilter === 'submitted' ? "No submitted assignments available." : 
               "No graded assignments to display."}
            </p>
         </div>`;

const newUI = `        {loadingAssignments ? (
           <div className="flex justify-center items-center py-10">
             <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
           </div>
        ) : filteredAssignments.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {filteredAssignments.map((task: any) => (
               <div key={task.id} className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                 <div>
                   <div className="flex justify-between items-start mb-3">
                     <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black uppercase tracking-wider">
                       {task.subject}
                     </span>
                     {task.status === 'graded' && <span className="text-emerald-500 font-black text-lg">{task.score}/{task.totalPoints}</span>}
                   </div>
                   <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2">{task.title}</h3>
                   {task.instructions && <p className="text-sm text-slate-500 mb-4 font-semibold">{task.instructions}</p>}
                 </div>
                 
                 <div className="mt-auto border-t border-slate-100 pt-4">
                   {task.status === 'pending' && (
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-1.5 text-sm font-bold text-amber-600">
                           <CircleDashed size={16} /> Due: {task.dueDate}
                         </div>
                      </div>
                   )}

                   {task.status === 'submitted' && (
                      <div className="flex items-center gap-1.5 text-sm font-bold">
                         <CheckCircle2 size={16} className={task.isOnTime ? 'text-emerald-500' : 'text-rose-500'} /> 
                         <span className={task.isOnTime ? 'text-emerald-600' : 'text-rose-600'}>
                           Submitted {task.submittedDate} {task.isOnTime ? '' : '(Late)'}
                         </span>
                      </div>
                   )}

                   {task.status === 'graded' && (
                      <div className="flex items-center gap-1.5 text-sm font-bold">
                         <Award size={16} className="text-emerald-500" /> 
                         <span className="text-emerald-600">Graded • {task.grade || 'Completed'}</span>
                      </div>
                   )}
                 </div>
               </div>
             ))}
           </div>
        ) : (
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
        )}`;

code = code.replace(oldUI, newUI);
fs.writeFileSync('kortex_users/parent/ChildAcademicView.tsx', code);
