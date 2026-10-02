const fs = require('fs');
const file = 'kortex_users/parent/ChildAcademicView.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add Lock to lucide-react imports
code = code.replace(
  `import { BookOpen, User, Building, AlertCircle, Sparkles, TrendingUp, Clock, CheckCircle2, FileText, BarChart2 } from 'lucide-react';`,
  `import { BookOpen, User, Building, AlertCircle, Sparkles, TrendingUp, Clock, CheckCircle2, FileText, BarChart2, Lock, X } from 'lucide-react';`
);

// 2. Add isLocked to SubjectPerformance
code = code.replace(
  `  baseline: number;\n}`,
  `  baseline: number;\n  isLocked?: boolean;\n}`
);

// 3. Add showUpsellModal state
code = code.replace(
  `  const [error, setError] = useState<string | null>(null);`,
  `  const [error, setError] = useState<string | null>(null);\n  const [showUpsellModal, setShowUpsellModal] = useState(false);`
);

// 4. Remove empty orgAcademics block and add Independent Learning Data
code = code.replace(
  `  if (orgAcademics.length === 0) {
    return (
      <div className="bg-slate-50 rounded-3xl border-2 border-slate-100 border-dashed p-12 text-center">
        <div className="w-16 h-16 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-700 mb-2">Not Linked to an Organization or No Active Courses</h3>
        <p className="text-slate-500 font-semibold max-w-sm mx-auto mb-6">
          {child.full_name} is currently an independent learner without active subscriptions. Link them to an organization or purchase independent courses to unlock homework tracking and class analytics.
        </p>
        <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md transition-all inline-flex items-center gap-2">
          <Sparkles size={18} /> Browse Independent Courses
        </button>
      </div>
    );
  }`,
  `
  // Inject a mock "Independent Learning" Block to demonstrate the Phase 4 Paywall
  const b2cLicenses = child.active_b2c_licenses || [];
  const isPro = child.is_pro || false;
  
  // We mock subjects the child has "played" but may not have paid for
  const independentSubjectsMock = [
    { name: "Coding Fundamentals", comboId: "grade3_coding" },
    { name: "Mathematics", comboId: "grade3_math" },
    { name: "Language Arts", comboId: "grade3_english" }
  ];

  const independentPerformance: SubjectPerformance[] = independentSubjectsMock.map((sub, idx) => {
    // It's locked if they are not Pro AND they don't have a specific B2C license for it
    const isLocked = !isPro && !b2cLicenses.includes(sub.comboId);
    
    return {
      subjectName: sub.name,
      childScore: 70 + (idx * 5),
      classAvg: 65,
      baseline: 60,
      isLocked
    };
  });
  `
);

// 5. Wrap Performance Benchmarking into PerformanceBlock component
const oldPerfBlock = `{/* Performance Benchmarking */}
            <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <BarChart2 size={24} className="text-emerald-600" /> Academic Performance
                  </h3>
                </div>
                
                {/* Legend */}
                <div className="flex flex-wrap gap-4 px-4 py-2 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">Your Child</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-3 bg-sky-400 rounded-full"></div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">Class Average</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-3 bg-amber-400 rounded-full"></div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">Baseline</span>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-8">
                {mockPerformance.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <TrendingUp size={48} className="text-slate-200 mb-4" />
                    <h3 className="text-lg font-black text-slate-400">No Data Available</h3>
                    <p className="text-slate-400 font-semibold text-sm max-w-sm mt-2">There is not enough graded data to generate performance benchmarks yet.</p>
                  </div>
                ) : (
                  mockPerformance.map((perf, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-center gap-6">
                      
                      {/* Subject Info */}
                      <div className="w-full sm:w-48 shrink-0 flex items-center justify-between sm:block">
                        <h4 className="font-black text-slate-800">{perf.subjectName}</h4>
                        <div className="font-bold text-emerald-600 text-lg sm:mt-1">{perf.childScore}%</div>
                      </div>

                      {/* Bullet Graph */}
                      <div className="flex-1 w-full relative">
                        
                        {/* Axis Marks */}
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2 px-1">
                          <span>0</span>
                          <span>25</span>
                          <span>50</span>
                          <span>75</span>
                          <span>100</span>
                        </div>

                        {/* Track */}
                        <div className="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                          {/* Fill */}
                          <div 
                            className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all duration-1000"
                            style={{ width: \`\${perf.childScore}%\` }}
                          />
                          
                          {/* Baseline Marker */}
                          <div 
                            className="absolute top-0 h-full w-1 bg-amber-400 z-10"
                            style={{ left: \`calc(\${perf.baseline}% - 2px)\` }}
                          />
                          
                          {/* Class Avg Marker */}
                          <div 
                            className="absolute top-0 h-full w-1.5 bg-sky-400 z-10 rounded-full shadow-sm"
                            style={{ left: \`calc(\${perf.classAvg}% - 3px)\` }}
                          />
                        </div>
                        
                        {/* Insight Text */}
                        <div className="mt-3 text-xs font-semibold text-slate-500">
                          {perf.childScore >= perf.classAvg ? (
                            <span><span className="text-emerald-600 font-bold">Ahead of class</span> by {perf.childScore - perf.classAvg}%. </span>
                          ) : (
                            <span><span className="text-amber-600 font-bold">Behind class</span> by {perf.classAvg - perf.childScore}%. </span>
                          )}
                          
                          {perf.childScore < perf.baseline && (
                            <span className="text-rose-500 font-bold">Requires attention (Below baseline).</span>
                          )}
                        </div>
                        
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>`;

const newPerfBlock = `{/* Performance Benchmarking */}
            <PerformanceBlock 
              title="Academic Performance" 
              icon={<BarChart2 size={24} className="text-emerald-600" />} 
              performanceData={mockPerformance}
              onUnlockClick={() => setShowUpsellModal(true)}
            />`;

code = code.replace(oldPerfBlock, newPerfBlock);

// 6. Append Independent Block & Modal & PerformanceBlock component before the last closing brace
const newContent = `
      {/* Independent Learning & Free Tier Block */}
      <div className="space-y-6 mt-12 pt-12 border-t-4 border-slate-100 border-dashed">
         <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">Independent Learning</h2>
              <div className="text-sm font-bold text-slate-500">Free Tier & Kortex Pro</div>
            </div>
          </div>

          <PerformanceBlock 
            title="Independent Progress" 
            icon={<TrendingUp size={24} className="text-purple-600" />} 
            performanceData={independentPerformance}
            onUnlockClick={() => setShowUpsellModal(true)}
          />
      </div>

      {/* The Upsell Modal */}
      {showUpsellModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center px-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] max-w-lg w-full shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4">
                 <button onClick={() => setShowUpsellModal(false)} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/40 shadow-sm transition-colors"><X size={18} /></button>
               </div>
               <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/30 shadow-sm backdrop-blur-md">
                 <Sparkles size={36} className="text-white" />
               </div>
               <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Unlock Kortex Pro</h2>
               <p className="text-indigo-100 font-bold text-lg">Give {child.full_name} the ultimate learning advantage.</p>
            </div>
            <div className="p-8 space-y-6">
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
                     <p className="font-bold text-slate-700">Unlimited Daily Energy (Hearts)</p>
                  </div>
                  <div className="flex items-center gap-3">
                     <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
                     <p className="font-bold text-slate-700">Access the entire curriculum library</p>
                  </div>
                  <div className="flex items-center gap-3">
                     <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
                     <p className="font-bold text-slate-700">Unlock detailed performance analytics</p>
                  </div>
               </div>
               <button 
                 onClick={() => {
                   alert("Redirecting to Stripe checkout...");
                   setShowUpsellModal(false);
                 }}
                 className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 text-lg"
               >
                 Upgrade Now for ₹199/mo
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Performance Block Component to handle the Paywall Blur
function PerformanceBlock({ title, icon, performanceData, onUnlockClick }: any) {
  return (
    <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
            {icon} {title}
          </h3>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 px-4 py-2 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">Your Child</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-sky-400 rounded-full"></div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">Class Average</span>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        {performanceData.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <TrendingUp size={48} className="text-slate-200 mb-4" />
            <h3 className="text-lg font-black text-slate-400">No Data Available</h3>
            <p className="text-slate-400 font-semibold text-sm max-w-sm mt-2">There is not enough graded data to generate performance benchmarks yet.</p>
          </div>
        ) : (
          performanceData.map((perf: any, idx: number) => (
            <div key={idx} className="flex flex-col sm:flex-row items-center gap-6 relative">
              
              {/* Subject Info */}
              <div className="w-full sm:w-48 shrink-0 flex items-center justify-between sm:block">
                <h4 className="font-black text-slate-800">{perf.subjectName}</h4>
                <div className="font-bold text-emerald-600 text-lg sm:mt-1">
                   {perf.isLocked ? "--" : \`\${perf.childScore}%\`}
                </div>
              </div>

              {/* Bullet Graph (Locked or Unlocked) */}
              <div 
                className={\`flex-1 w-full relative transition-all \${perf.isLocked ? 'blur-sm cursor-pointer grayscale opacity-50 select-none' : ''}\`}
                onClick={() => perf.isLocked && onUnlockClick()}
              >
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2 px-1">
                  <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                </div>

                <div className="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: \`\${perf.childScore}%\` }}
                  />
                  <div 
                    className="absolute top-0 h-full w-1.5 bg-sky-400 z-10 rounded-full shadow-sm"
                    style={{ left: \`calc(\${perf.classAvg}% - 3px)\` }}
                  />
                </div>
                
                <div className="mt-3 text-xs font-semibold text-slate-500">
                  {perf.childScore >= perf.classAvg ? (
                    <span><span className="text-emerald-600 font-bold">Ahead of class</span> by {perf.childScore - perf.classAvg}%. </span>
                  ) : (
                    <span><span className="text-amber-600 font-bold">Behind class</span> by {perf.classAvg - perf.childScore}%. </span>
                  )}
                </div>
              </div>

              {/* Paywall Overlay */}
              {perf.isLocked && (
                <div 
                  className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer"
                  onClick={onUnlockClick}
                >
                  <div className="bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-xl hover:scale-105 transition-transform">
                     <Lock size={16} className="text-amber-400" />
                     <span className="font-bold text-sm">Unlock Insights</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
`;

code = code.replace(`    </div>\n  );\n}`, newContent);
fs.writeFileSync(file, code);
