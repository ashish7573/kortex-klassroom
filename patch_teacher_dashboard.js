const fs = require('fs');
let code = fs.readFileSync('kortex_users/teacher/TeacherDashboard.tsx', 'utf8');

// 1. Add new state for tabs and orgName
const oldState = `  const [combos, setCombos] = useState<TeacherComboData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);`;

const newState = `  const [combos, setCombos] = useState<TeacherComboData[]>([]);
  const [orgName, setOrgName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'classrooms' | 'assignments' | 'timetable'>('classrooms');`;

code = code.replace(oldState, newState);

// 2. Set orgName from API
code = code.replace(`setCombos(res.combos || []);`, `setCombos(res.combos || []);\n        if (res.orgName) setOrgName(res.orgName);`);

// 3. Update the UI banner to show orgName instead of org_id
const oldBanner = `          <p className="text-emerald-100 text-base max-w-xl font-medium">
            Organization: {profile.org_id}
          </p>`;
const newBanner = `          <p className="text-emerald-100 text-base max-w-xl font-medium">
            Organization: {orgName || profile.org_id}
          </p>`;
code = code.replace(oldBanner, newBanner);

// 4. Wrap the Classrooms grid in the tabs UI
const oldContentStart = `      <div>
        <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <BookOpen className="text-sky-500" size={24} /> My Classrooms
        </h2>`;

const newContentStart = `      <div className="flex bg-slate-100 p-1 rounded-xl w-fit mb-4">
         <button 
            onClick={() => setActiveTab('classrooms')}
            className={\`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all \${activeTab === 'classrooms' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
         >My Classrooms</button>
         <button 
            onClick={() => setActiveTab('assignments')}
            className={\`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all \${activeTab === 'assignments' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
         >Assignments</button>
         <button 
            onClick={() => setActiveTab('timetable')}
            className={\`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all \${activeTab === 'timetable' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
         >Timetable</button>
      </div>

      {activeTab === 'classrooms' && (
      <div className="animate-fade-in">
        <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <BookOpen className="text-sky-500" size={24} /> My Classrooms
        </h2>`;

code = code.replace(oldContentStart, newContentStart);

// 5. Add the empty states for Assignments and Timetable at the bottom
const oldEnd = `           </div>
        )}
      </div>
    </div>
  );
}`;

const newEnd = `           </div>
        )}
      </div>
      )}

      {activeTab === 'assignments' && (
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
      )}

      {activeTab === 'timetable' && (
        <div className="animate-fade-in space-y-6">
           <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
             <BarChart3 className="text-sky-500" size={24} /> Weekly Timetable
           </h2>
           <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center shadow-sm">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 size={40} className="text-slate-300" />
             </div>
             <h3 className="text-xl font-black text-slate-700 mb-2">Timetable Not Configured</h3>
             <p className="text-slate-500 font-semibold max-w-md mx-auto">Your weekly schedule will appear here. The timetable module is currently under construction.</p>
           </div>
        </div>
      )}
    </div>
  );
}`;

code = code.replace(oldEnd, newEnd);

fs.writeFileSync('kortex_users/teacher/TeacherDashboard.tsx', code);
