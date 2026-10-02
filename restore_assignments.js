const fs = require('fs');
const file = 'kortex_users/student/StudentDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

const assignmentsLogic = `
  // --------------------------------------------------------------------------
  // ASSIGNMENTS STATE (Ready for Backend Integration)
  // --------------------------------------------------------------------------
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
  
  const filteredAssignments = myAssignments.filter(a => a.status === assignmentFilter);
`;

// Insert after useState for leaderboards or orgProfiles
code = code.replace(
  `const [allDisplayCombos, setAllDisplayCombos] = useState<Array<{ id: string, label: string, subject: string, orgName: string }>>([]);`,
  `const [allDisplayCombos, setAllDisplayCombos] = useState<Array<{ id: string, label: string, subject: string, orgName: string }>>([]);\n${assignmentsLogic}`
);

const assignmentsUI = `
          {/* ASSIGNMENTS SECTION */}
          <div className="mb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
               <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                 <ClipboardList className="text-indigo-500" size={24} /> My Assignments
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

            {filteredAssignments.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {filteredAssignments.map((task) => (
                   <div key={task.id} className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                     <div>
                       <div className="flex justify-between items-start mb-3">
                         <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black uppercase tracking-wider">
                           {task.subject}
                         </span>
                         {task.status === 'graded' && <span className="text-emerald-500 font-black text-lg">{task.score}/{task.totalPoints}</span>}
                       </div>
                       <h3 className="font-bold text-slate-800 text-lg leading-tight mb-4">{task.title}</h3>
                     </div>
                     
                     <div className="mt-auto border-t border-slate-100 pt-4">
                       {task.status === 'pending' && (
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-1.5 text-sm font-bold text-amber-600">
                               <CircleDashed size={16} /> Due: {task.dueDate}
                             </div>
                             <button className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-sm font-bold transition-colors">
                               Open
                             </button>
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
                    {assignmentFilter === 'pending' ? "You're all caught up! There are no pending tasks right now." : 
                     assignmentFilter === 'submitted' ? "You haven't submitted any assignments yet." : 
                     "No graded assignments to display."}
                  </p>
               </div>
            )}
          </div>
`;

code = code.replace(
  `          {/* COMBOS SECTION */}`,
  assignmentsUI + `\n          {/* COMBOS SECTION */}`
);

fs.writeFileSync(file, code);
