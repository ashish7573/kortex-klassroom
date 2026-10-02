const fs = require('fs');
const file = 'kortex_users/student/StudentDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Remove mockAssignments variable
const mockRegex = /\\s*\\/\\/ Mock Assignments[\\s\\S]*?\\] : \\[\\];/g;
code = code.replace(mockRegex, '');

// 2. Remove ASSIGNMENTS SECTION from UI
const assignSectionRegex = /\\s*\\/\\* ASSIGNMENTS SECTION \\*\\/[\\s\\S]*?{/\\* COMBOS SECTION \\*\\/}/g;
code = code.replace(assignSectionRegex, '          {/* COMBOS SECTION */}');

// 3. Fix the progress bar on the Combo Card to show real data (Tools Completed)
const oldCardProgress = `                 const progressPct = (comboObj.id.length * 7) % 100;

                 return (
                   <div 
                     key={comboObj.id}
                     onClick={() => handleActionClick(\`lessons:\${comboObj.label}\`)}
                     className={\`border-2 rounded-3xl p-6 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between \${colorClasses}\`}
                   >
                     <div className="flex items-center justify-between mb-4">
                       <div><h3 className="text-2xl font-black tracking-tight">{subjectName}</h3><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{comboObj.label}</p></div>
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
                   </div>`;

const newCardProgress = `                 // Find real progress
                 const subjProgress = progressData.find(p => p.id.toLowerCase() === comboObj.subject.toLowerCase() || p.subject_id?.toLowerCase() === comboObj.subject.toLowerCase());
                 const completedCount = subjProgress && subjProgress.completed_tools ? Object.keys(subjProgress.completed_tools).length : 0;
                 const xpEarned = subjProgress ? subjProgress.xp : 0;

                 return (
                   <div 
                     key={comboObj.id}
                     onClick={() => handleActionClick(\`lessons:\${comboObj.label}\`)}
                     className={\`border-2 rounded-3xl p-6 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between \${colorClasses}\`}
                   >
                     <div className="flex items-center justify-between mb-4">
                       <div><h3 className="text-2xl font-black tracking-tight">{subjectName}</h3><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{comboObj.label}</p></div>
                       <div className="w-12 h-12 bg-white/50 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                         <BookOpen size={24} />
                       </div>
                     </div>
                     
                     <div className="mt-4 flex items-center justify-between bg-white/40 p-3 rounded-xl backdrop-blur-sm">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black uppercase tracking-wider opacity-70">Progress</span>
                           <span className="font-bold text-sm">{completedCount} Lessons Completed</span>
                        </div>
                        <div className="flex flex-col text-right">
                           <span className="text-[10px] font-black uppercase tracking-wider opacity-70">XP Earned</span>
                           <span className="font-bold text-sm">{xpEarned} XP</span>
                        </div>
                     </div>
                   </div>`;

code = code.replace(oldCardProgress, newCardProgress);

fs.writeFileSync(file, code);
