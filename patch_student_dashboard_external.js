const fs = require('fs');
let code = fs.readFileSync('kortex_users/student/StudentDashboard.tsx', 'utf8');

// Import markAssignmentAsDone
code = code.replace(
  `import { getStudentDashboardData, checkStudentOfflineSession } from '../../app/actions/student';`,
  `import { getStudentDashboardData, checkStudentOfflineSession, markAssignmentAsDone } from '../../app/actions/student';`
);

// Add handleMarkAsDone
const stateInsert = `  const { assignments, loading: assignmentsLoading } = useStudentAssignments(profile.uid);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  
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
code = code.replace(`  const { assignments, loading: assignmentsLoading } = useStudentAssignments(profile.uid);\n  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');`, stateInsert);

// Replace mapping inside the grid
const oldCard = `                     <div>
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
                             <button 
                               onClick={() => onExploreTier && onExploreTier(\`play_tool:\${task.link}\`)}
                               className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-sm font-bold transition-colors"
                             >
                               Open
                             </button>
                          </div>
                       )}`;

const newCard = `                     <div>
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
                             {task.externalLink ? (
                               <div className="flex gap-2">
                                 <button 
                                   onClick={() => window.open(task.externalLink, '_blank')}
                                   className="px-3 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-sm font-bold transition-colors"
                                 >
                                   Open Link
                                 </button>
                                 <button 
                                   onClick={() => handleMarkAsDone(task.id)}
                                   className="px-3 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-sm font-bold transition-colors"
                                 >
                                   Mark Done
                                 </button>
                               </div>
                             ) : (
                               <button 
                                 onClick={() => onExploreTier && onExploreTier(\`play_tool:\${task.link}\`)}
                                 className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-sm font-bold transition-colors"
                               >
                                 Open
                               </button>
                             )}
                          </div>
                       )}`;
                       
code = code.replace(oldCard, newCard);
fs.writeFileSync('kortex_users/student/StudentDashboard.tsx', code);
