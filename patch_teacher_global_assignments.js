const fs = require('fs');
let code = fs.readFileSync('kortex_users/teacher/TeacherDashboard.tsx', 'utf8');

// 1. Add fetchAllTeacherAssignments import
code = code.replace(
  `import { getTeacherDashboardData, TeacherComboData } from '../../app/actions/teacher';`,
  `import { getTeacherDashboardData, TeacherComboData } from '../../app/actions/teacher';\nimport { fetchAllTeacherAssignments } from '../../app/actions/teacher_assignments';`
);

// 2. Add assignments state
const oldState = `  const [activeTab, setActiveTab] = useState<'classrooms' | 'assignments' | 'timetable'>('classrooms');`;
const newState = `  const [activeTab, setActiveTab] = useState<'classrooms' | 'assignments' | 'timetable'>('classrooms');
  const [globalAssignments, setGlobalAssignments] = useState<any[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);`;
code = code.replace(oldState, newState);

// 3. Add useEffect to load assignments
const effectInsert = `  useEffect(() => {
    async function loadAssignments() {
      if (activeTab !== 'assignments') return;
      try {
        setLoadingAssignments(true);
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const res = await fetchAllTeacherAssignments(token);
        if (res.success) setGlobalAssignments(res.assignments || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingAssignments(false);
      }
    }
    loadAssignments();
  }, [activeTab]);`;

code = code.replace(`  const getSubjectColor =`, effectInsert + `\n\n  const getSubjectColor =`);

// 4. Update the Assignments Tab UI
const oldAssignmentsTab = `      {activeTab === 'assignments' && (
        <div className="animate-fade-in space-y-6">
           <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
             <CheckCircle2 className="text-sky-500" size={24} /> Global Assignments
           </h2>
           <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center shadow-sm">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={40} className="text-slate-300" />
             </div>
             <h3 className="text-xl font-black text-slate-700 mb-2">Assignments Roll-Up</h3>
             <p className="text-slate-500 font-semibold max-w-md mx-auto">This global view will show all active assignments across all your classrooms. For now, please enter a specific classroom to manage its assignments.</p>
           </div>
        </div>
      )}`;

const newAssignmentsTab = `      {activeTab === 'assignments' && (
        <div className="animate-fade-in space-y-6">
           <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
             <CheckCircle2 className="text-sky-500" size={24} /> Global Assignments
           </h2>
           <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm p-6">
               {loadingAssignments ? (
                  <div className="py-10 text-center text-slate-400 font-bold animate-pulse">Loading global assignments...</div>
               ) : globalAssignments.length === 0 ? (
                  <div className="py-16 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                     <CheckCircle2 className="mx-auto text-slate-300 mb-4" size={48} />
                     <h3 className="text-xl font-black text-slate-700 mb-2">No Assignments Dispatched</h3>
                     <p className="text-slate-500 font-semibold max-w-sm mx-auto">You haven't assigned any curriculum tasks yet. Enter a classroom to start assigning homework.</p>
                  </div>
               ) : (
                  <div className="space-y-4">
                     {globalAssignments.map(a => (
                        <div key={a.id} className="border-2 border-slate-100 rounded-2xl p-5 hover:border-slate-200 transition-colors bg-white">
                           <div className="flex justify-between items-start mb-2">
                              <div>
                                 <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md mb-2 inline-block">{a.tool_type}</span>
                                 <h3 className="font-bold text-slate-800 text-lg">{a.title}</h3>
                                 <p className="text-xs font-bold text-slate-500 mt-1">Classroom ID: {a.combo_id}</p>
                              </div>
                              <div className="text-right">
                                 <div className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">Due: {a.due_date}</div>
                              </div>
                           </div>
                           <div className="text-xs font-bold text-slate-500 mt-4 flex items-center justify-between">
                              <span>Assigned to {a.assigned_to?.length || 0} students</span>
                              <button 
                                onClick={() => {
                                   const targetCombo = combos.find(c => c.comboId === a.combo_id);
                                   if (targetCombo && onComboSelect) onComboSelect(targetCombo);
                                }}
                                className="text-sky-500 hover:text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg transition-colors font-bold"
                              >
                                Go to Classroom
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
           </div>
        </div>
      )}`;

code = code.replace(oldAssignmentsTab, newAssignmentsTab);
fs.writeFileSync('kortex_users/teacher/TeacherDashboard.tsx', code);
