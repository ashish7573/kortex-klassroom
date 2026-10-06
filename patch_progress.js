const fs = require('fs');
let code = fs.readFileSync('kortex_landing_page/all_lessons_page.tsx', 'utf8');

// 1. Destructure isPro and role
code = code.replace(
  /const LessonsView = \(\{ isLoggedIn, requireAuth, onStartLesson, defaultClass, defaultSubject, authProfile \}: any\) => \{/,
  `const LessonsView = ({ isLoggedIn, requireAuth, onStartLesson, defaultClass, defaultSubject, authProfile, role, isPro }: any) => {\n  const showProgress = role === 'teacher' || (role === 'student' && isPro);`
);

// 2. Wrap progress bar logic in condition
code = code.replace(
  /return totalTools > 0 \? \(\n\s*<div className="mb-4">/,
  `return (totalTools > 0 && showProgress) ? (
                               <div className="mb-4">`
);

// 3. Wrap completed tools badge in condition (the one saying "X/Y Completed" etc)
code = code.replace(
  /const comp = subTopic\.tools\?\.filter\(\(t: any\) => compObj\[t\.id\]\)\?\.length \|\| 0;\n\s*if \(tot === 0\) return <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm hidden sm:block">0 Tools<\/span>;\n\s*if \(comp === tot\) return <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-sm flex items-center gap-1"><CheckCircle2 size=\{12\}\/> Completed<\/span>;\n\s*return <span className="text-xs font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-200 shadow-sm hidden sm:block">\{comp\}\/\{tot\} Completed<\/span>;\n\s*\}\)\(\)\}/,
  `const comp = subTopic.tools?.filter((t: any) => compObj[t.id])?.length || 0;
                                     if (tot === 0) return <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm hidden sm:block">0 Tools</span>;
                                     if (!showProgress) return <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm hidden sm:block">{tot} Tools</span>;
                                     if (comp === tot) return <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-sm flex items-center gap-1"><CheckCircle2 size={12}/> Completed</span>;
                                     return <span className="text-xs font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-200 shadow-sm hidden sm:block">{comp}/{tot} Completed</span>;
                                 })()}`
);

// 4. Hide individual tool completion badge (Score/Done)
code = code.replace(
  /if \(toolRecord\) \{\n\s*return <span className="bg-emerald-100 text-emerald-700 text-\[10px\] font-black uppercase tracking-widest px-2 py-0\.5 rounded-full flex items-center gap-1"><CheckCircle2 size=\{12\}\/> \{toolRecord\.best_score !== undefined \? \`Score: \$\{toolRecord\.best_score\}\` : 'Done'\}<\/span>;\n\s*\}/,
  `if (toolRecord && showProgress) {
                                                        return <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 size={12}/> {toolRecord.best_score !== undefined ? \`Score: \$\{toolRecord.best_score\}\` : 'Done'}</span>;
                                                    }`
);

fs.writeFileSync('kortex_landing_page/all_lessons_page.tsx', code);
console.log("Patched progress bar visibility.");
