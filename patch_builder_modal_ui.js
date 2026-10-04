const fs = require('fs');
let code = fs.readFileSync('kortex_users/teacher/AssignmentBuilderModal.tsx', 'utf8');

const oldUI = `           {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                 {loadingTools ? (
                    <div className="py-20 text-center font-bold text-slate-400 animate-pulse">Loading curriculum...</div>
                 ) : Object.keys(tools).length === 0 ? (
                    <div className="py-20 text-center font-bold text-slate-400">No tools found for this curriculum.</div>
                 ) : (
                    Object.keys(tools).map(chapter => (
                       <div key={chapter} className="border-2 border-slate-100 rounded-2xl overflow-hidden">
                          <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 font-black text-slate-700">{chapter}</div>
                          <div className="divide-y divide-slate-100">
                             {tools[chapter].map((tool: any) => (
                                <div 
                                  key={tool.id} 
                                  onClick={() => setSelectedTool(tool)}
                                  className={\`p-4 flex items-center justify-between cursor-pointer transition-colors \${selectedTool?.id === tool.id ? 'bg-emerald-50' : 'hover:bg-slate-50'}\`}
                                >
                                   <div className="flex items-center gap-3">
                                      <div className={\`w-10 h-10 rounded-xl flex items-center justify-center \${selectedTool?.id === tool.id ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-100 text-slate-400'}\`}>
                                         <BookOpen size={20} />
                                      </div>
                                      <div>
                                         <p className={\`font-bold \${selectedTool?.id === tool.id ? 'text-emerald-800' : 'text-slate-700'}\`}>{tool.title || tool.subtopic_name}</p>
                                         <p className="text-[10px] font-bold text-slate-400 uppercase">{tool.type || 'Activity'}</p>
                                      </div>
                                   </div>
                                   {selectedTool?.id === tool.id && <CheckCircle2 className="text-emerald-500" />}
                                </div>
                             ))}
                          </div>
                       </div>
                    ))
                 )}
              </div>
           )}`;

const newUI = `           {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                 <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Assignment Title (Optional for Kortex Library)</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Read Chapter 4" className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-indigo-500" />
                 </div>
                 
                 <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Instructions (Optional)</label>
                    <textarea value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Write instructions for the students..." className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-700 outline-none focus:border-indigo-500 min-h-[100px]"></textarea>
                 </div>
                 
                 <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Content Source</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl w-full">
                       <button onClick={() => setSourceType('kortex')} className={\`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all \${sourceType === 'kortex' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}>Kortex Library</button>
                       <button onClick={() => setSourceType('external')} className={\`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all \${sourceType === 'external' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}>External Link</button>
                    </div>
                 </div>
                 
                 {sourceType === 'external' && (
                    <div className="animate-fade-in">
                       <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">URL Link</label>
                       <input type="url" value={externalLink} onChange={e => setExternalLink(e.target.value)} placeholder="https://youtube.com/..." className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-indigo-500" />
                    </div>
                 )}
                 
                 {sourceType === 'kortex' && (
                   <div className="animate-fade-in">
                     {loadingTools ? (
                        <div className="py-10 text-center font-bold text-slate-400 animate-pulse">Loading curriculum...</div>
                     ) : Object.keys(tools).length === 0 ? (
                        <div className="py-10 text-center font-bold text-slate-400">No tools found for this curriculum.</div>
                     ) : (
                        Object.keys(tools).map(chapter => (
                           <div key={chapter} className="border-2 border-slate-100 rounded-2xl overflow-hidden mb-4">
                              <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 font-black text-slate-700">{chapter}</div>
                              <div className="divide-y divide-slate-100">
                                 {tools[chapter].map((tool: any) => (
                                    <div 
                                      key={tool.id} 
                                      onClick={() => setSelectedTool(tool)}
                                      className={\`p-4 flex items-center justify-between cursor-pointer transition-colors \${selectedTool?.id === tool.id ? 'bg-emerald-50' : 'hover:bg-slate-50'}\`}
                                    >
                                       <div className="flex items-center gap-3">
                                          <div className={\`w-10 h-10 rounded-xl flex items-center justify-center \${selectedTool?.id === tool.id ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-100 text-slate-400'}\`}>
                                             <BookOpen size={20} />
                                          </div>
                                          <div>
                                             <p className={\`font-bold \${selectedTool?.id === tool.id ? 'text-emerald-800' : 'text-slate-700'}\`}>{tool.title || tool.subtopic_name}</p>
                                             <p className="text-[10px] font-bold text-slate-400 uppercase">{tool.type || 'Activity'}</p>
                                          </div>
                                       </div>
                                       {selectedTool?.id === tool.id && <CheckCircle2 className="text-emerald-500" />}
                                    </div>
                                 ))}
                              </div>
                           </div>
                        ))
                     )}
                   </div>
                 )}
              </div>
           )}`;

code = code.replace(oldUI, newUI);
fs.writeFileSync('kortex_users/teacher/AssignmentBuilderModal.tsx', code);
