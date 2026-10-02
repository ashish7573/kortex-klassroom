const fs = require('fs');
const file = 'kortex_users/student/StudentDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add lucide-react icons needed
code = code.replace(
  `import { Sparkles, Trophy, Flame, Play, BookOpen, Lightbulb, Gamepad2, Target, Heart, BatteryCharging, X, Star, History, Award } from 'lucide-react';`,
  `import { Sparkles, Trophy, Flame, Play, BookOpen, Lightbulb, Gamepad2, Target, Heart, BatteryCharging, X, Star, History, Award, Book, ClipboardList, CheckCircle2, CircleDashed } from 'lucide-react';`
);

// 2. Add derived assignedCombos logic inside component
const combosLogic = `
  const assignedCombos = Array.from(new Set([
    ...(profile.active_b2c_licenses || []),
    ...Object.values(profile.org_links || {}).flatMap(link => link.status === 'approved' ? link.assigned_combos : [])
  ]));

  // Mock Assignments
  const mockAssignments = assignedCombos.length > 0 ? [
    { id: 1, title: 'Fractions & Decimals Quiz', status: 'pending', subject: assignedCombos[0]?.split('-').pop()?.toUpperCase() || 'MATH' },
    { id: 2, title: 'Read: The Magic Tree', status: 'graded', score: 95, subject: 'ENGLISH' },
    { id: 3, title: 'Science Experiment Video', status: 'completed', subject: 'SCIENCE' }
  ] : [];

  const getSubjectColor = (combo: string) => {
     if (combo.includes('math')) return 'bg-sky-50 text-sky-600 border-sky-200 hover:bg-sky-100 hover:border-sky-300';
     if (combo.includes('eng')) return 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 hover:border-rose-300';
     if (combo.includes('sci')) return 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300';
     return 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100 hover:border-purple-300';
  };
`;

code = code.replace(
  `  const isPro = profile.is_pro || false;`,
  `  const isPro = profile.is_pro || false;\n${combosLogic}`
);

// 3. Add the UI below Gamified Header
const combosUI = `
      {/* ---------------------------------------------------- */}
      {/* ORG / PARENT ASSIGNED COMBOS & ASSIGNMENTS           */}
      {/* ---------------------------------------------------- */}
      {assignedCombos.length > 0 && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 mt-8">
          
          {/* ASSIGNMENTS SECTION */}
          <div>
            <h2 className="text-2xl font-black text-slate-800 mb-4 flex items-center gap-2">
              <ClipboardList className="text-indigo-500" size={24} /> My Assignments
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mockAssignments.map((task) => (
                <div key={task.id} className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black uppercase tracking-wider">
                        {task.subject}
                      </span>
                      {task.status === 'graded' && <span className="text-emerald-500 font-black text-lg">{task.score}%</span>}
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2">{task.title}</h3>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-2 text-sm font-bold">
                    {task.status === 'pending' && <><CircleDashed className="text-amber-500" size={18} /> <span className="text-amber-600">Pending</span></>}
                    {task.status === 'completed' && <><CheckCircle2 className="text-sky-500" size={18} /> <span className="text-sky-600">Completed</span></>}
                    {task.status === 'graded' && <><Award className="text-emerald-500" size={18} /> <span className="text-emerald-600">Graded</span></>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COMBOS SECTION */}
          <div>
            <h2 className="text-2xl font-black text-slate-800 mb-4 flex items-center gap-2">
              <Book className="text-sky-500" size={24} /> My Subjects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignedCombos.map((combo) => {
                 const subjectName = combo.split('-').pop()?.toUpperCase() || 'SUBJECT';
                 const colorClasses = getSubjectColor(combo);
                 // Mock progress: pseudo-random based on string length
                 const progressPct = (combo.length * 7) % 100;

                 return (
                   <div 
                     key={combo}
                     onClick={() => handleActionClick('lessons')} // Route to lessons view
                     className={\`border-2 rounded-3xl p-6 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between \${colorClasses}\`}
                   >
                     <div className="flex items-center justify-between mb-4">
                       <h3 className="text-2xl font-black tracking-tight">{subjectName}</h3>
                       <div className="w-12 h-12 bg-white/50 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                         <BookOpen size={24} />
                       </div>
                     </div>
                     
                     <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider opacity-75">
                          <span>Chapter {Math.ceil(progressPct / 20)}</span>
                          <span>{progressPct}% Completed</span>
                        </div>
                        <div className="h-3 w-full bg-black/10 rounded-full overflow-hidden">
                           <div className="h-full bg-current rounded-full transition-all duration-1000" style={{ width: \`\${progressPct}%\` }}></div>
                        </div>
                     </div>
                   </div>
                 );
              })}
            </div>
          </div>

        </div>
      )}

`;

code = code.replace(
  `      {/* 5-Tier Fast Jump Grid */}`,
  combosUI + `\n\n      {/* 5-Tier Fast Jump Grid */}`
);

fs.writeFileSync(file, code);
