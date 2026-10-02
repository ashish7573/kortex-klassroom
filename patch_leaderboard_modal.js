const fs = require('fs');
const file = 'kortex_users/student/StudentDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Import getDocs, query, orderBy, limit
code = code.replace(
  `import { collection, onSnapshot } from 'firebase/firestore';`,
  `import { collection, onSnapshot, getDocs, query, orderBy, limit } from 'firebase/firestore';`
);

// 2. Add Leaderboard State
code = code.replace(
  `  const [progressData, setProgressData] = useState<any[]>([]);`,
  `  const [progressData, setProgressData] = useState<any[]>([]);\n  const [leaderboardTool, setLeaderboardTool] = useState<{ id: string, name: string } | null>(null);\n  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);\n  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);`
);

// 3. Add handleViewLeaderboard
const lbLogic = `
  const handleViewLeaderboard = async (toolKey: string, chapterName: string) => {
    setLeaderboardTool({ id: toolKey, name: chapterName });
    setLeaderboardData([]);
    setLoadingLeaderboard(true);
    
    try {
      const q = query(
        collection(db, 'leaderboards', toolKey, 'scores'),
        orderBy('score', 'desc'),
        limit(10)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeaderboardData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLeaderboard(false);
    }
  };
`;

code = code.replace(
  `  const handleActionClick = (tierId: string) => {`,
  lbLogic + `\n  const handleActionClick = (tierId: string) => {`
);

// 4. Update the "My Progress" section to add the button
code = code.replace(
  `                        {toolInfo.best_score !== undefined && (
                           <div className="text-right">
                             <p className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">Best Score</p>
                             <p className="text-xl font-black text-emerald-600">{toolInfo.best_score}</p>
                           </div>
                        )}`,
  `                        {toolInfo.best_score !== undefined && (
                           <div className="flex flex-col items-end gap-1">
                             <div className="text-right">
                               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">Best Score</p>
                               <p className="text-xl font-black text-emerald-600 leading-none">{toolInfo.best_score}</p>
                             </div>
                             <button 
                               onClick={() => handleViewLeaderboard(toolKey, toolInfo.chapter_name)}
                               className="text-[10px] font-bold text-sky-500 hover:text-sky-600 bg-sky-50 px-2 py-1 rounded-md"
                             >
                               View Leaderboard
                             </button>
                           </div>
                        )}`
);

// 5. Add the Modal UI
const modalUI = `
      {leaderboardTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-sky-500 p-6 flex items-center justify-between text-white shrink-0">
               <div>
                 <h3 className="text-xl font-black flex items-center gap-2"><Trophy size={20}/> Leaderboard</h3>
                 <p className="text-sky-100 text-xs font-bold mt-1">{leaderboardTool.name}</p>
               </div>
               <button onClick={() => setLeaderboardTool(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                 <X size={20} />
               </button>
             </div>
             
             <div className="p-6 overflow-y-auto max-h-[60vh] bg-slate-50">
               {loadingLeaderboard ? (
                 <div className="text-center py-10 text-slate-400 font-bold animate-pulse">Loading scores...</div>
               ) : leaderboardData.length === 0 ? (
                 <div className="text-center py-10 text-slate-400 font-bold">No scores yet! Be the first!</div>
               ) : (
                 <div className="space-y-3">
                   {leaderboardData.map((entry, index) => (
                     <div key={entry.id} className={\`flex items-center justify-between p-4 rounded-2xl border-2 \${entry.id === profile.uid ? 'bg-sky-50 border-sky-200' : 'bg-white border-slate-100'}\`}>
                       <div className="flex items-center gap-4">
                         <div className={\`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm \${index === 0 ? 'bg-yellow-100 text-yellow-600' : index === 1 ? 'bg-slate-200 text-slate-600' : index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}\`}>
                           {index + 1}
                         </div>
                         <p className={\`font-bold \${entry.id === profile.uid ? 'text-sky-700' : 'text-slate-700'}\`}>
                           {entry.id === profile.uid ? 'You' : entry.student_name}
                         </p>
                       </div>
                       <div className="font-black text-lg text-emerald-600">{entry.score}</div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
          </div>
        </div>
      )}
`;

code = code.replace(
  `      {showEnergyModal && (`,
  modalUI + `\n      {showEnergyModal && (`
);

fs.writeFileSync(file, code);
