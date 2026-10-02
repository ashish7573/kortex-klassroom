const fs = require('fs');
const file = 'kortex_users/student/StudentDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add progress state
code = code.replace(
  `  const [isResetting, setIsResetting] = useState(true);`,
  `  const [isResetting, setIsResetting] = useState(true);\n  const [progressData, setProgressData] = useState<any[]>([]);`
);

// 2. Add Firestore imports
code = code.replace(
  `import { Sparkles, Trophy, Flame, Play, BookOpen, Lightbulb, Gamepad2, Target, Heart, BatteryCharging, X } from 'lucide-react';`,
  `import { Sparkles, Trophy, Flame, Play, BookOpen, Lightbulb, Gamepad2, Target, Heart, BatteryCharging, X, Star, History, Award } from 'lucide-react';\nimport { collection, onSnapshot } from 'firebase/firestore';\nimport { db } from '../../backend_configurations/firebase';`
);

// 3. Add progress effect
const progressEffect = `
  useEffect(() => {
    if (!profile.uid) return;
    const unsubscribe = onSnapshot(collection(db, 'users', profile.uid, 'progress'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProgressData(data);
    });
    return () => unsubscribe();
  }, [profile.uid]);
`;

code = code.replace(
  `  // Phase 1: On Mount`,
  progressEffect + `\n  // Phase 1: On Mount`
);

// 4. Update the Gamified Header
const oldHeaderStats = `            <div className="flex flex-wrap gap-4 mt-6">
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-2xl">
                <Flame size={20} className="text-amber-400" />
                <div>
                  <div className="text-xs text-purple-200 font-bold uppercase">Learning Streak</div>
                  <div className="font-black text-lg leading-tight">3 Days</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-2xl">
                <Trophy size={20} className="text-yellow-400" />
                <div>
                  <div className="text-xs text-purple-200 font-bold uppercase">Achievements</div>
                  <div className="font-black text-lg leading-tight">12 Badges</div>
                </div>
              </div>
            </div>`;

const newHeaderStats = `            <div className="flex flex-wrap gap-4 mt-6">
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-2xl">
                <Flame size={20} className="text-amber-400" />
                <div>
                  <div className="text-xs text-purple-200 font-bold uppercase">Learning Streak</div>
                  <div className="font-black text-lg leading-tight">{profile.current_streak_days || 0} Days</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-2xl">
                <Trophy size={20} className="text-yellow-400" />
                <div>
                  <div className="text-xs text-purple-200 font-bold uppercase">Achievements</div>
                  <div className="font-black text-lg leading-tight">{profile.achievements?.length || 0} Badges</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-2xl">
                <Star size={20} className="text-sky-400 fill-sky-400" />
                <div>
                  <div className="text-xs text-purple-200 font-bold uppercase">Total XP</div>
                  <div className="font-black text-lg leading-tight">{profile.total_xp || 0} XP</div>
                </div>
              </div>
            </div>`;

code = code.replace(oldHeaderStats, newHeaderStats);

// 5. Add "My Progress" section at the bottom
const progressSection = `
      {/* My Progress Section */}
      <div className="mt-12 animate-fade-in">
        <div className="flex items-center gap-2 mb-6">
          <History className="text-indigo-500" size={24} />
          <h2 className="text-2xl font-black text-slate-800">My Progress</h2>
        </div>
        
        {progressData.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center">
            <div className="w-16 h-16 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gamepad2 size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-700 mb-2">No Games Played Yet</h3>
            <p className="text-slate-500 font-semibold max-w-sm mx-auto">Jump into learning above to start earning XP and tracking your best scores!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {progressData.map(subject => (
              <div key={subject.id} className="bg-white border-2 border-slate-100 shadow-sm rounded-3xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider">{subject.subject_id}</h3>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-black">{subject.xp || 0} XP Earned</span>
                </div>
                
                <div className="space-y-4">
                  {Object.keys(subject.completed_tools || {}).map(toolKey => {
                    const toolInfo = subject.completed_tools[toolKey];
                    return (
                      <div key={toolKey} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-indigo-100 text-indigo-500 rounded-xl flex items-center justify-center shrink-0">
                             <Award size={20} />
                           </div>
                           <div>
                             <p className="font-bold text-slate-700">{toolInfo.chapter_name || 'Learning Tool'}</p>
                             <p className="text-xs font-semibold text-slate-400">Played {toolInfo.times_completed} time{toolInfo.times_completed !== 1 ? 's' : ''}</p>
                           </div>
                        </div>
                        {toolInfo.best_score !== undefined && (
                           <div className="text-right">
                             <p className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">Best Score</p>
                             <p className="text-xl font-black text-emerald-600">{toolInfo.best_score}</p>
                           </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
`;

code = code.replace(
  `      {showEnergyModal && (`,
  progressSection + `\n\n      {showEnergyModal && (`
);

fs.writeFileSync(file, code);
