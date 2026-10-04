const fs = require('fs');
let code = fs.readFileSync('kortex_users/teacher/TeacherClassView.tsx', 'utf8');

// 1. Add tabs state
const oldState = `  const [error, setError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);`;

const newState = `  const [error, setError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'roster' | 'assignments'>('roster');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);`;

code = code.replace(oldState, newState);

// 2. Add fetchTeacherAssignments import
code = code.replace(
  `import { ClassStudentData, TeacherComboData, getClassroomRoster } from '../../app/actions/teacher';`,
  `import { ClassStudentData, TeacherComboData, getClassroomRoster } from '../../app/actions/teacher';\nimport { fetchTeacherAssignments } from '../../app/actions/teacher_assignments';`
);

// 3. Fetch assignments
const loadDataEffect = `
  useEffect(() => {
    async function loadAssignments() {
      try {
        setLoadingAssignments(true);
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const res = await fetchTeacherAssignments(token, combo.comboId);
        if (res.success) setAssignments(res.assignments || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingAssignments(false);
      }
    }
    if (activeTab === 'assignments') {
       loadAssignments();
    }
  }, [activeTab, combo]);`;

code = code.replace(`  useEffect(() => {`, loadDataEffect + `\n  useEffect(() => {`);

// 4. Update the UI to render tabs and conditional content
const oldContent = `          {/* Progress Chart Module */}
          <div className="bg-white rounded-3xl p-8 border-2 border-slate-100 shadow-sm">`;

const newContent = `
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit mb-6">
             <button 
                onClick={() => setActiveTab('roster')}
                className={\`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all \${activeTab === 'roster' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
             >Roster & Mastery</button>
             <button 
                onClick={() => setActiveTab('assignments')}
                className={\`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all \${activeTab === 'assignments' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
             >Assignments</button>
          </div>

          {activeTab === 'roster' && (
             <div className="space-y-6 animate-fade-in">
               {/* Progress Chart Module */}
               <div className="bg-white rounded-3xl p-8 border-2 border-slate-100 shadow-sm">
`;
code = code.replace(oldContent, newContent);

// Close the roster tab content
const oldTableEnd = `               </table>
             </div>
          </div>
        </>
      )}
      
      {showAssignModal && (`;

const newTableEnd = `               </table>
             </div>
          </div>
             </div>
          )}

          {activeTab === 'assignments' && (
             <div className="space-y-6 animate-fade-in">
                <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm p-6">
                   <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6">
                      <BookOpen className="text-sky-500" size={20} /> 
                      Dispatched Assignments
                   </h2>
                   {loadingAssignments ? (
                      <div className="py-10 text-center text-slate-400 font-bold animate-pulse">Loading assignments...</div>
                   ) : assignments.length === 0 ? (
                      <div className="py-10 text-center text-slate-400 font-bold">No assignments dispatched yet.</div>
                   ) : (
                      <div className="space-y-4">
                         {assignments.map(a => (
                            <div key={a.id} className="border-2 border-slate-100 rounded-2xl p-5 hover:border-slate-200 transition-colors">
                               <div className="flex justify-between items-start mb-2">
                                  <div>
                                     <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md mb-2 inline-block">{a.tool_type}</span>
                                     <h3 className="font-bold text-slate-800 text-lg">{a.title}</h3>
                                  </div>
                                  <div className="text-right">
                                     <div className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">Due: {a.due_date}</div>
                                  </div>
                               </div>
                               <div className="text-xs font-bold text-slate-500 mt-4 flex items-center justify-between">
                                  <span>Assigned to {a.assigned_to?.length || 0} students</span>
                                  <button className="text-sky-500 hover:text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg transition-colors">Grade Submissions</button>
                               </div>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             </div>
          )}
        </>
      )}
      
      {showAssignModal && (`;

code = code.replace(oldTableEnd, newTableEnd);

fs.writeFileSync('kortex_users/teacher/TeacherClassView.tsx', code);
