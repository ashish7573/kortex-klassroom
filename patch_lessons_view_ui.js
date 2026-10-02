const fs = require('fs');
const file = 'kortex_landing_page/all_lessons_page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add progress info to the Chapter Card
const oldChapterCardUI = `<h3 className="text-2xl font-black text-slate-800 mb-2 group-hover:text-sky-600 leading-tight">{lesson.chapter}</h3>
                       <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-4"><span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600">{lesson.grade}</span><span>•</span><span>{lesson.subject}</span></div>`;

const newChapterCardUI = `
                       <h3 className="text-2xl font-black text-slate-800 mb-2 group-hover:text-sky-600 leading-tight">{lesson.chapter}</h3>
                       <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-4"><span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600">{lesson.grade}</span><span>•</span><span>{lesson.subject}</span></div>
                       {(() => {
                           const subjProg = studentProgress.find(p => p.id?.toLowerCase() === lesson.subject?.toLowerCase() || p.subject_id?.toLowerCase() === lesson.subject?.toLowerCase());
                           const compObj = subjProg?.completed_tools || {};
                           let totalTools = 0;
                           let completedTools = 0;
                           if (lesson.subTopics) {
                               lesson.subTopics.forEach((st: any) => {
                                  if (st.tools) {
                                      totalTools += st.tools.length;
                                      st.tools.forEach((t: any) => { if (compObj[t.id]) completedTools++; });
                                  }
                               });
                           } else if (lesson.flow) {
                               totalTools += lesson.flow.length;
                               lesson.flow.forEach((t: any) => { if (compObj[t.id]) completedTools++; });
                           }
                           const pct = totalTools > 0 ? Math.round((completedTools / totalTools) * 100) : 0;
                           
                           return totalTools > 0 ? (
                               <div className="mb-4">
                                   <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider mb-1 text-slate-500">
                                       <span>Progress</span>
                                       <span className={pct === 100 ? 'text-emerald-500' : 'text-sky-500'}>{pct}%</span>
                                   </div>
                                   <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                       <div className={\`h-full rounded-full transition-all \${pct === 100 ? 'bg-emerald-500' : 'bg-sky-500'}\`} style={{ width: \`\${pct}%\` }}></div>
                                   </div>
                               </div>
                           ) : null;
                       })()}
`;

code = code.replace(oldChapterCardUI, newChapterCardUI);


// 2. Add progress info to Subtopic row
const oldSubtopicUI = `<span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm hidden sm:block">{subTopic.tools?.length || 0} Tools</span>`;

const newSubtopicUI = `
                                 {(() => {
                                     const subjProg = studentProgress.find(p => p.id?.toLowerCase() === activeLesson.subject?.toLowerCase() || p.subject_id?.toLowerCase() === activeLesson.subject?.toLowerCase());
                                     const compObj = subjProg?.completed_tools || {};
                                     const tot = subTopic.tools?.length || 0;
                                     const comp = subTopic.tools?.filter((t: any) => compObj[t.id])?.length || 0;
                                     if (tot === 0) return <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm hidden sm:block">0 Tools</span>;
                                     if (comp === tot) return <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-sm flex items-center gap-1"><CheckCircle2 size={12}/> Completed</span>;
                                     return <span className="text-xs font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-200 shadow-sm hidden sm:block">{comp}/{tot} Completed</span>;
                                 })()}
`;

code = code.replace(oldSubtopicUI, newSubtopicUI);

// 3. Add progress to individual Tools
const oldToolUI = `<h4 className="text-lg font-extrabold text-slate-800">{item.title}</h4>`;

const newToolUI = `
                                             <div className="flex items-center gap-2">
                                                <h4 className="text-lg font-extrabold text-slate-800">{item.title}</h4>
                                                {(() => {
                                                    const subjProg = studentProgress.find(p => p.id?.toLowerCase() === activeLesson.subject?.toLowerCase() || p.subject_id?.toLowerCase() === activeLesson.subject?.toLowerCase());
                                                    const toolRecord = subjProg?.completed_tools?.[item.id];
                                                    if (toolRecord) {
                                                        return <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 size={12}/> {toolRecord.best_score !== undefined ? \`Score: \${toolRecord.best_score}\` : 'Done'}</span>;
                                                    }
                                                    return null;
                                                })()}
                                             </div>
`;

code = code.replace(oldToolUI, newToolUI);


// Add CheckCircle2 to imports
code = code.replace(
  `BookOpen, Layers, Gamepad2, Video, ChevronLeft, ChevronUp, ChevronDown, `,
  `BookOpen, Layers, Gamepad2, Video, ChevronLeft, ChevronUp, ChevronDown, CheckCircle2, `
);

fs.writeFileSync(file, code);
