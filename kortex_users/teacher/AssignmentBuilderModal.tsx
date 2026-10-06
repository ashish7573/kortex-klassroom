"use client";
import { TeacherComboData, ClassStudentData } from '../../types/user';
import React, { useState, useEffect } from 'react';
import { X, ChevronRight, CheckCircle2, Calendar, Users, BookOpen, Search, ArrowLeft } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../../backend_configurations/firebase';
import { createAssignment } from '../../app/actions/teacher_assignments';


interface AssignmentBuilderModalProps {
  combo: TeacherComboData;
  roster: ClassStudentData[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignmentBuilderModal({ combo, roster, onClose, onSuccess }: AssignmentBuilderModalProps) {
  const [step, setStep] = useState(1);
  const [allTools, setAllTools] = useState<any[]>([]);
  const [hierarchy, setHierarchy] = useState<any>({});
  const [loadingTools, setLoadingTools] = useState(true);
  
  // Drill-down State
  const [searchQuery, setSearchQuery] = useState('');
  const [navChapter, setNavChapter] = useState<string | null>(null);
  const [navSubtopic, setNavSubtopic] = useState<string | null>(null);
  
  // Selections
  const [sourceType, setSourceType] = useState<'kortex' | 'external'>('kortex');
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>(roster.map(r => r.uid)); // Default all
  const [dueDate, setDueDate] = useState<string>('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCurriculum() {
      try {
        // Optimized to prevent Quota Exhaustion
        const q = query(collection(db, 'learning_tools'), where('subject', 'in', [combo.subjectStr, combo.subjectStr.toLowerCase(), 'Mathematics', 'mathematics', 'Maths', 'maths']));
        const snap = await getDocs(q).catch(() => ({ docs: [] }));
        
        const matched = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })).filter((t: any) => 
          ((t.grade || '').trim().toLowerCase() === combo.gradeStr.toLowerCase() || (t.grade || '').trim().toLowerCase() === 'all grades' || (t.grade || '').trim().toLowerCase() === 'all') &&
          (t.subject || '').trim().toLowerCase() === combo.subjectStr.toLowerCase() || (t.subject || '').trim().toLowerCase() === 'mathematics' && combo.subjectStr.toLowerCase() === 'maths'
        );
        
        setAllTools(matched);
        
        // Group by Chapter -> Subtopic for UI
        const grouped = matched.reduce((acc: any, tool: any) => {
          const ch = tool.chapter_name || tool.chapter || 'General';
          const sub = tool.subtopic_name || tool.subtopic || 'General Subtopic';
          if (!acc[ch]) acc[ch] = {};
          if (!acc[ch][sub]) acc[ch][sub] = [];
          acc[ch][sub].push(tool);
          return acc;
        }, {});
        
        setHierarchy(grouped);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingTools(false);
      }
    }
    fetchCurriculum();
  }, [combo]);

  const handleToggleStudent = (uid: string) => {
    if (selectedStudents.includes(uid)) {
      setSelectedStudents(selectedStudents.filter(id => id !== uid));
    } else {
      setSelectedStudents([...selectedStudents, uid]);
    }
  };

  const handleSubmit = async () => {
    if (sourceType === 'kortex' && !selectedTool) { setError("Select a content tool"); return; }
    if (sourceType === 'external' && (!title || !externalLink)) { setError("Provide a title and link"); return; }
    if (selectedStudents.length === 0 || !dueDate) { setError("Missing students or deadline"); return; }
    
    setSubmitting(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const token = await user.getIdToken();
      
      const res = await createAssignment(token, {
        orgId: combo.orgId,
        comboId: combo.comboId,
        toolId: sourceType === 'kortex' ? selectedTool.id : 'external',
        toolType: sourceType === 'kortex' ? (selectedTool.type || selectedTool.content_type || 'Task') : 'External',
        chapterName: sourceType === 'kortex' ? (selectedTool.chapter_name || 'Unknown') : 'External Source',
        toolTitle: title || (sourceType === 'kortex' ? (selectedTool.title || selectedTool.subtopic_name || 'Untitled') : 'Untitled'),
        dueDate: dueDate,
        assignedStudentIds: selectedStudents,
        instructions: instructions,
        externalLink: sourceType === 'external' ? externalLink : ''
      });
      
      if (!res.success) throw new Error(res.error);
      onSuccess();
    } catch (e: any) {
      setError(e.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-emerald-600 p-6 flex items-center justify-between text-white shrink-0">
           <div>
             <h3 className="text-xl font-black">Create Assignment</h3>
             <p className="text-emerald-100 text-xs font-bold mt-1">{combo.comboLabel}</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
             <X size={20} />
           </button>
        </div>
        
        {/* Progress Tracker */}
        <div className="flex bg-slate-50 border-b border-slate-100 shrink-0">
           <div className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider ${step >= 1 ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-400'}`}>1. Select Tool</div>
           <div className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider ${step >= 2 ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-400'}`}>2. Audience</div>
           <div className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider ${step >= 3 ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-400'}`}>3. Deadline</div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
           {error && <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-xl font-bold border border-rose-200">{error}</div>}

           {step === 1 && (
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
                       <button onClick={() => setSourceType('kortex')} className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all ${sourceType === 'kortex' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Kortex Library</button>
                       <button onClick={() => setSourceType('external')} className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all ${sourceType === 'external' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>External Link</button>
                    </div>
                 </div>
                 
                 {sourceType === 'external' && (
                    <div className="animate-fade-in">
                       <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">URL Link</label>
                       <input type="url" value={externalLink} onChange={e => setExternalLink(e.target.value)} placeholder="https://youtube.com/..." className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-indigo-500" />
                    </div>
                 )}
                 
                 {sourceType === 'kortex' && (
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
                                  className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${selectedTool?.id === tool.id ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                                >
                                   <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedTool?.id === tool.id ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                         <BookOpen size={20} />
                                      </div>
                                      <div>
                                         <p className={`font-bold ${selectedTool?.id === tool.id ? 'text-emerald-800' : 'text-slate-700'}`}>{tool.title || tool.subtopic_name}</p>
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
                                 {Object.keys(hierarchy).sort((a, b) => {
                                    const aTool = Object.values(hierarchy[a])[0]?.[0] || {};
                                    const bTool = Object.values(hierarchy[b])[0]?.[0] || {};
                                    return (Number(aTool.chapter_number) || 999) - (Number(bTool.chapter_number) || 999);
                                 }).map(chapter => (
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
                                 {Object.keys(hierarchy[navChapter] || {}).sort((a, b) => {
                                    const aTool = hierarchy[navChapter][a]?.[0] || {};
                                    const bTool = hierarchy[navChapter][b]?.[0] || {};
                                    return (Number(aTool.subtopic_order) || 999) - (Number(bTool.subtopic_order) || 999);
                                 }).map(subtopic => (
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
                                 {[...hierarchy[navChapter][navSubtopic]].sort((a: any, b: any) => {
                                    return (Number(a.content_order || a.orderIndex) || 999) - (Number(b.content_order || b.orderIndex) || 999);
                                 }).map((tool: any) => (
                                    <div 
                                      key={tool.id} 
                                      onClick={() => setSelectedTool(tool)}
                                      className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${selectedTool?.id === tool.id ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                                    >
                                       <div className="flex items-center gap-3">
                                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedTool?.id === tool.id ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                             <BookOpen size={20} />
                                          </div>
                                          <div>
                                             <p className={`font-bold ${selectedTool?.id === tool.id ? 'text-emerald-800' : 'text-slate-700'}`}>{tool.title || tool.subtopic_name}</p>
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
                 )}
              </div>
           )}

           {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                 <div className="flex items-center justify-between mb-4">
                    <h4 className="font-black text-slate-800">Assign to Students</h4>
                    <button 
                       onClick={() => setSelectedStudents(selectedStudents.length === roster.length ? [] : roster.map(r => r.uid))}
                       className="text-xs font-bold text-sky-500 bg-sky-50 px-3 py-1.5 rounded-lg"
                    >
                       {selectedStudents.length === roster.length ? 'Deselect All' : 'Select All'}
                    </button>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {roster.map(student => (
                       <label key={student.uid} className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-colors ${selectedStudents.includes(student.uid) ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}>
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={selectedStudents.includes(student.uid)} 
                            onChange={() => handleToggleStudent(student.uid)} 
                          />
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center ${selectedStudents.includes(student.uid) ? 'bg-emerald-500 text-white' : 'bg-slate-200'}`}>
                             {selectedStudents.includes(student.uid) && <CheckCircle2 size={14} />}
                          </div>
                          <span className="font-bold text-slate-700">{student.fullName}</span>
                       </label>
                    ))}
                 </div>
              </div>
           )}

           {step === 3 && (
              <div className="space-y-6 animate-fade-in max-w-md mx-auto py-10">
                 <div className="text-center mb-8">
                    <Calendar className="mx-auto text-emerald-500 mb-4" size={48} />
                    <h4 className="font-black text-slate-800 text-xl">Set a Deadline</h4>
                    <p className="text-sm font-semibold text-slate-500 mt-2">When should the students complete this task?</p>
                 </div>
                 
                 <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Due Date</label>
                    <input 
                      type="date" 
                      value={dueDate} 
                      onChange={(e) => setDueDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 focus:outline-none focus:border-emerald-500 transition-colors" 
                    />
                 </div>
              </div>
           )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-between shrink-0">
           {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-200 bg-slate-200/50 rounded-xl transition-colors">
                Back
              </button>
           ) : <div />}
           
           {step < 3 ? (
              <button 
                onClick={() => setStep(step + 1)} 
                disabled={step === 1 && (sourceType === 'kortex' ? !selectedTool : (!title.trim() || !externalLink.trim()))}
                className="flex items-center gap-2 px-6 py-2.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all"
              >
                Next <ChevronRight size={18} />
              </button>
           ) : (
              <button 
                onClick={handleSubmit} 
                disabled={submitting || !dueDate || selectedStudents.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition-all active:scale-95"
              >
                {submitting ? 'Assigning...' : 'Dispatch Assignment'} <CheckCircle2 size={18} />
              </button>
           )}
        </div>
      </div>
    </div>
  );
}
