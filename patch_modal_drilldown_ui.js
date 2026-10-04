const fs = require('fs');
let code = fs.readFileSync('kortex_users/teacher/AssignmentBuilderModal.tsx', 'utf8');

const oldKortexSection = `                 {sourceType === 'kortex' && (
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
                 )}`;

const newKortexSection = `                 {sourceType === 'kortex' && (
                   <div className="animate-fade-in space-y-4">
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input 
                           type="text" 
                           placeholder="Search curriculum..." 
                           value={searchQuery}
                           onChange={e => setSearchQuery(e.target.value)}
                           className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-10 pr-4 py-3 font-bold text-slate-700 outline-none focus:border-indigo-500"
                        />
                     </div>
                     
                     {loadingTools ? (
                        <div className="py-10 text-center font-bold text-slate-400 animate-pulse">Loading curriculum...</div>
                     ) : allTools.length === 0 ? (
                        <div className="py-10 text-center font-bold text-slate-400">No tools found for this curriculum.</div>
                     ) : searchQuery ? (
                        <div className="border-2 border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
                           {allTools.filter(t => (t.title || t.subtopic_name || '').toLowerCase().includes(searchQuery.toLowerCase())).map(tool => (
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
                                         <p className="text-[10px] font-bold text-slate-400 uppercase">{tool.chapter_name} • {tool.type || tool.content_type || 'Activity'}</p>
                                      </div>
                                   </div>
                                   {selectedTool?.id === tool.id && <CheckCircle2 className="text-emerald-500" />}
                                </div>
                           ))}
                        </div>
                     ) : (
                        <div>
                           {(navChapter || navSubtopic) && (
                              <button 
                                onClick={() => navSubtopic ? setNavSubtopic(null) : setNavChapter(null)}
                                className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-4"
                              >
                                 <ArrowLeft size={16} /> Back
                              </button>
                           )}
                           
                           {!navChapter ? (
                              <div className="space-y-2">
                                 {Object.keys(hierarchy).map(chapter => (
                                    <div 
                                      key={chapter} 
                                      onClick={() => setNavChapter(chapter)}
                                      className="p-4 bg-white border-2 border-slate-100 rounded-2xl hover:border-indigo-300 hover:shadow-sm cursor-pointer flex items-center justify-between transition-all"
                                    >
                                       <span className="font-bold text-slate-700">{chapter}</span>
                                       <ChevronRight size={20} className="text-slate-400" />
                                    </div>
                                 ))}
                              </div>
                           ) : !navSubtopic ? (
                              <div className="space-y-2">
                                 <h4 className="font-black text-slate-800 mb-3">{navChapter}</h4>
                                 {Object.keys(hierarchy[navChapter] || {}).map(subtopic => (
                                    <div 
                                      key={subtopic} 
                                      onClick={() => setNavSubtopic(subtopic)}
                                      className="p-4 bg-white border-2 border-slate-100 rounded-2xl hover:border-indigo-300 hover:shadow-sm cursor-pointer flex items-center justify-between transition-all"
                                    >
                                       <span className="font-bold text-slate-700">{subtopic}</span>
                                       <ChevronRight size={20} className="text-slate-400" />
                                    </div>
                                 ))}
                              </div>
                           ) : (
                              <div className="border-2 border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
                                 <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 font-black text-slate-700">{navSubtopic}</div>
                                 {hierarchy[navChapter][navSubtopic].map((tool: any) => (
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
                                             <p className="text-[10px] font-bold text-slate-400 uppercase">{tool.type || tool.content_type || 'Activity'}</p>
                                          </div>
                                       </div>
                                       {selectedTool?.id === tool.id && <CheckCircle2 className="text-emerald-500" />}
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>
                     )}
                   </div>
                 )}`;

code = code.replace(oldKortexSection, newKortexSection);

fs.writeFileSync('kortex_users/teacher/AssignmentBuilderModal.tsx', code);
